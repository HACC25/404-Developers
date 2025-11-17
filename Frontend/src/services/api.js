/**
 * API Service Module
 * Handles all communication with the backend at http://localhost:8000
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * Fetch list of all available job titles from SOC
 * @returns {Promise<Array>} Array of job titles
 * @throws {Error} If the request fails
 */
export const getAvailableJobs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
};

/**
 * Fetch the skill pathway data from the backend
 * @param {string} job1 - Current/starting job title
 * @param {string} job2 - Dream/goal job title
 * @returns {Promise<Object>} The pathway data with nodes and edges
 * @throws {Error} If the request fails
 */
export const getPathway = async (job1, job2) => {
  try {
    // Encode job titles to handle special characters
    const encodedJob1 = encodeURIComponent(job1);
    const encodedJob2 = encodeURIComponent(job2);
    
    const response = await fetch(
      `${API_BASE_URL}/pathway/${encodedJob1}/${encodedJob2}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pathway: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pathway:', error);
    throw error;
  }
};

/**
 * Health check - verify the backend is running
 * @returns {Promise<boolean>} True if backend is accessible
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/docs`);
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};
