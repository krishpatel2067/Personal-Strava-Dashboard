import { stravaFetch } from "./client.js";

/**
 * Fetches detailed information about a specific piece of gear (shoe or bike).
 * Refer to: https://developers.strava.com/docs/reference/#api-Gears-getGearById
 * 
 * @param {string} gearId - The unique identifier of the gear
 * @param {string} accessToken - Valid Strava access token
 * @return {Promise<Object>} - Detailed gear object
 */
export async function getGear(gearId, accessToken) {
    return stravaFetch(`gear/${gearId}`, accessToken);
}
