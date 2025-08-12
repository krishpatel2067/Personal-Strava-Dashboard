import "./Card.css";
import "./StatCard.css";

function StatCard({ name, stat, units, loaded, round = true }) {
  if (loaded) {
    return (
      <div className="StatCard Card">
        <span className="name secondary">{name}</span>
        <br />
        <span className="stat">{(round ? Math.round(stat) : stat).toLocaleString()}</span>
        <span className="units secondary"> {units}</span>
      </div>
    );
  }
}

export default StatCard;