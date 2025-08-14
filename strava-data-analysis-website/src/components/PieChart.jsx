import ReactECharts from "echarts-for-react";

function PieChart({ option: optionProp, title, data }) {
  const option = optionProp ?? {
    title: {
      text: title
    },
    tooltip: {
      show: true,
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: 150,
        center: ["50%", "50%"],
        data: data
      }
    ]
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

export default PieChart;