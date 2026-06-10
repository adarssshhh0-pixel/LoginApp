import { useState } from "react";

function PasswordInput({ name, placeholder, onChange, value, style }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        style={{
          padding: "11px 44px 11px 14px",
          fontSize: 14,
          borderRadius: 8,
          border: "1.5px solid #bfdbfe",
          backgroundColor: "#f8fafc",
          fontFamily: "inherit",
          width: "100%",
          boxSizing: "border-box",
          ...style,
        }}
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "#64748b",
          padding: 0,
          lineHeight: 1,
        }}
      >
        {show ? "👁" : "👁"}
      </button>
    </div>
  );
}

export default PasswordInput;