import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import ReactEchartsCore from "echarts-for-react/lib/core";

echarts.use([BarChart]);

function PieChart({ option: optionProp }) {
  const option = optionProp ?? {};

  return (
    <ReactEchartsCore
      echarts={echarts}
      option={option}
      style={{ width: "400px", height: "100%" }}
    />
  );
}

export default PieChart;