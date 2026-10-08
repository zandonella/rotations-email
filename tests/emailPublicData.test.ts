import test from 'node:test';import assert from 'node:assert/strict';
import { hydrateEmailLogs } from '../lib/emailPublicData.ts';
const row:any={UserID:'00000000-0000-4000-8000-000000000001',ItemID:'00000000-0000-4000-8000-000000000002',SaleID:'00000000-0000-4000-8000-000000000003',SaleType:'Catalog',Profile:{email:'test@example.com'}};
const publicData={ItemID:row.ItemID,SaleID:row.SaleID,SaleType:row.SaleType,CatalogItem:{Name:'Skin',ImageURL:'https://example.com/skin.png'},CatalogSale:{SaleEndAt:'2099-01-01',SalePrice:100,Currency:'RP',NormalPrice:200,PercentOff:50}};
test('confirmed public API cache supplies render data without a Supabase fallback',async t=>{
 const env={...process.env};t.after(()=>{for(const k of ['EMAIL_PUBLIC_API_URL','EMAIL_PUBLIC_API_SECRET','EMAIL_INGESTION_STARTED_AT']){if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}});
 process.env.EMAIL_PUBLIC_API_URL='http://127.0.0.1:3003/internal/refresh';process.env.EMAIL_PUBLIC_API_SECRET='test';process.env.EMAIL_INGESTION_STARTED_AT='2026-10-07T12:01:00Z';
 t.mock.method(globalThis,'fetch',async(url:any,options:any)=>{assert.equal(url.pathname,'/internal/email-data');assert.equal(options.headers.Authorization,'Bearer test');assert.equal(JSON.parse(options.body).records[0].UserID,undefined);return Response.json({checkedAt:'2026-10-07T12:02:00Z',records:[publicData]});});
 const results=await hydrateEmailLogs({from(){assert.fail('No database read needed');}},[row]);assert.equal(results[0].CatalogItem.Name,'Skin');assert.equal(results[0].Profile.email,row.Profile.email);
});
test('unavailable cache falls back only to exact pending identities and required fields',async()=>{
 const query={select(columns:string){assert.equal(columns.includes('*'),false);return this;},eq(k:string,v:string){assert.equal(k,'Status');assert.equal(v,'PENDING');return this;},or(filters:string){assert.ok(filters.includes(row.UserID));return Promise.resolve({data:[{...row,...publicData}],error:null});}};
 assert.equal((await hydrateEmailLogs({from:()=>query},[row]))[0].CatalogItem.Name,'Skin');
 await assert.rejects(hydrateEmailLogs({from:()=>({...query,or:async()=>({data:[],error:null})})},[row]),/incomplete/);
});

test('a stale successful cache response cannot hydrate current-cycle emails',async t=>{
 const old={...process.env};t.after(()=>{for(const k of ['EMAIL_PUBLIC_API_URL','EMAIL_PUBLIC_API_SECRET','EMAIL_INGESTION_STARTED_AT']){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}});
 process.env.EMAIL_PUBLIC_API_URL='http://127.0.0.1:3003';process.env.EMAIL_PUBLIC_API_SECRET='test';process.env.EMAIL_INGESTION_STARTED_AT='2026-10-07T13:01:00Z';
 t.mock.method(globalThis,'fetch',async()=>Response.json({checkedAt:'2026-10-07T12:02:00Z',records:[publicData]}));
 let reads=0;const q={select(){return this;},eq(){return this;},or(){reads++;return Promise.resolve({data:[{...row,...publicData}],error:null});}};
 await hydrateEmailLogs({from:()=>q},[row]);assert.equal(reads,1);
});
