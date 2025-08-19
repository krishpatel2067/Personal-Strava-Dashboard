import "./Tooltip.css";

function Tooltip({ content }) {
  return (
    <div className="Tooltip">
      <button className="activator">?</button>
      <div className="content">
        {content}
      </div>
    </div>
  );
}

export default Tooltip;