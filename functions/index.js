const { initializeApp, cert } = require("firebase-admin/app");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const fetch = require("./fetch");

// env vars
const bucketVar = defineString("STORAGE_BUCKET");

const serviceAccount = require("./serviceAccountKey.json");
const app = initializeApp({
    credential: cert(serviceAccount),
});

exports.fetchAndStore = onSchedule("every day 01:00", async (event) => {
    logger.info(event);
    logger.info("Starting fetch and store operation...", { structuredData: true });
    await fetch.retrieveAllData(app, bucketVar.value(), true);
    logger.info("Finished fetch and store operation.");
});
