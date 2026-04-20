import { browser } from 'wxt/browser';

export interface ExtensionSettings {
  cookieStatus: boolean;
  domainList: string[];
}

export type PopupRequest =
  | {
      type: 'getSettings';
    }
  | {
      type: 'setCookieStatus';
      cookieStatus: boolean;
    }
  | {
      type: 'addDomain';
      domain: string;
    }
  | {
      type: 'removeDomain';
      domain: string;
    };

export interface PopupSuccessResponse {
  success: true;
  settings: ExtensionSettings;
}

export interface PopupErrorResponse {
  success: false;
  error: string;
  settings: ExtensionSettings;
}

export type PopupResponse = PopupSuccessResponse | PopupErrorResponse;

export interface SettingsClient {
  getSettings: () => Promise<ExtensionSettings>;
  setCookieStatus: (cookieStatus: boolean) => Promise<ExtensionSettings>;
  addDomain: (domain: string) => Promise<ExtensionSettings>;
  removeDomain: (domain: string) => Promise<ExtensionSettings>;
}

export function createSuccessResponse(
  settings: ExtensionSettings,
): PopupSuccessResponse {
  return {
    success: true,
    settings,
  };
}

export function createErrorResponse(
  error: string,
  settings: ExtensionSettings,
): PopupErrorResponse {
  return {
    success: false,
    error,
    settings,
  };
}

export function toDisplayError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请稍后重试。';
}

async function sendPopupRequest(request: PopupRequest): Promise<PopupResponse> {
  return new Promise<PopupResponse>((resolve, reject) => {
    browser.runtime.sendMessage(
      request,
      (response: PopupResponse | undefined) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('Background did not return a response.'));
          return;
        }

        resolve(response);
      },
    );
  });
}

function unwrapSettings(response: PopupResponse) {
  if (response.success) {
    return response.settings;
  }

  throw new Error(response.error);
}

export function createSettingsClient(): SettingsClient {
  return {
    getSettings: async () => unwrapSettings(await sendPopupRequest({ type: 'getSettings' })),
    setCookieStatus: async (cookieStatus: boolean) =>
      unwrapSettings(await sendPopupRequest({ type: 'setCookieStatus', cookieStatus })),
    addDomain: async (domain: string) =>
      unwrapSettings(await sendPopupRequest({ type: 'addDomain', domain })),
    removeDomain: async (domain: string) =>
      unwrapSettings(await sendPopupRequest({ type: 'removeDomain', domain })),
  };
}
