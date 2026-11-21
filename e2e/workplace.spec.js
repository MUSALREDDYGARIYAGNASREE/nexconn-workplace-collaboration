import { test, expect } from '@playwright/test';

async function openRoom(page, label, id) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.locator('#target').fill(id);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.getByRole('heading', { name: id, exact: true })).toBeVisible();
}

async function exercise(a, b, ids) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const message = 'Schedule confirmation ' + suffix;
  await openRoom(a, 'Message a teammate', ids.b);
  await openRoom(b, 'Message a teammate', ids.a);
  await a.getByLabel('Message', { exact: true }).fill(message);
  await a.getByRole('button', { name: 'Send message' }).click();
  await expect(b.getByText(message, { exact: true })).toBeVisible();

  for (const page of [a,b]) await openRoom(page, 'Open project discussions', ids.project);
  const topic = 'Release review ' + suffix, reply = 'Reviewed ' + suffix;
  await a.getByLabel('New discussion').fill(topic);
  await a.getByRole('button', { name: 'Post topic' }).click();
  const thread = b.locator('article').filter({ hasText: topic });
  await thread.getByRole('button', { name: 'Reply' }).click();
  await b.getByLabel('Reply to thread').fill(reply);
  await b.getByRole('button', { name: 'Send reply' }).click();
  await expect(a.locator('article').filter({ hasText: topic }).getByText(reply)).toBeVisible();

  for (const page of [a,b]) await openRoom(page, 'Open handover channel', ids.handover);
  const summary = 'Ready for night shift ' + suffix;
  await a.getByLabel('Incoming shift').fill('Night operations');
  await a.getByLabel('Open items').fill('Check the support queue');
  await a.getByLabel('Shift summary').fill(summary);
  await a.getByRole('button', { name: 'Publish handover' }).click();
  await b.locator('article').filter({ hasText: summary }).getByRole('button', { name: 'Acknowledge handover' }).click();
  await expect(a.locator('article').filter({ hasText: summary })).toContainText(ids.b + ' · Acknowledged handover');
  await openRoom(a, 'Open project discussions', ids.project);
  await openRoom(a, 'Open handover channel', ids.handover);
  await expect(a.locator('article').filter({ hasText: summary })).toContainText('Acknowledged handover');
}

test('two demo teammates exchange messages, threaded replies and a handover', async ({ page, context }) => {
  const peer = await context.newPage();
  await page.goto('/'); await peer.goto('/?as=mina');
  await exercise(page, peer, { a: 'alex', b: 'mina', project: 'Studio launch', handover: 'Operations desk' });
});

test('two Nexconn accounts exchange messages, threaded replies and a handover', async ({ browser }) => {
  test.skip(process.env.RELAY_LIVE !== '1', 'Run npm run test:live with two provisioned test users.');
  process.loadEnvFile('.env');
  const value = name => {
    const result = process.env['NEXCONN_' + name];
    if (!result) throw new Error('Missing test setting NEXCONN_' + name);
    return result;
  };
  const ids = { a: value('USER_A_ID'), b: value('USER_B_ID'), project: value('PROJECT_GROUP_ID'), handover: value('HANDOVER_GROUP_ID') };
  const pages = [];
  for (const user of ['A','B']) {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173');
    await page.getByRole('button', { name: 'Connect Nexconn' }).click();
    await page.getByLabel('App key').fill(value('APP_KEY'));
    await page.getByLabel('User access token').fill(value('USER_' + user + '_TOKEN'));
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.locator('#identity')).toHaveText(value('USER_' + user + '_ID'), { timeout: 20000 });
    pages.push(page);
  }
  await exercise(...pages, ids);
});
