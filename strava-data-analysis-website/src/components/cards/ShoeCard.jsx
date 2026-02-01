import "./ShoeCard.css";

function ShoeCard({ brandName, modelName, distance, retired }) {
  return (
    <div className="ShoeCard Card">
      <h4 className="name secondary">{brandName} {modelName}</h4>
      <div className="data-container">
        <p className="value">{distance.value} <span className="units">{distance.units}</span></p>
        {retired ?
          <div className="retired" title="Retired"><p>Retired</p></div> :
          <div className="active" title="Active"><p>Active</p></div>
        }
      </div>
    </div>
  );
}

export default ShoeCard;