const { initializeApp, cert } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const test = require("./test");

// env vars
const testVar = defineString("TEST_VAR");
const bucketVar = defineString("STORAGE_BUCKET");

const serviceAccount = require("./serviceAccountKey.json");
const app = initializeApp({
    credential: cert(serviceAccount),
});

exports.helloWorld = onRequest(async (request, response) => {
    logger.info("Reading storage...", { structuredData: true });
    logger.info(testVar.value());
    test.testFunc(app, bucketVar.value());
    response.send("Hello from Firebase!");
});
