import fs from 'node:fs';
import path from 'node:path';
import {parseEnv} from 'node:util';
import {spawnSync} from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const recipient = process.argv[process.argv.indexOf('--to') + 1];
if (!process.argv.includes('--to') || !recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Usage: npm run test-email -- --to recipient@example.com');
}
Object.assign(process.env,parseEnv(fs.readFileSync(path.join(root, '../production/email.env'),'utf8')));
const {default:Template}=await import('../emails/Wishlist-Notification.tsx');
const {sendWishlistEmail}=await import('../sendRenderedEmail.tsx');
const items=Template.PreviewProps.items.map(item=>({...item,UserID:'00000000-0000-0000-0000-000000000000',Profile:{id:'00000000-0000-0000-0000-000000000000',email:recipient}}));
const logPath=path.join(root, 'data/logs',`emails_test_${new Date().toISOString().replace(/[:.]/g,'-')}.log`);
fs.mkdirSync(path.dirname(logPath),{recursive:true,mode:0o700});
const result=await sendWishlistEmail(recipient,items);
const summary=result.success
 ? `SES accepted one test email to ${recipient} with ${items.length} sample items. Message ID: ${result.response?.MessageId}`
 : `Test email to ${recipient} failed: ${result.errorMessage}`;
fs.writeFileSync(logPath,summary+'\nCustomer queue unchanged.\n',{mode:0o600});
console.log(summary);
const uploaded=spawnSync(path.join(root, 'node_modules/.bin/tsx'),['uploadLogFile.ts',logPath],{cwd:root,env:process.env,stdio:'inherit',timeout:60000});
if(uploaded.status!==0)console.log('Test log upload failed; local log retained.');
if(!result.success)process.exitCode=1;
