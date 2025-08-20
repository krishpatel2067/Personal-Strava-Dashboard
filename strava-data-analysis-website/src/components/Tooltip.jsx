import { useEffect, useState } from "react";
import { useDetectClickOutside } from "react-detect-click-outside";
import "./Tooltip.css";

const MARGIN = 0;

function Tooltip({ content }) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState({});
  const ref = useDetectClickOutside({ onTriggered: () => setVisible(false) });

  useEffect(() => {
    const updateRelativePosition = () => {
      const activator = ref.current;
      const content = document.querySelector(".Tooltip .content");
      const activatorRect = activator.getBoundingClientRect();
      const x = activatorRect.x + activatorRect.width / 2;
      const y = activatorRect.y + activatorRect.height / 2;
      const vpWidth = window.innerWidth, vpHeight = window.innerHeight;
      const contentRect = content.getBoundingClientRect();
      const contentHeight = contentRect.height;
      const effectiveHeight = contentHeight + 20;
      const newStyle = {};

      if (y > vpHeight - effectiveHeight) {
        // too low on the screen
        newStyle.bottom = (vpHeight - y) + activatorRect.height;
      } else {
        newStyle.top = y + activatorRect.height;
      }

      if (x / vpWidth > 0.5) {
        // too right on the screen
        newStyle.right = vpWidth - x - activatorRect.width;
      } else {
        newStyle.left = x;
      }

      setStyle(newStyle);
    };
    document.addEventListener("scroll", updateRelativePosition);
    window.addEventListener("resize", updateRelativePosition);
    
    return () => {
      document.removeEventListener("scroll", updateRelativePosition)
      window.removeEventListener("resize", updateRelativePosition);
    };
  }, []);

  return (
    <div className="Tooltip">
      <button className="activator" ref={ref} onClick={() => setVisible(true)}>
        ?
      </button>
      <div
        className="content"
        data-visible={visible}
        style={style}
      >
        {content}
      </div>
    </div>
  );
}

export default Tooltip;