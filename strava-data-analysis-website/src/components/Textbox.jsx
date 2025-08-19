import { useState } from "react";

function Textbox({ defaultValue, onChange }) {
  const [input, setInput] = useState(defaultValue ?? "");

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
      />
      {/* tool tip */}
    </div>
  );
}

export default Textbox;