// client/src/data/cewTargets.js
//
// Central registry of CEW navigation targets. Components should reference
// a target by key via resolveTarget() — never hardcode a `page` id or
// external URL inline in a component. That keeps every hop out to
// Salesforce/FactSet/a CEW workspace tab in one auditable place, and means
// swapping a placeholder `page` for the real CEW page id (once confirmed
// with IT) is a one-line change here, not a hunt through the UI.
//
// fallbackUrl is what opens when the app is running outside CEW (e.g. a
// plain browser tab in dev). Fill these in with your org's real URLs as
// they're confirmed.

export const cewTargets = {
  salesforceClient: {
    page: "salesforce:client/{id}",              // TODO: confirm real CEW page id with IT
    fallbackUrl: "https://yourorg.my.salesforce.com/{id}",
    label: "Open Client in Salesforce",
  },
  salesforceLogActivity: {
    page: "salesforce:activity/new?client={id}", // TODO: confirm real CEW page id with IT
    fallbackUrl: "https://yourorg.my.salesforce.com/_ui/core/email/author/EmailAuthor?p3_lkid={id}",
    label: "Log Activity to Salesforce",
  },
  factsetTicker: {
    page: "factset:security/{ticker}",            // TODO: confirm real CEW page id with IT
    fallbackUrl: "https://my.apps.factset.com/workstation/search/{ticker}",
    label: "Open in FactSet",
  },
};

/**
 * Look up a registered target by key and attach runtime params.
 * @param {keyof typeof cewTargets} key
 * @param {Object} [params]
 * @returns {import("../lib/cewNavigator.js").NavTarget|null}
 */
export function resolveTarget(key, params) {
  const base = cewTargets[key];
  if (!base) {
    // eslint-disable-next-line no-console
    console.warn(`[cewTargets] Unknown target key "${key}"`);
    return null;
  }
  return { ...base, params };
}
