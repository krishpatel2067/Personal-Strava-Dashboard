import * as echarts from "echarts/core";
import { PieChart as PieChartEChart } from "echarts/charts";
import ReactEChartsCore from "echarts-for-react/lib/core";

echarts.use([PieChartEChart]);

function PieChart({ option: optionProp, title, data }) {
  const option = optionProp ?? {
    title: {
      text: title
    },
    series: [
      {
        name: `${title} Pie Chart`,
        type: "pie",
        radius: 250,
        center: ["50%", "50%"],
        data: data
      }
    ]
  };

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ width: "400px", height: "100%" }}
    />
  );
}

export default PieChart;