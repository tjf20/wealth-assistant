// client/src/lib/cewNavigator.js
//
// Abstraction over CEW's legacy navigation shell.
//
// CEW (the Electron-based Client Engagement Workstation) exposes a global
// `shell` object at runtime — shell.goto(page) — that drives its own
// workspaces/tabs/portals. This file is the ONLY place in the app that
// should ever touch `window.shell` directly. Every other component should
// navigate through `navigate()` (or the <CewLink> component) so the app
// keeps working identically whether it's:
//   - embedded/driving CEW (window.shell is present), or
//   - running standalone in a normal browser tab (dev, testing, or a
//     future non-CEW deployment) — in which case we fall back to opening
//     a plain URL.
//
// This means every "open in Salesforce / FactSet / a CEW tab" link in the
// UI can be wired up today using fallbackUrl, and swapped to drive CEW for
// real the moment a `page` identifier is confirmed with IT — with zero
// changes to the components that call it.

/**
 * @typedef {Object} NavTarget
 * @property {string} [page]        CEW page identifier, e.g. "salesforce:opportunity/{id}".
 *                                   May contain {param} placeholders filled from `params`.
 * @property {Object} [params]      Values to interpolate into `page` / `fallbackUrl`.
 * @property {string} [fallbackUrl] Plain URL to open when CEW isn't present.
 *                                   May also contain {param} placeholders.
 * @property {string} [label]       Human-readable label, used in warnings/logging only.
 */

function isCewAvailable() {
  return typeof window !== "undefined" && typeof window.shell?.goto === "function";
}

function interpolate(template, params = {}) {
  if (!template) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined && params[key] !== null ? params[key] : `{${key}}`
  );
}

/**
 * Navigate to a target, preferring CEW's native shell when available and
 * falling back to a plain browser navigation otherwise.
 * @param {NavTarget} target
 */
export function navigate(target) {
  if (!target) return;
  const { page, params, fallbackUrl, label } = target;

  if (page && isCewAvailable()) {
    window.shell.goto(interpolate(page, params));
    return;
  }

  const resolvedUrl = interpolate(fallbackUrl, params);
  if (resolvedUrl) {
    window.open(resolvedUrl, "_blank", "noopener,noreferrer");
  } else if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[cewNavigator] No CEW shell and no fallbackUrl for target${label ? ` "${label}"` : ""}.`, target);
  }
}

export { isCewAvailable };
