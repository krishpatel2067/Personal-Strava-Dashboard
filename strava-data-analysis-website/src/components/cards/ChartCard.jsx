import "./Card.css";
import "./ChartCard.css";

function ChartCard({ name, chart, tooltip, style }) {
  return (
    <div className="ChartCard Card" style={style}>
      <div className="top-container">
        <h4 className="name secondary">{name}</h4>
        {tooltip}
      </div>
      <div className="data-container">
        {chart}
      </div>
    </div>
  )
}

export default ChartCard;