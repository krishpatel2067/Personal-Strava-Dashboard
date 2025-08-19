import { useState } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";
import "./Tooltip.css";

function Tooltip({ content }) {
  const [visible, setVisible] = useState(false);
  const ref = useDetectClickOutside({ onTriggered: () => setVisible(false) });

  return (
    <div className="Tooltip">
      <button className="activator" ref={ref} onClick={() => setVisible(true)}>
        ?
      </button>
      <div className="content" data-visible={visible}>
        {content}
      </div>
    </div>
  );
}

export default Tooltip;