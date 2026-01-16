import pLimit from "p-limit";
import { stravaFetch } from "./client.js";
import { info, warn } from "firebase-functions/logger";

/**
 * Fetches activities in a paginated manner with concurrency control and resume support.
 * 
 * @param {string} accessToken - Valid Strava access token
 * @param {Object} options - Configuration and state
 * @param {number} [options.startPage=1] - Page to start fetching from
 * @param {number} [options.apiLimitDaily=1000] - Daily API limit
 * @param {number} [options.apiLimitNow=100] - Execution API limit
 * @param {number} [options.numFetchesToday=0] - Accumulator for today's fetches
 * @param {Array} [options.existingData=[]] - Data already fetched (for resumption)
 * @param {number} [options.perPage=10] - Page size
 * @param {number} [options.concurrencyLimit=5] - Number of concurrent API requests
 * @return {Promise<Object>} - Result including data, lastPageFetched, and interrupt status
 */
export async function fetchActivities(accessToken, {
    startPage = 1,
    apiLimitDaily = 100,
    apiLimitNow = 10,
    numFetchesToday = 0,
    existingData = [],
    perPage = 200,
    concurrencyLimit = 5,
}) {
    const limit = pLimit(concurrencyLimit);
    let lastSuccessfulPage = startPage - 1;
    let data = [...existingData];
    let interrupted = false;
    let fetchesDoneNow = 0;
    const loop = true;

    info(`Fetching activities starting from page ${startPage}...`);

    while (loop) {
        // Fetch in batches of concurrencyLimit
        const pagesToFetch = Array.from({ length: concurrencyLimit }, (_, i) => (lastSuccessfulPage + 1) + i);

        const results = await Promise.allSettled(
            pagesToFetch.map((p, index) => limit(async () => {
                // Precise check: would this specific request exceed the limit?
                const wouldExceedNow = (fetchesDoneNow + index) >= apiLimitNow;
                const wouldExceedDaily = (numFetchesToday + fetchesDoneNow + index) >= apiLimitDaily;

                if (wouldExceedNow || wouldExceedDaily) {
                    const error = new Error("Rate limit would be exceeded");
                    error.isLimitReached = true;
                    throw error;
                }

                return stravaFetch("athlete/activities", accessToken, {
                    params: {
                        per_page: perPage,
                        page: p,
                    },
                });
            })),
        );

        let stopFetching = false;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const currentPageNum = pagesToFetch[i];

            if (result.status === "fulfilled") {
                const pageData = result.value;
                if (pageData.length > 0) {
                    data = data.concat(pageData);
                    lastSuccessfulPage = currentPageNum;
                    fetchesDoneNow++;

                    if (pageData.length < perPage) {
                        info(`Reached end of data at page ${currentPageNum} (items: ${pageData.length})`);
                        stopFetching = true;
                        break;
                    }
                } else {
                    info(`Reached end of data (empty page ${currentPageNum})`);
                    stopFetching = true;
                    break;
                }
            } else {
                // Handle rejection within the batch
                const err = result.reason;
                if (err.isLimitReached) {
                    warn("Local API limit reached. Interrupting activities fetch...");
                    interrupted = true;
                    stopFetching = true;
                    break;
                } else if (err.status === 429) {
                    warn(`Rate limit hit (429) at page ${currentPageNum}. Interrupting activities fetch...`);
                    interrupted = true;
                    stopFetching = true;
                    break;
                } else {
                    throw err;
                }
            }
        }

        if (stopFetching) break;
    }

    return {
        data,
        lastPageFetched: interrupted ? lastSuccessfulPage : 0,
        fetchesDoneCount: fetchesDoneNow,
        interrupted,
    };
}
