import "./Card.css";

function ChartCard({ name, chart, loaded }) {
  if (loaded) {
    return (
      <div className="TableCard Card">
        <h2 className="name secondary">{name}</h2>
        <div className="data-container">
          {chart}
        </div>
      </div>
    )
  }
}

export default ChartCard;