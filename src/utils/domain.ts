export function normalizeDomain(domain: string) {
  return domain.trim().replace(/^\.+/, '').toLowerCase();
}

export function uniqueDomains(domains: string[]) {
  return [...new Set(domains.map(normalizeDomain).filter(Boolean))];
}

export function addDomainToList(domainList: string[], domain: string) {
  return uniqueDomains([...domainList, domain]);
}

export function removeDomainFromList(domainList: string[], domain: string) {
  const normalizedDomain = normalizeDomain(domain);
  return uniqueDomains(domainList).filter((item) => item !== normalizedDomain);
}

export function isForbiddenDomain(domain: string, forbiddenDomains: string[]) {
  const normalizedDomain = normalizeDomain(domain);
  return forbiddenDomains.some((forbiddenDomain) =>
    normalizedDomain.includes(normalizeDomain(forbiddenDomain)),
  );
}
