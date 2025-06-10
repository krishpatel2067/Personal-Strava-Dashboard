/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { initializeApp, cert, storage } = require('firebase-admin/app');
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
require('dotenv').config();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET
});

exports.helloWorld = onRequest((request, response) => {
    logger.info("Reading storage...", { structuredData: true });
    const bucket = getStorage().bucket();
    const fileRef = bucket.file('test/MyTestNote.txt');
    getDownloadURL(fileRef).then(url => {
        logger.info('MyTestNote.txt URL: ', url);
    });
    response.send("Hello from Firebase!");
});

exports.byeWorld = onRequest((request, response) => {
    logger.info("Bye logs!", { structuredData: true });
    response.send("Bye from Firebase!");
});