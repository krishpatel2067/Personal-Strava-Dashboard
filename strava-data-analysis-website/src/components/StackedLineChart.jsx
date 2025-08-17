import ReactECharts from "echarts-for-react";
import { mergeObjects, useTheme } from "../util";

function StackedLineChart({ option: optionProp, title, data, xAxis, applyFunc, yAxis }) {
  const isDarkTheme = useTheme();
  const option = optionProp ?? {
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
    series: Object.entries(data).map(([category, valueData]) => {
      return {
        name: category,
        type: "line",
        showSymbol: false,
        data: (
          (applyFunc != null) ?
            Object.values(valueData).map(datapoint => applyFunc(datapoint))
            :
            Object.values(valueData)
        )
      };
    })
  };

  return (
    <div className="StackedLineChart">
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "400px" }}
        theme={isDarkTheme ? "dark" : "light"}
      />
    </div>
  );
}

export default StackedLineChart;