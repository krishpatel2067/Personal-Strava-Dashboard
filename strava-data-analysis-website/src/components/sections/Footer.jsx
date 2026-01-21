import githubIcon from "../../assets/github_icon.svg";
import linkedinIcon from "../../assets/linkedin_icon.svg";
import stravaIcon from "../../assets/strava_icon.svg";

function Footer({ metadata, loaded }) {
  return (
    <footer>
      <div className="inner-container">
        <p>Connect with me</p>
        <div className="contacts-container">
          <a href="https://www.linkedin.com/in/krishpatel2067/" target="_blank" className="contact">
            <img src={linkedinIcon} className="icon" />
          </a>
          <a href="https://github.com/krishpatel2067" target="_blank" className="contact">
            <img src={githubIcon} className="icon" />
          </a>
          <a href="https://www.strava.com/athletes/120371207" target="_blank" className="contact">
            <img src={stravaIcon} className="icon" />
          </a>
        </div>
        <p>
          <b>Last fetched</b>: {loaded ? new Date(metadata.fetch_end).toLocaleString() : "Loading..."}
          <br />
          <b>Last analyzed</b>: {loaded ? new Date(metadata.analysis_end).toLocaleString() : "Loading..."}
        </p>
        <p>
          <b>Fetch Duration</b>: {loaded ? Math.round(metadata.fetch_duration).toLocaleString() : "Loading..."} ms
          <br />
          <b>Analysis Duration</b>: {loaded ? Math.round(metadata.analysis_duration).toLocaleString() : "Loading..."} ms
        </p>
        <p>This website is not affiliated with <a href="https://www.strava.com/" target="_blank">Strava</a>.</p>
        <p>
          &#169; 2025 - {new Date().getFullYear()} Krish A. Patel
        </p>
      </div>
    </footer>
  );
}

export default Footer;
