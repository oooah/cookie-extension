import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

import { createBackgroundController } from '@/background/controller';
import { refreshCookies } from '@/utils/cookie';
import { DEFAULT_FORBIDDEN_DOMAINS, DEFAULT_SETTINGS } from '@/utils/defaults';
import { createErrorResponse, type PopupRequest, type PopupResponse } from '@/utils/messages';
import { clearDynamicRules, syncDynamicRules } from '@/utils/rules';
import { addDomainToStorage, readSettings, removeDomainFromStorage, writeSettings } from '@/utils/storage';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected background error.';
}

export default defineBackground({
  type: 'module',
  main() {
    const controller = createBackgroundController({
      readSettings,
      writeSettings,
      addDomain: addDomainToStorage,
      removeDomain: removeDomainFromStorage,
      refreshCookies,
      syncRules: (domainList) => syncDynamicRules(domainList, DEFAULT_FORBIDDEN_DOMAINS),
      clearRules: clearDynamicRules,
    });

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      void controller
        .handleMessage(message as PopupRequest)
        .then((response) => {
          sendResponse(response);
        })
        .catch(async (error) => {
          const settings = await controller
            .ensureInitialized()
            .catch(() => ({ ...DEFAULT_SETTINGS }));
          const response: PopupResponse = createErrorResponse(
            toErrorMessage(error),
            settings,
          );
          sendResponse(response);
        });

      return true;
    });

    browser.runtime.onInstalled.addListener(() => {
      void controller.ensureInitialized();
    });

    browser.runtime.onStartup.addListener(() => {
      void controller.ensureInitialized();
    });

    void controller.ensureInitialized();
  },
});
