import "./Card.css";
import PieChart from "../charts/PieChart";
import "./TableCard.css";

function TableCard({ name, data, headers, applyFunc: applyFuncProp, loaded, style }) {
  if (loaded) {
    const applyFunc = applyFuncProp != null ? applyFuncProp : (val) => val;
    return (
      <div className="TableCard Card" style={style}>
        <h3 className="name secondary">{name}</h3>
        <div className="data-container">
          <table>
            <thead>
              <tr>
                {headers && headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data && data.map(([rowHeader, ...rowData], index1) => (
                <tr key={index1}>
                  <th>{rowHeader}</th>
                  {rowData && [].concat(rowData).map((value, index2) => (
                    <td key={index2}>
                      {applyFunc(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <PieChart
            seriesTitle={name}
            data={data.map(item => ({ value: applyFunc(item[1]), name: item[0] }))}
          />
        </div>
      </div>
    )
  }
}

export default TableCard;