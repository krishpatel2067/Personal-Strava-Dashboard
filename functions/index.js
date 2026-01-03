import { initializeApp, cert } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import { info } from "firebase-functions/logger";
import path from "path";
import { readFile } from "fs/promises";
import { retrieveAllData } from "./fetch.js";

// env vars
const bucketVar = defineString("STORAGE_BUCKET");

const serviceAccount = await readFile(path.join(process.cwd(), "serviceAccountKey.json"), "utf-8");
const app = initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
});

export const fetchAndStore = onSchedule("every day 01:00", async (event) => {
    info(event);
    info("Starting fetch and store operation...", { structuredData: true });
    await retrieveAllData(app, bucketVar.value(), true);
    info("Finished fetch and store operation.");
});
