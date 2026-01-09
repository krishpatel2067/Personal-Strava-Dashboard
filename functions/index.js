import { initializeApp, cert } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import { info } from "firebase-functions/logger";
import { retrieveAllData } from "./fetch.js";
import serviceAccountKey from "./serviceAccountKey.json" with { type: "json" };

const bucketVar = defineString("STORAGE_BUCKET");
const app = initializeApp({ credential: cert(serviceAccountKey) });

export const fetchAndStore = onSchedule("every day 01:00", async () => {
    info("Starting fetch and store operation...");
    await retrieveAllData(app, bucketVar.value(), true);
    info("Finished fetch and store operation.");
});
