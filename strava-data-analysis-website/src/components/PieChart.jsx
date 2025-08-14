import ReactECharts from "echarts-for-react";

function PieChart({ option: optionProp, title, data }) {
  const option = optionProp ?? {
    title: {
      text: title
    },
    series: [
      {
        name: `${title} Pie Chart`,
        type: "pie",
        radius: 200,
        center: ["50%", "50%"],
        data: data
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "400px", height: "400px" }}
    />
  );
}

export default PieChart;