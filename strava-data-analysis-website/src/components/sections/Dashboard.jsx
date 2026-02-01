import StatCard from '../cards/StatCard';
import TableCard from '../cards/TableCard';
import ChartCard from '../cards/ChartCard';
import StackedLineChart from '../charts/StackedLineChart';
import Tooltip from '../core/Tooltip';
import { mToMi, sToHrs } from "../../util";
import ShoeCard from '../cards/ShoeCard';

// TODO: improve tooltips to not have to manually calculate position
// TODO: animate numbers
// TODO: make cards fade in

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
      <br />
      Weeks start on Monday (to match Strava).
    </p>
  )
};

// TODO: make charts refresh upon changing theme
function Dashboard({ data, loaded }) {
  return (
    <main className="Dashboard">
      <h2>Dashboard</h2>
      {
        loaded ? (
          <>
            <h3>Overview</h3>
            <div className="container">
              <StatCard
                name="Total Distance"
                stat={mToMi(data.activities.total.overall.distance)}
                units="mi"
              />
              <StatCard
                name="Total Moving Time"
                stat={sToHrs(data.activities.total.overall.moving_time)}
                units="hrs"
              />
              <StatCard
                name="Total Elapsed Time"
                stat={sToHrs(data.activities.total.overall.elapsed_time)}
                units="hrs"
              />
              <StatCard
                name="Total Elevation Gain"
                stat={data.activities.total.overall.elevation_gain}
                units="m"
              />
              <StatCard
                name="Total Kudos"
                stat={data.activities.total.overall.kudos}
              />
              <StatCard
                name="Total Activities"
                stat={data.activities.total.overall.activities}
              />
              <StatCard
                name="Total Recorded Activities"
                stat={data.activities.total.overall.recorded_activities}
              />
            </div>
            <h3>Shoes</h3>
            <div className="shoes-container">
              {data.gear.shoes.sort((a, b) => b.distance - a.distance).map((shoe, index) => (
                <ShoeCard
                  key={index}
                  brandName={shoe.brand_name}
                  modelName={shoe.model_name}
                  distance={{
                    value: Math.round(mToMi(shoe.distance)),
                    units: "mi"
                  }}
                  retired={shoe.retired}
                />
              ))}
            </div>
            <h3>Advanced</h3>
            <div className="container">
              <TableCard
                name="Distance by Sport"
                // sort by distance, descending
                data={Object.entries(data.activities.total.by_sport.distance).sort((a, b) => b[1] - a[1])}
                headers={["", "Distance (mi)"]}
                applyFunc={(val) => Math.round(mToMi(val))}
              />
              <TableCard
                name="Elevation Gain by Sport"
                // sort by elevation gain, descending
                data={Object.entries(data.activities.total.by_sport.elevation_gain).sort((a, b) => b[1] - a[1])}
                headers={["", "Elevation Gain (m)"]}
                applyFunc={Math.round}
              />

              <TableCard
                name="Kudos by Sport"
                // sort by kudos, descending
                data={Object.entries(data.activities.total.by_sport.kudos).sort((a, b) => b[1] - a[1])}
                headers={["", "Kudos Count"]}
              />

              <TableCard
                name="Activities by Sport"
                // sort by activities, descending
                data={Object.entries(data.activities.total.by_sport.activities).sort((a, b) => b[1] - a[1])}
                headers={["", "Activities Count"]}
              />

              <ChartCard
                name="Distance Over Time"
                chart={
                  <StackedLineChart
                    data={data.activities}
                    keyName="distance"
                    applyFunc={distance => Math.round(mToMi(distance))}
                    yAxis={{
                      name: "Distance (mi)",
                    }}
                  />
                }
                tooltip={<Tooltip content={TOOLTIPS.chartCard} />}
              />

              <ChartCard
                name="Kudos Over Time"
                chart={
                  <StackedLineChart
                    data={data.activities}
                    keyName="kudos"
                    yAxis={{
                      name: "Kudos Count",
                    }}
                    pastWeeksDefaultValue={25}
                  />
                }
                tooltip={<Tooltip content={TOOLTIPS.chartCard} />}
              />

              <ChartCard
                name="Activities Over Time"
                chart={
                  <StackedLineChart
                    data={data.activities}
                    keyName="activities"
                    yAxis={{
                      name: "Activities Count",
                    }}
                    pastWeeksDefaultValue={25}
                  />
                }
                tooltip={<Tooltip content={TOOLTIPS.chartCard} />}
              />
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )
      }
    </main>
  );
}

export default Dashboard;