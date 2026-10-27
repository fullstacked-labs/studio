// The workaround the long cut shows: commit the allowedHosts edit Vite asks for
// and push it. Run for real in a throwaway repo with a local bare remote, under
// script(1) so git colors its output and prints push progress as it does in a
// terminal. The user's git config stays out of it (no signing prompts, no real
// name). Reads the edit from meta.json, so it needs no network.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = (name) => join(here, '../../captures/devhop', name);
const meta = JSON.parse(readFileSync(out('meta.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'devhop-git-'));
const env = {
  ...process.env, TERM: 'xterm-256color', SHELL: '/bin/sh', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'you', GIT_AUTHOR_EMAIL: 'you@example.com', GIT_COMMITTER_NAME: 'you', GIT_COMMITTER_EMAIL: 'you@example.com',
};
const git = (cwd, ...args) => execFileSync('git', args, { cwd, env, stdio: 'ignore' });
const tty = (cwd, cmd) => execFileSync('script', ['-q', '-e', '-c', `stty cols 80 rows 20; ${cmd}`, '/dev/null'], { cwd, env });

try {
  git(dir, 'init', '-q', '--bare', '-b', 'main', 'origin.git');
  git(dir, 'clone', '-q', 'origin.git', 'app');
  const app = join(dir, 'app');
  writeFileSync(join(app, 'vite.config.js'), meta.configBefore);
  git(app, 'add', '.');
  git(app, 'commit', '-q', '-m', 'init');
  git(app, 'push', '-q', '-u', 'origin', 'main');
  writeFileSync(join(app, 'vite.config.js'), meta.configAfter);
  writeFileSync(out('git-commit.ansi'), tty(app, 'git -c color.ui=always commit -am "allow tunnel host"'));
  writeFileSync(out('git-push.ansi'), tty(app, 'git -c color.ui=always push'));
  console.log('wrote git-commit.ansi and git-push.ansi');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
