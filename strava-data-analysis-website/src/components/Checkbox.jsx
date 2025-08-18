import { useState } from "react";

function Checkbox({ defaultValue, onChange }) {
  const [checked, setChecked] = useState(defaultValue ?? false);

  const onClickHandler = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    onChange(newChecked);
  }

  return (
    <button className={"Checkbox"} onClick={onClickHandler} data-checked={checked}></button>
  );
}

export default Checkbox;