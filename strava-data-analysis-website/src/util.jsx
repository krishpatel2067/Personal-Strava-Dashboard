import { useEffect, useState } from "react";

function mergeObjects(baseObj, addObj, override = true, copy = true) {
  if (baseObj == null) {
    return {};
  }
  if (addObj == null) {
    return baseObj;
  }

  let result;
  if (copy) {
    result = JSON.parse(JSON.stringify(baseObj));
  } else {
    result = baseObj;
  }

  for (const key in addObj) {
    if (override) {
      result[key] = addObj[key];
    } else {
      if (!(key in baseObj)) {
        result[key] = addObj[key];
      }
    }
  }

  return result;
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

function formatDate(dateStr, from, to) {
  const date = {
    month: 0,
    day: 0,
    year: 0,
  };
  let result = "";

  if (from === "mm/dd/yyyy") {
    const split = dateStr.split("/");
    date.month = Number(split[0]);
    date.day = Number(split[1]);
    date.year = Number(split[2]);
  } else if (from === "yyyy-mm-dd") {
    const split = dateStr.split("-");
    date.year = Number(split[0]);
    date.month = Number(split[1]);
    date.day = Number(split[2]);
  }

  if (to  === "yyyy-mm-dd") {
    result = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  } else if (to === "mm/dd/yyyy") {
    result = `${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}/${date.year}`;
  }

  return result;
}

export { mergeObjects, useTheme, getCumulative, formatDate };