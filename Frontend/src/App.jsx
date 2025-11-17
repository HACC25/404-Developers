import React, { useState, useCallback, useEffect, useRef } from 'react';
// --- VIS-NETWORK IMPORTS ---
// FIX: We are now importing the components by name. 
// Network handles the rendering, and DataSet handles the data structure.
// This is the clean, modern import style that resolves the 'undefined' issue.
import { Network } from 'vis-network'; 
import { DataSet } from 'vis-data'; // Requires 'vis-data' to be installed (often peer dependency)
import 'vis-network/styles/vis-network.css';
// --- END VIS-NETWORK IMPORTS ---

import styles from './App.module.css';
import { getPathway, getAvailableJobs } from './services/api';

// --- PAGE CONSTANTS ---
const PAGE_HOME = 'home';
const PAGE_COMPLEX = 'complex';
const PAGE_BASIC = 'basic';
const PAGE_STATS = 'stats'; 

// --- PAGE TITLES FOR NAVIGATION & HEADER ---
const PAGE_TITLES = {
  [PAGE_COMPLEX]: 'Complex Skill Map',
  [PAGE_BASIC]: 'Basic Course Map',
  [PAGE_STATS]: 'Career Stats Comparison',
};

// --- RAW JSON DATA FROM BACKEND ---
// This constant has been updated with the new JSON data provided by your developer.
const RAW_DATA_ANALYST_PATH = {
    "nodes": [
        {
            "connections": null,
            "skill_name": "root",
            "id": "root",
            "label": ""
        },
        {
            "skill_name": "Describe the Visual Elements of Design",
            "courses": [
                {
                    "course_prefix": "CINE",
                    "course_number": "375",
                    "course_title": "Directing the Camera for the Screen",
                    "course_desc": "Detailed analysis of cinematic grammar, placement, movement, focus, and effects of the camera to create the mise-en-scene. Practical exercises to apply theory to individual creative work and in collaboration with actors from the Theatre program.",
                    "num_units": "3",
                    "dept_name": "Cinema",
                    "inst_ipeds": "141574",
                    "metadata": "Prerequisites: ( CINE 310 , or CINE 215 and CINE 216 ), and CINE 350 , and CINE 370 .; Grade Option: A-F only.; Major Restrictions: SCA majors only.; General Education Designation(s): DA",
                    "skills": [
                        "and Other Visual Effects",
                        "Messaging Principles Application",
                        "Develop Creative Solutions to Communication Challenges",
                        "Describe the Visual Elements of Design",
                        "Character Program Vision",
                        "Select Appropriate Visual Images in Multimedia Projects",
                        "Employ Digital Visual Tools",
                        "Apply Visual Design Principles",
                        "Educational Visual Design Application",
                        "Create Storyboards with Technology",
                        "Create Storyboards for Online Learning",
                        "Develop Creative Solutions for Instructional Design",
                        "Visual Design",
                        "Marketing Campaign Representations Design",
                        "Professional Image Creation",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Describe the Visual Elements of Design",
            "description": "Understand and apply the fundamental components of visual composition, such as line, shape, color, and texture.",
            "label": "Describe the Visual Elements of Design"
        },
        {
            "skill_name": "Employ Digital Visual Tools",
            "courses": [
                {
                    "course_prefix": "CINE",
                    "course_number": "364",
                    "course_title": "Interactive Storytelling for the Screen",
                    "course_desc": "Study of visual and spatial storytelling practices for interactive, screen-based media, with an emphasis on creating narrative experiences in gaming and virtual/augmented reality environments.",
                    "num_units": "3",
                    "dept_name": "Cinema",
                    "inst_ipeds": "141574",
                    "metadata": "Prerequisites: CINE 310 or CINE 215 and CINE 216.; Grade Option: A-F only.; Major Restrictions: SCA majors only.; General Education Designation(s): DA",
                    "skills": [
                        "and Other Visual Effects",
                        "Develop Creative Solutions to Communication Challenges",
                        "Employ Digital Visual Tools",
                        "Apply Visual Design Principles",
                        "Educational Visual Design Application",
                        "Create Storyboards with Technology",
                        "Create Storyboards for Online Learning",
                        "Develop Creative Solutions for Instructional Design",
                        "Visual Design",
                        "Marketing Campaign Representations Design",
                        "Professional Image Creation",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Employ Digital Visual Tools",
            "description": "Utilize various digital software and applications for creating, editing, and manipulating visual content.",
            "label": "Employ Digital Visual Tools"
        },
        {
            "skill_name": "Apply Visual Design Principles",
            "courses": [
                {
                    "course_prefix": "CINE",
                    "course_number": "375",
                    "course_title": "Directing the Camera for the Screen",
                    "course_desc": "Detailed analysis of cinematic grammar, placement, movement, focus, and effects of the camera to create the mise-en-scene. Practical exercises to apply theory to individual creative work and in collaboration with actors from the Theatre program.",
                    "num_units": "3",
                    "dept_name": "Cinema",
                    "inst_ipeds": "141574",
                    "metadata": "Prerequisites: ( CINE 310 , or CINE 215 and CINE 216 ), and CINE 350 , and CINE 370 .; Grade Option: A-F only.; Major Restrictions: SCA majors only.; General Education Designation(s): DA",
                    "skills": [
                        "and Other Visual Effects",
                        "Messaging Principles Application",
                        "Develop Creative Solutions to Communication Challenges",
                        "Describe the Visual Elements of Design",
                        "Character Program Vision",
                        "Select Appropriate Visual Images in Multimedia Projects",
                        "Employ Digital Visual Tools",
                        "Apply Visual Design Principles",
                        "Educational Visual Design Application",
                        "Create Storyboards with Technology",
                        "Create Storyboards for Online Learning",
                        "Develop Creative Solutions for Instructional Design",
                        "Visual Design",
                        "Marketing Campaign Representations Design",
                        "Professional Image Creation",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Apply Visual Design Principles",
            "description": "Incorporate established design rules (e.g., balance, contrast, hierarchy) to create aesthetically pleasing and functional layouts.",
            "label": "Apply Visual Design Principles"
        },
        {
            "skill_name": "Educational Visual Design Application",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Educational Visual Design Application",
            "description": "Design visual aids and materials optimized for educational effectiveness and learner engagement.",
            "label": "Educational Visual Design Application"
        },
        {
            "skill_name": "Instructional Design and Technology Application",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Instructional Design and Technology Application",
            "description": "Utilize instructional design models (like ADDIE) and technology tools to create effective learning environments.",
            "label": "Instructional Design and Technology Application"
        },
        {
            "skill_name": "Develop Creative Solutions for Instructional Design",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Develop Creative Solutions for Instructional Design",
            "description": "Generate innovative approaches to solve complex learning and training challenges.",
            "label": "Develop Creative Solutions for Instructional Design"
        },
        {
            "skill_name": "Educational Materials Prototypes Deployment",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Educational Materials Prototypes Deployment",
            "description": "Design, test, and implement prototype educational content and tools for pilot testing and feedback.",
            "label": "Educational Materials Prototypes Deployment"
        },
        {
            "skill_name": "Design Curriculum within Technology Requirements",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Design Curriculum within Technology Requirements",
            "description": "Develop educational courses and programs tailored to be delivered effectively using specific technological platforms.",
            "label": "Design Curriculum within Technology Requirements"
        },
        {
            "skill_name": "Competency-based Education Design Strategies",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Competency-based Education Design Strategies",
            "description": "Create educational frameworks that focus on mastering specific skills (competencies) rather than seat time.",
            "label": "Competency-based Education Design Strategies"
        },
        {
            "skill_name": "Information Literacy Instruction Design",
            "courses": [
                {
                    "course_prefix": "ILART",
                    "course_number": "603",
                    "course_title": "Instructional Design and Technology",
                    "course_desc": "Instructional design models and processes, including design-based research. Survey of current theory and practice in instructional technology application in diverse learning environments. Focus on principles of learning and the role of technology.",
                    "num_units": "3",
                    "dept_name": "Instructional Technology, Learning, and Art Education",
                    "inst_ipeds": "141574",
                    "metadata": "Grade Option: A-F only.; General Education Designation(s): N/A",
                    "skills": [
                        "Design Curriculum within Technology Requirements",
                        "Competency-based Education Design Strategies",
                        "Information Literacy Instruction Design",
                        "Instructional Design and Technology Application",
                        "Develop Creative Solutions for Instructional Design",
                        "Educational Visual Design Application",
                        "Educational Materials Prototypes Deployment"
                    ]
                }
            ],
            "id": "Information Literacy Instruction Design",
            "description": "Design learning modules that teach students how to effectively find, evaluate, and use information.",
            "label": "Information Literacy Instruction Design"
        },
        {
            "skill_name": "Continuous Learning and Professional Development",
            "courses": [],
            "id": "Continuous Learning and Professional Development",
            "description": "Engage in ongoing skill improvement and seek professional growth opportunities in instructional technology.",
            "label": "Continuous Learning and Professional Development"
        },
        {
            "skill_name": "Create Storyboards with Technology",
            "courses": [],
            "id": "Create Storyboards with Technology",
            "description": "Develop visual planning documents for interactive or linear media using digital tools.",
            "label": "Create Storyboards with Technology"
        },
        {
            "skill_name": "Create Storyboards for Online Learning",
            "courses": [],
            "id": "Create Storyboards for Online Learning",
            "description": "Adapt storyboarding techniques specifically for the development of online courses and digital content.",
            "label": "Create Storyboards for Online Learning"
        },
        {
            "skill_name": "Page Layouts Creation",
            "courses": [],
            "id": "Page Layouts Creation",
            "description": "Design the arrangement of text and graphical elements for web pages or digital documents to ensure readability and flow.",
            "label": "Page Layouts Creation"
        },
        {
            "skill_name": "Visual Design",
            "courses": [],
            "id": "Visual Design",
            "description": "The general practice of creating cohesive visual elements in an interface or document.",
            "label": "Visual Design"
        },
        {
            "skill_name": "Marketing Campaign Representations Design",
            "courses": [],
            "id": "Marketing Campaign Representations Design",
            "description": "Create visual assets and representations used to promote educational programs or products.",
            "label": "Marketing Campaign Representations Design"
        },
        {
            "skill_name": "Professional Image Creation",
            "courses": [],
            "id": "Professional Image Creation",
            "description": "Develop and maintain a high-quality, professional aesthetic for all work products and personal brand materials.",
            "label": "Professional Image Creation"
        }
    ],
    "edges": [
        {
            "from": "root",
            "to": "Describe the Visual Elements of Design"
        },
        {
            "from": "Describe the Visual Elements of Design",
            "to": "Employ Digital Visual Tools"
        },
        {
            "from": "Describe the Visual Elements of Design",
            "to": "Apply Visual Design Principles"
        },
        {
            "from": "Apply Visual Design Principles",
            "to": "Educational Visual Design Application"
        },
        {
            "from": "Apply Visual Design Principles",
            "to": "Instructional Design and Technology Application"
        },
        {
            "from": "Instructional Design and Technology Application",
            "to": "Develop Creative Solutions for Instructional Design"
        },
        {
            "from": "Develop Creative Solutions for Instructional Design",
            "to": "Educational Materials Prototypes Deployment"
        },
        {
            "from": "Educational Materials Prototypes Deployment",
            "to": "Design Curriculum within Technology Requirements"
        },
        {
            "from": "Design Curriculum within Technology Requirements",
            "to": "Competency-based Education Design Strategies"
        },
        {
            "from": "Competency-based Education Design Strategies",
            "to": "Information Literacy Instruction Design"
        },
        {
            "from": "Competency-based Education Design Strategies",
            "to": "Design Curriculum within Technology Requirements"
        },
        {
            "from": "Competency-based Education Design Strategies",
            "to": "Continuous Learning and Professional Development"
        },
        {
            "from": "Employ Digital Visual Tools",
            "to": "Create Storyboards with Technology"
        },
        {
            "from": "Create Storyboards with Technology",
            "to": "Create Storyboards for Online Learning"
        },
        {
            "from": "Create Storyboards for Online Learning",
            "to": "Page Layouts Creation"
        },
        {
            "from": "Employ Digital Visual Tools",
            "to": "Educational Visual Design Application"
        },
        {
            "from": "Educational Visual Design Application",
            "to": "Educational Materials Prototypes Deployment"
        },
        {
            "from": "Employ Digital Visual Tools",
            "to": "Marketing Campaign Representations Design"
        },
        {
            "from": "Marketing Campaign Representations Design",
            "to": "Visual Design"
        },
        {
            "from": "Marketing Campaign Representations Design",
            "to": "Professional Image Creation"
        }
    ]
};

// --- HELPER FUNCTION TO PROCESS RAW DATA INTO VIS-NETWORK FORMAT ---
const processGraphData = (rawData, currentJobSkills = [], dreamJob = '') => {
    console.log('processGraphData called with:', rawData, 'dream job:', dreamJob);
    
    // Defensive checks
    if (!rawData || !rawData.nodes || !rawData.edges) {
        console.error('processGraphData: Invalid data structure:', rawData);
        return null;
    }
    
    if (rawData.error) {
        console.error('processGraphData: Backend returned error:', rawData.error);
        return null;
    }
    
    if (rawData.nodes.length === 0 || rawData.edges.length === 0) {
        console.warn('processGraphData: No nodes or edges in response');
        return null;
    }
    
    // Find the actual start and goal IDs based on the first and last skill in the path
    const startId = rawData.edges[0]?.from || '';
    const goalId = rawData.edges[rawData.edges.length - 1]?.to || '';

    const nodes = rawData.nodes
        .map(node => {  
            const isCurrentSkill = currentJobSkills.includes(node.skill_name);
            const hasMatch = node.match === true; // Check if node has match property set to true
            
            let color = { border: '#008751', background: '#000000' }; // Default Skill/Course Green
            // Replace spaces with newlines to prevent excessively wide nodes
            let label = node.skill_name.replace(/ /g, '\n'); 
            let shape = 'box';
            let size = 25; // Default size

            // Root node - special styling (central hub for snowflake)
            if (node.id === 'root') {
                color = { border: '#39FF14', background: '#001a00' }; // Bright neon green for dream job
                label = dreamJob ? `${dreamJob}\n🎯 DREAM ROLE` : 'DREAM\nROLE';
                shape = 'star';
                size = 40; // Make root larger and more prominent
            } 
            // Nodes with match property - highlight in yellow/gold
            else if (hasMatch) {
                color = { border: '#FFD700', background: '#333300' }; // Gold for matched skills from current job
                label = `${node.skill_name}\n⭐ Current Skills`;
                shape = 'box';
                size = 28;
            }
            else if (node.id === startId) {
                // If this is the starting skill in the path
                color = { border: '#C0C0C0', background: '#000000' }; // Silver/Current Role style
                label = `${node.skill_name}\n(Start Skill)`; 
                shape = 'box';
            } 
            else if (node.id === goalId) {
                // If this is the final skill in the path
                color = { border: '#39FF14', background: '#000000' }; // Neon Green/Dream Role style
                label = `${node.skill_name}\n(Goal Skill)`; 
                shape = 'star'; // Use a star shape for the goal
            }  
            else if (isCurrentSkill) {
                color = { border: '#FFD700', background: '#1a1a00' };
                label = `${node.skill_name}\n✓ Already Have`; 
                shape = 'box';
            }
            
            return {
                id: node.id, 
                label: label,
                shape: shape,
                color: color,
                size: size,
                // The title will show the original skill name on hover
                title: node.skill_name,
                // Store the full node data for access when clicked
                description: node.description || 'No description available.',
                courses: node.courses ? node.courses.map(c => `${c.course_prefix} ${c.course_number} - ${c.course_title}`) : [], // Extract and format courses from the new data structure
                isCurrentSkill: isCurrentSkill,
                hasMatch: hasMatch
            };
        });

    const edges = rawData.edges
        .map(edge => ({
            from: edge.from,
            to: edge.to,
            color: { color: '#008751' }
        }));

    const result = { nodes, edges, rawNodes: rawData.nodes };
    console.log('processGraphData: Returning processed data with', nodes.length, 'nodes and', edges.length, 'edges');
    return result;
};

// --- NAVIGATION COMPONENT ---
const Navigation = ({ currentPage, setCurrentPage, styles }) => {
  const pages = [
    { id: PAGE_HOME, label: 'Home' },
    { id: PAGE_COMPLEX, label: 'Complex Map' },
    { id: PAGE_BASIC, label: 'Basic Map' },
    { id: PAGE_STATS, label: 'Job Stats' },
  ];

  return (
    <nav className={styles.navigation}>
      {pages.map((page) => (
        <button
          key={page.id}
          className={`${styles.navButton} ${currentPage === page.id ? styles.activeNav : ''}`}
          onClick={() => setCurrentPage(page.id)}
        >
          {page.label}
        </button>
      ))}
    </nav>
  );
};

// --- HOME PAGE (TITLE PAGE) COMPONENT ---
const HomePage = ({ styles, setCurrentPage }) => {
  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.homeTitle}>Skill Mapper</h1>
      <p className={styles.homeSubtitle}>
        Chart your path from your current role to your dream career.
      </p>
      
      <button 
        className={styles.submitButton}
        onClick={() => setCurrentPage(PAGE_COMPLEX)}
        style={{marginTop: '2rem'}}
      >
        Start Mapping
      </button>
      
      <div className={styles.mapDescription}>
        <p>The **Complex Map** suggests electives and advanced skills.</p>
        <p>The **Basic Map** shows mandatory, foundational classes.</p>
        <p>The **Job Stats** page compares career outlook.</p>
      </div>
    </div>
  );
};

// --- JOB INPUT HEADER (Shared component for Complex and Basic Maps) ---
const JobInputHeader = ({
  styles,
  job1,
  job2,
  job1Submitted,
  job2Submitted,
  handleJob1Change,
  handleJob2Change,
  handleGetPathway,
  job1Suggestions,
  job2Suggestions,
  isJob1Focused,
  isJob2Focused,
  renderSuggestions,
  setIsJob1Focused,
  setIsJob2Focused,
  setJob1Suggestions,
  setJob2Suggestions,
  filterSuggestions,
  pageTitle, 
}) => (
  <header className={styles.headerContainer}>
    
    <h1 className={styles.title}>
      {pageTitle}
    </h1>

    <div className={styles.inputSection}>
      
      <div className={styles.inputGroup}>
        <label htmlFor="job1" className={styles.inputLabel}>
          Job 1 (Current Role)
        </label>
        <input
          id="job1"
          type="text"
          value={job1}
          onChange={handleJob1Change}
          onFocus={() => {
            console.log(`job1 input focused, job1="${job1}"`);
            setIsJob1Focused(true);
            setJob1Suggestions(filterSuggestions(job1));
          }}
          onBlur={() => setIsJob1Focused(false)}
          placeholder="e.g., Software Developers"
          className={styles.inputField}
          disabled={job1Submitted}
        />
        {isJob1Focused && !job1Submitted && renderSuggestions(job1Suggestions, 'job1')}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="job2" className={styles.inputLabel}>
          Job 2 (Dream Role)
        </label>
        <input
          id="job2"
          type="text"
          value={job2}
          onChange={handleJob2Change}
          onFocus={() => {
            console.log(`job2 input focused, job2="${job2}"`);
            setIsJob2Focused(true);
            setJob2Suggestions(filterSuggestions(job2));
          }}
          onBlur={() => setIsJob2Focused(false)}
          placeholder="e.g., Data Scientists"
          className={styles.inputField}
          disabled={job2Submitted}
        />
        {isJob2Focused && !job2Submitted && renderSuggestions(job2Suggestions, 'job2')}
      </div>

      <button 
        className={styles.submitButton}
        onClick={handleGetPathway}
        disabled={!job1 || !job2}
        style={{ marginTop: '1rem' }}
      >
        Get Pathway
      </button>
    </div>

  </header>
);


// --- VIS-NETWORK WRAPPER COMPONENT ---
// This component wraps the vis-network library
const VisNetworkGraph = ({ data, onNodeClick }) => {
    // A ref to attach to the DOM element
    const visJsRef = useRef(null);
    const networkRef = useRef(null); // Ref for the network instance
    const dataRef = useRef(null); // Ref to track data changes

    // Function to handle resize and fit the network
    const fitNetwork = useCallback(() => {
        if (networkRef.current) {
            networkRef.current.fit();
        }
    }, []);

    useEffect(() => {
        // CRITICAL CHECK: Ensure both required classes are available and data exists.
        if (!data || !data.nodes || !data.edges) {
            console.warn("VisNetworkGraph: Waiting for data...");
            return;
        }

        if (!visJsRef.current || !DataSet || !Network) {
            console.error("VIS-NETWORK ERROR: DataSet or Network components are missing.");
            console.warn("If the error persists, you may need to install the 'vis-data' package.");
            return; 
        }

        // Check if data has actually changed - if the same data is passed, don't rebuild
        const dataChanged = dataRef.current !== data;
        if (!dataChanged && networkRef.current) {
            console.log("VisNetworkGraph: Data unchanged, skipping rebuild");
            return;
        }
        dataRef.current = data;

        // Create DataSet instances using the imported DataSet class
        const nodes = new DataSet(data.nodes); 
        const edges = new DataSet(data.edges);

        // Define options to match your CRT theme with radial/snowflake layout
        const options = {
            layout: {
                // Use force-directed layout for web/snowflake appearance
                randomSeed: 42, // For consistent layout across reloads
            },
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 500,
                    fit: true,
                    updateInterval: 25,
                },
                barnesHut: {
                    gravitationalConstant: -26000,
                    centralGravity: 0.5,
                    springLength: 250,
                    springConstant: 0.08,
                },
                minVelocity: 0.1,
                solver: 'barnesHut',
                timestep: 0.5,
                adaptiveTimestep: true,
            },
            nodes: {
                shape: 'box',
                font: {
                    color: '#FFFFFF', // White text
                    face: "'Press Start 2P', monospace", // Your pixel font
                    size: 10,
                },
                color: {
                    border: '#008751', // Green border (default)
                    background: '#000000', // Black background
                    highlight: {
                        border: '#39FF14', // Neon green highlight
                        background: '#008751',
                    },
                },
                borderWidth: 2,
                margin: 10,
                shadow: {
                    enabled: true,
                    color: 'rgba(0, 135, 81, 0.6)',
                    x: 0,
                    y: 0,
                    size: 10
                }
            },
            edges: {
                arrows: 'to',
                color: {
                    color: '#008751', // Green edge
                    highlight: '#39FF14', // Neon green highlight
                },
                font: {
                    align: 'horizontal',
                },
                smooth: true,
            },
            interaction: {
                hover: true, // Enable hover effects
                dragNodes: true,
                dragView: true,
                zoomView: true,
            },
        };

        // Initialize the network using the imported Network class
        const network = new Network(visJsRef.current, { nodes, edges }, options);
        networkRef.current = network;

        // Add click event listener
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const nodeData = nodes.get(nodeId);
                if (onNodeClick && nodeData) {
                    onNodeClick(nodeData);
                }
            }
            // Prevent any default behavior or propagation
            if (params.event) {
                params.event.preventDefault();
                params.event.stopPropagation();
            }
        });

        // Fit the network to the canvas immediately after creation
        network.once('afterDrawing', () => {
            network.fit();
        });

        // Set up a window resize listener to ensure the network fits when the window size changes
        window.addEventListener('resize', fitNetwork);

        // Return a cleanup function to destroy the network on unmount
        return () => {
            window.removeEventListener('resize', fitNetwork);
            if (network) {
                network.destroy();
                networkRef.current = null;
            }
        };
    }, [data?.nodes.length, data?.edges.length, fitNetwork, onNodeClick]); // Only re-run if data size changes

    // Set a specific height and width for the graph container
    return (
        <div 
            ref={visJsRef} 
            style={{ 
                width: '100%', 
                height: '600px', // Increased height to show the complex map better
                backgroundColor: '#000'
            }} 
        />
    );
};
// --- END VIS-NETWORK WRAPPER ---


// --- COMPLEX MAP CONTENT (Displays the Course & Skill Map Visualization) ---
const ComplexMapContent = ({ styles, job1, job2 }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const isSubmitted = job1 && job2;
    const data = {
        title: "Complex Course & Skill Map",
        description: "This map visualizes the optimal path, showing the skills you need to acquire and the associated elective courses required to move from your Current Role to your Dream Role."
    };

    // Use useMemo to keep currentJobSkills stable across re-renders
    const currentJobSkills = React.useMemo(() => [], []);

    // Fetch pathway data when jobs are submitted
    useEffect(() => {
        console.log('ComplexMapContent useEffect triggered:', { isSubmitted, job1, job2 });
        if (isSubmitted) {
            const fetchPathway = async () => {
                console.log(`ComplexMapContent: Fetching pathway for ${job1} -> ${job2}`);
                setLoading(true);
                setError(null);
                setGraphData(null);
                try {
                    const response = await getPathway(job1, job2);
                    console.log('ComplexMapContent: Got response:', response);
                    if (response.error) {
                        throw new Error(response.error);
                    }
                    const processedData = processGraphData(response, currentJobSkills, job2);
                    console.log('ComplexMapContent: Processed data:', processedData);
                    if (processedData) {
                        setGraphData(processedData);
                        console.log('ComplexMapContent: GraphData state updated successfully');
                    } else {
                        throw new Error('processGraphData returned null');
                    }
                } catch (err) {
                    console.error('Error fetching pathway:', err);
                    setError(err.message || 'Failed to fetch pathway data from backend');
                }
                setLoading(false);
            };
            
            fetchPathway();
        }
    }, [isSubmitted, job1, job2]);

    const handleNodeClick = useCallback((nodeData) => {
        setSelectedNode(nodeData);
    }, []);

    const closePanel = useCallback(() => {
        setSelectedNode(null);
    }, []);
    
    // Awaiting role submissions - show placeholder
    if (!isSubmitted) {
        const placeholderContent = (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{color: 'gray', fontSize: '1.2rem', margin: 0}}>
                    Awaiting Role Submissions
                </p>
                <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                    Submit your Current Role and Dream Role in the header above to view the skill pathway.
                </p>
            </div>
        );
        
        return (
            <div className={styles.mainContent} style={{
                padding: '2rem',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2rem',
                maxWidth: '90rem',
                minHeight: '40vh' 
            }}>
                <div style={{width: '100%', textAlign: 'center', marginBottom: '1rem'}}>
                    <h1 style={{
                        fontSize: '2rem',
                        color: 'var(--bright-white)',
                        marginBottom: '0.5rem',
                        textShadow: '1px 1px 0 var(--uh-green)'
                    }}>
                        {data.title}
                    </h1>
                    <p className={styles.homeSubtitle} style={{textAlign: 'center', margin: '0', fontSize: '1rem', color: 'var(--silver)'}}>
                        {data.description}
                    </p>
                </div>

                {/* Legend */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #FFD700', backgroundColor: '#1a1a00' }}></div>
                        <span style={{color: 'var(--bright-white)'}}>Skills You Already Have</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #008751', backgroundColor: '#000000' }}></div>
                        <span style={{color: 'var(--bright-white)'}}>Skills You Need</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #39FF14', backgroundColor: '#000000' }}></div>
                        <span style={{color: 'var(--bright-white)'}}>Goal Skill</span>
                    </div>
                </div>
                
                {/* --- GRAPH AREA --- */}
                <div style={{
                    width: '100%', 
                    border: '2px solid var(--uh-green)',
                    boxShadow: '0 0 15px rgba(0, 135, 81, 0.4)',
                    borderRadius: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}>
                    {placeholderContent}
                </div>
            </div>
        );
    }
    
    // Loading state
    if (loading) {
        return (
            <div className={styles.mainContent} style={{
                padding: '2rem',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2rem',
                maxWidth: '90rem',
                minHeight: '40vh' 
            }}>
                <div style={{width: '100%', textAlign: 'center', marginBottom: '1rem'}}>
                    <h1 style={{
                        fontSize: '2rem',
                        color: 'var(--bright-white)',
                        marginBottom: '0.5rem',
                        textShadow: '1px 1px 0 var(--uh-green)'
                    }}>
                        {data.title}
                    </h1>
                    <p className={styles.homeSubtitle} style={{textAlign: 'center', margin: '0', fontSize: '1rem', color: 'var(--silver)'}}>
                        {data.description}
                    </p>
                </div>

                <div style={{
                    width: '100%', 
                    border: '2px solid var(--uh-green)',
                    boxShadow: '0 0 15px rgba(0, 135, 81, 0.4)',
                    borderRadius: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px'
                }}>
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <p style={{color: 'var(--uh-green)', fontSize: '1.2rem', margin: 0, animation: 'pulse 1s infinite'}}>
                            ▌ Loading pathway...
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Error state
    if (error) {
        return (
            <div className={styles.mainContent} style={{
                padding: '2rem',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2rem',
                maxWidth: '90rem',
                minHeight: '40vh' 
            }}>
                <div style={{width: '100%', textAlign: 'center', marginBottom: '1rem'}}>
                    <h1 style={{
                        fontSize: '2rem',
                        color: 'var(--bright-white)',
                        marginBottom: '0.5rem',
                        textShadow: '1px 1px 0 var(--uh-green)'
                    }}>
                        {data.title}
                    </h1>
                    <p className={styles.homeSubtitle} style={{textAlign: 'center', margin: '0', fontSize: '1rem', color: 'var(--silver)'}}>
                        {data.description}
                    </p>
                </div>

                <div style={{
                    width: '100%', 
                    border: '2px solid #ff0000',
                    boxShadow: '0 0 15px rgba(255, 0, 0, 0.4)',
                    borderRadius: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <p style={{color: '#ff0000', fontSize: '1.2rem', margin: 0}}>
                            ⚠ Error Loading Pathway
                        </p>
                        <p style={{color: 'var(--silver)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
                            {error}
                        </p>
                        <p style={{color: 'var(--silver)', fontSize: '0.8rem', marginTop: '1rem'}}>
                            Make sure the backend server is running at http://localhost:8000
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Success state - render graph
    
    return (
        <div className={styles.mainContent} style={{
            padding: '2rem',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2rem',
            maxWidth: '90rem',
            minHeight: '40vh',
            position: 'relative'
        }}>
            {/* Title and Description specific to the Complex Map */}
            <div style={{width: '100%', textAlign: 'center', marginBottom: '1rem'}}>
                <h1 style={{
                    fontSize: '2rem',
                    color: 'var(--bright-white)',
                    marginBottom: '0.5rem',
                    textShadow: '1px 1px 0 var(--uh-green)'
                }}>
                    {data.title}
                </h1>
                <p className={styles.homeSubtitle} style={{textAlign: 'center', margin: '0', fontSize: '1rem', color: 'var(--silver)'}}>
                    {data.description}
                </p>
            </div>
            
            {/* --- GRAPH AREA --- */}
            <div style={{
                width: '100%', 
                border: '2px solid var(--uh-green)',
                boxShadow: '0 0 15px rgba(0, 135, 81, 0.4)',
                borderRadius: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                position: 'relative'
            }}>
                <VisNetworkGraph data={graphData} onNodeClick={handleNodeClick} />
                
                {/* Skill Detail Panel */}
                {selectedNode && (
                    <div className={styles.skillPanel}>
                        <div className={styles.skillPanelHeader}>
                            <h3 className={styles.skillPanelTitle}>
                                {selectedNode.title || selectedNode.label}
                                {selectedNode.isCurrentSkill && <span style={{ color: '#FFD700', marginLeft: '0.5rem', fontSize: '0.8rem' }}>✓</span>}
                            </h3>
                            <button 
                                type="button" 
                                className={styles.closePanelButton} 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    closePanel();
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.skillPanelContent}>
                            
                            {/* ADD THE BANNER HERE - FIRST THING INSIDE skillPanelContent */}
                            {selectedNode.isCurrentSkill && (
                                <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '1px solid #FFD700', borderRadius: '0' }}>
                                    <p style={{ color: '#FFD700', fontSize: '0.75rem', margin: 0, fontWeight: 'bold' }}>
                                        ✓ You already have this skill from your current role
                                    </p>
                                </div>
                            )}

                            <div className={styles.skillDescription}>
                                <h4 style={{color: 'var(--uh-green)', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Description:</h4>
                                <p style={{color: 'var(--bright-white)', fontSize: '0.85rem', lineHeight: '1.4'}}>
                                    {selectedNode.description}
                                </p>
                            </div>
                            <div className={styles.skillCourses}>
                                <h4 style={{color: 'var(--uh-green)', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Related Courses:</h4>
                                {selectedNode.courses && selectedNode.courses.length > 0 ? (
                                    <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                        {selectedNode.courses.map((course, index) => (
                                            <li key={index} style={{
                                                color: 'var(--silver)',
                                                fontSize: '0.8rem',
                                                marginBottom: '0.3rem',
                                                paddingLeft: '1rem',
                                                position: 'relative'
                                            }}>
                                                <span style={{position: 'absolute', left: 0, color: 'var(--uh-green)'}}>▸</span>
                                                {course}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{color: 'var(--silver)', fontSize: '0.8rem', fontStyle: 'italic'}}>
                                        No courses available for this skill.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- BASIC MAP CONTENT (Displays the General Education Requirements) ---
const BasicMapContent = ({ styles }) => {
    // This component remains unchanged, but you could also use
    // VisNetworkGraph here for a different set of data.
    const data = {
        title: "Basic Course Map",
        description: "This map visualizes the mandatory, foundational **course path** (e.g., General Education requirements) required for your degree."
    };

    return (
        <div className={styles.mainContent} style={{
            padding: '2rem',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2rem',
            maxWidth: '90rem',
            minHeight: '40vh' 
        }}>
            {/* Title and Description specific to the Basic Map */}
            <div style={{width: '100%', textAlign: 'center', marginBottom: '1rem'}}>
                <h1 style={{
                    fontSize: '2rem',
                    color: 'var(--bright-white)',
                    marginBottom: '0.5rem',
                    textShadow: '1px 1px 0 var(--uh-green)'
                }}>
                    {data.title}
                </h1>
                <p className={styles.homeSubtitle} style={{textAlign: 'center', margin: '0', fontSize: '1rem', color: 'var(--silver)'}}>
                    {data.description}
                </p>
            </div>
            
            {/* Placeholder Content for Basic Course Map */}
            <div style={{
                width: '100%', 
                textAlign: 'center', 
                padding: '4rem 0', 
                border: '2px dashed rgba(192, 192, 192, 0.3)', 
                borderRadius: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
                <p style={{color: 'var(--uh-green)', fontSize: '1.2rem', margin: 0}}>
                    [Course Path Node Map Generation]
                </p>
                <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                    This area will display a node map of core, mandatory courses, showing prerequisites and sequences.
                </p>
            </div>
        </div>
    );
};


// --- JOB STATS CONTENT COMPONENT (UPDATED) ---
const JobStatsContent = ({ styles, job1, job2 }) => {
    const data = {
        title: "BLS Career Outlook Comparison",
        description: "Compare key statistics from the Bureau of Labor Statistics for your current and dream roles."
    };
    
    const isSubmitted = job1 && job2;

    const placeholderContent = isSubmitted ? (
        <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                Stats feature coming soon - currently showing pathway data.
            </p>
        </div>
    ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{color: 'gray', fontSize: '1.2rem', margin: 0}}>
                Awaiting Role Submissions
            </p>
            <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                Select and submit your Job 1 (Current) and Job 2 (Dream) roles in the header above to view comparison statistics.
            </p>
        </div>
    );
    
    return (
        <div className={styles.mainContent} style={{
            padding: '2rem',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2rem',
            maxWidth: '90rem',
            minHeight: '40vh' 
        }}>
            <div style={{width: '100%', textAlign: 'center', marginBottom: '1rem'}}>
                <h1 style={{
                    fontSize: '2rem',
                    color: 'var(--bright-white)',
                    marginBottom: '0.5rem',
                    textShadow: '1px 1px 0 var(--uh-green)'
                }}>
                    {data.title}
                </h1>
                <p className={styles.homeSubtitle} style={{textAlign: 'center', margin: '0', fontSize: '1rem', color: 'var(--silver)'}}>
                    {data.description}
                </p>
            </div>
            
            <div style={{
                width: '100%', 
                border: !isSubmitted ? '2px dashed rgba(255, 255, 255, 0.2)' : 'none', 
                borderRadius: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: !isSubmitted ? '0' : '0 1rem', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
                {placeholderContent}
            </div>
        </div>
    );
};


const App = () => {
  const [currentPage, setCurrentPage] = useState(PAGE_HOME);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [job1, setJob1] = useState('');
  const [job2, setJob2] = useState('');
  const [job1Submitted, setJob1Submitted] = useState(false);
  const [job2Submitted, setJob2Submitted] = useState(false);
  const [job1Suggestions, setJob1Suggestions] = useState([]);
  const [job2Suggestions, setJob2Suggestions] = useState([]);
  const [isJob1Focused, setIsJob1Focused] = useState(false);
  const [isJob2Focused, setIsJob2Focused] = useState(false);

  // Load available job titles from backend
  useEffect(() => {
    const loadJobs = async () => {
      try {
        console.log('Loading jobs from backend...');
        const jobs = await getAvailableJobs();
        console.log('Jobs loaded:', jobs.length);
        console.log('First 5 jobs:', jobs.slice(0, 5));
        setAvailableJobs(jobs);
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setAvailableJobs([]);
      }
    };
    loadJobs();
  }, []);

  const filterSuggestions = useCallback((inputValue) => {
    console.log(`filterSuggestions called. availableJobs.length=${availableJobs.length}, inputValue="${inputValue}"`);
    if (!inputValue) {
      console.log(`Empty input - returning all ${availableJobs.length} jobs`);
      return availableJobs;
    }
    const lowerInput = inputValue.toLowerCase();
    const filtered = availableJobs.filter(title => 
      title.toLowerCase().includes(lowerInput)
    );
    console.log(`Filtering "${inputValue}": found ${filtered.length} matches from ${availableJobs.length} total`);
    return filtered;
  }, [availableJobs]);

  const selectSuggestion = (jobTitle, type) => {
    if (type === 'job1') {
      setJob1(jobTitle);
      setJob1Suggestions([]);
      setIsJob1Focused(false);
    } else {
      setJob2(jobTitle);
      setJob2Suggestions([]);
      setIsJob2Focused(false);
    }
  };
  
  const handleJob1Change = (e) => {
    const value = e.target.value;
    setJob1(value);
    setJob1Suggestions(filterSuggestions(value));
  };

  const handleJob2Change = (e) => {
    const value = e.target.value;
    setJob2(value);
    setJob2Suggestions(filterSuggestions(value));
  };
  
  const handleGetPathway = () => {
    console.log(`handleGetPathway called with job1="${job1}", job2="${job2}"`);
    setJob1Submitted(job1);
    setJob2Submitted(job2);
    console.log(`handleGetPathway: Set submitted states`);
  };

  const renderSuggestions = (suggestions, type) => {
    console.log(`Rendering suggestions for ${type}:`, suggestions.length, suggestions.slice(0, 3));
    if (suggestions.length === 0) {
      return (
        <div className={styles.suggestionsContainer}>
          <div className={styles.suggestionItem}>
            No matches found
          </div>
        </div>
      );
    }
    return (
      <div className={styles.suggestionsContainer}>
        {suggestions.map((title) => (
          <div
            key={title}
            className={styles.suggestionItem}
            onMouseDown={() => selectSuggestion(title, type)}
          >
            {title}
          </div>
        ))}
      </div>
    );
  };

  const renderPageContent = () => {
    const title = PAGE_TITLES[currentPage] || 'Skill Mapper';
    
    const inputHeaderProps = {
        styles,
        job1,
        job2,
        job1Submitted,
        job2Submitted,
        handleJob1Change,
        handleJob2Change,
        handleGetPathway,
        job1Suggestions,
        job2Suggestions,
        isJob1Focused,
        isJob2Focused,
        renderSuggestions,
        setIsJob1Focused,
        setIsJob2Focused,
        setJob1Suggestions,
        setJob2Suggestions,
        filterSuggestions,
        pageTitle: title,
    };
    
    switch (currentPage) {
      case PAGE_HOME:
        return <HomePage styles={styles} setCurrentPage={setCurrentPage} />;
        
      case PAGE_COMPLEX:
        return (
          <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <JobInputHeader {...inputHeaderProps} /> 
            <ComplexMapContent 
                styles={styles} 
                job1={job1Submitted ? job1 : ''} 
                job2={job2Submitted ? job2 : ''} 
            />
          </div>
        );

      case PAGE_BASIC:
        return (
            <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <JobInputHeader {...inputHeaderProps} />
                <BasicMapContent styles={styles} />
            </div>
        );
        
      case PAGE_STATS: 
        return (
            <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <JobInputHeader {...inputHeaderProps} />
                <JobStatsContent 
                    styles={styles} 
                    job1={job1Submitted ? job1 : ''} 
                    job2={job2Submitted ? job2 : ''} 
                />
            </div>
        );

      default:
        return <HomePage styles={styles} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundLayer}></div>
      <Navigation 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        styles={styles} 
      />
      {renderPageContent()}
    </div>
  );
};

export default App;