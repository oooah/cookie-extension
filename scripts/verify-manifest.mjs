import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifestPath = resolve('.output/chrome-mv3/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const expectedPermissions = [
  'cookies',
  'declarativeNetRequestWithHostAccess',
  'storage',
  'tabs',
].sort();
const expectedHostPermissions = ['*://*/'];

function assertArrayEqual(label, actual, expected) {
  const normalizedActual = [...actual].sort();
  const normalizedExpected = [...expected].sort();

  if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
    throw new Error(
      `${label} mismatch.\nExpected: ${JSON.stringify(
        normalizedExpected,
      )}\nActual: ${JSON.stringify(normalizedActual)}`,
    );
  }
}

if (manifest.manifest_version !== 3) {
  throw new Error(`Expected manifest_version 3, received ${manifest.manifest_version}.`);
}

assertArrayEqual('permissions', manifest.permissions ?? [], expectedPermissions);
assertArrayEqual(
  'host_permissions',
  manifest.host_permissions ?? [],
  expectedHostPermissions,
);

if (!manifest.background?.service_worker) {
  throw new Error('Expected background.service_worker to be generated.');
}

if (manifest.background?.type !== 'module') {
  throw new Error(
    `Expected background.type to be "module", received ${manifest.background?.type}.`,
  );
}

if (!manifest.action?.default_popup) {
  throw new Error('Expected action.default_popup to be generated.');
}

console.log(`Manifest verification passed for ${manifestPath}`);
