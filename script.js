/* ========================= Navigation ========================= */
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
if(toggle){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');});}
document.querySelectorAll('.nav a').forEach(link=>link.addEventListener('click',()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}));

/* ========================= News modal ========================= */
const modal=document.querySelector('#news-modal');
const modalTitle=document.querySelector('#modal-title');
const modalText=document.querySelector('#modal-text');
function closeModal(){modal?.classList.remove('show');modal?.setAttribute('aria-hidden','true');}
function openNews(title,text){if(!modal)return; modalTitle.textContent=title;modalText.textContent=text;modal.classList.add('show');modal.setAttribute('aria-hidden','false');}
function bindReadMore(btn){btn.addEventListener('click',()=>openNews(btn.dataset.title,btn.dataset.text));}
document.querySelectorAll('.read-more').forEach(bindReadMore);
document.querySelector('.modal-close')?.addEventListener('click',closeModal);
document.getElementById('modal-back')?.addEventListener('click',closeModal);
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();}});

/* ========================= Class / test picker ========================= */
const testLinks={4:'',5:'',6:'',7:'',8:'',9:'',10:'',11:''};
const testMessage=document.querySelector('#test-message'); const testLink=document.querySelector('#test-link');
document.querySelectorAll('.class-btn').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.class-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
 const cls=btn.dataset.class,url=testLinks[cls];
 testMessage.textContent=`${cls}-сынып таңдалды. Тест сілтемесі дайын болғанда осы батырма арқылы ашылады.`;
 if(url){testLink.href=url;testLink.target='_blank';testLink.classList.remove('disabled');testLink.textContent=`${cls}-сынып тестін ашу →`;} else {testLink.href='#tests';testLink.removeAttribute('target');testLink.classList.add('disabled');testLink.textContent='Тест сілтемесі кейін қосылады';}
}));
testLink?.addEventListener('click',e=>{if(testLink.classList.contains('disabled')){e.preventDefault();testMessage.textContent='Қазір тест сілтемелері әлі қосылған жоқ. Google Forms дайын болғаннан кейін осы жерге енгізіледі.';}});

/* ========================= Scroll-reveal animation ========================= */
(function(){
 const items=document.querySelectorAll('.reveal');
 if(!items.length)return;
 if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('visible'));return;}
 const io=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}});},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
 items.forEach(el=>io.observe(el));
})();

/* ========================= Toasts ========================= */
function toast(message,type='success'){
 const box=document.getElementById('toast-container'); if(!box){alert(message);return;}
 const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; box.appendChild(el);
 setTimeout(()=>{el.classList.add('hide'); setTimeout(()=>el.remove(),250);},3200);
}

