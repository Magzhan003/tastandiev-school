import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
const csvPath = process.argv[2] || './student-accounts.csv';
const text = fs.readFileSync(csvPath,'utf8').replace(/^\uFEFF/,'');
const [header,...lines]=text.trim().split(/\r?\n/);
const cols=header.split(',');
function parse(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return Object.fromEntries(cols.map((k,i)=>[k,out[i]??'']));}
const students=lines.filter(Boolean).map(parse);
const supabase=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
for(const s of students){
  const {data,error}=await supabase.auth.admin.createUser({email:s.email,password:s.password,email_confirm:true,user_metadata:{full_name:s.full_name,class_name:s.class_name,iin_login:s.iin_login}});
  let user=data?.user;
  if(error && !String(error.message).toLowerCase().includes('already been registered')) throw error;
  if(!user){
    const list=await supabase.auth.admin.listUsers({page:1,perPage:1000});
    user=(list.data?.users||[]).find(u=>u.email===s.email);
  }
  if(!user) throw new Error(`Could not find Auth user for ${s.iin_login}`);
  const {error:profileError}=await supabase.from('student_profiles').upsert({auth_user_id:user.id,iin_login:s.iin_login,full_name:s.full_name,class_name:s.class_name,active:true},{onConflict:'iin_login'});
  if(profileError) throw profileError;
  console.log(`OK ${s.iin_login} — ${s.full_name} — ${s.class_name}`);
}
console.log(`Created/updated ${students.length} student accounts.`);
