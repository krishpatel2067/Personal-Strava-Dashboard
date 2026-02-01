import ReactECharts from "echarts-for-react";
import { useTheme, getCumulative } from "../../util";
import { useEffect, useState } from "react";
import "./StackedLineChart.css";
import Checkbox from "../core/Checkbox";

const DEFAULT_PAST_DATAPPOINTS = 25;

const PERIOD_TO_X_AXIS_NAME = {
  weekly: "Week",
  monthly: "Month",
  yearly: "Year",
}

// TODO: organize this code!
function StackedLineChart({ title, data, keyName,
  applyFunc: applyFuncProp, yAxis }) {
  const [option, setOption] = useState({});
  // form
  const [form, setForm] = useState(() => {
    const obj = {
      filterType: "past",       // "past" (show the past x datapoints) or "between" (between 2 date bounds)
      period: "weekly",         // "weekly", "monthly", "yearly"
      datapointsPast: DEFAULT_PAST_DATAPPOINTS,
      // stored at ms since Epoch
      error: ""
    }

    obj.xAxis = { name: PERIOD_TO_X_AXIS_NAME[obj.period], data: data[obj.period].timestamps };
    obj.dateFrom = obj.xAxis.data.at(DEFAULT_PAST_DATAPPOINTS <= obj.xAxis.data.length ? -DEFAULT_PAST_DATAPPOINTS : 0);
    obj.dateTo = obj.xAxis.data.at(-1);

    return obj;
  });
  const [funcs, setFuncs] = useState({
    // for filtering based on "show the past x datapoints" (aka x-axis range)
    filterFunc: () => true,
    // for calculating cumulative data
    cumFunc: (arr) => arr,
    applyFunc: applyFuncProp != null ? applyFuncProp : (val) => val,
  });
  const { isDarkTheme } = useTheme();

  useEffect(() => {
    onRadioChange({ target: { value: form.filterType } });
  }, []);

  const xAxisApplyFunc = (epoch, period) => {
    const date = new Date(epoch + new Date().getTimezoneOffset() * 60 * 1000)
    if (period === "weekly") {
      return date.toLocaleDateString();
    } else if (period === "monthly") {
      return date.getMonth() + 1 + "/" + date.getFullYear();
    } else if (period === "yearly") {
      return date.getFullYear();
    }
  };

  const onDatapointsPastTextboxChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      datapointsPast: value,
    }));

    if (value === "") {
      const newFilterFunc = () => true;
      setFuncs((prev) => ({
        ...prev,
        filterFunc: newFilterFunc,
      }));
      setOptionState({
        filterFunc: newFilterFunc,
      });
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
    const newFilterFunc = (_, index) => index >= form.xAxis.data.length - numPastDatapoints;
    setFuncs((prev) => ({
      ...prev,
      filterFunc: newFilterFunc,
    }));
    setOptionState({
      filterFunc: newFilterFunc,
    });
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
      setOptionState({
        cumFunc: newCumFunc,
      });
    }
  }

  const onRadioChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      filterType: value,
    }));

    if (value === "past") {
      onDatapointsPastTextboxChange({ target: { value: form.datapointsPast } });
    } else if (value === "between") {
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

    const newDates = {
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      [name]: new Date(value).getTime(),
    };

    setForm((prev) => ({
      ...prev,
      ...newDates,
    }));

    const getIndex = (newDate) => {
      // newDate is ms since Epoch
      let index = 0;

      while (index < form.xAxis.data.length && newDate >= form.xAxis.data[index]) {
        index++;
      }

      if (index > 0) {
        index--;
      }

      return index;
    }

    let indexStart = getIndex(newDates.dateFrom);
    let indexEnd = getIndex(newDates.dateTo);

    const newFilterFunc = (_, index) => index >= indexStart && index <= indexEnd;
    setFuncs((prev) => ({
      ...prev,
      filterFunc: newFilterFunc,
    }));
    setOptionState({
      filterFunc: newFilterFunc,
    });
  };

  const onPeriodChange = (e) => {
    const value = e.target.value;
    const newXAxis = {
      name: PERIOD_TO_X_AXIS_NAME[value],
      data: data[value].timestamps
    };
    const newFilterFunc = (_, index) => index >= data[value].timestamps.length - form.datapointsPast;
    setForm((prev) => ({
      ...prev,
      xAxis: newXAxis,
      period: value,
      datapointsPast: Math.min(form.datapointsPast, newXAxis.data.length),
    }));
    setFuncs((prev) => ({
      ...prev,
      filterFunc: newFilterFunc,
    }));
    setOptionState({
      period: value,
      filterFunc: newFilterFunc,
      xAxis: newXAxis,
    });
  };

  const setOptionState = (newState) => {
    // restrict x-axis based on date filter func
    newState = {
      filterFunc: funcs.filterFunc,
      cumFunc: funcs.cumFunc,
      period: form.period,
      xAxis: form.xAxis,
      ...newState,
    };
    const filteredXAxis = newState.xAxis.data.map((epoch) => xAxisApplyFunc(epoch, newState.period)).filter(newState.filterFunc);
    const seriesData = {
      ...data[newState.period].by_sport[keyName],
      "Total": data[newState.period].overall[keyName],
    };
    const newOption = {
      title: { text: title },
      tooltip: { show: true, trigger: "axis" },
      // priorities (lowest to highest): default xAxis obj, given xAxis obj, xAxis obj with filtered data, 
      xAxis: { ...newState.xAxis, type: "category", data: filteredXAxis },
      yAxis: { ...yAxis, type: "value" },
      legend: {},
      series: Object.entries(seriesData).reduce((arr, [category, valueData]) => {
        arr.push({
          name: category,
          type: "line",
          showSymbol: filteredXAxis.length <= 50,
          data: newState.cumFunc(Object.values(valueData))      // whether or not it's cumulative
            .filter(newState.filterFunc)                        // filter by date
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
        <select className="filter-choice" value={form.period} onChange={onPeriodChange}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <div className="filter-choices">
          <label>
            <input
              type="radio"
              name="filter"
              value="past"
              onChange={onRadioChange}
              checked={form.filterType === "past"}
            />
            <span className="textbox-container">
              <span>Show the past </span>
              <input
                type="number"
                value={form.datapointsPast}
                onChange={onDatapointsPastTextboxChange}
                disabled={form.filterType !== "past"}
              />
              <span> datapoints</span>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="filter"
              value="between"
              checked={form.filterType === "between"}
              onChange={onRadioChange}
            />
            <span className="textbox-container">
              <span>Show only weeks from </span>
              <input
                type="date"
                name="dateFrom"
                onChange={onDateChange}
                value={new Date(form.dateFrom).toISOString().split("T")[0]}
                disabled={form.filterType !== "between"}
              />
              <span> to </span>
              <input
                type="date"
                name="dateTo"
                onChange={onDateChange}
                value={new Date(form.dateTo).toISOString().split("T")[0]}
                disabled={form.filterType !== "between"}
              />
            </span>
          </label>
        </div>
        <Checkbox label="Cumulative" onChange={onCheckboxChange} />
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