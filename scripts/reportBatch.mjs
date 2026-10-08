const status = process.argv[2];
if (!['running', 'ok', 'error'].includes(status)) throw new Error('Invalid email status.');
const response = await fetch(new URL('/rest/v1/linux_email_status', process.env.SUPABASE_URL), {
    method: 'POST', headers: { apikey: process.env.SUPABASE_KEY, Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ runner_id: 'direct', run_id: process.env.EMAIL_RUN_ID, status, updated_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(5000), redirect: 'error',
});
await response.body?.cancel();
if (!response.ok) throw new Error(`Email status publication returned HTTP ${response.status}.`);
