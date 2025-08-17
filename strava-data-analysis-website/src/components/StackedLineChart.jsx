import ReactECharts from "echarts-for-react";

function StackedLineChart({ option: optionProp, title, data, xAxis, applyFunc }) {
  if (data != null && xAxis != null) {
    const option = optionProp ?? {
      title: {
        text: title
      },
      tooltip: {
        show: true,
      },
      xAxis: {
        type: "category",
        data: xAxis,
      },
      yAxis: {
        type: "value"
      },
      series: Object.entries(data).map(([category, valueData]) => {
        return {
          name: category,
          type: "line",
          stack: "Total",
          emphasis: {
            focus: "series",
          },
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
        />
      </div>
    );
  }
}

export default StackedLineChart;