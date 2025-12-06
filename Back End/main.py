import json
from sentence_transformers import SentenceTransformer
import os
import faiss
import numpy as np
import requests
import re
import copy
import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - do nothing, let requests lazy-load models
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model - will be loaded on first use
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-mpnet-base-v2")
    return _model

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "pathway-api"}

@app.get("/jobs")
def get_available_jobs():
    """Get list of all available job titles from detailed_occupations.json"""
    try:
        with open("detailed_occupations.json", "r", encoding="utf-8") as f:
            jobs = json.load(f)
        job_titles = [job["SOC Title"] for job in jobs]
        return {"jobs": job_titles, "count": len(job_titles)}
    except Exception as e:
        return {"error": str(e), "jobs": [], "count": 0}

@app.get("/pathway/{job1}/{job2}")
async def get_pathway(job1: str, job2: str):
    """Get pathway between two jobs - runs in background thread pool"""
    from concurrent.futures import ThreadPoolExecutor
    import concurrent.futures
    
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        result = await loop.run_in_executor(executor, lambda: _get_pathway_sync(job1, job2))
    return result

def _get_pathway_sync(job1: str, job2: str):
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

    embeddings = np.load("skill_embeddings2.npy")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    query = "Web and Digital Interface Designers: Design digital user interfaces or websites. Develop and test layouts, interfaces, functionality, and navigation menus to ensure compatibility and usability across browsers or devices. May use web framework applications as well as client-side code and processes. May evaluate web design following web and accessibility standards, and may analyze web use metrics and optimize websites for marketability and search engine ranking. May design and test interfaces that facilitate the human-computer interaction and maximize the usability of digital devices, websites, and software with a focus on aesthetics and design. May create graphics used in websites and manage website content and links. Excludes “Special Effects Artists and Animators” (27-1014) and “Graphic Designers” (27-1024)."

    
    print(f"{jobs[job1Index]['SOC Title']}: {jobs[job1Index]['SOC Definition']}")

    query = f"{jobs[job1Index]['SOC Title']}: {jobs[job1Index]['SOC Definition']}"
    query2 = f"{jobs[job2Index]['SOC Title']}: {jobs[job2Index]['SOC Definition']}"

    queryEncoded = get_model().encode(query, normalize_embeddings=True)
    queryCurrentEncoded = get_model().encode(query2, normalize_embeddings=True)


    if len(queryEncoded.shape) == 1:
        queryEncoded = queryEncoded.reshape(1, -1)
        d , i = index.search(queryEncoded, k=300)
        for idx in i[0]:
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
        queryCurrentEncoded = queryCurrentEncoded.reshape(1, -1)
        d , i = index.search(queryCurrentEncoded, k=100)
        for index2 in i[0]:
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
        new_embed = get_model().encode(query, convert_to_numpy=True, normalize_embeddings=True)
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

    job_embeddings = np.load("job_embeddings.npy")
    with open("detailed_occupations.json", "r", encoding="utf-8") as f:
        job_list = json.load(f)

    def rankCourses(courses, job):
        m = get_model()  # Get the model (lazy loaded if needed)
        newCourses = []
        highestCourse = {}
        counter = -100
        for course in courses:
            course_embed = get_model().encode(f"{course['course_title']}: {course['course_desc']}", convert_to_numpy=True, normalize_embeddings=True)
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

