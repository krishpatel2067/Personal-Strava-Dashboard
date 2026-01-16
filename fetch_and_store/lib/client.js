const BASE_URL = "https://www.strava.com/api/v3";

/**
 * A thin wrapper around the native fetch() specialized for the Strava API.
 * Automatically handles the base URL and Authorization header.
 * 
 * @param {string} endpoint - API endpoint starting WITHOUT a slash (e.g., 'athlete/activities')
 * @param {string} accessToken - Valid Strava access token
 * @param {Object} [options={}] - Standard fetch options (method, body, params)
 * @return {Promise<Object>} - Parsed JSON response
 */
export async function stravaFetch(endpoint, accessToken, options = {}) {
    const { params, ...fetchOptions } = options;

    // Construct URL with query parameters
    const url = new URL(`${BASE_URL}/${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
    }

    const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...fetchOptions.headers,
        },
    });

    if (response.status === 429) {
        const err = new Error("Strava Rate Limit Exceeded (429)");
        err.status = 429;
        throw err;
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || response.statusText;
        throw new Error(`Strava API Error: ${message} (${response.status})`);
    }

    return response.json();
}
