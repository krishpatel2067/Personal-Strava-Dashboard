import { getStorage, ref, getDownloadURL } from "firebase/storage";

async function fetchAndProcessAnalysis(app) {
  const storage = getStorage(app);
  const analysisRef = ref(storage, "public/analysis.json");

  try {
    const url = await getDownloadURL(analysisRef);
    const res = await fetch(url);
    let { data, metadata } = await res.json();

    if (import.meta.env.DEV) {
      console.log({ data, metadata });
    }

    // fill in 0 for missing timestamp keys
    // { [period]: { [timestamp]: 0, ... }, ... }
    const periods = ["weekly", "monthly", "yearly"];
    const tsDefaults = {};

    for (const period of periods) {
      tsDefaults[period] = Object.fromEntries(data.activities[period].timestamps.map(ts => [ts, 0]));
    }

    for (const period of periods) {
      // e.g. by_sport, overall, etc., but NOT timestamps
      for (const key1 of Object.keys(data.activities[period])) {
        if (key1 === "timestamps") {
          continue;
        }

        // e.g. activities, distance, kudos, etc.
        for (const key2 of Object.keys(data.activities[period][key1])) {
          if (key1 === "overall") {
            data.activities[period][key1][key2] = {
              ...tsDefaults[period],
              ...data.activities[period][key1][key2]
            }
          } else if (key1 === "by_sport") {
            for (const sport of Object.keys(data.activities[period][key1][key2])) {
              data.activities[period][key1][key2][sport] = {
                ...tsDefaults[period],
                ...data.activities[period][key1][key2][sport]
              }
            }
          }
        }
      }
    }

    return { data, metadata };
  } catch (err) {
    console.log("Error while fetching analysis.json:", err);
  }
}

export { fetchAndProcessAnalysis };