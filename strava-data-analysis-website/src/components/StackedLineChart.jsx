import ReactECharts from "echarts-for-react";
import { mergeObjects, useTheme } from "../util";
import { useEffect, useState } from "react";
import Checkbox from "./Checkbox";

function StackedLineChart({ option: optionProp, title, data, xAxis, applyFunc, yAxis }) {
  const [categories, setCategories] = useState({});
  const [option, setOption] = useState({});

  useEffect(() => {
    setCategories(Object.fromEntries(Object.keys(data).map(key => [key, true])));
    setOptionState();
  }, [data]);

  const isDarkTheme = useTheme();

  const onCheckboxChange = (label, checked) => {
    const newCategories = {
      ...categories,
      [label]: checked
    };
    setCategories(newCategories);
    setOptionState(newCategories);
  }

  const setOptionState = (newCategories = categories) => {
    const newOption = optionProp ?? {
      title: {
        text: title
      },
      tooltip: {
        show: true,
        trigger: "axis",
      },
      xAxis: mergeObjects({
        type: "category",
      }, xAxis),
      yAxis: mergeObjects({
        type: "value",
      }, yAxis),
      series: Object.entries(data).reduce((arr, [category, valueData]) => {
        if (newCategories[category]) {
          arr.push({
            name: category,
            type: "line",
            showSymbol: false,
            data: (
              (applyFunc != null) ?
                Object.values(valueData).map(datapoint => applyFunc(datapoint))
                :
                Object.values(valueData)
            )
          });
        }
        return arr;
      }, [])
    };
    setOption(newOption);
  }

  return (
    <div className="StackedLineChart">
      <form className="controls">
        {Object.keys(categories).map((category, index) => (
          <Checkbox
            key={index}
            label={category}
            defaultValue={true}
            onChange={onCheckboxChange}
          />
        ))}
      </form>
      <ReactECharts
        option={option}
        notMerge={true}
        style={{ width: "100%", height: "400px" }}
        theme={isDarkTheme ? "dark" : "light"}
      />
    </div>
  );
}

export default StackedLineChart;