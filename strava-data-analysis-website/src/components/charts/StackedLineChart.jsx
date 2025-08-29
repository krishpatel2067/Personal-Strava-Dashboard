import ReactECharts from "echarts-for-react";
import { mergeObjects, useTheme, getCumulative } from "../../util";
import { useState } from "react";
import "./StackedLineChart.css";
import Textbox from "../core/Textbox";
import Checkbox from "../core/Checkbox";

function StackedLineChart({ option: optionProp, title, data, xAxis,
  applyFunc: applyFuncProp, yAxis, pastDatapointsDefaultValue, showPastDatapointsContent }) {
  const [option, setOption] = useState({});
  const [formError, setFormError] = useState("");
  // for filtering based on "show the past x datapoints" (aka x-axis range)
  const [filterFunc, setFilterFunc] = useState(() => () => true);
  // for calculating cumulative data
  const [cumFunc, setCumFunc] = useState(() => (arr) => arr);
  const { colors } = useTheme();
  const applyFunc = applyFuncProp != null ? applyFuncProp : (val) => val;

  const isDarkTheme = useTheme();

  const onTextboxChange = (input) => {
    if (input === "") {
      const newFilterFunc = () => true;
      setFilterFunc(() => newFilterFunc);
      setOptionState(newFilterFunc);
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
    const length = xAxis.data.length;
    const newFilterFunc = (_, index) => index >= length - numPastDatapoints;
    setFilterFunc(() => newFilterFunc);
    setOptionState(newFilterFunc);
  };

  const onCheckboxChange = (label, input) => {
    if (label === "Cumulative") {
      let newCumFunc;

      if (input === true) {
        newCumFunc = (arr) => getCumulative(arr)
      } else {
        newCumFunc = (arr) => arr;
      }

      setCumFunc(() => newCumFunc);
      setOptionState(undefined, newCumFunc);
    }
  }

  const setOptionState = (newFilterFunc = filterFunc, newCumFunc = cumFunc) => {
    // restrict x-axis based on date filter func
    const filteredXAxis = xAxis.data.filter(newFilterFunc);
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
        data: filteredXAxis,
      }),
      yAxis: mergeObjects({
        type: "value",
      }, yAxis),
      legend: {},
      series: Object.entries(data).reduce((arr, [category, valueData]) => {
        arr.push({
          name: category,
          type: "line",
          showSymbol: filteredXAxis.length <= 50,
          data: newCumFunc(Object.values(valueData))      // whether or not it's cumulative
            .filter(newFilterFunc)                        // filter by date
            .map(datapoint => applyFunc(datapoint))       // e.g., any formatting for each point
        });
        return arr;
      }, [])
    };
    setOption(newOption);
  };

  return (
    <div className="StackedLineChart">
      <form className="controls">
        <Checkbox label="Cumulative" onChange={onCheckboxChange} />
        <div className="textbox-container">
          {(showPastDatapointsContent != null) ? (
            showPastDatapointsContent(
              <Textbox
                defaultValue={pastDatapointsDefaultValue}
                onChange={onTextboxChange}
              />
            )
          ) : (
            <>
              <span>Show the past </span>
              <Textbox
                defaultValue={pastDatapointsDefaultValue}
                onChange={onTextboxChange}
              />
              <span> datapoints</span>
            </>
          )}
        </div>
        <p className="form-error">{formError}</p>
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