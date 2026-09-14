const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
if(toggle){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');});}
document.querySelectorAll('.nav a').forEach(link=>link.addEventListener('click',()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}));

const modal=document.querySelector('#news-modal');
const modalTitle=document.querySelector('#modal-title');
const modalText=document.querySelector('#modal-text');
function closeModal(){modal?.classList.remove('show');modal?.setAttribute('aria-hidden','true');}
function openNews(title,text){if(!modal)return; modalTitle.textContent=title;modalText.textContent=text;modal.classList.add('show');modal.setAttribute('aria-hidden','false');}
document.querySelectorAll('.read-more').forEach(btn=>btn.addEventListener('click',()=>openNews(btn.dataset.title,btn.dataset.text)));
document.querySelector('.modal-close')?.addEventListener('click',closeModal);
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

const testLinks={4:'',5:'',6:'',7:'',8:'',9:'',10:'',11:''};
const testMessage=document.querySelector('#test-message'); const testLink=document.querySelector('#test-link');
document.querySelectorAll('.class-btn').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.class-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
 const cls=btn.dataset.class,url=testLinks[cls];
 testMessage.textContent=`${cls}-сынып таңдалды. Тест сілтемесі дайын болғанда осы батырма арқылы ашылады.`;
 if(url){testLink.href=url;testLink.target='_blank';testLink.classList.remove('disabled');testLink.textContent=`${cls}-сынып тестін ашу →`;} else {testLink.href='#tests';testLink.removeAttribute('target');testLink.classList.add('disabled');testLink.textContent='Тест сілтемесі кейін қосылады';}
}));
testLink?.addEventListener('click',e=>{if(testLink.classList.contains('disabled')){e.preventDefault();testMessage.textContent='Қазір тест сілтемелері әлі қосылған жоқ. Google Forms дайын болғаннан кейін осы жерге енгізіледі.';}});

// ===== Shared cloud admin: Supabase =====
(async function(){
 const configured=window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('PASTE_') && window.SUPABASE_ANON_KEY.length>20;
 const brand=document.getElementById('admin-secret'), overlay=document.getElementById('admin-overlay');
 if(!brand||!overlay)return;
 let taps=0,timer=null;
 brand.addEventListener('click',e=>{taps++;clearTimeout(timer);timer=setTimeout(()=>taps=0,1400);if(taps>=5){e.preventDefault();taps=0;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.getElementById('admin-password')?.focus();}});
 const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');};
 document.getElementById('admin-close')?.addEventListener('click',close); overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 if(!configured){
   // Keep the page functional while the cloud project is not configured.
   const msg=document.querySelector('.admin-hint'); if(msg)msg.textContent='Общее облачное хранилище ещё не подключено. После настройки Supabase новости и документы будут видны всем посетителям.';
   return;
 }
 const {createClient}=window.supabase; const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
 const login=document.getElementById('admin-login'), content=document.getElementById('admin-content'), password=document.getElementById('admin-password');
 const showContent=()=>{login.hidden=true;content.hidden=false;renderAdmin();};
 document.getElementById('admin-login-btn').onclick=async()=>{
   const {error}=await sb.auth.signInWithPassword({email:window.ADMIN_EMAIL,password:password.value});
   if(error){alert('Құпиясөз дұрыс емес немесе әкімші аккаунты әлі жасалмаған.');return;} showContent();
 };
 password.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('admin-login-btn').click();});
 document.getElementById('a-logout').onclick=async()=>{await sb.auth.signOut();content.hidden=true;login.hidden=false;password.value='';close();};
 document.getElementById('a-news-add').onclick=async()=>{
   const title=document.getElementById('a-news-title').value.trim(), body=document.getElementById('a-news-text').value.trim(), date=document.getElementById('a-news-date').value||new Date().toISOString().slice(0,10);
   if(!title||!body){alert('Тақырып пен мәтінді толтырыңыз.');return;}
   const {error}=await sb.from('news').insert({title,content:body,published_date:date}); if(error){alert('Жаңалықты сақтау кезінде қате шықты.');return;}
   document.getElementById('a-news-title').value='';document.getElementById('a-news-text').value='';await loadPublic();alert('Жаңалық жарияланды!');
 };
 document.getElementById('a-doc-add').onclick=async()=>{
   const title=document.getElementById('a-doc-title').value.trim(), file=document.getElementById('a-doc-file').files[0];
   if(!title||!file){alert('Құжат атауы мен файлды таңдаңыз.');return;}
   if(file.size>50*1024*1024){alert('Файл 50 МБ-тан аспауы керек.');return;}
   const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`${Date.now()}_${safe}`;
   let r=await sb.storage.from('documents').upload(path,file,{upsert:false}); if(r.error){alert('Файлды жүктеу кезінде қате шықты.');return;}
   const {error}=await sb.from('documents').insert({title,file_name:file.name,storage_path:path,file_url:sb.storage.from('documents').getPublicUrl(path).data.publicUrl});
   if(error){await sb.storage.from('documents').remove([path]);alert('Құжат мәліметін сақтау кезінде қате шықты.');return;}
   document.getElementById('a-doc-title').value='';document.getElementById('a-doc-file').value='';await loadPublic();alert('Құжат жарияланды!');
 };
 async function loadPublic(){
   const n=await sb.from('news').select('*').order('published_date',{ascending:false}).order('created_at',{ascending:false});
   const d=await sb.from('documents').select('*').order('created_at',{ascending:false});
   const list=document.getElementById('news-list'); if(n.data?.length){n.data.forEach(x=>{const el=document.createElement('article');el.className='news-card';el.innerHTML=`<div class="news-image">ЖАҢАЛЫҚ</div><div class="news-body"><span class="date">${escapeHtml(x.published_date)}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.content)}</p><button class="read-more">Оқу →</button></div>`;el.querySelector('button').onclick=()=>openNews(x.title,x.content);list.prepend(el);});}
   const dl=document.getElementById('documents-list'); if(d.data?.length){d.data.forEach(x=>{const url=x.file_url || (x.storage_path ? sb.storage.from('documents').getPublicUrl(x.storage_path).data.publicUrl : '#');const el=document.createElement('a');el.className='doc-card';el.href=url;el.target='_blank';el.rel='noopener';el.innerHTML=`<span>📄</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.file_name)}</p><span class="status">Ашу / жүктеу</span>`;dl.prepend(el);});}
 }
 function renderAdmin(){document.querySelector('.admin-hint')?.classList.add('cloud-ready');}
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
 await loadPublic();
})();
