import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { fillKeys } from "./util";

async function fetchAnalysis(app, setData, setMetadata, setLoaded) {
    const storage = getStorage(app);
    const analysisRef = ref(storage, "public/analysis.json");

    try {

        const url = await getDownloadURL(analysisRef);
        const res = await fetch(url);
        let { data, metadata } = await res.json();

        if (import.meta.env.DEV) {
            console.log({ data, metadata });
        }

        // the epoch timestamps of all weeks since account creation (distance is the superset)
        data.week_starts = Object.keys(data.weekly_distance)
            .map((key) => Number(key))
            .sort();

        // different sports were first recorded on different dates (so some week epochs for some sports are missing)
        for (const [weekKey, totalKey] of [
            ["weekly_distance_by_sport", "weekly_distance"],
            ["weekly_kudos_by_sport", "weekly_kudos"],
            ["weekly_activities_by_sport", "weekly_activities"]
        ]) {
            for (const [sport, weekData] of Object.entries(data[weekKey])) {
                // fill non-existent keys to 0; sort by keys (oldest first); retain only the value (not key)
                data[weekKey][sport] = Object.entries(fillKeys(data[totalKey], weekData))
                    .sort((a, b) => a[0] - b[0])
                    .map(([_, value]) => value);
            }
        }

        data.weekly_distance_by_sport["Total"] = Object.values(data.weekly_distance);
        data.weekly_kudos_by_sport["Total"] = Object.values(data.weekly_kudos);
        data.weekly_activities_by_sport["Total"] = Object.values(data.weekly_activities);

        setMetadata(metadata);
        setData(data);
        setLoaded(true);
    } catch (err) {
        console.log("Error while fetching analysis.json:", err.message);
    }
}

export { fetchAnalysis };