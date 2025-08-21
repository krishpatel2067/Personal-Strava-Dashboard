import { useState } from "react";

function MultiselectDropdown({ options: optionsProp }) {
  let options = optionsProp;

  // turn it into {id: value} pairings
  if (typeof optionsProp === "object" && Array.isArray(optionsProp)) {
    options = Object.fromEntries(optionsProp.map((value, index) => [index, value]));
  }

  const NUM_OPTIONS = Object.keys(options).length;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  const getOptionsDisplayText = () => {
    if (selected.length === NUM_OPTIONS) {
      return "All";
    }

    return selected.map((id) => options[id]).join(", ");
  };

  return (
    <div className="MultiselectDropdown">
      <button className="select" onClick={() => setOpen(prev => !prev)}>{getOptionsDisplayText()}</button>
      <div className="panel">
        <input
          type="text"
          className=""
        />
        {/* continue here */}
      </div>
    </div>
  );
}

export default MultiselectDropdown;