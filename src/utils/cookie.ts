import { browser, type Browser } from 'wxt/browser';

type RuntimeCookie = Pick<Browser.cookies.Cookie, 'domain' | 'name' | 'value'>;

let cookieSnapshot = '';
let cookieMap = new Map<string, string>();

function normalizeCookieDomain(domain: string) {
  return domain.trim().replace(/^\.+/, '').toLowerCase();
}

function getDomainCandidates(domain: string) {
  const normalizedDomain = normalizeCookieDomain(domain);
  if (!normalizedDomain) {
    return [];
  }

  const parts = normalizedDomain.split('.').filter(Boolean);
  const candidates = [normalizedDomain];

  for (let index = 1; index < parts.length - 1; index += 1) {
    candidates.push(parts.slice(index).join('.'));
  }

  return candidates;
}

export async function refreshCookies() {
  try {
    const cookies = await browser.cookies.getAll({});
    return storeCookie(cookies);
  } catch (error) {
    console.error('Failed to read cookies:', error);
    return false;
  }
}

export function storeCookie(cookies: RuntimeCookie[]) {
  const nextSnapshot = JSON.stringify(cookies);
  if (nextSnapshot === cookieSnapshot) {
    return false;
  }

  cookieSnapshot = nextSnapshot;
  cookieMap = new Map<string, string>();

  for (const cookie of cookies) {
    const domainKey = normalizeCookieDomain(cookie.domain);
    const cookiePair = `${cookie.name}=${cookie.value}; `;
    cookieMap.set(domainKey, `${cookieMap.get(domainKey) ?? ''}${cookiePair}`);
  }

  return true;
}

export function getCookieDomains() {
  return [...cookieMap.keys()];
}

export function getDomainCookie(domain: string) {
  const value = getDomainCandidates(domain)
    .map((candidate) => cookieMap.get(candidate) ?? '')
    .join('');

  return value || null;
}
