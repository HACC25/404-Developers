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

// Mock BLS Job Titles for demonstration
const MOCK_BLS_JOB_TITLES = [
  'Software Developers',
  'Data Scientists',
  'Computer Systems Analysts',
  'Financial Analysts',
  // Note: 'Data Analysis Method Development' is a skill, but we keep the mock job titles here.
];

const MOCK_JOB_SKILLS = {
  'Software Developers': [
    'Describe the Visual Elements of Design',
    'Employ Digital Visual Tools',
    'Apply Visual Design Principles',
    'Create Storyboards with Technology'
  ],
  'Computer Systems Analysts': [
    'Describe the Visual Elements of Design',
    'Instructional Design and Technology Application',
    'Design Curriculum within Technology Requirements'
  ],
  'Financial Analysts': [
    'Describe the Visual Elements of Design',
    'Apply Visual Design Principles'
  ],
  'Data Scientists': []
};

// --- MOCK BLS STATS DATA ---
const MOCK_BLS_STATS = {
  'Software Developers': {
    wage: '$130,160',
    jobs: '1,800,000',
    growth: '25%', 
    education: 'Bachelor\'s Degree',
  },
  'Data Scientists': {
    wage: '$103,500',
    jobs: '179,000',
    growth: '35%', 
    education: 'Master\'s Degree',
  },
  'Computer Systems Analysts': {
    wage: '$102,280',
    jobs: '619,000',
    growth: '10%',
    education: 'Bachelor\'s Degree',
  },
  'Financial Analysts': {
    wage: '$99,880',
    jobs: '360,000',
    growth: '8%',
    education: 'Bachelor\'s Degree',
  },
};
const getJobStats = (jobTitle) => MOCK_BLS_STATS[jobTitle] || null;

// Helper to strip non-numeric characters for comparison
const parseNumericValue = (str) => {
    if (!str) return 0;
    const numericStr = str.replace(/[$,%,A-Za-z\s]/g, '');
    return parseFloat(numericStr);
};


