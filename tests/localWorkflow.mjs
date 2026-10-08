// Real local Supabase -> API cache -> queued email HTML -> batched status updates.
// No AWS credentials are loaded and no mail is sent. Synthetic rows are cleaned up.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseEnv } from 'node:util';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createSnapshotStore } from '../../rotations-api/src/refresh.mjs';
import { createApiServer } from '../../rotations-api/src/server.mjs';
import { queueWishlistSaleEmails, getPendingEmailLogs, updateEmailLogStatuses } from '../lib/emailQueue.ts';
import { render } from '@react-email/components';
import React from 'react';
import Template from '../emails/Wishlist-Notification.tsx';
const root=path.resolve(import.meta.dirname,'../..');
const env=parseEnv(fs.readFileSync(path.join(root,'rotations-ingestion/.env.local'),'utf8'));
assert.equal(new URL(env.SUPABASE_URL).origin,'http://127.0.0.1:55421');
const db=createClient(env.SUPABASE_URL,env.SUPABASE_KEY,{auth:{persistSession:false}});
const anon=JSON.parse(execFileSync(path.join(root,'rotations-ingestion/node_modules/.bin/supabase'),['--workdir',path.join(root,'rotations-ingestion/linux'),'status','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})).ANON_KEY;
const sql=fs.readFileSync(path.join(root,'rotations-ingestion/tests/emailBatches.sql'),'utf8').split('SET LOCAL ROLE service_role;')[0]+'\nCOMMIT;';
function psql(sql){execFileSync('docker',['exec','-i','supabase_db_rotations-linux-lab','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:sql,stdio:['pipe','ignore','pipe']});}
let store,server;const dataDir=fs.mkdtempSync('/tmp/hourly-local-api-');
const cleanup=`DELETE FROM public."WishlistEmailLog" WHERE "ItemID"='10000000-0000-4000-8000-000000000010';
DELETE FROM public."WishlistItem" WHERE "ItemID"='10000000-0000-4000-8000-000000000010';
DELETE FROM public."CatalogSale" WHERE "RiotItemID"=99999001;
DELETE FROM public."MythicSale" WHERE "PrimaryItemID"='10000000-0000-4000-8000-000000000010';
DELETE FROM public."SanctumSale" WHERE "RiotItemID"=99999001;
DELETE FROM public."CatalogItem" WHERE "ItemID"='10000000-0000-4000-8000-000000000010';
DELETE FROM auth.users WHERE id IN ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');`;
try {
 psql(cleanup);psql(sql);
 const startedAt=new Date(Date.now()-1000).toISOString();
 assert.equal((await db.rpc('record_public_api_state')).error,null);
 const config={supabaseUrl:env.SUPABASE_URL,supabasePublishableKey:anon,dataDir,refreshSecret:'local-email-test',publicRateLimit:1000,trustedProxyIps:[],refreshIntervalMs:3600000};
 store=await createSnapshotStore(config);store.requestRefresh('local-test');await store.whenIdle();assert.ok(store.current,'Local API snapshot must load');
 server=createApiServer(config,store);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 process.env.EMAIL_PUBLIC_API_URL=`http://127.0.0.1:${server.address().port}`;process.env.EMAIL_PUBLIC_API_SECRET=config.refreshSecret;process.env.EMAIL_INGESTION_STARTED_AT=startedAt;
 assert.equal(await queueWishlistSaleEmails(db),3);assert.equal(await queueWishlistSaleEmails(db),0);
 let bytes=0,calls=0;const measuredDb={from(table){const q=db.from(table);return {select(columns){assert.ok(!columns.includes('*'));const query=q.select(columns);let eq=query.eq.bind(query);query.eq=(key,value)=>{eq(key,value);return query;};const range=query.range.bind(query);query.range=async(...args)=>{calls++;const result=await range(...args);bytes+=Buffer.byteLength(JSON.stringify(result.data));return result;};return query;}};}};
 const logs=await getPendingEmailLogs(measuredDb);assert.equal(logs.length,3);
 const html=await render(React.createElement(Template,{items:logs}));assert.ok(html.includes('Hourly local fixture'));assert.ok(html.includes('Sanctum'));
 fs.writeFileSync(path.join(dataDir,'email-preview.html'),html);
 await updateEmailLogStatuses(db,logs,'SENT');assert.equal((await getPendingEmailLogs(db)).length,0);assert.equal(await queueWishlistSaleEmails(db),0);
 console.log(JSON.stringify({result:'PASS',matches:logs.length,pendingReadCalls:calls,pendingResponseBytes:bytes,htmlBytes:Buffer.byteLength(html),mailSent:false,preview:path.join(dataDir,'email-preview.html')}));
} finally {
 if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await store?.close();psql(cleanup);
}
