import ReactECharts from "echarts-for-react";
import { useTheme } from "../util";

function PieChart({ option: optionProp, title, data }) {
  const isDarkTheme = useTheme();
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
        theme={isDarkTheme ? "dark" : "light"}
      />
    </div>
  );
}

export default PieChart;