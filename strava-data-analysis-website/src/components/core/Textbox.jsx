import { useEffect, useState } from "react";
import "./Textbox.css";

function Textbox({ defaultValue, onChange, disabled }) {
  const [input, setInput] = useState(defaultValue ?? "");

  useEffect(() => {
    onChange(input);
  }, []);

  const onChangeWrapper = (event) => {
    event.preventDefault();
    const newInput = event.target.value;
    setInput(newInput);

    if (onChange != null) {
      onChange(newInput);
    }
  }

  return (
    <div className="Textbox">
      <input
        type="text"
        value={input}
        onChange={onChangeWrapper}
        disabled={disabled}
      />
    </div>
  );
}

export default Textbox;