import { useEffect } from "react";
import downArrow from "../../assets/down_arrow.svg";
import githubIcon from "../../assets/github_icon.svg";

function Header() {

  useEffect(() => {
    // TODO: remove animation; make static gradient
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

    startGradientAnimation();
  })
  return (
    <header className="Header">
      <div className="banner">
        <div className="container">
          <h1 className="title">Personal Strava Dashboard</h1>
          <p className="subtitle">Krish A. Patel</p>
          <a href="https://github.com/krishpatel2067/Personal-Strava-Dashboard" target="_blank" className="repo">
            <img src={githubIcon} className="icon" />
            <span>Repository</span>
          </a>
          <div className="scroll-hint">
            <p>Scroll</p>
            <img src={downArrow} className="down-arrow" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;