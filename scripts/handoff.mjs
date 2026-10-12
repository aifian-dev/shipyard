import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const required = ['INTERVIEW_EVIDENCE.md', 'HANDOFF.md'];
const blockedDirectories = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.interview', '.data',
  'data', 'runtime', 'transcript', 'transcripts', 'secret', 'secrets', 'credentials',
  '.ssh', '.aws', '.azure', '.gcp', '.config',
]);

function exclusion(path) {
  const parts = path.toLowerCase().split('/');
  if (parts.some(part => blockedDirectories.has(part))) return 'excluded directory';
  if (parts.some(part => part.startsWith('.env') || part === '.npmrc' || part === '.netrc')) return 'environment or credentials';
  const name = parts.at(-1);
  if (/(^|[._-])(secret|secrets|credential|credentials|transcript|question)([._-]|$)/.test(name)) return 'private material filename';
  if (/\.(pem|key|p12|pfx|db|sqlite|sqlite3)([-.]|$)/.test(name) || /^id_(rsa|ed25519|ecdsa)/.test(name)) return 'key or database filename';
  if (/\.(log|tar|tgz|gz|zip)$/.test(name) || name === 'interview_assessment.md' || name === '.ds_store' || name === 'manifest.json') return 'runtime or archive file';
  return null;
}

function assertLocalRegularFile(root, path) {
  if (isAbsolute(path) || path.split('/').some(part => part === '..')) throw new Error(`Unsafe path: ${path}`);
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`Symlink excluded: ${path}`);
  }
  if (!lstatSync(current).isFile()) throw new Error(`Not a regular file: ${path}`);
}

export function buildHandoff(root = process.cwd(), { archive = true } = {}) {
  root = realpathSync(root);
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (realpathSync(git('rev-parse', '--show-toplevel').trim()) !== root) throw new Error('Run handoff from the repository root.');
  for (const path of required) {
    if (!existsSync(join(root, path))) throw new Error(`Missing ${path}. Finalize your interview session before packaging.`);
    assertLocalRegularFile(root, path);
    if (!readFileSync(join(root, path), 'utf8').trim()) throw new Error(`Empty ${path}. Finalize your interview session before packaging.`);
  }
  const privateRoot = join(root, '.interview');
  if (existsSync(privateRoot) && (!lstatSync(privateRoot).isDirectory() || lstatSync(privateRoot).isSymbolicLink())) throw new Error('.interview must be a real local directory.');
  mkdirSync(privateRoot, { recursive: true });
  const output = mkdtempSync(join(privateRoot, 'handoff-'));
  const submission = join(output, 'submission');
  mkdirSync(submission);
  const paths = [...new Set([...git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean), ...required])].sort();
  const included = [];
  const excluded = [];
  for (const path of paths) {
    const reason = exclusion(path);
    if (reason) { excluded.push({ path, reason }); continue; }
    try { assertLocalRegularFile(root, path); }
    catch (error) { excluded.push({ path, reason: error.message }); continue; }
    const destination = join(submission, path);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(root, path), destination);
    included.push({ path, sha256: createHash('sha256').update(readFileSync(destination)).digest('hex') });
  }
  // This manifest describes copied working files, including uncommitted changes.
  const manifest = {
    createdAt: new Date().toISOString(),
    baseCommit: git('rev-parse', 'HEAD').trim(),
    workingTreeDirty: Boolean(git('status', '--porcelain', '--untracked-files=all').trim()),
    source: 'Current working files; not a commit snapshot. Required local reports are included explicitly.',
    included,
    excluded,
  };
  writeFileSync(join(submission, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
  let artifact = submission;
  if (archive) {
    const target = join(output, 'submission.tar.gz');
    try {
      execFileSync('tar', ['-czf', target, '-C', output, 'submission'], { stdio: 'pipe' });
      artifact = target;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Archive creation failed. Review the retained folder ${submission}. ${error.message}`);
      console.warn('tar is unavailable. Use the complete submission folder for private transfer.');
    }
  }
  return { artifact, submission, manifest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { artifact, manifest } = buildHandoff();
    console.log(`Private handoff: ${artifact}\nIncluded ${manifest.included.length} files. Review MANIFEST.json and file contents before private sharing. Nothing was uploaded.`);
  } catch (error) {
    console.error(`Handoff failed: ${error.message}`);
    process.exitCode = 1;
  }
}
