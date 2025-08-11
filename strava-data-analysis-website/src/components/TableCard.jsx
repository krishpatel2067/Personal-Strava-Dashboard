function TableCard({ name, data, headers, applyFunc, loaded }) {
  if (loaded) {
    return (
      <div className="TableCard">
        <table>
          <caption>{name}</caption>
          <thead>
            <tr>
              {headers && headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && Object.entries(data).map(([rowHeader, rowData], index1) => (
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
      </div>
    )
  }
}

export default TableCard;