import { browser } from 'wxt/browser';

import { resolveStoredSettings } from '@/utils/defaults';
import { addDomainToList, removeDomainFromList } from '@/utils/domain';
import type { ExtensionSettings } from '@/utils/messages';

const SETTINGS_KEYS = ['cookieStatus', 'domainList'] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export async function readSettings() {
  try {
    const storedValues = await browser.storage.local.get([...SETTINGS_KEYS]);

    return resolveStoredSettings({
      cookieStatus:
        typeof storedValues.cookieStatus === 'boolean'
          ? storedValues.cookieStatus
          : undefined,
      domainList: isStringArray(storedValues.domainList)
        ? storedValues.domainList
        : undefined,
    });
  } catch (error) {
    console.error('Failed to read extension storage:', error);
    return resolveStoredSettings();
  }
}

export async function writeSettings(settings: ExtensionSettings) {
  const nextSettings = resolveStoredSettings(settings);

  await browser.storage.local.set(nextSettings);
  return nextSettings;
}

export async function addDomainToStorage(domain: string) {
  const settings = await readSettings();
  return writeSettings({
    ...settings,
    domainList: addDomainToList(settings.domainList, domain),
  });
}

export async function removeDomainFromStorage(domain: string) {
  const settings = await readSettings();
  return writeSettings({
    ...settings,
    domainList: removeDomainFromList(settings.domainList, domain),
  });
}
