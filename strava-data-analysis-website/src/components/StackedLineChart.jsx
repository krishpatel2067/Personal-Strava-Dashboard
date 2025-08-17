import ReactECharts from "echarts-for-react";

function StackedLineChart({ option: optionProp, title, data: dataProp, xAxis, applyFunc }) {
  if (dataProp != null && xAxis != null) {
    // const data = Object.fromEntries(Object.entries(dataProp).map(([category, dataValue]) => {
    //   console.log(category);
    //   return [
    //     category,
    //     Object.fromEntries(xAxis.map((xAxisValue) => {
    //       if (xAxisValue in dataValue) {
    //         console.log(`\tretained ${xAxisValue}`);
    //         return [xAxisValue, dataValue[xAxisValue]];
    //       } else {
    //         console.log(`\tfilled ${xAxisValue} with 0`);
    //         return [xAxisValue, 0];
    //       }
    //     }))
    //   ];
    // }));
    const data = dataProp;

    // console.log(xAxis.length);
    // console.log(Object.entries(data).length);

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