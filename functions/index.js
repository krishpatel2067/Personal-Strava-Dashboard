const { initializeApp } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const { defineString } = require('firebase-functions/params');
// require("dotenv").config();

// env vars
const testVar = defineString("TEST_VAR");

// const serviceAccount = require("./serviceAccountKey.json");
initializeApp();

exports.helloWorld = onRequest(async (request, response) => {
    logger.info("Reading storage...", { structuredData: true });
    logger.info(testVar.value());
    const bucket = getStorage().bucket();
    logger.info("after bucket");
    const fileRef = bucket.file("test/MyTestNote.txt");
    logger.info("after fileRef");
    const url = await getDownloadURL(fileRef);
    logger.info("URL received!");
    logger.info(url);

    response.send("Hello from Firebase!");
});
