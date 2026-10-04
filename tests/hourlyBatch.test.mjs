import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
function fixture(t){
    const base=fs.mkdtempSync(path.join(os.tmpdir(),'hourly-email-test-'));
    t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
    const root=path.join(base,'rotations-email');
    for(const dir of ['scripts','node_modules/.bin','data'])fs.mkdirSync(path.join(root,dir),{recursive:true});
    const production=path.join(base,'production');
    const marker=path.join(production,'rotations-ingestion/data/run/email-pull.json');
    fs.mkdirSync(path.dirname(marker),{recursive:true});
    fs.copyFileSync(new URL('../scripts/hourlyBatch.mjs',import.meta.url),path.join(root,'scripts/hourlyBatch.mjs'));
    fs.writeFileSync(path.join(root,'node_modules/.bin/tsx'),`#!/usr/bin/env node\nconst fs=require('node:fs');fs.appendFileSync('calls',process.argv[2]+'\\n');console.log('mock batch log');if(fs.existsSync('fail')&&process.argv[2]==='pullSales.ts')process.exit(1);`,{mode:0o700});
    fs.writeFileSync(path.join(production,'email.env'),['SUPABASE_URL','SUPABASE_KEY','AWS_ACCESS_KEY','AWS_SECRET_KEY','AWS_REGION','FROM_EMAIL'].map(k=>`${k}=test`).join('\n'));
    return {root,marker,production,run:(...args)=>spawnSync(process.execPath,[path.join(root,'scripts/hourlyBatch.mjs'),...args],{encoding:'utf8'}),calls:()=>fs.existsSync(path.join(root,'calls'))?fs.readFileSync(path.join(root,'calls'),'utf8'):''};
}
test('on-hour completion queues then sends then uploads, and does not resend the same completed batch',t=>{
    const f=fixture(t);fs.writeFileSync(f.marker,JSON.stringify({startedAt:'2026-10-04T03:00:01Z'}));
    assert.equal(f.run().status,0);assert.equal(f.calls(),'pullSales.ts\nsendEmails.ts\nuploadLogFile.ts\n');
    assert.equal(f.run().status,0);assert.equal(f.calls(),'pullSales.ts\nsendEmails.ts\nuploadLogFile.ts\n');
});
test('half-hour completions do not queue or send',t=>{
    const f=fixture(t);fs.writeFileSync(f.marker,JSON.stringify({startedAt:'2026-10-04T03:30:01Z'}));
    assert.equal(f.run().status,0);assert.equal(f.calls(),'');
});
test('queue failure prevents sending, retains a log, and uploads that failure log',t=>{
    const f=fixture(t);fs.writeFileSync(f.marker,JSON.stringify({startedAt:'2026-10-04T03:00:01Z'}));fs.writeFileSync(path.join(f.root,'fail'),'');
    assert.equal(f.run().status,1);assert.equal(f.calls(),'pullSales.ts\nuploadLogFile.ts\n');
    assert.equal(fs.existsSync(path.join(f.root,'data/last-hourly-batch.json')),false);
});
test('missing credentials prevents queue mutation or delivery',t=>{
    const f=fixture(t);fs.writeFileSync(f.marker,JSON.stringify({startedAt:'2026-10-04T03:00:01Z'}));fs.writeFileSync(path.join(f.production,'email.env'),'');
    assert.equal(f.run().status,1);assert.equal(f.calls(),'uploadLogFile.ts\n');
    const logFiles=fs.readdirSync(path.join(f.root,'data/logs'));
    assert.match(fs.readFileSync(path.join(f.root,'data/logs',logFiles[0]),'utf8'),/Email configuration missing/);
});

test('configuration check uploads a log without sending, queuing, or consuming a batch slot',t=>{
    const f=fixture(t);fs.writeFileSync(f.marker,JSON.stringify({startedAt:'2026-10-04T03:30:01Z'}));
    assert.equal(f.run('--check-config').status,0);assert.equal(f.calls(),'uploadLogFile.ts\n');
    assert.equal(fs.existsSync(path.join(f.root,'data/last-hourly-batch.json')),false);
});
