import "./Card.css";
import PieChart from "./PieChart";
import "./TableCard.css";

function TableCard({ name, data, headers, applyFunc, loaded }) {
  if (loaded) {
    return (
      <div className="TableCard Card">
        <table>
          <caption className="secondary">{name}</caption>
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
          data={data.map(item => ({ value: item[1], name: item[0] }))}
        />
      </div>
    )
  }
}

export default TableCard;