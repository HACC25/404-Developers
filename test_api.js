// Quick test of backend API

async function testPathway() {
    try {
        const job1 = "Chief Executives";
        const job2 = "General and Operations Managers";
        const url = `http://127.0.0.1:8000/pathway/${encodeURIComponent(job1)}/${encodeURIComponent(job2)}`;
        
        console.log(`Testing: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("Response:", data);
        console.log("Has error?", !!data.error);
        if (!data.error) {
            console.log("Nodes:", data.nodes?.length || 0);
            console.log("Edges:", data.edges?.length || 0);
            if (data.nodes && data.nodes.length > 0) {
                console.log("First node:", data.nodes[0]);
            }
            if (data.edges && data.edges.length > 0) {
                console.log("First edge:", data.edges[0]);
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

testPathway();
