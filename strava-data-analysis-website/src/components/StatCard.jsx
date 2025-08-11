function StatCard({ name, stat, units, loaded }) {
    return (
        <div className="StatCard">
            <span className="name">{name}</span>
            <br />
            <span className="stat">{stat.toLocaleString()}</span>
            <br />  
            <span className="units">{units}</span>
        </div>
    );
}

export default StatCard;