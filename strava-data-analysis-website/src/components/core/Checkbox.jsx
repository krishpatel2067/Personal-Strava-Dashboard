import { useState } from "react";
import "./Checkbox.css";

function Checkbox({ label, defaultValue, onChange }) {
  const [checked, setChecked] = useState(defaultValue ?? false);

  const onClickHandler = (event) => {
    event.preventDefault();
    const newChecked = !checked;
    setChecked(newChecked);

    if (onChange != null) {
      onChange(label, newChecked);
    }
  }

  return (
    <div className="Checkbox" onClick={onClickHandler}>
      <button className="checkbox" data-checked={checked}>
        {/* todo: replace with SVG */}
        <span className="checkmark">&#10004;</span>
      </button>
      <span className="label">{label}</span>
    </div>
  );
}

export default Checkbox;