import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { buildHandoff } from '../scripts/handoff.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'interview-handoff-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, content = 'fixture') => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content); };
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
  git('init', '-q');
  put('.gitignore', 'node_modules/\n.interview/\nINTERVIEW_EVIDENCE.md\nHANDOFF.md\n');
  put('src/main.ts', 'export const answer = 1;');
  git('add', '.gitignore', 'src/main.ts');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture');
  put('INTERVIEW_EVIDENCE.md', '# Evidence\nEvent 1: failing check.\nEvent 2: repair verified.');
  put('HANDOFF.md', '# Handoff\nRun npm test. Known limits: fixture.');
  return { root, put, git };
}

test('includes current source, untracked tests, ignored required reports and manifest hashes in a real archive', t => {
  const { root, put } = fixture(t);
  put('src/main.ts', 'export const answer = 2;');
  put('test/new.test.ts', '// untracked solution test');
  const { artifact, manifest } = buildHandoff(root);
  assert.ok(artifact.endsWith('.tar.gz'));
  const extracted = join(root, 'extract'); mkdirSync(extracted);
  execFileSync('tar', ['-xzf', artifact, '-C', extracted]);
  assert.equal(readFileSync(join(extracted, 'submission/src/main.ts'), 'utf8'), 'export const answer = 2;');
  assert.match(readFileSync(join(extracted, 'submission/INTERVIEW_EVIDENCE.md'), 'utf8'), /failing check/);
  assert.equal(manifest.workingTreeDirty, true);
  for (const path of ['HANDOFF.md', 'test/new.test.ts', 'INTERVIEW_EVIDENCE.md']) assert.ok(manifest.included.some(file => file.path === path));
  assert.ok(manifest.included.every(file => /^[a-f0-9]{64}$/.test(file.sha256)));
});

test('excludes tracked and untracked private paths, runtime files, nested secrets and symlinks', t => {
  const { root, put, git } = fixture(t);
  const blocked = ['.env.production', '.npmrc', 'nested/.env.local', 'credentials.json', 'nested/private.key', 'private-question.md', 'runtime/state.json', 'data/state.json', 'state.sqlite-wal', 'transcripts/session.md', '.interview/question.md'];
  for (const path of blocked) put(path, 'SYNTHETIC_PRIVATE_SENTINEL');
  git('add', '-f', '--', ...blocked);
  symlinkSync('/tmp', join(root, 'outside'));
  symlinkSync(join(root, 'src/main.ts'), join(root, 'linked.ts'));
  const { submission, manifest } = buildHandoff(root, { archive: false });
  assert.deepEqual(manifest.included.filter(file => blocked.includes(file.path)), []);
  assert.ok(manifest.excluded.some(file => file.path === 'outside'));
  assert.ok(manifest.excluded.some(file => file.path === 'linked.ts'));
  for (const file of manifest.included) assert.doesNotMatch(readFileSync(join(submission, file.path), 'utf8'), /SYNTHETIC_PRIVATE_SENTINEL/);
});

test('rejects missing or blank required records instead of silently omitting them', t => {
  const { root, put } = fixture(t);
  rmSync(join(root, 'INTERVIEW_EVIDENCE.md'));
  assert.throws(() => buildHandoff(root), /Missing INTERVIEW_EVIDENCE/);
  put('INTERVIEW_EVIDENCE.md', ' \n');
  assert.throws(() => buildHandoff(root), /Empty INTERVIEW_EVIDENCE/);
});

test('rejects symlinked required evidence and private output directory', t => {
  const { root, put } = fixture(t);
  rmSync(join(root, 'HANDOFF.md'));
  symlinkSync(join(root, 'src/main.ts'), join(root, 'HANDOFF.md'));
  assert.throws(() => buildHandoff(root), /Symlink excluded/);
  rmSync(join(root, 'HANDOFF.md')); put('HANDOFF.md');
  symlinkSync('/tmp', join(root, '.interview'));
  assert.throws(() => buildHandoff(root), /real local directory/);
});

test('falls back to a complete folder when tar is unavailable', t => {
  const { root } = fixture(t);
  const bin = join(root, '.interview', 'bin'); mkdirSync(bin, { recursive: true });
  const gitPath = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  symlinkSync(gitPath, join(bin, 'git'));
  const result = execFileSync(process.execPath, [new URL('../scripts/handoff.mjs', import.meta.url).pathname], {
    cwd: root, env: { ...process.env, PATH: bin }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.match(result, /Private handoff: .*\/submission\n/);
  assert.match(result, /Nothing was uploaded/);
});
