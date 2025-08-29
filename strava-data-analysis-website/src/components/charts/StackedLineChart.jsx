import ReactECharts from "echarts-for-react";
import { mergeObjects, useTheme, getCumulative, formatDate } from "../../util";
import { useEffect, useState } from "react";
import "./StackedLineChart.css";
import Textbox from "../core/Textbox";
import Checkbox from "../core/Checkbox";

function StackedLineChart({ option: optionProp, title, data, xAxis,
  applyFunc: applyFuncProp, yAxis, pastDatapointsDefaultValue, showPastDatapointsContent }) {
  const [option, setOption] = useState({});
  // form
  const [filterType, setFilterType] = useState("weeksPast");
  const [weeksPast, setWeeksPast] = useState(String(pastDatapointsDefaultValue) ?? "25");
  const [dateBounds, setDateBounds] = useState({
    dateFrom: formatDate(xAxis.data[0], "mm/dd/yyyy", "yyyy-mm-dd"),
    dateTo: formatDate(xAxis.data.at(-1), "mm/dd/yyyy", "yyyy-mm-dd"),
  });
  const [formError, setFormError] = useState("");
  // for filtering based on "show the past x datapoints" (aka x-axis range)
  const [filterFunc, setFilterFunc] = useState(() => () => true);
  // for calculating cumulative data
  const [cumFunc, setCumFunc] = useState(() => (arr) => arr);
  const { colors } = useTheme();
  const applyFunc = applyFuncProp != null ? applyFuncProp : (val) => val;

  const isDarkTheme = useTheme();

  useEffect(() => {
    onRadioChange({ target: { value: filterType } });
  }, []);

  const onWeeksPastTextboxChange = (e) => {
    const value = e.target.value;
    setWeeksPast(value);

    if (value === "") {
      const newFilterFunc = () => true;
      setFilterFunc(() => newFilterFunc);
      setOptionState(newFilterFunc);
      setFormError("");
      return;
    }

    const numPastDatapoints = Number(value);

    if (numPastDatapoints <= 0) {
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

  const onRadioChange = (e) => {
    const value = e.target.value;
    setFilterType(value);

    if (value === "weeksPast") {
      onWeeksPastTextboxChange({ target: { value: String(weeksPast) } });
    } else if (value === "weeksBetween") {
      onDateChange({ target: { name: "weekFrom", value: dateBounds.weekFrom } });
      onDateChange({ target: { name: "weekTo", value: dateBounds.weekTo } });
    }
  }

  const onDateChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    const newDateBounds = {
      ...dateBounds,
      [name]: value,
    };

    setDateBounds(newDateBounds);

    const getIndex = (date) => {
      const newDate = new Date(formatDate(date, "yyyy-mm-dd", "mm/dd/yyyy")).getTime();
      let index = 0;

      while (index < LENGTH && newDate >= new Date(xAxis.data[index]).getTime()) {
        index++;
      }

      if (index > 0) {
        index -= 1;
      }

      return index;
    }

    const LENGTH = xAxis.data.length
    let indexStart = 0, indexEnd = LENGTH - 1;

    indexStart = getIndex(newDateBounds.dateFrom);
    indexEnd = getIndex(newDateBounds.dateTo);

    const newFilterFunc = (_, index) => index >= indexStart && index <= indexEnd;
    setFilterFunc(() => newFilterFunc);
    setOptionState(newFilterFunc);
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
        <div className="filter-choices">

          <label>
            <input
              type="radio"
              name="filter"
              value="weeksPast"
              onChange={onRadioChange}
              checked={filterType === "weeksPast"}
            />
            <span className="textbox-container">
              {(showPastDatapointsContent != null) ? (
                showPastDatapointsContent(
                  <input
                    type="number"
                    value={weeksPast}
                    onChange={onWeeksPastTextboxChange}
                    disabled={filterType !== "weeksPast"}
                  />
                )
              ) : (
                <>
                  <span>Show the past </span>
                  <input
                    type="number"
                    value={weeksPast}
                    onChange={onWeeksPastTextboxChange}
                    disabled={filterType !== "weeksPast"}
                  />
                  <span> datapoints</span>
                </>
              )}
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="filter"
              value="weeksBetween"
              checked={filterType === "weeksBetween"}
              onChange={onRadioChange}
            />
            <span className="textbox-container">
              <span>Show only weeks from </span>
              <input
                type="date"
                name="dateFrom"
                onChange={onDateChange}
                value={dateBounds.dateFrom}
                disabled={filterType !== "weeksBetween"}
              />
              <span> to </span>
              <input
                type="date"
                name="dateTo"
                onChange={onDateChange}
                value={dateBounds.dateTo}
                disabled={filterType !== "weeksBetween"}
              />
            </span>
          </label>
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