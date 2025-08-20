import "./Card.css";
import "./ChartCard.css";

function ChartCard({ name, chart, loaded, tooltip, style }) {
  if (loaded) {
    return (
      <div className="ChartCard Card" style={style}>
        <div className="top-container">
          <h2 className="name secondary">{name}</h2>
          {tooltip}
        </div>
        <div className="data-container">
          {chart}
        </div>
      </div>
    )
  }
}

export default ChartCard;