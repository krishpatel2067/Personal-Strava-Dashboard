# Personal Strava Dashboard

Personal Strava Dashboard is a static website that displays summary statistics and visualizations of my Strava activities. You can access it [here](https://strava-data-analysis.web.app/).

## Motivation and Impact
Without a premium subscription, Strava shows only a limited set of statistics and visualizations. Even with a subscription, it can display only so much as it is mainly a cosnumer-facing application and needs to make sure it doesn't become too detailed with numbers. I created Personal Strava Dashboard to tap into my activity data and unlock those hidden metrics waiting to be found. As an added bonus, seeing all these stats and visualizations in one cohesive dashboard motivates me to stay committed my fitness, whether it's through running, walking, or going to the gym.

## Nomenclature

Originally called Strava Data Analysis, the website is now called Personal Strava Dashboard. However, the old name is still used in the backend and in permanent attributes, most prominently the website URL.

## Technologies Used
Languages:
* **Python**: Used in a cloud function to analyze my raw Strava data using Pandas.
* **JavaScript**
  * Used in a cloud function to fetch my raw Strava data.
  * Used in the frontend website.
* **Jupyter Notebook**: Used for testing Python code (especially Pandas) before including it in the cloud function's main script.

APIs and frameworks:
* **Strava API v3**: Authorizes access to my Strava data.
* **Firebase**
  * **Storage**: Holds both the JSON files containing the latest raw and analyzed data.
  * **Functions**: Automatically fetches (via JavaScript) and analyzes (via Python and Pandas) the data.
  * **Firestore**: Stores the necessary credentials for accessing my Strava data.
  * **Hosting**: Statically hosts this site.
* **React**: Creates the structure and logic of this website.
* **Apache ECharts**: Displays various visualizations with built-in animations.

## Features
* **Graph interactivity**: On top of built-in ECharts interactivity, some visualizations offer, for instance, the ability to restrict the x-axis to "zoom" in and out on the graph.
* **Responsive design**: Works on both desktop and mobile. However, the graphs are much easier to interact with on desktop.
* **Light and dark mode**: Automatically adheres to the device theme.

## Future Plans
Apart from internal changes (such as refining the codebase), my main plan is to incrementally add new stats and visualizations as I think of them. A smaller plan is to explore better grid options since the current flexbox method has some awkward edge cases.