// Logic to determine which role has the superior value (used for highlighting)
const determineHighlightStatus = (key, currentValue, dreamValue) => {
    if (!currentValue || !dreamValue) {
        return { currentHighlight: false, dreamHighlight: false };
    }
    if (key === 'education') {
        return { currentHighlight: false, dreamHighlight: false };
    }
    const numCurrent = parseNumericValue(currentValue);
    const numDream = parseNumericValue(dreamValue);
    let currentIsWinner = false;
    let dreamIsWinner = false;
    if (numCurrent > numDream) {
        currentIsWinner = true;
    } else if (numDream > numCurrent) {
        dreamIsWinner = true;
    }
    return { 
        currentHighlight: currentIsWinner, 
        dreamHighlight: dreamIsWinner 
    };
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
const processGraphData = (rawData, currentJobSkills = []) => {
    // Find the actual start and goal IDs based on the first and last skill in the path
    const startId = rawData.edges[0]?.from || '';
    const goalId = rawData.edges[rawData.edges.length - 1]?.to || '';

    const nodes = rawData.nodes
        .filter(node => node.id !== 'root') // Filter out the utility 'root' node
        .map(node => {  
            const isCurrentSkill = currentJobSkills.includes(node.skill_name);
            
            let color = { border: '#008751', background: '#000000' }; // Default Skill/Course Green
            // Replace spaces with newlines to prevent excessively wide nodes
            let label = node.skill_name.replace(/ /g, '\n'); 
            let shape = 'box';

            if (node.id === startId) {
                // If this is the starting skill in the path
                color = { border: '#C0C0C0', background: '#000000' }; // Silver/Current Role style
                label = `${node.skill_name}\n(Start Skill)`; 
                shape = 'box';
            } else if (node.id === goalId) {
                // If this is the final skill in the path
                color = { border: '#39FF14', background: '#000000' }; // Neon Green/Dream Role style
                label = `${node.skill_name}\n(Goal Skill)`; 
                shape = 'star'; // Use a star shape for the goal
            }  else if (isCurrentSkill) {
                color = { border: '#FFD700', background: '#1a1a00' };
                label = `${node.skill_name}\n✓ Already Have`; 
                shape = 'box';
            }
            
            return {
                id: node.id, 
                label: label,
                shape: shape,
                color: color,
                // The title will show the original skill name on hover
                title: node.skill_name,
                // Store the full node data for access when clicked
                description: node.description || 'No description available.',
                courses: node.courses ? node.courses.map(c => `${c.course_prefix} ${c.course_number} - ${c.course_title}`) : [], // Extract and format courses from the new data structure
                isCurrentSkill: isCurrentSkill
            };
        });

    const edges = rawData.edges
        // Filter out edges connecting from the utility 'root' node
        .filter(edge => edge.from !== 'root')
        .map(edge => ({
            from: edge.from,
            to: edge.to,
            color: { color: '#008751' }
        }));

    return { nodes, edges, rawNodes: rawData.nodes };
};

// --- MOCK GRAPH DATA (Including the new complex path) ---
const MOCK_GRAPH_DATA = {
    // Default graph to show when no specific path is selected
    default: {
        nodes: [
            { id: 'start', label: 'Submit Roles', color: { border: '#C0C0C0', background: '#000' }, x: -100, y: 0 },
            { id: 'goal', label: 'View Path', color: { border: '#39FF14', background: '#000' }, x: 100, y: 0 },
        ],
        edges: [
            { from: 'start', to: 'goal', color: { color: '#008751' } }
        ]
    },
    // The new complex path using the JSON data, triggered by the roles.
    'Software Developers-Data Scientists': (currentJobSkills) => processGraphData(RAW_DATA_ANALYST_PATH, currentJobSkills),
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
  currentJob,
  dreamJob,
  currentJobIsSubmitted,
  dreamJobIsSubmitted,
  handleCurrentJobChange,
  handleDreamJobChange,
  handleSubmission,
  handleRevertSubmission,
  currentSuggestions,
  dreamSuggestions,
  isCurrentFocused,
  isDreamFocused,
  renderSuggestions,
  renderSubmitButton,
  setIsCurrentFocused,
  setIsDreamFocused,
  pageTitle, 
}) => (
  <header className={styles.headerContainer}>
    
    <h1 className={styles.title}>
      {pageTitle}
    </h1>

    <div className={styles.inputSection}>
      
      <div className={styles.inputGroup}>
        <label htmlFor="dream-job" className={styles.inputLabel}>
          Dream Role (BLS Match)
        </label>
        <input
          id="dream-job"
          type="text"
          value={dreamJob}
          onChange={handleDreamJobChange}
          onFocus={() => setIsDreamFocused(true)}
          onBlur={() => setTimeout(() => setIsDreamFocused(false), 150)}
          placeholder="e.g., Data Scientists"
          className={`${styles.inputField} ${dreamJobIsSubmitted ? styles.submitted : ''}`}
          disabled={dreamJobIsSubmitted}
        />
        {isDreamFocused && dreamSuggestions.length > 0 && !dreamJobIsSubmitted && renderSuggestions(dreamSuggestions, 'dream')}
        {renderSubmitButton('dream')}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="current-job" className={styles.inputLabel}>
          Current Role (BLS Match)
        </label>
        <input
          id="current-job"
          type="text"
          value={currentJob}
          onChange={handleCurrentJobChange}
          onFocus={() => setIsCurrentFocused(true)}
          onBlur={() => setTimeout(() => setIsCurrentFocused(false), 150)}
          placeholder="e.g., Software Developers"
          className={`${styles.inputField} ${currentJobIsSubmitted ? styles.submitted : ''}`}
          disabled={currentJobIsSubmitted}
        />
        {isCurrentFocused && currentSuggestions.length > 0 && !currentJobIsSubmitted && renderSuggestions(currentSuggestions, 'current')}
        {renderSubmitButton('current')}
      </div>
    </div>

  </header>
);


