import { stravaFetch } from "./client.js";

/**
 * Fetches the detailed profile of the currently authenticated athlete.
 * Refer to: https://developers.strava.com/docs/reference/#api-Athletes-getLoggedInAthlete
 * 
 * @param {string} accessToken - Valid Strava access token
 * @returns {Promise<Object>} - Detailed athlete object
 */
export async function getLoggedInAthlete(accessToken) {
    return stravaFetch("athlete", accessToken);
}
