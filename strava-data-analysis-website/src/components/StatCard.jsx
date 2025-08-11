import './StatCard.css';

function StatCard({ name, stat, units, loaded, round = true }) {
    if (loaded) {
        return (
            <div className="StatCard">
                <span className="name">{name}</span>
                <br />
                <span className="stat">{(round ? Math.round(stat) : stat).toLocaleString()}</span>
                <span className="units"> {units}</span>
            </div>
        );
    }
}

export default StatCard;