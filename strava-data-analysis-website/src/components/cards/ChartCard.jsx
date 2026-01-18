import "./Card.css";
import "./ChartCard.css";

function ChartCard({ name, chart, tooltip, style }) {
  return (
    <div className="ChartCard Card" style={style}>
      <div className="top-container">
        <h3 className="name secondary">{name}</h3>
        {tooltip}
      </div>
      <div className="data-container">
        {chart}
      </div>
    </div>
  )
}

export default ChartCard;