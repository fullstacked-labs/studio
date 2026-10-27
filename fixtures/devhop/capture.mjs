// Captures README demo screenshots and terminal output from real runs:
// the Vite demo app, a raw cloudflared tunnel (to show Vite's host block),
// and devhop itself under a pseudo-TTY. Nothing here is faked or edited.
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, 'app');
const appFile = join(appDir, 'src/App.jsx');
// A devhop checkout next to this repo (~/dev/apps/devhop beside ~/dev/studio) unless DEVHOP_DIR says otherwise.
const devhopDir = process.env.DEVHOP_DIR ?? join(here, '../../../apps/devhop');
const devhopBin = join(devhopDir, 'bin/devhop.js');
const devhopPkg = join(devhopDir, 'package.json');
// Reuse the cloudflared devhop already downloaded and checksummed, newest version first.
const cloudflaredCache = join(homedir(), '.cache/devhop/bin');
const cloudflaredBin = join(cloudflaredCache, readdirSync(cloudflaredCache).sort().at(-1), 'cloudflared');
const chromePath = process.env.CHROME ?? '/usr/bin/chromium';
// Vite's default port, so the typed commands in the demo look like a normal session.
const demoPort = Number(process.env.PORT ?? 5173);
const iphoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const dayLine = 'const theme = themes.day;';
const nightLine = 'const theme = themes.night;';
const nightBg = 'rgb(11, 16, 36)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);
const out = (name) => join(here, '../../captures/devhop', name);

const stripAnsi = (s) => s
  .replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '')
  .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');

async function pollUntil(check, timeoutMs, label, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(intervalMs);
  }
  throw new Error(`timed out after ${timeoutMs} ms waiting for ${label}`);
}

function exitOf(child) {
  return new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
}

