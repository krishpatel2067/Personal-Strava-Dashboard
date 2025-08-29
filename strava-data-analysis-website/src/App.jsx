import { useEffect, useState } from 'react';
import './App.css'
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import StatCard from './components/cards/StatCard';
import TableCard from './components/cards/TableCard';
import ChartCard from './components/cards/ChartCard';
import StackedLineChart from './components/charts/StackedLineChart';
import Tooltip from './components/core/Tooltip';
import downArrow from "./assets/down_arrow.svg";
// TODO: fix date input issue with non en-US locale; style text and date inputs; figure out how to show Monday-based weeks; animate "scroll" text; make tooltip render over graph tooltip

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

const TOOLTIPS = {
  chartCard: (
    <p>
      <b>Show the past [x] weeks</b>: Start x-axis range from <i>x</i> weeks ago up to now, both inclusive. <i>x</i> must be positive. Leave blank to show all available weeks.
      <br />
      <b>Show only weeks from [date1] to [date2]</b>: Start x-axis range from the week that includes <i>date1</i> to the week that includes <i>date2</i>, both inclusive.
      <br />
      <b>Cumulative</b>: Toggle to view data cumulatively or not.
      <br />
      <b>Toggling series</b>: Click its respective name in the legend.
    </p>
  )
};

function mToMi(m) {
  return m / 1609;
}

function sToHrs(s) {
  return s / 3600;
}

