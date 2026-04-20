import { DEFAULT_SETTINGS } from '@/utils/defaults';
import {
  createErrorResponse,
  createSuccessResponse,
  type ExtensionSettings,
  type PopupRequest,
  type PopupResponse,
} from '@/utils/messages';

export interface BackgroundControllerDeps {
  readSettings: () => Promise<ExtensionSettings>;
  writeSettings: (settings: ExtensionSettings) => Promise<ExtensionSettings>;
  addDomain: (domain: string) => Promise<ExtensionSettings>;
  removeDomain: (domain: string) => Promise<ExtensionSettings>;
  refreshCookies: () => Promise<boolean>;
  syncRules: (domainList: string[]) => Promise<unknown>;
  clearRules: () => Promise<void>;
}

export function createBackgroundController(deps: BackgroundControllerDeps) {
  let initialized = false;
  let initPromise: Promise<ExtensionSettings> | null = null;
  let settings: ExtensionSettings = { ...DEFAULT_SETTINGS };

  function getSnapshot(): ExtensionSettings {
    return {
      cookieStatus: settings.cookieStatus,
      domainList: [...settings.domainList],
    };
  }

  async function applyRules(nextSettings: ExtensionSettings) {
    if (nextSettings.cookieStatus) {
      await deps.refreshCookies();
      await deps.syncRules(nextSettings.domainList);
      return;
    }

    await deps.clearRules();
  }

  async function ensureInitialized() {
    if (initialized) {
      return getSnapshot();
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      settings = await deps.readSettings();
      initialized = true;
      await applyRules(settings);
      return getSnapshot();
    })().finally(() => {
      initPromise = null;
    });

    return initPromise;
  }

  async function handleMessage(request: PopupRequest): Promise<PopupResponse> {
    await ensureInitialized();

    switch (request.type) {
      case 'getSettings':
        return createSuccessResponse(getSnapshot());
      case 'setCookieStatus':
        settings = await deps.writeSettings({
          ...settings,
          cookieStatus: request.cookieStatus,
        });
        await applyRules(settings);
        return createSuccessResponse(getSnapshot());
      case 'addDomain':
        settings = await deps.addDomain(request.domain);
        await applyRules(settings);
        return createSuccessResponse(getSnapshot());
      case 'removeDomain':
        settings = await deps.removeDomain(request.domain);
        await applyRules(settings);
        return createSuccessResponse(getSnapshot());
      default:
        return createErrorResponse('Unsupported message type.', getSnapshot());
    }
  }

  return {
    ensureInitialized,
    handleMessage,
  };
}
