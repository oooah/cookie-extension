import { describe, expect, it, vi } from 'vitest';

import { createBackgroundController } from '@/background/controller';
import { DEFAULT_SETTINGS } from '@/utils/defaults';
import type { ExtensionSettings } from '@/utils/messages';

describe('createBackgroundController', () => {
  function createDeps(overrides: Partial<Parameters<typeof createBackgroundController>[0]> = {}) {
    let settings: ExtensionSettings = { ...DEFAULT_SETTINGS };

    const deps = {
      readSettings: vi.fn(async () => settings),
      writeSettings: vi.fn(async (nextSettings: ExtensionSettings) => {
        settings = nextSettings;
        return settings;
      }),
      addDomain: vi.fn(async (domain: string) => {
        settings = {
          ...settings,
          domainList: [...settings.domainList, domain],
        };
        return settings;
      }),
      removeDomain: vi.fn(async (domain: string) => {
        settings = {
          ...settings,
          domainList: settings.domainList.filter((item) => item !== domain),
        };
        return settings;
      }),
      refreshCookies: vi.fn(async () => true),
      syncRules: vi.fn(async () => {}),
      clearRules: vi.fn(async () => {}),
      ...overrides,
    };

    return { deps, getSettings: () => settings };
  }

  it('initializes with stored settings and syncs rules when enabled', async () => {
    const storedSettings: ExtensionSettings = {
      cookieStatus: true,
      domainList: ['localhost', 'tieba.baidu.com'],
    };
    const { deps } = createDeps({
      readSettings: vi.fn(async () => storedSettings),
    });

    const controller = createBackgroundController(deps);
    const settings = await controller.ensureInitialized();

    expect(settings).toEqual(storedSettings);
    expect(deps.refreshCookies).toHaveBeenCalledTimes(1);
    expect(deps.syncRules).toHaveBeenCalledWith(storedSettings.domainList);
    expect(deps.clearRules).not.toHaveBeenCalled();
  });

  it('updates stored status and clears rules when the cookie switch is turned off', async () => {
    const initialSettings: ExtensionSettings = {
      cookieStatus: true,
      domainList: ['localhost'],
    };
    const { deps } = createDeps({
      readSettings: vi.fn(async () => initialSettings),
    });

    const controller = createBackgroundController(deps);

    await controller.ensureInitialized();
    const response = await controller.handleMessage({
      type: 'setCookieStatus',
      cookieStatus: false,
    });

    expect(deps.writeSettings).toHaveBeenCalledWith({
      cookieStatus: false,
      domainList: ['localhost'],
    });
    expect(deps.clearRules).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      success: true,
      settings: {
        cookieStatus: false,
        domainList: ['localhost'],
      },
    });
  });
});
