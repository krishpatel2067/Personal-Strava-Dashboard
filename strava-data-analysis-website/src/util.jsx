import { useEffect, useState } from "react";

/**
 * Converts meters to miles.
 * @param {number} m - The number of meters.
 * @return {number} The number of miles.
 */
function mToMi(m) {
  return m / 1609;
}

/**
 * Converts seconds to hours.
 * @param {number} s - The number of seconds.
 * @return {number} The number of hours.
 */
function sToHrs(s) {
  return s / 3600;
}

function useTheme() {
  const [isDarkTheme, setIsDarkTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [colors, setColors] = useState({});
  const mqListener = (e) => {
    setIsDarkTheme(e.matches);
    setColors({
      backgroundColor: computedStyles.getPropertyValue(`--bkg-col-` + (isDarkTheme ? "dark" : "light")),
      textColor: computedStyles.getPropertyValue(`--txt-col-` + (isDarkTheme ? "dark" : "light")),
    });
  };

  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", mqListener);
    return () => darkThemeMq.removeEventListener("change", mqListener);
  }, []);

  const computedStyles = getComputedStyle(document.documentElement);
  return { isDarkTheme, colors };
}

function getCumulative(arr) {
  return arr.reduce((soFar, value) => {
    soFar.push((soFar.at(-1) ?? 0) + value);
    return soFar;
  }, []);
}

export { mToMi, sToHrs, useTheme, getCumulative };