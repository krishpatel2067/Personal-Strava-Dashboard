import { useEffect, useState } from 'react';
import './App.css'
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import StatCard from './components/StatCard';
import TableCard from './components/TableCard';

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
          const json = await res.json();
          console.log(json);
          setMetadata(json.metadata);
          setData(json.data);
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
