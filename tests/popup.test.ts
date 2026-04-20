/**
 * @vitest-environment happy-dom
 */
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import App from '@/entrypoints/popup/App.vue';
import type { ExtensionSettings, SettingsClient } from '@/utils/messages';

function createClient(initialSettings: ExtensionSettings): SettingsClient {
  let settings = { ...initialSettings };

  return {
    getSettings: vi.fn(async () => settings),
    setCookieStatus: vi.fn(async (cookieStatus: boolean) => {
      settings = { ...settings, cookieStatus };
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
  };
}

describe('popup app', () => {
  it('loads extension settings on mount', async () => {
    const client = createClient({
      cookieStatus: true,
      domainList: ['localhost'],
    });

    const wrapper = mount(App, {
      props: {
        client,
      },
    });

    await flushPromises();

    expect(client.getSettings).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-testid="status-text"]').text()).toContain('已开启');
    expect(wrapper.text()).toContain('localhost');
  });

  it('toggles status, adds a domain, and removes a domain through the client', async () => {
    const client = createClient({
      cookieStatus: true,
      domainList: ['localhost'],
    });

    const wrapper = mount(App, {
      props: {
        client,
      },
    });

    await flushPromises();

    await wrapper.get('[data-testid="cookie-toggle"]').trigger('click');
    await flushPromises();
    expect(client.setCookieStatus).toHaveBeenCalledWith(false);

    await wrapper.get('[data-testid="domain-input"]').setValue('tieba.baidu.com');
    await wrapper.get('[data-testid="add-domain"]').trigger('click');
    await flushPromises();
    expect(client.addDomain).toHaveBeenCalledWith('tieba.baidu.com');
    expect(wrapper.text()).toContain('tieba.baidu.com');

    await wrapper.get('[data-testid="remove-domain-localhost"]').trigger('click');
    await flushPromises();
    expect(client.removeDomain).toHaveBeenCalledWith('localhost');
    expect(wrapper.text()).not.toContain('localhost');
  });
});
