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
      console.log("override", override)
      result[key] = addObj[key];
    } else {
      if (!(key in baseObj)) {
        result[key] = addObj[key];
      }
    }
  }

  return result;
}

export { mergeObjects };