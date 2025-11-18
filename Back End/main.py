import json
import os
import threading
import copy
import math
import re
import requests
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Adjust the path if your folder structure differs
frontend_dist_path = os.path.join(os.path.dirname(__file__), "../Frontend/dist")
if os.path.isdir(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")


# Enable CORS for frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Backend starting – setting up lazy model load thread.", flush=True)
model = None  # will hold the SentenceTransformer instance

# Low-memory controls
LOW_MEM_MODE = os.getenv("LOW_MEM_MODE", "1") == "1"
PRELOAD_MODEL = os.getenv("PRELOAD_MODEL", "1") == "1"
try:
    CHUNK_SIZE = int(os.getenv("EMBEDDING_CHUNK", "2048"))
except ValueError:
    CHUNK_SIZE = 2048

def get_model():
    """Lazy load the embedding model; respects EMBEDDING_MODEL env var for smaller production variants."""
    global model
    if model is None:
        try:
            model_name = os.getenv("EMBEDDING_MODEL", "all-mpnet-base-v2")
            print(f"Loading SentenceTransformer model '{model_name}'...", flush=True)
            model = SentenceTransformer(model_name, device="cpu")
            print("Model loaded successfully", flush=True)
        except Exception as e:
            print(f"Error loading model: {e}", flush=True)
            raise
    return model

@app.on_event("startup")
def preload_model_background():
    """Kick off a background thread to preload the model so first user request doesn't timeout (avoids 502)."""
    if not PRELOAD_MODEL:
        print("PRELOAD_MODEL disabled; model will load on first request.", flush=True)
        return
    def _load():
        try:
            get_model()
        except Exception:
            # Already logged inside get_model
            pass
    threading.Thread(target=_load, daemon=True).start()
@app.get("/health")
async def health():
    """Lightweight health/readiness endpoint for deployment platform probes."""
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/jobs")
async def get_jobs():
    """Get list of all available job titles from SOC"""
    with open("detailed_occupations.json", "r", encoding="utf-8") as f:
        jobs = json.load(f)
    job_titles = [job["SOC Title"] for job in jobs]
    return {"jobs": job_titles}

@app.get("/pathway/{job1}/{job2}")
async def get_pathway(job1: str, job2: str):
    global model
    model = get_model()  # Ensure model is loaded before processing
    
    with open("detailed_occupations.json", "r",  encoding="utf-8") as f:
        jobs = json.load(f)
        job1Index = None
        job2Index = None
    
    # Find the indices of the jobs
    for idx, job in enumerate(jobs):
        if job["SOC Title"] == job1:
            job1Index = idx
        if job["SOC Title"] == job2:
            job2Index = idx
    
    # If jobs not found, return error
    if job1Index is None or job2Index is None:
        return {"error": "Job title not found", "job1": job1, "job2": job2}

    #for cos similarity
    def objectiveSkillIndex(skillName):
        with open("skillOrder.json", "r") as f:
            skills = json.load(f)
        for index, skill in enumerate(skills):
            if skill == skillName:
                return index

    # i used chatgpt for this formula, this determines semantic distances
    def distance(embed1, embed2):
        return np.dot(embed1, embed2) / (np.linalg.norm(embed1) * np.linalg.norm(embed2))

    jobSkills = []
    skills = []
    commonOccurring = {}

    def getCourses(skill):
        courseList = []
        with open("courses.json", "r") as f:
            courseSet = json.load(f)
        for course in courseSet:
            if course.get("skills"):
                if skill in course["skills"]:
                    courseList.append(course)
        return courseList


    def outputJson(jsonFile, jsonName):
        with open(jsonName, "w") as f:
            json.dump(jsonFile, f, indent=4, default=convert)

    with open("skillOrder.json", "r") as f:
        skills = json.load(f)

    # Load embeddings with minimal memory where possible
    embeddings = np.load("skill_embeddings2.npy", mmap_mode='r' if LOW_MEM_MODE else None)

    # Optional FAISS index; in LOW_MEM_MODE, avoid copying full matrix into FAISS to save RAM
    use_faiss = (not LOW_MEM_MODE)
    if use_faiss:
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(np.array(embeddings, copy=False))

    def top_k_inner_product(query_vec: np.ndarray, emb: np.ndarray, k: int = 300, chunk: int = CHUNK_SIZE):
        """Memory-friendly top-k by inner product over memmapped embeddings in chunks."""
        # Ensure 1-D normalized query vector
        q = query_vec.ravel()
        # Track global top-k across chunks
        top_scores = np.full(k, -np.inf, dtype=np.float32)
        top_indices = np.full(k, -1, dtype=np.int32)
        n = emb.shape[0]
        for start in range(0, n, chunk):
            end = min(start + chunk, n)
            chunk_mat = emb[start:end]
            # Compute inner product for the chunk
            scores = chunk_mat @ q
            # If embeddings are not unit-normalized, approximate cosine by dividing by row norms
            # This keeps memory low but costs some compute
            try:
                row_norms = np.linalg.norm(chunk_mat, axis=1)
                # Avoid divide-by-zero
                row_norms[row_norms == 0] = 1.0
                scores = scores / row_norms
            except Exception:
                # Fall back to raw inner product if norm computation fails
                pass

            # Merge with existing top-k
            combined_scores = np.concatenate([top_scores, scores.astype(np.float32, copy=False)])
            combined_indices = np.concatenate([top_indices, np.arange(start, end, dtype=np.int32)])
            if combined_scores.size > k:
                part = np.argpartition(combined_scores, -k)[-k:]
                # Order these top-k by descending score
                order = np.argsort(combined_scores[part])[::-1]
                top_scores = combined_scores[part][order]
                top_indices = combined_indices[part][order]
            else:
                order = np.argsort(combined_scores)[::-1]
                top_scores = combined_scores[order]
                top_indices = combined_indices[order]
        return top_indices.tolist()

    query = "Web and Digital Interface Designers: Design digital user interfaces or websites. Develop and test layouts, interfaces, functionality, and navigation menus to ensure compatibility and usability across browsers or devices. May use web framework applications as well as client-side code and processes. May evaluate web design following web and accessibility standards, and may analyze web use metrics and optimize websites for marketability and search engine ranking. May design and test interfaces that facilitate the human-computer interaction and maximize the usability of digital devices, websites, and software with a focus on aesthetics and design. May create graphics used in websites and manage website content and links. Excludes “Special Effects Artists and Animators” (27-1014) and “Graphic Designers” (27-1024)."

    
    print(f"{jobs[job1Index]["SOC Title"]}: {jobs[job1Index]["SOC Definition"]}")

    query = f"{jobs[job1Index]["SOC Title"]}: {jobs[job1Index]["SOC Definition"]}"
    query2 = f"{jobs[job2Index]["SOC Title"]}: {jobs[job2Index]["SOC Definition"]}"

    queryEncoded = model.encode(query, normalize_embeddings=True)
    queryCurrentEncoded = model.encode(query2, normalize_embeddings=True)


    if len(queryEncoded.shape) == 1:
        if use_faiss:
            q_2d = queryEncoded.reshape(1, -1)
            d, i = index.search(q_2d, k=300)
            idx_iter = i[0]
        else:
            idx_iter = top_k_inner_product(queryEncoded, embeddings, k=300)
        for idx in idx_iter:
            #check to see size of node tree
            if len(jobSkills) > 60:
                break
            skillDict = {}
            skillDict["skill_name"] = skills[idx]
            courses = getCourses(skills[idx])
            #if no courses, move on
            if len(courses) <= 0:
                continue
            skillDict["courses"] = courses
            jobSkills.append(skillDict)

    oldJobSkills = []

    if len(queryCurrentEncoded.shape) == 1:
        if use_faiss:
            q2_2d = queryCurrentEncoded.reshape(1, -1)
            d, i = index.search(q2_2d, k=100)
            idx_iter2 = i[0]
        else:
            idx_iter2 = top_k_inner_product(queryCurrentEncoded, embeddings, k=100)
        for index2 in idx_iter2:
            skillDict = {}
            skillDict["skill_name"] = skills[index2]

            oldJobSkills.append(skillDict)

    print(oldJobSkills)
    #copy dictionary twice for dual processing and aggregate (importance + foundational level)
    skillListImportance = [skill["skill_name"] for skill in jobSkills]
    skillListFoundational = copy.deepcopy(jobSkills)

    skillListFoundational.sort(key=lambda skill:len(skill["courses"]), reverse=True)

    aggregate = []

    forProcessing = {}
    forProcessing["importance"] = []
    forProcessing["angle"] = []

    def convert(obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()              # Convert arrays to lists
        if isinstance(obj, (np.float32, np.float64)):
            return float(obj)                # Convert NumPy floats to Python float
        if isinstance(obj, (np.int32, np.int64)):
            return int(obj)                  # Convert NumPy ints to Python int
        raise TypeError(f"Type {type(obj)} not serializable")


    for skill in skillListImportance:
        forProcessing["importance"].append(skill)
        skillEmbed = embeddings[objectiveSkillIndex(skill)]
        new_embed = model.encode(query, convert_to_numpy=True, normalize_embeddings=True)
        skillDistance = distance(skillEmbed, new_embed)
        forProcessing["angle"].append(skillDistance)


    # ------------------ PATHS ------------------
    skill_graph_path = "courses_with_skills.json"
    output_path = "learning_progression.json"


    # ------------------ INPUT LIST ------------------
    input_skills = skillListImportance



    # ------------------ PARAMETERS ------------------
    alpha = 0.1  # weight for disagreement penalty

    # ------------------ STEP 1: LOAD SKILL GRAPH ------------------
    with open(skill_graph_path, "r", encoding="utf-8") as f:
        skill_graph = json.load(f)
        skill_graph = skill_graph["skills_to_courses"]
    # Build a mapping of which skills share courses
    skill_graph_skills = {skill: set() for skill in skill_graph}

    # Reverse map: course -> skills
    course_to_skills = {}
    for skill, courses in skill_graph.items():
        for course in courses:
            course_to_skills.setdefault(course, set()).add(skill)

    # Build skill-to-skill connections
    for skill, courses in skill_graph.items():
        connected_skills = set()
        for course in courses:
            connected_skills.update(course_to_skills[course])
        connected_skills.discard(skill)  # remove self-loop
        skill_graph_skills[skill] = list(connected_skills)
    # ------------------ STEP 2: BUILD SUBGRAPH ------------------
    subgraph = {}
    for skill in input_skills:
        if skill in skill_graph_skills:
            subgraph[skill] = [s for s in skill_graph_skills[skill] if s in input_skills]

    # ------------------ STEP 3: PRUNE NODES WITH NO CONNECTIONS ------------------
    while True:

        no_edge_nodes = [skill for skill, neighbors in subgraph.items() if len(neighbors) == 0]
        if not no_edge_nodes:
            break
        for n in no_edge_nodes:
            del subgraph[n]
        for skill in list(subgraph.keys()):
            subgraph[skill] = [s for s in subgraph[skill] if s in subgraph]

    # ------------------ STEP 4: PRUNED SKILLS IN ORIGINAL ORDER ------------------
    pruned_skills_in_input_order = [s for s in input_skills if s in subgraph]

    # ------------------ STEP 5: SORTED BY DEGREE ------------------
    pruned_skills_sorted_by_degree = sorted(
        [
            {"skill": skill, "degree": len(neighbors), "edges": neighbors}
            for skill, neighbors in subgraph.items()
        ],
        key=lambda x: x["degree"],
        reverse=True
    )

    # ------------------ STEP 6: INDEX MAPS ------------------
    index_input = {skill: i for i, skill in enumerate(pruned_skills_in_input_order)}
    index_degree = {entry["skill"]: i for i, entry in enumerate(pruned_skills_sorted_by_degree)}

    # ------------------ STEP 7: LEARNING PROGRESSION ------------------
    learning_list = []
    for skill in pruned_skills_in_input_order:
        n = index_input[skill] + 0.1
        m = index_degree[skill] + 0.1
        learning_score = n + m + alpha * abs(n - m)

        learning_list.append({
            "skill": skill,
            "input_index": n,
            "degree_index": m,
            "learning_score": learning_score
        })

    learning_list_sorted = sorted(learning_list, key=lambda x: x["learning_score"])

    # ============================================================
    # ============== STEP 8 TREE-BRANCH CATEGORY MODEL =========
    # ============================================================
    output={}
    N = len(learning_list_sorted)

    # Adaptive exponential-like branching ratios
    cut1 = int(N * 0.10)  # foundational (roots)
    cut2 = int(N * 0.30)  # medium (primary branches)
    cut3 = int(N * 0.75)  # niche (secondary branches)
    # Rest → applied/hard (leaves)

    categories = {
        "foundational": [],
        "medium": [],
        "niche": [],
        "applied_hard": []
    }

    for idx, entry in enumerate(learning_list_sorted):
        skill = entry["skill"]
        if idx < cut1:
            categories["foundational"].append(skill)
        elif idx < cut2:
            categories["medium"].append(skill)
        elif idx < cut3:
            categories["niche"].append(skill)
        else:
            categories["applied_hard"].append(skill)

    output["categories"] = categories

    # ------------------ STEP 9: SAVE JSON ------------------
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=4, ensure_ascii=False)


    #aggregate data from 2 lists
    for index, skill in enumerate(skillListImportance):
        skillDict = {}
        skillDict["skill_name"] = skill
        skillDict["importance_index"] = index
        for index, skill2 in enumerate(skillListFoundational):
            if skill2["skill_name"] == skillDict["skill_name"]:
                skillDict["foundational_index"] = index
        #weight * sum * variance
        skillDict["learning_rate"] = 0.1 * (abs(skillDict["importance_index"] - skillDict["foundational_index"])) * (skillDict["importance_index"] + skillDict["foundational_index"])
        aggregate.append(skillDict)

    aggregate.sort(key=lambda skill:skill["learning_rate"])

    #returns skill dict given skill name
    def searchSkill(skillname):
        for skill in jobSkills:
            if skill["skill_name"] == skillname:
                return skill

    #pulls the whole skill (not for official use, for partial use)
    def skillPull(skillName):
        for root, dirs, files in os.walk("skillsRSD"):
            for filename in files:
                path = os.path.join(root, filename)
                with open(path, "r") as f:
                    skillCollection = json.load(f)
                for skill in skillCollection:
                    if skill["RSD Name"] == skillName:
                        return skill

    #this is the entire thing
    skillNet = []
    # this is for each level, when we iterate through this will be subject to change
    skillLayer = []
    nextSkillLayer = []

    root = {}
    root["connections"] = []
    root["skill_name"] = "root"
    skillNet.append(root)

    job_embeddings = np.load("job_embeddings.npy", mmap_mode='r' if LOW_MEM_MODE else None)
    with open("detailed_occupations.json", "r", encoding="utf-8") as f:
        job_list = json.load(f)

    def rankCourses(courses, job):
        m = get_model()  # Get the model (lazy loaded if needed)
        newCourses = []
        highestCourse = {}
        counter = -100
        for course in courses:
            course_embed = m.encode(f"{course["course_title"]}: {course["course_desc"]}", convert_to_numpy=True, normalize_embeddings=True)
            distanceOfCourse = distance(job_embeddings[job], course_embed)
            if distanceOfCourse >= 0.5:
                newCourses.append(course)
            if distanceOfCourse > counter:
                highestCourse = course
                counter = distanceOfCourse
        if len(newCourses) == 0:
            newCourses.append(highestCourse)
        return newCourses

    for i, value in enumerate(output["categories"]["foundational"]):
        officialSkill = copy.deepcopy(searchSkill(value))
        skillSpine = skillPull(value)
        officialSkill["description"] = skillSpine["Skill Statement"]
        officialSkill["alignment"] = skillSpine["Alignment Name"]
        officialSkill["connections"] = []
        officialSkill["match"] = False
        officialSkill["courses"] = rankCourses(officialSkill["courses"], job1Index)
        output["categories"]["foundational"][i] = officialSkill
    for i, value in enumerate(output["categories"]["medium"]):
        officialSkill = copy.deepcopy(searchSkill(value))
        skillSpine = skillPull(value)
        officialSkill["description"] = skillSpine["Skill Statement"]
        officialSkill["alignment"] = skillSpine["Alignment Name"]
        officialSkill["connections"] = []
        officialSkill["match"] = False
        officialSkill["courses"] = rankCourses(officialSkill["courses"], job1Index)
        output["categories"]["medium"][i] = officialSkill
    for i, value in enumerate(output["categories"]["niche"]):
        officialSkill = copy.deepcopy(searchSkill(value))
        skillSpine = skillPull(value)
        officialSkill["description"] = skillSpine["Skill Statement"]
        officialSkill["alignment"] = skillSpine["Alignment Name"]
        officialSkill["connections"] = []
        officialSkill["match"] = False
        officialSkill["courses"] = rankCourses(officialSkill["courses"], job1Index)
        output["categories"]["niche"][i] = officialSkill
    for i, value in enumerate(output["categories"]["applied_hard"]):
        officialSkill = copy.deepcopy(searchSkill(value))
        skillSpine = skillPull(value)
        officialSkill["description"] = skillSpine["Skill Statement"]
        officialSkill["alignment"] = skillSpine["Alignment Name"]
        officialSkill["connections"] = []
        officialSkill["match"] = False
        officialSkill["courses"] = rankCourses(officialSkill["courses"], job1Index)
        output["categories"]["applied_hard"][i] = officialSkill

    offLearningRate = 0

    added = []


#r


    for skill in output["categories"]["foundational"]:
        if skill["skill_name"] not in added:
            added.append("skill_name")
            root["connections"].append(skill)
    for skill in output["categories"]["medium"]:
        smallestSimilarity = -1000000
        closestNode = None
        skillEmbedding = embeddings[objectiveSkillIndex(skill["skill_name"])]
        for foundationSkill in output["categories"]["foundational"]:
            foundationSkillEmbedding = embeddings[objectiveSkillIndex(foundationSkill["skill_name"])]
            semanticDistance = distance(skillEmbedding, foundationSkillEmbedding)
            if semanticDistance > smallestSimilarity:
                smallestSimilarity = semanticDistance
                closestNode = foundationSkill
        if skill["skill_name"] not in added:
            added.append("skill_name")
            closestNode["connections"].append(skill)
    for skill in output["categories"]["niche"]:
        smallestSimilarity = -1000000
        closestNode = None
        skillEmbedding = embeddings[objectiveSkillIndex(skill["skill_name"])]
        for foundationSkill in output["categories"]["medium"]:
            foundationSkillEmbedding = embeddings[objectiveSkillIndex(foundationSkill["skill_name"])]
            semanticDistance = distance(skillEmbedding, foundationSkillEmbedding)
            if semanticDistance > smallestSimilarity:
                smallestSimilarity = semanticDistance
                closestNode = foundationSkill
        if skill["skill_name"] not in added:
            added.append("skill_name")
            closestNode["connections"].append(skill)
    for skill in output["categories"]["applied_hard"]:
        smallestSimilarity = -1000000
        closestNode = None
        skillEmbedding = embeddings[objectiveSkillIndex(skill["skill_name"])]
        for foundationSkill in output["categories"]["niche"]:
            foundationSkillEmbedding = embeddings[objectiveSkillIndex(foundationSkill["skill_name"])]
            semanticDistance = distance(skillEmbedding, foundationSkillEmbedding)
            if semanticDistance > smallestSimilarity:
                smallestSimilarity = semanticDistance
                closestNode = foundationSkill
        if skill["skill_name"] not in added:
            added.append("skill_name")
            closestNode["connections"].append(skill)
    #official skill = object we will send through GET request

    nodes = []
    edges = []
    visited = []
    def traverse(node):
        
        if node["skill_name"] in visited:
            return
        visited.append(node["skill_name"])
        node["id"] = node["skill_name"]
        node["label"] = ""
        nodes.append(node)
        
        for child in node["connections"]:
            edges.append({"from": node["id"], "to": child["skill_name"]})
            traverse(child)
        node["connections"] = None
        
        

    traverse(root)

    export = {"nodes": nodes, "edges": edges}   

    for node in nodes:
        for skill in oldJobSkills:
            if skill["skill_name"] == node["skill_name"]:
                node["match"] = True

    return export
    #for skill in jobSkills:
    # for course in skill["courses"]:
            #check to see course
        #    if commonOccurring.get(course["course_title"]):
        #       commonOccurring[course["course_title"]] = commonOccurring[course["course_title"]] + 1
        #  else:
        #     commonOccurring[course["course_title"]] = 1


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

