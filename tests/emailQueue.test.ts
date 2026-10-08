import test from 'node:test';
import assert from 'node:assert/strict';
import {getPendingEmailLogs, groupEmailLogsByUser, updateEmailLogStatuses, queueWishlistSaleEmails} from '../lib/emailQueue.ts';
const record = (UserID: string, ItemID: string, SaleID: string) => ({UserID,ItemID,SaleID,SaleType:'Catalog',CatalogItem:{Name:'Skin',ImageURL:'https://example.com/skin.png'},CatalogSale:{SaleEndAt:'2099-01-01'}}) as any;
test('all new wishlist matches for a user share one email batch', () => {
    const items=[record('alice','a','sale-1'),record('bob','a','sale-1'),record('alice','b','sale-2')];
    assert.deepEqual(groupEmailLogsByUser(items).alice,[items[0],items[2]]);
});
test('delivery updates batch exact included identities and preserve later pending items',async()=>{
    const records=[record('alice','a','1'),record('alice','b','1'),record('alice','a','2'),record('bob','a','1')].map(x=>({...x,Status:'PENDING'}));
    let calls=0;
    const db={async rpc(name:string,args:any){calls++;assert.equal(name,'record_wishlist_email_delivery');let count=0;for(const row of records){if(row.Status==='PENDING'&&args.records.some((r:any)=>r.UserID===row.UserID&&r.ItemID===row.ItemID&&r.SaleID===row.SaleID)){row.Status=args.delivery_status;count++;}}return {data:count,error:null};}};
    await updateEmailLogStatuses(db,[records[0]],'SENT');
    assert.deepEqual(records.map(x=>x.Status),['SENT','PENDING','PENDING','PENDING']);assert.equal(calls,1);
    await assert.rejects(updateEmailLogStatuses(db,[records[0]],'SENT'),/recording/);
});
test('more than 500 delivery records are split into bounded RPC batches',async()=>{
    const sizes:number[]=[];const db={async rpc(_name:string,args:any){sizes.push(args.records.length);return {data:args.records.length,error:null};}};
    await updateEmailLogStatuses(db,Array.from({length:1101},(_,i)=>record('alice',String(i),'1')),'SENT');
    assert.deepEqual(sizes,[500,500,101]);
});
test('pending records paginate completely and project only required private fields',async()=>{
    const records=Array.from({length:1101},(_,i)=>record('alice',String(i),'1'));
    const query={select(columns:string){assert.equal(columns.includes('*'),false);return this;},eq(){return this;},order(){return this;},range(start:number,end:number){return Promise.resolve({data:records.slice(start,end+1),error:null});}};
    assert.equal((await getPendingEmailLogs({from:()=>query})).length,1101);
});
test('queuing only calls the backend RPC and validates its count',async()=>{
    let calls=0;const db={async rpc(name:string){calls++;assert.equal(name,'queue_wishlist_sale_emails');return {data:3,error:null};}};
    assert.equal(await queueWishlistSaleEmails(db),3);assert.equal(calls,1);
    for(const data of [null,-1,'3']) await assert.rejects(queueWishlistSaleEmails({rpc:async()=>({data,error:null})}),/Invalid/);
    await assert.rejects(queueWishlistSaleEmails({rpc:async()=>({error:{message:'offline'}})}),/offline/);
});
test('database failures stop email processing',async()=>{
    const query={select(){return this;},eq(){return this;},order(){return this;},range(){return Promise.resolve({error:{message:'offline'}});}};
    await assert.rejects(getPendingEmailLogs({from:()=>query}),/offline/);
    await assert.rejects(updateEmailLogStatuses({rpc:async()=>({error:{message:'offline'}})},[record('a','b','c')],'SENT'),/recording/);
});
