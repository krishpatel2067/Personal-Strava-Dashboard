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

/**
 * Fills in missing keys in a subset object with a default value.
 * @param {Object} superset - The object to use as the superset.
 * @param {Object} subset - The object to fill in missing keys for.
 * @param {any} defaultValue - The default value to use for missing keys.
 * @return {Object} The filled-in subset object.
 */
function fillKeys(superset, subset, defaultValue = 0) {
  for (const key in superset) {
    if (!(key in subset)) {
      subset[key] = defaultValue;
    }
  }

  return subset;
}

function useTheme() {
  const [isDarkTheme, setIsDarkTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const mqListener = e => setIsDarkTheme(e.matches);

  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", mqListener);
    return () => darkThemeMq.removeEventListener("change", mqListener);
  }, []);

  const computedStyles = getComputedStyle(document.documentElement);
  const colors = {
    backgroundColor: computedStyles.getPropertyValue(`--bkg-col-` + (isDarkTheme ? "dark" : "light")),
  };
  return { isDarkTheme, colors };
}

function getCumulative(arr) {
  return arr.reduce((soFar, value) => {
    soFar.push((soFar.at(-1) ?? 0) + value);
    return soFar;
  }, []);
}

export { mToMi, sToHrs, fillKeys, useTheme, getCumulative };