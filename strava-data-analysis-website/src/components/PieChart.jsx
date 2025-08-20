import ReactECharts from "echarts-for-react";
import { useTheme } from "../util";

function PieChart({ option: optionProp, seriesTitle, data }) {
  const { colors } = useTheme();
  const option = optionProp ?? {
    tooltip: {
      show: true,
    },
    backgroundColor: colors.backgroundColor,
    series: [
      {
        name: seriesTitle,
        type: "pie",
        radius: "50%",
        center: ["50%", "50%"],
        data: data
      }
    ]
  };

  return (
    <div className="PieChart">
      <ReactECharts
        option={option}
        style={{ width: "300px", height: "300px" }}
        // theme={isDarkTheme ? "dark" : "light"}
      />
    </div>
  );
}

export default PieChart;