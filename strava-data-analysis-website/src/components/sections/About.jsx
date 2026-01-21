function About() {
  return (
    <section className="About">
      <h2>About</h2>
      <p>
        Since the fall 2021 season of cross country, I have had a passion for running, and from summer 2023, I have been using Strava to post my runs, walks, and other workouts. Lucky for me, Strava has a web API to get a user's activities, and that's how the idea for this project came to be!
      </p>
      <p>
        Personal Strava Dashboard is a statically hosted site that displays the summary statistics calculated from all my Strava activities. Every day, two serverless cloud functions are scheduled to run automatically: one that fetches the raw data from Strava, and the other that analyzes that data to prepare a clean set of statistics. Finally, this website displays this analyzed data neatly via cards.
      </p>
      <h3>Features</h3>
      <ul>
        <li><b>Graph interactivity</b>: On top of built-in ECharts interactivity, some visualizations offer, for instance, the ability to restrict the x-axis to "zoom" in and out on the graph.</li>
        <li><b>Responsive design</b>: Works on both desktop and mobile. However, the graphs are much easier to interact with on desktop.</li>
        <li><b>Light and dark mode</b>: Automatically adheres to the device theme.</li>
      </ul>
      <h3>Technologies Used</h3>
      <ul>
        <li>
          <b>Frontend</b>:
          <ul>
            <li><b>React</b>: Creates the structure and logic of this website.</li>
            <li><b>Apache ECharts</b>: Displays various visualizations in a stylish and interactive manner.</li>
          </ul>
        </li>
        <li>
          <b>Backend</b>:
          <ul>
            <li><b>Strava API v3</b>: Authorizes access to my Strava data.</li>
            <li><b>Firebase</b>
              <ul>
                <li><b>Functions</b>:
                  <ul>
                    <li><b>fetchAndStore (JavaScript)</b>: Fetches the latest raw data from my Strava account and stores it along with some metadata.</li>
                    <li><b>read_and_analyze (Python)</b>: Reads the raw data, analyzes it using Pandas, and stores a JSON file with the analyzed data.</li>
                  </ul>
                </li>
                <li><b>Storage</b>: Holds two JSON files: one containing the latest raw data, and the other containing the latest analyzed data.</li>
                <li><b>Firestore</b>: Stores the necessary authorization credentials and metadata regarding fetching.</li>
                <li><b>Hosting</b>: Hosts this static website.</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <h3>Design Choices</h3>
      <p>
        For the backend, I chose a serverless model using Firebase for two reasons: Firebase is a user-friendly wrapper around Google Cloud, which was perfect for a beginner to backend development like I was then; and it has a generous free tier for serverless functions that covers the needs of this project. In fact, since I only post up to several activities on Strava per day, it was perfect to have both serverless functions run daily on a schedule, eliminating the risk of incurring costs. The only cost that might be incurred is for read requests to Firebase Storage, which shouldn't be an issue with very few visits to this website.
      </p>
      <p>
        For the frontend, I chose React also for two reasons: it s a user-friendly framework that I had just learned at the inception of this project (Summer 2025), and it is the most used framework, so it is a good way to practice what I had just learned and gain experience with it.
      </p>
      <h3>Limitations</h3>
      <p>
        A major limitation is that this website only deals with my data. By default, Strava's API only allows up to one authenticated user per application. Although it is possible to appeal to Strava to increase this limit, it is not a straightforward process.
      </p>
      <h3>Future Plans</h3>
      <p>
        Apart from internal changes (such as refining the codebase), my main plan is to incrementally add new stats and visualizations as I think of them. A smaller plan, satisfying my frontend interests, is to explore new styling options for the website.
      </p>
    </section>
  );
}

export default About;