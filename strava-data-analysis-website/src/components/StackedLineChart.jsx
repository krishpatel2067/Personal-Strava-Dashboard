import ReactECharts from "echarts-for-react";
import { mergeObjects, useTheme } from "../util";
import { useEffect, useState } from "react";
import Checkbox from "./Checkbox";
import "./StackedLineChart.css";
import Textbox from "./Textbox";

function StackedLineChart({ option: optionProp, title, data, xAxis,
  applyFunc: applyFuncProp, yAxis, showPastDatapointsContent }) {
  const [categories, setCategories] = useState({});
  const [option, setOption] = useState({});
  const [formError, setFormError] = useState("");
  // for filtering based on "show the past x datapoints" (aka x-axis range)
  const [filterFunc, setFilterFunc] = useState(() => () => true);
  const { colors } = useTheme();
  const applyFunc = applyFuncProp != null ? applyFuncProp : (val) => val;

  useEffect(() => {
    setCategories(Object.fromEntries(Object.keys(data).map(key => [key, true])));
    setOptionState();
  }, [data]);

  const isDarkTheme = useTheme();

  // const onCheckboxChange = (label, checked) => {
  //   const newCategories = {
  //     ...categories,
  //     [label]: checked
  //   };
  //   setCategories(newCategories);
  //   setOptionState(newCategories);
  // };

  const onTextboxChange = (input) => {
    if (input === "") {
      const newFilterFunc = () => true;
      setFilterFunc(() => newFilterFunc);
      setOptionState(undefined, newFilterFunc);
      setFormError("");
      return;
    }

    const numPastDatapoints = Number(input);

    if (isNaN(numPastDatapoints)) {
      setFormError("Enter a valid number");
      return;
    } if (numPastDatapoints <= 0) {
      setFormError("Enter a positive number");
      return;
    }

    setFormError("");
    const LENGTH = xAxis.data.length;
    const newFilterFunc = (_, index) => index >= LENGTH - numPastDatapoints;
    setFilterFunc(() => newFilterFunc);
    setOptionState(undefined, newFilterFunc);
  };

  const setOptionState = (newCategories = categories, newFilterFunc = filterFunc) => {
    const newOption = optionProp ?? {
      title: {
        text: title
      },
      tooltip: {
        show: true,
        trigger: "axis",
      },
      backgroundColor: colors.backgroundColor,
      // priorities (lowest to highest): default xAxis obj, given xAxis obj, xAxis obj with filtered data, 
      xAxis: mergeObjects(mergeObjects({
        type: "category",
      }, xAxis), {
        data: xAxis.data.filter(newFilterFunc),
      }),
      yAxis: mergeObjects({
        type: "value",
      }, yAxis),
      legend: {},
      series: Object.entries(data).reduce((arr, [category, valueData]) => {
        if (newCategories[category]) {
          arr.push({
            name: category,
            type: "line",
            showSymbol: false,
            data: Object.values(valueData).filter(newFilterFunc).map(datapoint => applyFunc(datapoint))
          });
        }
        return arr;
      }, [])
    };
    setOption(newOption);
  };

  return (
    <div className="StackedLineChart">
      <form className="controls">
        <div className="textbox-container">
          {(showPastDatapointsContent != null) ? (
            showPastDatapointsContent(
              <Textbox
                onChange={onTextboxChange}
              />
            )
          ) : (
            <>
              <span>Show the past </span>
              <Textbox
                onChange={onTextboxChange}
              />
              <span> datapoints</span>
            </>
          )}
        </div>
        <p className="form-error">{formError}</p>
        {/* <div className="checkbox-container">
          {Object.keys(categories).map((category, index) => (
            <Checkbox
              key={index}
              label={category}
              defaultValue={true}
              onChange={onCheckboxChange}
            />
          ))}
        </div> */}
      </form>
      <ReactECharts
        option={option}
        notMerge={true}
        style={{ maxWidth: "100%", height: "400px" }}
        theme={isDarkTheme ? "dark" : "light"}
      />
    </div>
  );
}

export default StackedLineChart;