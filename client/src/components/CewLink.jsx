// client/src/components/CewLink.jsx
//
// Drop-in replacement for a plain <a href> whenever the destination is
// Salesforce, FactSet, or any other CEW-hosted portal/tab/workspace.
// Renders as an inline, unstyled-by-default button and routes the click
// through cewNavigator so it drives CEW's shell.goto() when available,
// or opens a normal browser tab otherwise.
//
// Usage:
//   import CewLink from "./CewLink.jsx";
//   import { resolveTarget } from "../data/cewTargets.js";
//
//   <CewLink target={resolveTarget("salesforceClient", { id: client.sfId })}>
//     Open in Salesforce
//   </CewLink>

import { navigate } from "../lib/cewNavigator.js";

export default function CewLink({ target, children, style, className, onClick, ...rest }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
    navigate(target);
  };

  return (
    <button
      type="button"
      className={className}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        textDecoration: "none",
        ...style,
      }}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  );
}
