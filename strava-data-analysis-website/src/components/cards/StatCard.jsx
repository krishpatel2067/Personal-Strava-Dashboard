import "./Card.css";
import "./StatCard.css";

function StatCard({ name, stat, units, round = true }) {
  return (
    <div className="StatCard Card">
      <h4 className="name secondary">{name}</h4>
      <div className="data-container">
        <span className="stat">{(round ? Math.round(stat) : stat).toLocaleString()}</span>
        <span className="units secondary"> {units}</span>
      </div>
    </div>
  );
}

export default StatCard;