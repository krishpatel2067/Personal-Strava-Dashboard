import { useEffect, useState } from 'react';
import './App.css'
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import StatCard from './components/StatCard';
import TableCard from './components/TableCard';
import ChartCard from './components/ChartCard';
import StackedLineChart from './components/StackedLineChart';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

function mToMi(m) {
  return m / 1609;
}

function sToHrs(s) {
  return s / 3600;
}

function fillKeys(superset, subset, defaultValue = 0) {
  for (const key in superset) {
    if (!(key in subset)) {
      // console.log(`\tfilled ${key} with 0`);
      subset[key] = defaultValue;
    }
  }

  return subset;
}

function App() {
  const [loaded, setLoaded] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchAnalysis = () => {
      const storage = getStorage(app);
      const analysisRef = ref(storage, "public/analysis.json");

      getDownloadURL(analysisRef)
        .then(async url => {
          console.log(url);

          const res = await fetch(url);
          let { data, metadata } = await res.json();

          console.log({ data, metadata });

          // the epoch timestamps of all weeks since account creation
          data.week_starts = Object.keys(data.weekly_distance).sort();

          // different sports were first recorded on different dates (so some week epochs for some sports are missing)
          for (const [sport, distanceData] of Object.entries(data.weekly_distance_by_sport)) {
            // fill non-existent keys to 0; sort by keys (oldest first); retain only the distance
            data.weekly_distance_by_sport[sport] = Object.entries(fillKeys(data.weekly_distance, distanceData))
              .sort((a, b) => a[0] - b[0])
              .map(([_, value]) => value);
          }

          // console.log({ data, metadata });
          setMetadata(metadata);
          setData(data);
          setLoaded(true);
        })
        .catch(err => {
          console.log("Error while fetching analysis.json:", err.message);
        });
    }
    fetchAnalysis();
  }, []);

  return (
    <div className="App">
      {/* add intro! */}
      <main>
        <StatCard
          name="Total Distance"
          stat={mToMi(data.total_distance)}
          units="mi"
          loaded={loaded}
        />
        <StatCard
          name="Total Elapsed Time"
          stat={sToHrs(data.total_elapsed_time)}
          units="hrs"
          loaded={loaded}
        />
        <StatCard
          name="Total Moving Time"
          stat={sToHrs(data.total_moving_time)}
          units="hrs"
          loaded={loaded}
        />
        <TableCard
          name="Distance by Sport"
          // sort by distance, descending
          data={Object.entries(data.distance_by_sport ?? {}).sort((a, b) => b[1] - a[1])}
          headers={["", "Distance (mi)"]}
          applyFunc={(val) => Math.round(mToMi(val))}
          loaded={loaded}
        />
        <ChartCard
          name="Distance Per Week By Sport"
          chart={
            <StackedLineChart
              data={data.weekly_distance_by_sport}
              applyFunc={distance => Math.round(mToMi(distance))}
              xAxis={{
                name: "Date",
                data: loaded ?
                data.week_starts.map(epoch => new Date(Number(epoch)).toLocaleDateString())
                :
                []
              }}
              yAxis={{
                name: "Distance (mi)",
              }}
            />
          }
          loaded={loaded}
        />
      </main>
      <footer>
        <div className="inner-container">
          Last fetched: {new Date(metadata?.fetched_at).toLocaleString()}
          <br />
          Last analyzed: {new Date(metadata?.analyzed_at).toLocaleString()}
        </div>
      </footer>
    </div>
  );
}

export default App
