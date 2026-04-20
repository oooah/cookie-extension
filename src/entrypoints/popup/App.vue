<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { DEFAULT_SETTINGS } from '@/utils/defaults';
import {
  createSettingsClient,
  toDisplayError,
  type ExtensionSettings,
  type SettingsClient,
} from '@/utils/messages';

const props = defineProps<{
  client?: SettingsClient;
}>();

const client = props.client ?? createSettingsClient();
const settings = ref<ExtensionSettings>({ ...DEFAULT_SETTINGS });
const domainInput = ref('');
const errorMessage = ref('');
const isReady = ref(false);
const isSubmitting = ref(false);

const statusText = computed(() =>
  settings.value.cookieStatus ? '已开启，建议仅在开发调试时使用' : '已关闭',
);

const toggleLabel = computed(() =>
  settings.value.cookieStatus ? '关闭' : '开启',
);

async function applyUpdate(action: () => Promise<ExtensionSettings>) {
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    settings.value = await action();
  } catch (error) {
    errorMessage.value = toDisplayError(error);
  } finally {
    isSubmitting.value = false;
  }
}

async function loadSettings() {
  errorMessage.value = '';

  try {
    settings.value = await client.getSettings();
  } catch (error) {
    errorMessage.value = toDisplayError(error);
  } finally {
    isReady.value = true;
  }
}

async function toggleCookieStatus() {
  await applyUpdate(() => client.setCookieStatus(!settings.value.cookieStatus));
}

async function addDomain() {
  const domain = domainInput.value.trim();
  if (!domain) {
    return;
  }

  await applyUpdate(async () => {
    const nextSettings = await client.addDomain(domain);
    domainInput.value = '';
    return nextSettings;
  });
}

async function removeDomain(domain: string) {
  await applyUpdate(() => client.removeDomain(domain));
}

onMounted(() => {
  void loadSettings();
});
</script>

<template>
  <main class="popup-shell">
    <section class="panel">
      <div class="panel__eyebrow">Chrome MV3</div>
      <header class="panel__header">
        <div>
          <h1>强制携带 Cookie</h1>
          <p data-testid="status-text">{{ statusText }}</p>
        </div>
        <button
          data-testid="cookie-toggle"
          class="toggle-button"
          :class="{ 'toggle-button--active': settings.cookieStatus }"
          :disabled="!isReady || isSubmitting"
          type="button"
          @click="toggleCookieStatus"
        >
          {{ toggleLabel }}
        </button>
      </header>

      <div v-if="!isReady" class="state-card">正在读取扩展设置...</div>

      <template v-else>
        <section class="section">
          <div class="section__title">白名单 Domain</div>
          <p class="section__description">
            如果开启后仍未生效，可以把需要的 Domain 加入白名单。
          </p>

          <div class="input-row">
            <input
              data-testid="domain-input"
              v-model="domainInput"
              class="domain-input"
              :disabled="isSubmitting"
              placeholder="例如 www.baidu.com"
              type="text"
              @keyup.enter="addDomain"
            />
            <button
              data-testid="add-domain"
              class="primary-button"
              :disabled="isSubmitting"
              type="button"
              @click="addDomain"
            >
              添加
            </button>
          </div>

          <ul v-if="settings.domainList.length > 0" class="domain-list">
            <li
              v-for="domain in settings.domainList"
              :key="domain"
              class="domain-item"
            >
              <span class="domain-item__name">{{ domain }}</span>
              <button
                :data-testid="`remove-domain-${domain}`"
                class="link-button"
                :disabled="isSubmitting"
                type="button"
                @click="removeDomain(domain)"
              >
                删除
              </button>
            </li>
          </ul>
          <div v-else class="empty-state">当前还没有配置额外的 Domain。</div>
        </section>

        <section class="tips-card">
          <div class="tips-card__title">查看 Domain 的位置</div>
          <p>打开开发者工具后，进入 `Application -> Cookies -> Domain`。</p>
        </section>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </template>
    </section>
  </main>
</template>

<style scoped>
.popup-shell {
  min-width: 360px;
}

.panel {
  display: grid;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.84)),
    radial-gradient(circle at top left, rgba(7, 118, 91, 0.12), transparent 48%);
  border: 1px solid rgba(7, 118, 91, 0.16);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.12);
}

.panel__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(7, 118, 91, 0.12);
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.panel__header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-start;
}

.panel__header h1 {
  margin: 0;
  color: #102a43;
  font-family: 'Bahnschrift', 'Segoe UI Variable Display', 'PingFang SC', sans-serif;
  font-size: 24px;
  line-height: 1.1;
}

.panel__header p {
  margin: 8px 0 0;
  color: #486581;
  font-size: 13px;
  line-height: 1.5;
}

.toggle-button,
.primary-button,
.link-button {
  border: none;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.toggle-button:disabled,
.primary-button:disabled,
.link-button:disabled,
.domain-input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.toggle-button {
  min-width: 84px;
  padding: 11px 14px;
  border-radius: 999px;
  background: rgba(16, 42, 67, 0.08);
  color: #102a43;
  font-size: 13px;
  font-weight: 700;
}

.toggle-button--active {
  background: linear-gradient(135deg, #0f766e, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 12px 22px rgba(15, 118, 110, 0.26);
}

.toggle-button:not(:disabled):hover,
.primary-button:not(:disabled):hover,
.link-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.section {
  display: grid;
  gap: 12px;
}

.section__title,
.tips-card__title {
  color: #102a43;
  font-size: 14px;
  font-weight: 700;
}

.section__description,
.tips-card p,
.empty-state,
.state-card {
  margin: 0;
  color: #486581;
  font-size: 13px;
  line-height: 1.5;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.domain-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(72, 101, 129, 0.2);
  background: rgba(248, 250, 252, 0.92);
  color: #102a43;
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.domain-input:focus {
  border-color: rgba(29, 78, 216, 0.42);
  box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.12);
}

.primary-button {
  padding: 0 18px;
  border-radius: 14px;
  background: #102a43;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.domain-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.domain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.domain-item__name {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #102a43;
  font-size: 13px;
  font-weight: 600;
}

.link-button {
  padding: 0;
  background: transparent;
  color: #d64545;
  font-size: 12px;
  font-weight: 700;
}

.tips-card,
.state-card {
  padding: 14px;
  border-radius: 16px;
  background: rgba(239, 246, 255, 0.72);
  border: 1px solid rgba(147, 197, 253, 0.22);
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(254, 226, 226, 0.82);
  color: #b42318;
  font-size: 13px;
  line-height: 1.5;
}
</style>
