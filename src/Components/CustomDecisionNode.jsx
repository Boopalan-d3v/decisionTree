import React from "react";
import { Handle, Position } from "reactflow";

const CustomDecisionNode = ({ data }) => {
  return (
    <div
      style={{
        width: 140,
        height: 140,
        backgroundColor: "#FFF3CD",
        border: "2px solid #FFC107",
        transform: "rotate(45deg)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: "rotate(-45deg)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 8,
        }}
      >
        <div style={{ fontWeight: "bold" }}>{data.label}</div>
      </div>

      {/* Yes/No Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{
          background: "#28a745",
          transform: "translate(60px, -60px)",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{
          background: "#dc3545",
          transform: "translate(0px, 60px)",
        }}
      />
    </div>
  );
};

export default CustomDecisionNode;
