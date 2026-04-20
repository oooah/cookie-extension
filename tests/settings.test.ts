import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, resolveStoredSettings } from '@/utils/defaults';

describe('resolveStoredSettings', () => {
  it('returns the default settings when storage is empty', () => {
    expect(resolveStoredSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('deduplicates and trims the stored domain list while preserving cookie status', () => {
    expect(
      resolveStoredSettings({
        cookieStatus: false,
        domainList: [' localhost ', 'tieba.baidu.com', 'localhost'],
      }),
    ).toEqual({
      cookieStatus: false,
      domainList: ['localhost', 'tieba.baidu.com'],
    });
  });
});
