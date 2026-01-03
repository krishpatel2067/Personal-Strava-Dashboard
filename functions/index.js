import { initializeApp, cert } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import logger from "firebase-functions/logger";
import fetch from "./fetch";

// env vars
const bucketVar = defineString("STORAGE_BUCKET");

const serviceAccount = require("./serviceAccountKey.json");
const app = initializeApp({
    credential: cert(serviceAccount),
});

export const fetchAndStore = onSchedule("every day 01:00", async (event) => {
    logger.info(event);
    logger.info("Starting fetch and store operation...", { structuredData: true });
    await fetch.retrieveAllData(app, bucketVar.value(), true);
    logger.info("Finished fetch and store operation.");
});
