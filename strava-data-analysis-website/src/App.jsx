import { useEffect, useState } from 'react';
import './App.css'
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import StatCard from './components/StatCard';
import TableCard from './components/TableCard';
import ChartCard from './components/ChartCard';
import StackedLineChart from './components/StackedLineChart';
import Tooltip from './components/ToolTip';
import downArrow from "./assets/down_arrow.svg";

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
          for (const [weekKey, totalKey] of [
            ["weekly_distance_by_sport", "weekly_distance"], 
            ["weekly_kudos_by_sport", "weekly_kudos"]
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

          // console.log({ data, metadata });
          setMetadata(metadata);
          setData(data);
          setLoaded(true);
        })
        .catch(err => {
          console.log("Error while fetching analysis.json:", err.message);
        });
    }

    const startGradientAnimation = () => {
      const banner = document.querySelector(".App .banner");
      const options = {
        duration: 1000 * Math.floor(Math.random() * 11 + 10),
        easing: "ease-in-out",
        direction: "alternate",
        iterations: Infinity
      };
      banner.animate([
        {
          "--x": `${Math.floor(Math.random() * 101)}%`,
          "--y": `${Math.floor(Math.random() * 101)}%`
        },
        {
          "--x": `${Math.floor(Math.random() * 101)}%`,
          "--y": `${Math.floor(Math.random() * 101)}%`
        }
      ], options);

      banner.animate([
        {
          "--stop": `${Math.floor(Math.random() * 81 + 20)}%`,
        },
        {
          "--stop": `${Math.floor(Math.random() * 81 + 20)}%`
        }
      ], options);
    }

    fetchAnalysis();
    startGradientAnimation();
  }, []);

  return (
    <div className="App">
      <header>
        <div className="banner">
          <div className="container">
            <h1 className="title">Personal Strava Dashboard</h1>
            <h2 className="subtitle">Krish A. Patel</h2>
            <div className="scroll-hint">
              <p>Scroll</p>
              <img src={downArrow} />
            </div>
          </div>
        </div>
      </header>
      <section className="info">
        <h2>Background</h2>
        <p>
          Since the fall 2021 season of cross country, I have had a passion for running, and from summer 2023, I have been using Strava to post my runs, walks, and other workouts. Lucky for me, Strava has a web API to get a user's activities, and that's how the idea for his project started.
        </p>
        <h2>About</h2>
        <p>
          Personal Strava Dashboard is a statically hosted site that displays the summary statistics calculated from all my Strava activities. Every day, two serverless cloud functions are scheduled to run automatically: one fetches the raw data from Strava, and the other analyzes that data to prepare a clean set of statistics. Finally, this website displays those numbers via cards.
        </p>
        <h2>Technologies Used</h2>
        <ul>
          <li><b>Strava API v3</b>: Authorizes access to my Strava data</li>
          <li><b>Firebase</b>
            <ul>
              <li><b>Storage</b>: Holds both the JSON files containing the latest raw and analyzed data</li>
              <li><b>Functions</b>: Automatically fetches (via JavaScript) and analyzes (via Python and Pandas) the data</li>
              <li><b>Firestore</b>: Stores the necessary credentials for accessing my Strava data</li>
              <li><b>Hosting</b>: Hosts this site</li>
            </ul>
          </li>
          <li><b>React</b>: Creates the structure and logic of this website</li>
          <li><b>Apache ECharts</b>: Displays various visualizations</li>
        </ul>
      </section>
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
          name="Distance Per Week"
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
              showPastDatapointsContent={(textbox) => <><span>Show the past </span>{textbox}<span> weeks</span></>}
            />
          }
          tooltip={<Tooltip
            content={(
              <p>
                <b>Show the past [x] weeks</b>: Start x-axis range from <i>x</i> weeks ago up to now
                <br />
                <b>Toggling series</b>: Click its respective name in the legend.
              </p>
            )}
          />}
          loaded={loaded}
        />
        <ChartCard
          name="Kudos Per Week"
          chart={
            <StackedLineChart
              data={data.weekly_kudos_by_sport}
              xAxis={{
                name: "Date",
                data: loaded ?
                  data.week_starts.map(epoch => new Date(Number(epoch)).toLocaleDateString())
                  :
                  []
              }}
              yAxis={{
                name: "Kudos Count",
              }}
              showPastDatapointsContent={(textbox) => <><span>Show the past </span>{textbox}<span> weeks</span></>}
            />
          }
          tooltip={<Tooltip
            content={(
              <p>
                <b>Show the past [x] weeks</b>: Start x-axis range from <i>x</i> weeks ago up to now
                <br />
                <b>Toggling series</b>: Click its respective name in the legend.
              </p>
            )}
          />}
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
