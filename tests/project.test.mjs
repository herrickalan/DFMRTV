import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Expo app has iOS and Android identifiers', async () => {
  const config = JSON.parse(await read('app.json'));
  assert.equal(config.expo.ios.bundleIdentifier, 'nu.dfm.mobile');
  assert.equal(config.expo.android.package, 'nu.dfm.mobile');
  assert.ok(config.expo.ios.infoPlist.UIBackgroundModes.includes('audio'));
});

test('all public station endpoints are configurable', async () => {
  const config = await read('src/config.ts');
  for (const key of ['STREAM_URL', 'WEBSITE_URL', 'FACEBOOK_URL', 'DISCORD_URL', 'SECONDLIFE_URL']) {
    assert.match(config, new RegExp(`EXPO_PUBLIC_DFM_${key}`));
  }
});

test('retired services and the TV launch flow are removed', async () => {
  const files = `${await read('src/config.ts')}\n${await read('App.tsx')}\n${await read('.env.example')}`;
  for (const retired of ['WATCH_URL', 'WHATSAPP_URL', 'YOUTUBE_URL', 'INSTAGRAM_URL', 'DFM TV']) {
    assert.ok(!files.includes(retired), `${retired} should not be present`);
  }
});

test('the app exposes the four core station destinations', async () => {
  const app = await read('App.tsx');
  for (const label of ["'home'", "'live'", "'schedule'", "'more'"]) assert.ok(app.includes(label));
});
