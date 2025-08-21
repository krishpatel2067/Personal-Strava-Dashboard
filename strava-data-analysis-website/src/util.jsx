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

export { mergeObjects, useTheme };