function fillKeys(superset, subset, defaultValue = 0) {
  for (const key in superset) {
    if (!(key in subset)) {
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
          const res = await fetch(url);
          let { data, metadata } = await res.json();

          // TOGGLE
          // console.log({ data, metadata });

          // the epoch timestamps of all weeks since account creation (distance is the superset)
          data.week_starts = Object.keys(data.weekly_distance)
            .sort()
            .map(epoch => new Date(Number(epoch)).toLocaleDateString());

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
            <p className="subtitle">Krish A. Patel</p>
            <div className="scroll-hint">
              <p>Scroll</p>
              <img src={downArrow} />
            </div>
          </div>
        </div>
      </header>
      <section className="info">
        <h2>Info</h2>
        <h3>Background</h3>
        <p>
          Since the fall 2021 season of cross country, I have had a passion for running, and from summer 2023, I have been using Strava to post my runs, walks, and other workouts. Lucky for me, Strava has a web API to get a user's activities, and that's how the idea for his project started.
        </p>
        <h3>About</h3>
        <p>
          Personal Strava Dashboard is a statically hosted site that displays the summary statistics calculated from all my Strava activities. Every day, two serverless cloud functions are scheduled to run automatically: one fetches the raw data from Strava, and the other analyzes that data to prepare a clean set of statistics. Finally, this website displays those numbers via cards.
        </p>
        <h3>Features</h3>
        <ul>
          <li><b>Graph interactivity</b>: On top of built-in ECharts interactivity, some visualizations offer, for instance, the ability to restrict the x-axis to "zoom" in and out on the graph.</li>
          <li><b>Responsive design</b>: Works on both desktop and mobile. However, the graphs are much easier to interact with on desktop.</li>
          <li><b>Light and dark mode</b>: Automatically adheres to the device theme.</li>
        </ul>
        <h3>Technologies Used</h3>
        <ul>
          <li><b>Strava API v3</b>: Authorizes access to my Strava data.</li>
          <li><b>Firebase</b>
            <ul>
              <li><b>Storage</b>: Holds both the JSON files containing the latest raw and analyzed data.</li>
              <li><b>Functions</b>: Automatically fetches (via JavaScript) and analyzes (via Python and Pandas) the data.</li>
              <li><b>Firestore</b>: Stores the necessary credentials for accessing my Strava data.</li>
              <li><b>Hosting</b>: Statically hosts this site.</li>
            </ul>
          </li>
          <li><b>React</b>: Creates the structure and logic of this website.</li>
          <li><b>Apache ECharts</b>: Displays various visualizations.</li>
        </ul>
        <h3>Future Plans</h3>
        <p>
          Apart from internal changes (such as refining the codebase), my main plan is to incrementally add new stats and visualizations as I think of them. A smaller plan is to explore better grid options since the current flexbox method has some awkward edge cases.
        </p>
      </section>
      <main>
        <h2>Stats</h2>
        <div className="container">
          <StatCard
            name="Total Distance"
            stat={mToMi(data.total_distance)}
            units="mi"
            loaded={loaded}
          />
          <StatCard
            name="Total Moving Time"
            stat={sToHrs(data.total_moving_time)}
            units="hrs"
            loaded={loaded}
          />
          <StatCard
            name="Total Elapsed Time"
            stat={sToHrs(data.total_elapsed_time)}
            units="hrs"
            loaded={loaded}
          />
          <StatCard
            name="Total Elevation Gain"
            stat={data.total_elevation_gain}
            units="m"
            loaded={loaded}
          />
          <StatCard
            name="Total Kudos"
            stat={data.total_kudos}
            loaded={loaded}
          />
          <StatCard
            name="Total Activities"
            stat={data.total_activities}
            loaded={loaded}
          />
          <StatCard
            name="Total Recorded Activities"
            stat={data.total_recorded_activities}
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
          <TableCard
            name="Elevation Gain by Sport"
            // sort by elevation gain, descending
            data={Object.entries(data.elevation_gain_by_sport ?? {}).sort((a, b) => b[1] - a[1])}
            headers={["", "Elevation Gain (m)"]}
            applyFunc={Math.round}
            loaded={loaded}
          />
          <TableCard
            name="Kudos by Sport"
            // sort by kudos, descending
            data={Object.entries(data.kudos_by_sport ?? {}).sort((a, b) => b[1] - a[1])}
            headers={["", "Kudos Count"]}
            loaded={loaded}
          />
          <TableCard
            name="Activities by Sport"
            // sort by activities, descending
            data={Object.entries(data.activities_by_sport ?? {}).sort((a, b) => b[1] - a[1])}
            headers={["", "Activities Count"]}
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
                  data: loaded ? data.week_starts : []
                }}
                yAxis={{
                  name: "Distance (mi)",
                }}
                pastWeeksDefaultValue={25}
              />
            }
            tooltip={<Tooltip content={TOOLTIPS.chartCard} />}
            loaded={loaded}
          />
          <ChartCard
            name="Kudos Per Week"
            chart={
              <StackedLineChart
                data={data.weekly_kudos_by_sport}
                xAxis={{
                  name: "Date",
                  data: loaded ? data.week_starts : []
                }}
                yAxis={{
                  name: "Kudos Count",
                }}
                pastWeeksDefaultValue={25}
              />
            }
            tooltip={<Tooltip content={TOOLTIPS.chartCard} />}
            loaded={loaded}
          />
          <ChartCard
            name="Activities Per Week"
            chart={
              <StackedLineChart
                data={data.weekly_activities_by_sport}
                xAxis={{
                  name: "Date",
                  data: loaded ? data.week_starts : []
                }}
                yAxis={{
                  name: "Activities Count",
                }}
                pastWeeksDefaultValue={25}
              />
            }
            tooltip={<Tooltip content={TOOLTIPS.chartCard} />}
            loaded={loaded}
          />
        </div>
      </main>
      <footer>
        <div className="inner-container">
          <p>
            <b>Last fetched</b>: {new Date(metadata?.fetched_at).toLocaleString()}
            <br />
            <b>Last analyzed</b>: {new Date(metadata?.analyzed_at).toLocaleString()}
          </p>
          <p>This website is not affiliated with <a href="https://www.strava.com/" target="_blank">Strava</a>.</p>
          <p>
            &#169; {new Date().getFullYear()} Krish A. Patel
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App
