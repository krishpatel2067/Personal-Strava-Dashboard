import ReactECharts from "echarts-for-react";

function StackedLineChart({ option: optionProp, title, data }) {
  const option = optionProp ?? {
    title: {
      text: title
    },
    tooltip: {
      show: true,
    },
    series: []
  };

  return (
    <div className="PieChart">
      <ReactECharts
        option={option}
        style={{ width: "400px", height: "400px" }}
      />
    </div>
  );
}

export default StackedLineChart;