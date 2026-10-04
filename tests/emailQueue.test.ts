import test from 'node:test';
import assert from 'node:assert/strict';
import {getPendingEmailLogs, groupEmailLogsByUser, updateEmailLogStatuses} from '../lib/emailQueue.ts';
const record = (UserID: string, ItemID: string, SaleID: string) => ({UserID,ItemID,SaleID}) as any;
test('all new wishlist matches for a user share one email batch', () => {
    const items = [record('alice','skin-a','reset-1'),record('bob','skin-a','reset-1'),record('alice','skin-b','reset-2')];
    const batches = groupEmailLogsByUser(items);
    assert.equal(Object.keys(batches).length,2);
    assert.deepEqual(batches.alice,[items[0],items[2]]);
});
test('only exact included user/item/sale rows are marked delivered; later pending items stay pending', async () => {
    const records=[record('alice','a','reset-1'),record('alice','b','reset-1'),record('alice','a','reset-2'),record('bob','a','reset-1')].map(x=>({...x,Status:'PENDING',SentAt:null}));
    const db={from:()=>{let values:any;const filters:Record<string,string>={};return {update(v:any){values=v;return this;},eq(k:string,v:string){filters[k]=v;return this;},then(resolve:any){for(const row of records){if(Object.entries(filters).every(([k,v])=>row[k]===v))Object.assign(row,values);}resolve({error:null});}};}};
    await updateEmailLogStatuses(db,[records[0]],'SENT');
    assert.deepEqual(records.map(x=>x.Status),['SENT','PENDING','PENDING','PENDING']);
    assert.ok(records[0].SentAt);
    await updateEmailLogStatuses(db,[records[1]],'FAILED');
    assert.equal(records[1].SentAt,null);
});
test('reads include every pending item rather than truncating users at the database row limit',async()=>{
    const records=Array.from({length:1101},(_,i)=>record('alice',String(i),'reset-1'));
    const query={select(){return this;},eq(){return this;},order(){return this;},range(start:number,end:number){return Promise.resolve({data:records.slice(start,end+1),error:null});}};
    const logs=await getPendingEmailLogs({from:()=>query});
    assert.equal(groupEmailLogsByUser(logs).alice.length,1101);
});
test('database failures surface as failures instead of successful empty batches',async()=>{
    const query={select(){return this;},update(){return this;},eq(){return this;},order(){return this;},range(){return Promise.resolve({error:{message:'offline'}});},then(resolve:any){resolve({error:{message:'offline'}});}};
    await assert.rejects(getPendingEmailLogs({from:()=>query}),/offline/);
    await assert.rejects(updateEmailLogStatuses({from:()=>query},[record('alice','a','reset-1')],'SENT'),/offline/);
});