// Vite is the target for every other step, so it must answer before we use it.
async function startVite(port) {
  const child = spawn(join(appDir, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: appDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const logBuf = [];
  child.stdout.on('data', (d) => logBuf.push(d));
  child.stderr.on('data', (d) => logBuf.push(d));
  const exited = exitOf(child);
  await pollUntil(async () => fetch(`http://127.0.0.1:${port}/`).then((r) => r.ok, () => false), 30000, 'vite to answer');
  return { child, exited, log: () => Buffer.concat(logBuf).toString('utf8') };
}

// The blocked-host step needs a tunnel with no devhop proxy in front of it.
async function startQuickTunnel(port) {
  const child = spawn(cloudflaredBin, ['tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let text = '';
  const exited = exitOf(child);
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no trycloudflare URL within 60 s; cloudflared said:\n${text}`)), 60000);
    const onData = (d) => {
      text += d;
      const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) {
        clearTimeout(timer);
        resolve(m[0]);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    exited.then(({ code }) => {
      clearTimeout(timer);
      reject(new Error(`cloudflared exited (code ${code}) before printing a URL:\n${text}`));
    });
  });
  return { child, exited, url };
}

// New quick-tunnel hostnames fail DNS or return Cloudflare errors for a while,
// so a failed navigation is retried until the page is ready or 90 s pass.
async function retryLoad(page, url, ready, label) {
  const deadline = Date.now() + 90000;
  let attempt = 0;
  let last = '';
  while (Date.now() < deadline) {
    attempt += 1;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (await ready(page)) {
        log(`${label}: ready on attempt ${attempt}`);
        return;
      }
      last = 'loaded, but not ready: ' + (await page.evaluate(() => document.body?.innerText ?? '')).slice(0, 200);
    } catch (err) {
      last = err.message.split('\n')[0];
    }
    log(`${label}: attempt ${attempt} not ready (${last}); retrying`);
    await sleep(3000);
  }
  throw new Error(`${label}: not ready after 90 s; last result: ${last}`);
}

const blockedReady = async (page) =>
  (await page.evaluate(() => document.body?.innerText ?? '')).includes('Blocked request');

const appReady = (page) =>
  page.getByText('Pick a trail').waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false);

// devhop runs under script(1) so it sees a real TTY and prints its colored
// dashboard. The stty call sets the pty size; COLUMNS/LINES alone do not.
function startDevhop(port) {
  const child = spawn('script', ['-q', '-e', '-c', `stty cols 80 rows 40; node ${devhopBin} ${port}`, '/dev/null'], {
    env: { ...process.env, TERM: 'xterm-256color', SHELL: '/bin/sh', COLUMNS: '80', LINES: '40' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const chunks = [];
  const errChunks = [];
  child.stdout.on('data', (d) => chunks.push(d));
  child.stderr.on('data', (d) => errChunks.push(d));
  const exited = exitOf(child);
  const bytes = () => Buffer.concat(chunks);
  const plain = () => stripAnsi(bytes().toString('utf8'));
  const dashboardDone = () => {
    const t = plain();
    return /Mobile URL:\s+https:\/\/\S+/.test(t) && /[█▀▄]/.test(t) && /Press Ctrl\+C/.test(t);
  };
  return {
    child,
    exited,
    bytes,
    plain,
    stderr: () => Buffer.concat(errChunks).toString('utf8'),
    dashboardDone,
  };
}

async function stopDevhop(dh, port) {
  // SIGINT goes to the devhop node process itself, the same signal Ctrl+C sends.
  const pids = pgrepPids(`^node ${devhopBin} ${port}$`);
  if (pids.length === 0) log('no devhop node process matched; sending SIGINT to script instead');
  for (const pid of pids) process.kill(Number(pid), 'SIGINT');
  if (pids.length === 0) dh.child.kill('SIGINT');
  const result = await Promise.race([dh.exited, sleep(20000).then(() => null)]);
  if (!result) {
    log('devhop did not exit 20 s after SIGINT; sending SIGTERM to script');
    dh.child.kill('SIGTERM');
    await dh.exited;
  }
  return result;
}

function pgrepPids(pattern) {
  try {
    return execFileSync('pgrep', ['-f', pattern], { encoding: 'utf8' }).split('\n').filter(Boolean).map(Number);
  } catch {
    return [];
  }
}

function pgrepList(pattern) {
  try {
    return execFileSync('pgrep', ['-af', pattern], { encoding: 'utf8' }).trim() || '(none)';
  } catch {
    return '(none)';
  }
}

async function main() {
  const original = readFileSync(appFile);
  const viteVersion = JSON.parse(readFileSync(join(appDir, 'node_modules/vite/package.json'), 'utf8')).version;
  const devhopVersion = JSON.parse(readFileSync(devhopPkg, 'utf8')).version;
  const meta = { capturedAt: new Date().toISOString(), viteVersion, devhopVersion, port: demoPort };

  let vite;
  let cf;
  let dh;
  let browser;
  let vitePort;
  try {
    vitePort = demoPort;
    log(`starting vite on port ${vitePort}`);
    vite = await startVite(vitePort);
    log('vite answering');

    browser = await chromium.launch({ executablePath: chromePath });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: iphoneUa,
    });

    // 1. Blocked host: raw tunnel to Vite, no devhop.
    cf = await startQuickTunnel(vitePort);
    log(`raw tunnel: ${cf.url}`);
    // Vite's block page is plain text with no viewport tag, so mobile emulation
    // lays it out 980px wide and shrinks it to unreadable. Without isMobile the
    // same response wraps at phone width. 4x so the hook shot can zoom into it.
    const blockedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4, userAgent: iphoneUa });
    const blockedPage = await blockedContext.newPage();
    await retryLoad(blockedPage, cf.url, blockedReady, 'blocked');
    meta.blockedText = await blockedPage.evaluate(() => document.body.innerText);
    await blockedPage.screenshot({ path: out('blocked.png') });
    await blockedContext.close();
    cf.child.kill();
    await cf.exited;
    log('raw tunnel stopped');

    // 2. devhop dashboard in a pseudo-TTY.
    dh = startDevhop(vitePort);
    await pollUntil(async () => dh.dashboardDone(), 180000, 'devhop dashboard');
    await sleep(2000);
    const urlMatch = dh.plain().match(/Mobile URL:\s+(https:\/\/\S+)/);
    meta.devhopUrl = urlMatch[1];
    writeFileSync(out('terminal.ansi'), dh.bytes());
    log(`devhop dashboard captured; Mobile URL ${meta.devhopUrl}`);

    // 3. Loaded on the phone through devhop.
    const page = await context.newPage();
    await retryLoad(page, meta.devhopUrl, appReady, 'loaded');
    await page.screenshot({ path: out('loaded.png') });

    // 4. Hot update: the same page must keep its JS state across the edit.
    await page.evaluate(() => {
      window.__noReload = 1;
    });
    const source = original.toString('utf8');
    if (source.split(dayLine).length !== 2) throw new Error(`expected exactly one "${dayLine}" in App.jsx`);
    const t0 = Date.now();
    writeFileSync(appFile, source.replace(dayLine, nightLine));
    await page.waitForFunction(
      (rgb) => {
        const main = document.querySelector('main');
        return !!main && getComputedStyle(main).backgroundColor === rgb;
      },
      nightBg,
      { timeout: 30000, polling: 50 },
    );
    meta.hmrMs = Date.now() - t0;
    meta.hotUpdate = (await page.evaluate(() => window.__noReload)) === 1;
    await page.screenshot({ path: out('edited.png') });
    log(`night theme after ${meta.hmrMs} ms; hotUpdate=${meta.hotUpdate}`);

    writeFileSync(out('meta.json'), JSON.stringify(meta, null, 2) + '\n');
    log('meta.json written');
  } finally {
    writeFileSync(appFile, original);
    log(`App.jsx restored byte-for-byte: ${readFileSync(appFile).equals(original)}`);

    if (dh) {
      const r = await stopDevhop(dh, vitePort).catch((err) => {
        log(`stopDevhop error: ${err.message}`);
        return null;
      });
      log(`devhop exit: ${JSON.stringify(r)}`);
      if (dh.stderr()) log(`devhop script stderr: ${dh.stderr()}`);
    }
    if (vite) {
      vite.child.kill();
      await vite.exited;
    }
    if (cf && cf.child.exitCode === null && cf.child.signalCode === null) cf.child.kill();
    if (browser) await browser.close();
    log(`pgrep -af cloudflared:\n${pgrepList('cloudflared')}`);
    log(`pgrep -af vite:\n${pgrepList('vite')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
