import { useState } from "react";
import "./Tooltip.css";

function Tooltip({ content }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="Tooltip">
      <button className="activator" onClick={() => setVisible(prev => !prev)}>?</button>
      <div className="content" data-visible={visible}>
        {content}
      </div>
    </div>
  );
}

export default Tooltip;