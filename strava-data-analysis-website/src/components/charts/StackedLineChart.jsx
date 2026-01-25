import ReactECharts from "echarts-for-react";
import { useTheme, getCumulative } from "../../util";
import { useEffect, useState } from "react";
import "./StackedLineChart.css";
import Checkbox from "../core/Checkbox";

const DEFAULT_PAST_WEEKS = 25;

// TODO: fix date between glitch!
function StackedLineChart({ option: optionProp, title, data, xAxis,
  applyFunc: applyFuncProp, xAxisApplyFunc: xAxisApplyFuncProp, yAxis }) {
  const [option, setOption] = useState({});
  // form
  const [form, setForm] = useState({
    filterType: "weeksPast",
    weeksPast: String(DEFAULT_PAST_WEEKS),
    // stored at ms since Epoch
    dateFrom: xAxis.data.at(DEFAULT_PAST_WEEKS <= xAxis.data.length ? -DEFAULT_PAST_WEEKS : 0),
    dateTo: xAxis.data.at(-1),
    error: ""
  });
  const [funcs, setFuncs] = useState({
    // for filtering based on "show the past x datapoints" (aka x-axis range)
    filterFunc: () => true,
    // for calculating cumulative data
    cumFunc: (arr) => arr,
    applyFunc: applyFuncProp != null ? applyFuncProp : (val) => val,
    xAxisApplyFunc: xAxisApplyFuncProp != null ? xAxisApplyFuncProp : (val) => val,
  });
  const { colors } = useTheme();

  const isDarkTheme = useTheme();

  useEffect(() => {
    onRadioChange({ target: { value: form.filterType } });
  }, []);

  const onWeeksPastTextboxChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      weeksPast: value,
    }));

    if (value === "") {
      const newFilterFunc = () => true;
      setFuncs((prev) => ({
        ...prev,
        filterFunc: newFilterFunc,
      }));
      setOptionState(undefined, newFilterFunc);
      setForm((prev) => ({
        ...prev,
        error: ""
      }));
      return;
    }

    const numPastDatapoints = Number(value);

    if (numPastDatapoints <= 0) {
      setForm((prev) => ({
        ...prev,
        error: "Enter a positive number"
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      error: ""
    }));
    const length = xAxis.data.length;
    const newFilterFunc = (_, index) => index >= length - numPastDatapoints;
    setFuncs((prev) => ({
      ...prev,
      filterFunc: newFilterFunc,
    }));
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

      setFuncs((prev) => ({
        ...prev,
        cumFunc: newCumFunc,
      }));
      setOptionState(undefined, newCumFunc);
    }
  }

  const onRadioChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      filterType: value,
    }));

    if (value === "weeksPast") {
      onWeeksPastTextboxChange({ target: { value: String(form.weeksPast) } });
    } else if (value === "weeksBetween") {
      onDateChange({ target: { name: "weekFrom", value: new Date(form.dateFrom).toISOString().split("T")[0] } });
      onDateChange({ target: { name: "weekTo", value: new Date(form.dateTo).toISOString().split("T")[0] } });
    }
  }

  const onDateChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    if (value === "") {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: new Date(value).getTime(),
    }));

    const getIndex = (newDate) => {
      // newDate is ms since Epoch
      let index = 0;

      while (index < LENGTH && newDate >= xAxis.data[index]) {
        index++;
      }

      if (index > 0) {
        index--;
      }

      return index;
    }

    const LENGTH = xAxis.data.length
    let indexStart = 0, indexEnd = LENGTH - 1;

    indexStart = getIndex(form.dateFrom);
    indexEnd = getIndex(form.dateTo);

    const newFilterFunc = (_, index) => index >= indexStart && index <= indexEnd;
    setFuncs((prev) => ({
      ...prev,
      filterFunc: newFilterFunc,
    }));
    setOptionState(newFilterFunc);
  }

  const setOptionState = (newFilterFunc = funcs.filterFunc, newCumFunc = funcs.cumFunc) => {
    // restrict x-axis based on date filter func
    const filteredXAxis = xAxis.data.map(funcs.xAxisApplyFunc).filter(newFilterFunc);
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
      xAxis: {
        ...xAxis,
        type: "category",
        data: filteredXAxis,
      },
      yAxis: {
        ...yAxis,
        type: "value",
      },
      legend: {},
      series: Object.entries(data).reduce((arr, [category, valueData]) => {
        arr.push({
          name: category,
          type: "line",
          showSymbol: filteredXAxis.length <= 50,
          data: newCumFunc(Object.values(valueData))      // whether or not it's cumulative
            .filter(newFilterFunc)                        // filter by date
            .map(datapoint => funcs.applyFunc(datapoint))       // e.g., any formatting for each point
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
              checked={form.filterType === "weeksPast"}
            />
            <span className="textbox-container">
              <span>Show the past </span>
              <input
                type="number"
                value={form.weeksPast}
                onChange={onWeeksPastTextboxChange}
                disabled={form.filterType !== "weeksPast"}
              />
              <span> weeks</span>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="filter"
              value="weeksBetween"
              checked={form.filterType === "weeksBetween"}
              onChange={onRadioChange}
            />
            <span className="textbox-container">
              <span>Show only weeks from </span>
              <input
                type="date"
                name="dateFrom"
                onChange={onDateChange}
                value={new Date(form.dateFrom).toISOString().split("T")[0]}
                disabled={form.filterType !== "weeksBetween"}
              />
              <span> to </span>
              <input
                type="date"
                name="dateTo"
                onChange={onDateChange}
                value={new Date(form.dateTo).toISOString().split("T")[0]}
                disabled={form.filterType !== "weeksBetween"}
              />
            </span>
          </label>
        </div>
        <p className="form-error">{form.error}</p>
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