// --- VIS-NETWORK WRAPPER COMPONENT ---
// This component wraps the vis-network library
const VisNetworkGraph = ({ data, onNodeClick }) => {
    // A ref to attach to the DOM element
    const visJsRef = useRef(null);
    const networkRef = useRef(null); // Ref for the network instance

    // Function to handle resize and fit the network
    const fitNetwork = useCallback(() => {
        if (networkRef.current) {
            networkRef.current.fit();
        }
    }, []);

    useEffect(() => {
        // CRITICAL CHECK: Ensure both required classes are available.
        if (!visJsRef.current || !DataSet || !Network) {
            console.error("VIS-NETWORK ERROR: DataSet or Network components are missing.");
            console.warn("If the error persists, you may need to install the 'vis-data' package.");
            return; 
        }

        // Create DataSet instances using the imported DataSet class
        const nodes = new DataSet(data.nodes); 
        const edges = new DataSet(data.edges);

        // Define options to match your CRT theme
        const options = {
            layout: {
                // Hierarchical layout is better for directed graphs like this one
                hierarchical: {
                    enabled: true,
                    direction: 'LR', // Left-to-Right layout
                    sortMethod: 'directed',
                    levelSeparation: 150, // Space between levels
                    nodeSpacing: 100, // Space between nodes in the same level
                },
            },
            physics: {
                enabled: false, // Disable physics for a static layout
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
    }, [data, fitNetwork, onNodeClick]); // Re-run effect if data changes

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
const ComplexMapContent = ({ styles, submittedCurrentJob, submittedDreamJob }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const isSubmitted = submittedCurrentJob && submittedDreamJob;
    const data = {
        title: "Complex Course & Skill Map",
        description: "This map visualizes the optimal path, showing the skills you need to acquire and the associated elective courses required to move from your Current Role to your Dream Role."
    };

    const currentJobSkills = MOCK_JOB_SKILLS[submittedCurrentJob] || [];

    // --- Logic to select the correct graph data ---
    let graphData;
    // Key is generated from submitted roles
    const dataKey = `${submittedCurrentJob}-${submittedDreamJob}`; 

    if (isSubmitted && MOCK_GRAPH_DATA[dataKey]) {
        // Use the new complex data if the specific combination is selected
        graphData = typeof MOCK_GRAPH_DATA[dataKey] === 'function' 
            ? MOCK_GRAPH_DATA[dataKey](currentJobSkills)
            : MOCK_GRAPH_DATA[dataKey];
    } else if (isSubmitted) {
        // If roles are submitted but no specific path exists, use a default map 
        graphData = MOCK_GRAPH_DATA.default; 
    } else {
        // If roles are not submitted, show the placeholder text
        const placeholderContent = (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{color: 'gray', fontSize: '1.2rem', margin: 0}}>
                    Awaiting Role Submissions
                </p>
                <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                    Try submitting **"Software Developers"** as your Current Role and **"Data Scientists"** as your Dream Role to view the new path.
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

                {/* Legend - ADD THIS HERE */}
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
                    border: '2px solid var(--uh-green)', // Use your CRT border
                    boxShadow: '0 0 15px rgba(0, 135, 81, 0.4)', // Use your CRT glow
                    borderRadius: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}>
                    {placeholderContent}
                </div>
            </div>
        );
    }
    // --- End graph data logic ---

    const handleNodeClick = (nodeData) => {
        setSelectedNode(nodeData);
    };

    const closePanel = () => {
        setSelectedNode(null);
    };
    
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
                            <button className={styles.closePanelButton} onClick={closePanel}>
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
const JobStatsContent = ({ styles, submittedCurrentJob, submittedDreamJob }) => {
    const data = {
        title: "BLS Career Outlook Comparison",
        description: "Compare key statistics from the Bureau of Labor Statistics for your current and dream roles."
    };

    const currentStats = getJobStats(submittedCurrentJob);
    const dreamStats = getJobStats(submittedDreamJob);
    
    const isSubmitted = submittedCurrentJob && submittedDreamJob;

    const statRows = [
        { label: 'Median Annual Wage', key: 'wage' },
        { label: 'Projected Job Growth (2022-32)', key: 'growth' },
        { label: 'Total Number of Jobs', key: 'jobs' },
        { label: 'Typical Entry-Level Education', key: 'education' },
    ];
    
    const hasData = currentStats && dreamStats;

    const placeholderContent = isSubmitted ? (
        hasData ? (
            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <table className={styles.statsTable}>
                    <thead>
                        <tr>
                            <th className={styles.statHeader}>Metric</th>
                            <th className={styles.statHeader}>{submittedCurrentJob}</th>
                            <th className={styles.statHeader}>{submittedDreamJob}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statRows.map(row => {
                            const highlightStatus = determineHighlightStatus(
                                row.key, 
                                currentStats[row.key], 
                                dreamStats[row.key]
                            );
                            
                            return (
                                <tr key={row.key} className={styles.statRow}>
                                    <td className={styles.statLabel}>
                                        {row.label}
                                    </td>
                                    <td 
                                        className={`${styles.statValue} ${highlightStatus.currentHighlight ? styles.highlightedValue : ''}`}
                                    >
                                        {currentStats[row.key]}
                                    </td>
                                    <td 
                                        className={`${styles.statValue} ${highlightStatus.dreamHighlight ? styles.highlightedValue : ''}`}
                                    >
                                        {dreamStats[row.key]}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <p className={styles.statNote}>
                    Note: Data is simulated for demonstration and based on mock BLS reporting.
                </p>
            </div>
        ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{color: 'gray', fontSize: '1.2rem', margin: 0}}>
                    Role data not found in mock database.
                </p>
                <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                    Please try the mock roles like **"Software Developers"** or **"Data Scientists."**
                </p>
            </div>
        )
    ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{color: 'gray', fontSize: '1.2rem', margin: 0}}>
                Awaiting Role Submissions
            </p>
            <p style={{color: 'var(--silver)', fontSize: '1rem', marginTop: '0.5rem'}}>
                Select and submit your Current Role and Dream Role in the header above to view comparison statistics.
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
                border: !hasData ? '2px dashed rgba(255, 255, 255, 0.2)' : 'none', 
                borderRadius: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: !hasData ? '0' : '0 1rem', 
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
  const [availableJobTitles, setAvailableJobTitles] = useState([]);
  const [currentJob, setCurrentJob] = useState('');
  const [dreamJob, setDreamJob] = useState('');
  const [submittedCurrentJob, setSubmittedCurrentJob] = useState('');
  const [submittedDreamJob, setSubmittedDreamJob] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [dreamSuggestions, setDreamSuggestions] = useState([]);
  const [isCurrentFocused, setIsCurrentFocused] = useState(false);
  const [isDreamFocused, setIsDreamFocused] = useState(false);

  useEffect(() => {
    const loadJobTitles = () => {
      setAvailableJobTitles(MOCK_BLS_JOB_TITLES); 
    };
    loadJobTitles();
  }, []);

  const isValidJobTitle = useCallback((jobTitle) => {
      return availableJobTitles.includes(jobTitle);
  }, [availableJobTitles]);

  const filterSuggestions = useCallback((inputValue) => {
    if (!inputValue) return [];
    const lowerInput = inputValue.toLowerCase();
    return availableJobTitles.filter(title => 
      title.toLowerCase().includes(lowerInput)
    );
  }, [availableJobTitles]);

  const selectSuggestion = (jobTitle, type) => {
    if (type === 'current') {
      setCurrentJob(jobTitle);
      setCurrentSuggestions([]);
      setIsCurrentFocused(false);
    } else {
      setDreamJob(jobTitle);
      setDreamSuggestions([]);
      setIsDreamFocused(false);
    }
  };
  
  const handleCurrentJobChange = (e) => {
    const value = e.target.value;
    setCurrentJob(value);
    setCurrentSuggestions(filterSuggestions(value));
  };

  const handleDreamJobChange = (e) => {
    const value = e.target.value;
    setDreamJob(value);
    setDreamSuggestions(filterSuggestions(value));
  };
  
  const handleSubmission = (type) => {
    if (type === 'current' && currentJob && isValidJobTitle(currentJob)) {
      setSubmittedCurrentJob(currentJob);
      setCurrentSuggestions([]);
    } else if (type === 'dream' && dreamJob && isValidJobTitle(dreamJob)) {
      setSubmittedDreamJob(dreamJob);
      setDreamSuggestions([]);
    }
  };
  
  const handleRevertSubmission = (type) => {
      if (type === 'current') {
          setSubmittedCurrentJob('');
      } else {
          setSubmittedDreamJob('');
      }
  };

  const renderSuggestions = (suggestions, type) => {
    if (suggestions.length === 0) return null;
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
  
  const currentJobIsSubmitted = submittedCurrentJob && submittedCurrentJob === currentJob;
  const dreamJobIsSubmitted = submittedDreamJob && submittedDreamJob === dreamJob;
  const currentJobIsValid = isValidJobTitle(currentJob);
  const dreamJobIsValid = isValidJobTitle(dreamJob);

  const renderSubmitButton = (type) => {
      const isSubmitted = type === 'current' ? currentJobIsSubmitted : dreamJobIsSubmitted;
      const isValid = type === 'current' ? currentJobIsValid : dreamJobIsValid;
      const jobValue = type === 'current' ? currentJob : dreamJob;

      if (isSubmitted) {
          return (
              <button 
                className={`${styles.submitButton} ${styles.changeButton}`}
                onClick={() => handleRevertSubmission(type)}
              >
                Change Role
              </button>
          );
      }
      
      return (
          <button 
            className={styles.submitButton}
            onClick={() => handleSubmission(type)}
            disabled={!jobValue || !isValid}
          >
            Submit {type === 'current' ? 'Current' : 'Dream'} Role
          </button>
      );
  };

  const renderPageContent = () => {
    const title = PAGE_TITLES[currentPage] || 'Skill Mapper';
    
    const inputHeaderProps = {
        styles,
        currentJob,
        dreamJob,
        currentJobIsSubmitted,
        dreamJobIsSubmitted,
        handleCurrentJobChange,
        handleDreamJobChange,
        handleSubmission,
        handleRevertSubmission,
        currentSuggestions,
        dreamSuggestions,
        isCurrentFocused,
        isDreamFocused,
        renderSuggestions,
        renderSubmitButton,
        setIsCurrentFocused,
        setIsDreamFocused,
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
                submittedCurrentJob={submittedCurrentJob} 
                submittedDreamJob={submittedDreamJob} 
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
                    submittedCurrentJob={submittedCurrentJob} 
                    submittedDreamJob={submittedDreamJob} 
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