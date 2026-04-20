import type { ExtensionSettings } from '@/utils/messages';
import { uniqueDomains } from '@/utils/domain';

export const DEFAULT_DOMAIN_LIST = ['localhost'];
export const DEFAULT_FORBIDDEN_DOMAINS: string[] = [];

export const DEFAULT_SETTINGS: ExtensionSettings = {
  cookieStatus: true,
  domainList: DEFAULT_DOMAIN_LIST,
};

export function resolveStoredSettings(
  storedSettings?: Partial<ExtensionSettings>,
): ExtensionSettings {
  return {
    cookieStatus: storedSettings?.cookieStatus ?? DEFAULT_SETTINGS.cookieStatus,
    domainList: uniqueDomains(storedSettings?.domainList ?? DEFAULT_SETTINGS.domainList),
  };
}
