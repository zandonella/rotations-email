import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const production = path.resolve(root, '../production');
const validateOnly = process.argv.includes('--check-config');
const runNow = process.argv.includes('--run-now');
const markerPath = path.join(production, 'rotations-ingestion/data/run/email-pull.json');
const donePath = path.join(root, 'data/last-hourly-batch.json');
fs.mkdirSync(path.dirname(donePath), { recursive: true, mode: 0o700 });
const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
const slot = new Date(marker.startedAt);
if (!Number.isFinite(slot.getTime())) throw new Error('Invalid ingestion slot.');
const completed = Date.parse(marker.completedAt);
if (!validateOnly && !runNow && (
    typeof marker.runId !== 'string' || !/^[0-9a-f-]{36}$/.test(marker.runId) ||
    !Number.isFinite(completed) || completed < slot.getTime() || completed > Date.now() + 60_000 ||
    Date.now() - completed > 90 * 60_000
)) throw new Error('Missing, stale, or invalid completed ingestion marker; email batch not started.');
let previous;
try { previous = JSON.parse(fs.readFileSync(donePath, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
if (!validateOnly && !runNow && (previous?.runId === marker.runId || previous?.startedAt === marker.startedAt)) {
    console.log('This hourly email batch already completed.');
    process.exit(0);
}
let env = { ...process.env };
const logDirectory = path.join(root, 'data/logs');
fs.mkdirSync(logDirectory, {recursive:true, mode:0o700});
const logName = validateOnly
    ? `emails_config-check_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    : runNow ? `emails_manual_${new Date().toISOString().replace(/[:.]/g, '-')}.log`
    : `emails_${slot.toISOString().replace(/[:.]/g, '-')}.log`;
const logPath = path.join(logDirectory, logName);
const fd = fs.openSync(logPath, 'a', 0o600);
const run = script => {
    const result = spawnSync(path.join(root,'node_modules/.bin/tsx'), [script], {
        cwd: root, env, stdio:['ignore',fd,fd], timeout:10*60*1000,
    });
    if (result.error || result.status !== 0) throw new Error(`${script} failed; see ${logPath}`);
};
const report = status => {
    if (validateOnly || runNow || !marker.runId || !env.SUPABASE_URL || !env.SUPABASE_KEY) return;
    env.EMAIL_RUN_ID = marker.runId;
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/reportBatch.mjs'), status], { cwd: root, env, stdio: ['ignore', fd, fd], timeout: 7000 });
    if (result.status !== 0) fs.writeSync(fd, 'WARNING: Email status publication failed.\n');
};
let failure;
try {
    env = { ...env, ...parseEnv(fs.readFileSync(path.join(production, 'email.env'), 'utf8')) };
    for (const key of ['SUPABASE_URL','SUPABASE_KEY','AWS_ACCESS_KEY','AWS_SECRET_KEY','AWS_REGION','FROM_EMAIL']) {
        if (!env[key]?.trim()) throw new Error(`Email configuration missing: ${key}; configure production/email.env.`);
    }
    // Reuse the ingestion API's authenticated cache destination without exposing private records.
    const ingestion = parseEnv(fs.readFileSync(path.join(production, 'ingestion.env'), 'utf8'));
    env.EMAIL_PUBLIC_API_URL ||= ingestion.ROTATIONS_API_REFRESH_URL || '';
    env.EMAIL_PUBLIC_API_SECRET ||= ingestion.ROTATIONS_API_REFRESH_SECRET || '';
    env.EMAIL_INGESTION_STARTED_AT = marker.startedAt;
    fs.writeSync(fd, `Hourly email batch after pull ${marker.startedAt}; run ${marker.runId ?? 'manual'}\n`);
    if (validateOnly) {
        fs.writeSync(fd, 'Email configuration validated; no emails queued or sent.\n');
    } else {
        report('running');
        run('pullSales.ts');
        run('sendEmails.ts');
        if (!runNow) {
            fs.writeFileSync(donePath + '.tmp', JSON.stringify({runId:marker.runId,startedAt:marker.startedAt,completedAt:new Date().toISOString()}), {mode:0o600});
            fs.renameSync(donePath + '.tmp',donePath);
        }
        report('ok');
        console.log(`${runNow ? 'Manual' : 'Hourly'} email batch complete after pull ${marker.startedAt}.`);
    }
} catch(error) {
    failure=error;
    report('error');
    fs.writeSync(fd, `ERROR: ${error.message}\n`);
}
finally {
    fs.closeSync(fd);
}
// Log uploads require only Supabase credentials, even when SES configuration is missing.
try {
    const fallback = parseEnv(fs.readFileSync(path.join(production, 'ingestion.env'), 'utf8'));
    env.SUPABASE_URL ||= fallback.SUPABASE_URL;
    env.SUPABASE_KEY ||= fallback.SUPABASE_KEY;
} catch { /* email.env normally supplies these */ }
const upload = spawnSync(path.join(root,'node_modules/.bin/tsx'), ['uploadLogFile.ts',logPath], {cwd:root,env,stdio:'inherit',timeout:60000});
if (upload.error || upload.status !== 0) console.error(`Email log upload failed; local log retained at ${logPath}.`);
if (failure) throw failure;
