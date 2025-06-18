const { initializeApp, cert } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const fetch = require("./fetch");

// env vars
const bucketVar = defineString("STORAGE_BUCKET");

const serviceAccount = require("./serviceAccountKey.json");
const app = initializeApp({
    credential: cert(serviceAccount),
});

exports.fetchAndStore = onRequest(async (request, response) => {
    logger.info("Starting fetch and store operation...", { structuredData: true });
    await fetch.retrieveAllData(app, bucketVar.value(), true);
    response.send("Fetch and store operation completed.");
});
