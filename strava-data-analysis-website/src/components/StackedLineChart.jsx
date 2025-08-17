import ReactECharts from "echarts-for-react";

function StackedLineChart({ option: optionProp, title, data }) {
  const option = optionProp ?? {
    title: {
      text: title
    },
    tooltip: {
      show: true,
    },
    series: Object.entries(data).map(([category, data]) => {
      return {
        name: category,
        type: "line",
        stack: "Total",
        emphasis: {
          focus: "series",
        },
        data: [Object.values(data)]
      };
    })
  };

  return (
    <div className="StackedLineChart">
      <ReactECharts
        option={option}
        style={{ width: "400px", height: "400px" }}
      />
    </div>
  );
}

export default StackedLineChart;