/* ========================= Shared cloud admin: Supabase ========================= */
(async function(){
 const configured=window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('PASTE_') && window.SUPABASE_ANON_KEY.length>20;
 const brand=document.getElementById('admin-secret'), overlay=document.getElementById('admin-overlay');
 if(!brand||!overlay)return;

 // Logo/"11" must be tapped 5 times quickly to reveal the admin panel.
 let taps=0,timer=null;
 brand.addEventListener('click',e=>{
   taps++;clearTimeout(timer);timer=setTimeout(()=>taps=0,1400);
   if(taps>=5){e.preventDefault();taps=0;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.getElementById('admin-password')?.focus();}
 });
 const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');};
 document.getElementById('admin-close')?.addEventListener('click',close);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))close();});

 if(!configured){
   const msg=document.querySelector('.admin-hint'); if(msg)msg.textContent='Общее облачное хранилище ещё не подключено. После настройки Supabase новости и документы будут видны всем посетителям.';
   return;
 }

 const {createClient}=window.supabase; const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
 const login=document.getElementById('admin-login'), content=document.getElementById('admin-content'), password=document.getElementById('admin-password');
 const loginBtn=document.getElementById('admin-login-btn');

 const showContent=()=>{login.hidden=true;content.hidden=false;refreshAdminLists();};

 loginBtn.onclick=async()=>{
   setBusy(loginBtn,true,'Кіру');
   const {error}=await sb.auth.signInWithPassword({email:window.ADMIN_EMAIL,password:password.value});
   setBusy(loginBtn,false,'Кіру');
   if(error){toast('Құпиясөз дұрыс емес немесе әкімші аккаунты әлі жасалмаған.','error');return;}
   showContent();
 };
 password.addEventListener('keydown',e=>{if(e.key==='Enter')loginBtn.click();});
 document.getElementById('a-logout').onclick=async()=>{await sb.auth.signOut();content.hidden=true;login.hidden=false;password.value='';close();};

 function setBusy(btn,busy,idleLabel){ if(!btn)return; btn.disabled=busy; btn.textContent=busy?'Жүктелуде...':idleLabel; }
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

 /* ---------- News: add / edit / delete ---------- */
 let editingNewsId=null;
 const newsForm=document.getElementById('a-news-form');
 const newsTitleI=document.getElementById('a-news-title'), newsDateI=document.getElementById('a-news-date'), newsTextI=document.getElementById('a-news-text');
 const newsAddBtn=document.getElementById('a-news-add'), newsCancelBtn=document.getElementById('a-news-cancel'), newsFormTitle=document.getElementById('a-news-form-title');

 function startEditNews(item){
   editingNewsId=item.id; newsForm.classList.add('editing');
   newsFormTitle.textContent='✏️ Жаңалықты өңдеу';
   newsAddBtn.textContent='Өзгерісті сақтау';
   newsTitleI.value=item.title||''; newsTextI.value=item.content||''; newsDateI.value=item.published_date||'';
   newsForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditNews(){
   editingNewsId=null; newsForm.classList.remove('editing');
   newsFormTitle.textContent='📰 Жаңалық қосу'; newsAddBtn.textContent='Жаңалықты жариялау';
   newsTitleI.value='';newsTextI.value='';newsDateI.value='';
 }
 newsCancelBtn.onclick=stopEditNews;

 newsAddBtn.onclick=async()=>{
   const title=newsTitleI.value.trim(), body=newsTextI.value.trim(), date=newsDateI.value||new Date().toISOString().slice(0,10);
   if(!title||!body){toast('Тақырып пен мәтінді толтырыңыз.','error');return;}
   setBusy(newsAddBtn,true,editingNewsId?'Өзгерісті сақтау':'Жаңалықты жариялау');
   let error;
   if(editingNewsId){
     ({error}=await sb.from('news').update({title,content:body,published_date:date}).eq('id',editingNewsId));
   } else {
     ({error}=await sb.from('news').insert({title,content:body,published_date:date}));
   }
   setBusy(newsAddBtn,false,editingNewsId?'Өзгерісті сақтау':'Жаңалықты жариялау');
   if(error){toast('Жаңалықты сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingNewsId; stopEditNews();
   await loadPublic(); await refreshAdminLists();
   toast(wasEditing?'Жаңалық жаңартылды!':'Жаңалық жарияланды!');
 };

 async function deleteNews(id){
   if(!confirm('Бұл жаңалықты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('news').delete().eq('id',id);
   if(error){toast('Жаңалықты өшіру кезінде қате шықты.','error');return;}
   if(editingNewsId===id)stopEditNews();
   await loadPublic(); await refreshAdminLists();
   toast('Жаңалық өшірілді.');
 }

 /* ---------- Achievements: add / edit / delete ---------- */
 let editingAchId=null;
 const achForm=document.getElementById('a-ach-form');
 const achIconI=document.getElementById('a-ach-icon'), achTitleI=document.getElementById('a-ach-title'), achTextI=document.getElementById('a-ach-text');
 const achAddBtn=document.getElementById('a-ach-add'), achCancelBtn=document.getElementById('a-ach-cancel'), achFormTitle=document.getElementById('a-ach-form-title');

 function startEditAch(item){
   editingAchId=item.id; achForm.classList.add('editing');
   achFormTitle.textContent='✏️ Жетістікті өңдеу';
   achAddBtn.textContent='Өзгерісті сақтау';
   achIconI.value=item.icon||''; achTitleI.value=item.title||''; achTextI.value=item.description||'';
   achForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditAch(){
   editingAchId=null; achForm.classList.remove('editing');
   achFormTitle.textContent='🏆 Жетістік қосу'; achAddBtn.textContent='Жетістікті жариялау';
   achIconI.value='';achTitleI.value='';achTextI.value='';
 }
 achCancelBtn.onclick=stopEditAch;

 achAddBtn.onclick=async()=>{
   const icon=achIconI.value.trim()||'🏆', title=achTitleI.value.trim(), description=achTextI.value.trim();
   if(!title||!description){toast('Тақырып пен сипаттаманы толтырыңыз.','error');return;}
   setBusy(achAddBtn,true,editingAchId?'Өзгерісті сақтау':'Жетістікті жариялау');
   let error;
   if(editingAchId){
     ({error}=await sb.from('achievements').update({icon,title,description}).eq('id',editingAchId));
   } else {
     ({error}=await sb.from('achievements').insert({icon,title,description}));
   }
   setBusy(achAddBtn,false,editingAchId?'Өзгерісті сақтау':'Жетістікті жариялау');
   if(error){toast('Жетістікті сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingAchId; stopEditAch();
   await loadPublic(); await refreshAdminLists();
   toast(wasEditing?'Жетістік жаңартылды!':'Жетістік жарияланды!');
 };

 async function deleteAch(id){
   if(!confirm('Бұл жетістікті өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('achievements').delete().eq('id',id);
   if(error){toast('Жетістікті өшіру кезінде қате шықты.','error');return;}
   if(editingAchId===id)stopEditAch();
   await loadPublic(); await refreshAdminLists();
   toast('Жетістік өшірілді.');
 }

 /* ---------- KITAPVERSE: Library books (add / edit / delete) ---------- */
 let editingBookId=null;
 const bookForm=document.getElementById('a-book-form');
 const bookIconI=document.getElementById('a-book-icon'), bookTitleI=document.getElementById('a-book-title'), bookAuthorI=document.getElementById('a-book-author'), bookTextI=document.getElementById('a-book-text');
 const bookAddBtn=document.getElementById('a-book-add'), bookCancelBtn=document.getElementById('a-book-cancel'), bookFormTitle=document.getElementById('a-book-form-title');

 function startEditBook(item){
   editingBookId=item.id; bookForm.classList.add('editing');
   bookFormTitle.textContent='✏️ Кітапты өңдеу';
   bookAddBtn.textContent='Өзгерісті сақтау';
   bookIconI.value=item.icon||''; bookTitleI.value=item.title||''; bookAuthorI.value=item.author||''; bookTextI.value=item.description||'';
   bookForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditBook(){
   editingBookId=null; bookForm.classList.remove('editing');
   bookFormTitle.textContent='📖 Кітапханаға кітап қосу'; bookAddBtn.textContent='Кітапты қосу';
   bookIconI.value='';bookTitleI.value='';bookAuthorI.value='';bookTextI.value='';
 }
 bookCancelBtn.onclick=stopEditBook;

 bookAddBtn.onclick=async()=>{
   const icon=bookIconI.value.trim()||'📕', title=bookTitleI.value.trim(), author=bookAuthorI.value.trim(), description=bookTextI.value.trim();
   if(!title){toast('Кітап атауын енгізіңіз.','error');return;}
   setBusy(bookAddBtn,true,editingBookId?'Өзгерісті сақтау':'Кітапты қосу');
   let error;
   if(editingBookId){
     ({error}=await sb.from('library_books').update({icon,title,author,description}).eq('id',editingBookId));
   } else {
     ({error}=await sb.from('library_books').insert({icon,title,author,description}));
   }
   setBusy(bookAddBtn,false,editingBookId?'Өзгерісті сақтау':'Кітапты қосу');
   if(error){toast('Кітапты сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingBookId; stopEditBook();
   await refreshAdminLists();
   toast(wasEditing?'Кітап жаңартылды!':'Кітап қосылды!');
 };

 async function deleteBook(id){
   if(!confirm('Бұл кітапты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('library_books').delete().eq('id',id);
   if(error){toast('Кітапты өшіру кезінде қате шықты.','error');return;}
   if(editingBookId===id)stopEditBook();
   await refreshAdminLists();
   toast('Кітап өшірілді.');
 }

 /* ---------- KITAPVERSE: Class XP (add points / edit total / delete) ---------- */
 const xpClassI=document.getElementById('a-xp-class'), xpAmountI=document.getElementById('a-xp-amount'), xpAddBtn=document.getElementById('a-xp-add');

 xpAddBtn.onclick=async()=>{
   const className=xpClassI.value.trim(), amount=parseInt(xpAmountI.value,10);
   if(!className){toast('Сынып атын енгізіңіз (мысалы 7А).','error');return;}
   if(!Number.isFinite(amount)||amount===0){toast('XP мөлшерін дұрыс енгізіңіз.','error');return;}
   setBusy(xpAddBtn,true,'+ XP қосу');
   const existing=await sb.from('class_xp').select('*').eq('class_name',className).maybeSingle();
   let error;
   if(existing.data){
     ({error}=await sb.from('class_xp').update({xp:existing.data.xp+amount,updated_at:new Date().toISOString()}).eq('id',existing.data.id));
   } else {
     ({error}=await sb.from('class_xp').insert({class_name:className,xp:amount}));
   }
   setBusy(xpAddBtn,false,'+ XP қосу');
   if(error){toast('XP сақтау кезінде қате шықты.','error');return;}
   xpClassI.value='';
   await refreshAdminLists();
   toast(`${className} сыныбына ${amount>0?'+':''}${amount} XP қосылды!`);
 };

 async function editXpTotal(item){
   const val=prompt(`${item.class_name} сыныбы үшін жаңа жалпы XP мөлшерін енгізіңіз:`,item.xp);
   if(val===null)return;
   const num=parseInt(val,10);
   if(!Number.isFinite(num)){toast('Дұрыс сан енгізіңіз.','error');return;}
   const {error}=await sb.from('class_xp').update({xp:num,updated_at:new Date().toISOString()}).eq('id',item.id);
   if(error){toast('XP сақтау кезінде қате шықты.','error');return;}
   await refreshAdminLists();
   toast('XP жаңартылды!');
 }

 async function deleteXp(id){
   if(!confirm('Бұл сыныпты рейтингтен өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('class_xp').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   await refreshAdminLists();
   toast('Сынып рейтингтен өшірілді.');
 }

 /* ---------- Documents: add / edit / delete ---------- */
 let editingDoc=null; // {id, storage_path}
 const docForm=document.getElementById('a-doc-form');
 const docTitleI=document.getElementById('a-doc-title'), docFileI=document.getElementById('a-doc-file'), docFileHint=document.getElementById('a-doc-file-hint');
 const docAddBtn=document.getElementById('a-doc-add'), docCancelBtn=document.getElementById('a-doc-cancel'), docFormTitle=document.getElementById('a-doc-form-title');

 function startEditDoc(item){
   editingDoc={id:item.id,storage_path:item.storage_path}; docForm.classList.add('editing');
   docFormTitle.textContent='✏️ Құжатты өңдеу';
   docAddBtn.textContent='Өзгерісті сақтау';
   docTitleI.value=item.title||''; docFileI.value=''; docFileHint.hidden=false;
   docForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditDoc(){
   editingDoc=null; docForm.classList.remove('editing');
   docFormTitle.textContent='📄 Құжат қосу'; docAddBtn.textContent='Құжатты қосу';
   docTitleI.value='';docFileI.value='';docFileHint.hidden=true;
 }
 docCancelBtn.onclick=stopEditDoc;

 docAddBtn.onclick=async()=>{
   const title=docTitleI.value.trim(), file=docFileI.files[0];
   if(!title){toast('Құжат атауын енгізіңіз.','error');return;}
   if(!editingDoc && !file){toast('Файлды таңдаңыз.','error');return;}
   if(file && file.size>50*1024*1024){toast('Файл 50 МБ-тан аспауы керек.','error');return;}

   setBusy(docAddBtn,true,editingDoc?'Өзгерісті сақтау':'Құжатты қосу');
   try{
     if(editingDoc){
       const updates={title};
       if(file){
         const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`${Date.now()}_${safe}`;
         const up=await sb.storage.from('documents').upload(path,file,{upsert:false});
         if(up.error)throw new Error('upload');
         updates.file_name=file.name; updates.storage_path=path;
         updates.file_url=sb.storage.from('documents').getPublicUrl(path).data.publicUrl;
         if(editingDoc.storage_path)await sb.storage.from('documents').remove([editingDoc.storage_path]);
       }
       const {error}=await sb.from('documents').update(updates).eq('id',editingDoc.id);
       if(error)throw new Error('update');
       stopEditDoc();
       await loadPublic(); await refreshAdminLists();
       toast('Құжат жаңартылды!');
     } else {
       const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`${Date.now()}_${safe}`;
       const up=await sb.storage.from('documents').upload(path,file,{upsert:false});
       if(up.error)throw new Error('upload');
       const {error}=await sb.from('documents').insert({title,file_name:file.name,storage_path:path,file_url:sb.storage.from('documents').getPublicUrl(path).data.publicUrl});
       if(error){await sb.storage.from('documents').remove([path]);throw new Error('insert');}
       stopEditDoc();
       await loadPublic(); await refreshAdminLists();
       toast('Құжат жарияланды!');
     }
   }catch(err){
     toast('Құжатты сақтау кезінде қате шықты.','error');
   } finally {
     setBusy(docAddBtn,false,editingDoc?'Өзгерісті сақтау':'Құжатты қосу');
   }
 };

 async function deleteDoc(id,storagePath){
   if(!confirm('Бұл құжатты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('documents').delete().eq('id',id);
   if(error){toast('Құжатты өшіру кезінде қате шықты.','error');return;}
   if(storagePath)await sb.storage.from('documents').remove([storagePath]);
   if(editingDoc?.id===id)stopEditDoc();
   await loadPublic(); await refreshAdminLists();
   toast('Құжат өшірілді.');
 }

 /* ---------- Public (visitor-facing) lists ---------- */
 function toggleEmpty(container,emptyId,hasItems){
   const empty=document.getElementById(emptyId);
   if(empty)empty.style.display=hasItems?'none':'';
 }

 async function loadPublic(){
   const n=await sb.from('news').select('*').order('published_date',{ascending:false}).order('created_at',{ascending:false});
   const a=await sb.from('achievements').select('*').order('created_at',{ascending:false});
   const d=await sb.from('documents').select('*').order('created_at',{ascending:false});

   const list=document.getElementById('news-list');
   if(n.data){
     list.querySelectorAll('[data-cloud-item]').forEach(el=>el.remove());
     n.data.forEach(x=>{
       const el=document.createElement('article');
       el.className='news-card card-in'; el.setAttribute('data-cloud-item','');
       el.innerHTML=`<div class="news-image">ЖАҢАЛЫҚ</div><div class="news-body"><span class="date">${escapeHtml(x.published_date||'')}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.content)}</p><button class="read-more" data-title="${escapeHtml(x.title)}" data-text="${escapeHtml(x.content)}">Оқу →</button></div>`;
       bindReadMore(el.querySelector('.read-more'));
       list.appendChild(el);
     });
     toggleEmpty(list,'news-empty',n.data.length>0);
   }

   const al=document.getElementById('achievements-list');
   if(a.data){
     al.querySelectorAll('[data-cloud-item]').forEach(el=>el.remove());
     a.data.forEach(x=>{
       const el=document.createElement('div');
       el.className='card-in'; el.setAttribute('data-cloud-item','');
       el.innerHTML=`<b>${escapeHtml(x.icon||'🏆')}</b><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.description)}</p>`;
       al.appendChild(el);
     });
     toggleEmpty(al,'achievements-empty',a.data.length>0);
   }

   const dl=document.getElementById('documents-list');
   if(d.data){
     dl.querySelectorAll('[data-cloud-item]').forEach(el=>el.remove());
     d.data.forEach(x=>{
       const url=x.file_url || (x.storage_path ? sb.storage.from('documents').getPublicUrl(x.storage_path).data.publicUrl : '#');
       const el=document.createElement('a');
       el.className='doc-card card-in'; el.setAttribute('data-cloud-item',''); el.href=url; el.target='_blank'; el.rel='noopener';
       el.innerHTML=`<span>📄</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.file_name||'')}</p><span class="status">Ашу / жүктеу</span>`;
       dl.appendChild(el);
     });
     toggleEmpty(dl,'documents-empty-msg',d.data.length>0);
   }
 }

 /* ---------- Admin-facing lists (with edit / delete buttons) ---------- */
 async function refreshAdminLists(){
   const newsBox=document.getElementById('a-news-admin-list');
   const achBox=document.getElementById('a-ach-admin-list');
   const docBox=document.getElementById('a-doc-admin-list');
   if(!newsBox||!achBox||!docBox)return;

   const n=await sb.from('news').select('*').order('published_date',{ascending:false}).order('created_at',{ascending:false});
   newsBox.innerHTML='';
   if(!n.data || !n.data.length){ newsBox.innerHTML='<p class="admin-empty">Әзірге жаңалық жоқ.</p>'; }
   else n.data.forEach(item=>{
     const row=document.createElement('div'); row.className='admin-list-item';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.published_date||'')}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
     row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditNews(item);
     row.querySelector('.icon-btn.danger').onclick=()=>deleteNews(item.id);
     newsBox.appendChild(row);
   });

   const a=await sb.from('achievements').select('*').order('created_at',{ascending:false});
   achBox.innerHTML='';
   if(!a.data || !a.data.length){ achBox.innerHTML='<p class="admin-empty">Әзірге жетістік жоқ.</p>'; }
   else a.data.forEach(item=>{
     const row=document.createElement('div'); row.className='admin-list-item';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.icon||'🏆')} ${escapeHtml(item.title)}</strong><small>${escapeHtml((item.description||'').slice(0,60))}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
     row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditAch(item);
     row.querySelector('.icon-btn.danger').onclick=()=>deleteAch(item.id);
     achBox.appendChild(row);
   });

   const d=await sb.from('documents').select('*').order('created_at',{ascending:false});
   docBox.innerHTML='';
   if(!d.data || !d.data.length){ docBox.innerHTML='<p class="admin-empty">Әзірге құжат жоқ.</p>'; }
   else d.data.forEach(item=>{
     const row=document.createElement('div'); row.className='admin-list-item';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.file_name||'')}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
     row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditDoc(item);
     row.querySelector('.icon-btn.danger').onclick=()=>deleteDoc(item.id,item.storage_path);
     docBox.appendChild(row);
   });

   const bookBox=document.getElementById('a-book-admin-list');
   if(bookBox){
     const b=await sb.from('library_books').select('*').order('created_at',{ascending:false});
     bookBox.innerHTML='';
     if(!b.data || !b.data.length){ bookBox.innerHTML='<p class="admin-empty">Әзірге кітап жоқ.</p>'; }
     else b.data.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.icon||'📕')} ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.author||'')}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditBook(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteBook(item.id);
       bookBox.appendChild(row);
     });
   }

   const xpBox=document.getElementById('a-xp-admin-list');
   if(xpBox){
     const x=await sb.from('class_xp').select('*').order('xp',{ascending:false});
     xpBox.innerHTML='';
     if(!x.data || !x.data.length){ xpBox.innerHTML='<p class="admin-empty">Әзірге рейтингте сынып жоқ.</p>'; }
     else x.data.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.class_name)}</strong><small>${item.xp} XP</small></div><div class="ali-actions"><button class="icon-btn" title="Мәнін өзгерту" aria-label="Мәнін өзгерту">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>editXpTotal(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteXp(item.id);
       xpBox.appendChild(row);
     });
   }
 }

 await loadPublic();
})();
