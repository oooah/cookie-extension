import { browser, type Browser } from 'wxt/browser';

import { getCookieDomains, getDomainCookie } from '@/utils/cookie';
import { isForbiddenDomain, normalizeDomain, uniqueDomains } from '@/utils/domain';

export interface RuleTarget {
  requestDomain: string;
  excludedRequestDomains: string[];
}

function isSubdomainOrSame(candidateDomain: string, parentDomain: string) {
  return (
    candidateDomain === parentDomain ||
    candidateDomain.endsWith(`.${parentDomain}`)
  );
}

function sortDomainsBySpecificity(domains: Iterable<string>) {
  return [...domains].sort((left, right) => {
    const depthDiff = right.split('.').length - left.split('.').length;
    if (depthDiff !== 0) {
      return depthDiff;
    }

    return left.localeCompare(right);
  });
}

export function buildRuleTargets(
  domainList: string[],
  cookieDomains: string[] = getCookieDomains(),
): RuleTarget[] {
  const configuredDomains = uniqueDomains(domainList);
  const knownCookieDomains = uniqueDomains(cookieDomains);
  const targets = new Set<string>();

  for (const configuredDomain of configuredDomains) {
    const normalizedConfiguredDomain = normalizeDomain(configuredDomain);
    targets.add(normalizedConfiguredDomain);

    for (const cookieDomain of knownCookieDomains) {
      const normalizedCookieDomain = normalizeDomain(cookieDomain);

      if (isSubdomainOrSame(normalizedCookieDomain, normalizedConfiguredDomain)) {
        targets.add(normalizedCookieDomain);
      }
    }
  }

  const sortedTargets = sortDomainsBySpecificity(targets);

  return sortedTargets.map((requestDomain) => ({
    requestDomain,
    excludedRequestDomains: sortedTargets.filter(
      (candidateDomain) =>
        candidateDomain !== requestDomain &&
        isSubdomainOrSame(candidateDomain, requestDomain),
    ),
  }));
}

export function createRule(
  requestDomain: string,
  cookieValue: string,
  id: number,
  excludedRequestDomains: string[] = [],
) {
  return {
    id,
    priority: 100 + requestDomain.split('.').length,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        {
          header: 'Cookie',
          operation: 'set',
          value: cookieValue,
        },
      ],
    },
    condition: {
      urlFilter: requestDomain,
      resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
      ...(excludedRequestDomains.length > 0
        ? { excludedRequestDomains }
        : {}),
    },
  } satisfies Browser.declarativeNetRequest.Rule;
}

export function buildRules(
  domainList: string[],
  forbiddenDomains: string[] = [],
  cookieDomains: string[] = getCookieDomains(),
) {
  const rules: Browser.declarativeNetRequest.Rule[] = [];
  const ruleIds: number[] = [];
  const ruleTargets = buildRuleTargets(domainList, cookieDomains);

  for (const [index, target] of ruleTargets.entries()) {
    if (isForbiddenDomain(target.requestDomain, forbiddenDomains)) {
      continue;
    }

    const cookieValue = getDomainCookie(target.requestDomain);
    if (!cookieValue) {
      continue;
    }

    const ruleId = index + 1;
    rules.push(
      createRule(
        target.requestDomain,
        cookieValue,
        ruleId,
        target.excludedRequestDomains,
      ),
    );
    ruleIds.push(ruleId);
  }

  return { rules, ruleIds };
}

export async function syncDynamicRules(
  domainList: string[],
  forbiddenDomains: string[] = [],
) {
  const { rules, ruleIds } = buildRules(domainList, forbiddenDomains);
  const existingRules = await browser.declarativeNetRequest.getDynamicRules();

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: rules,
  });

  return ruleIds;
}

export async function clearDynamicRules() {
  const existingRules = await browser.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map((rule) => rule.id);

  if (removeRuleIds.length === 0) {
    return;
  }

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: [],
  });
}
