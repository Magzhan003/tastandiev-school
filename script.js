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

 const showContent=()=>{login.hidden=true;content.hidden=false;refreshAdminLists();loadQuestLink();};

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
 /* Normalize a class name so lookalike input (extra spaces, latin letters that
    look like Cyrillic) never creates a hidden duplicate row in the rating —
    this is what made classes like "8А" sometimes disappear from the board. */
 function normalizeClassName(s){
   if(!s)return '';
   let out=String(s).trim().toUpperCase().replace(/\s+/g,'');
   const map={'A':'А','B':'В','E':'Е','K':'К','M':'М','H':'Н','O':'О','P':'Р','C':'С','T':'Т','X':'Х','Y':'У'};
   out=out.replace(/[ABEKMHOPCTXY]/g,ch=>map[ch]);
   return out;
 }

 /* ---------- News: add / edit / delete ---------- */
 let editingNewsId=null, editingNewsPhotoPath=null;
 const newsForm=document.getElementById('a-news-form');
 const newsTitleI=document.getElementById('a-news-title'), newsDateI=document.getElementById('a-news-date'), newsTextI=document.getElementById('a-news-text');
 const newsPhotoI=document.getElementById('a-news-photo'), newsPhotoHint=document.getElementById('a-news-photo-hint'), newsPhotoPreview=document.getElementById('a-news-photo-preview');
 const newsAddBtn=document.getElementById('a-news-add'), newsCancelBtn=document.getElementById('a-news-cancel'), newsFormTitle=document.getElementById('a-news-form-title');

 newsPhotoI?.addEventListener('change',()=>{
   const file=newsPhotoI.files[0];
   if(!file){newsPhotoPreview.hidden=true;return;}
   newsPhotoPreview.src=URL.createObjectURL(file); newsPhotoPreview.hidden=false;
 });

 function startEditNews(item){
   editingNewsId=item.id; editingNewsPhotoPath=item.photo_path||null; newsForm.classList.add('editing');
   newsFormTitle.textContent='✏️ Жаңалықты өңдеу';
   newsAddBtn.textContent='Өзгерісті сақтау';
   newsTitleI.value=item.title||''; newsTextI.value=item.content||''; newsDateI.value=item.published_date||'';
   newsPhotoI.value=''; newsPhotoHint.hidden=false;
   if(item.photo_url){newsPhotoPreview.src=item.photo_url; newsPhotoPreview.hidden=false;} else {newsPhotoPreview.hidden=true;}
   newsForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditNews(){
   editingNewsId=null; editingNewsPhotoPath=null; newsForm.classList.remove('editing');
   newsFormTitle.textContent='📰 Жаңалық қосу'; newsAddBtn.textContent='Жаңалықты жариялау';
   newsTitleI.value='';newsTextI.value='';newsDateI.value=''; newsPhotoI.value=''; newsPhotoHint.hidden=true; newsPhotoPreview.hidden=true;
 }
 newsCancelBtn.onclick=stopEditNews;

 newsAddBtn.onclick=async()=>{
   const title=newsTitleI.value.trim(), body=newsTextI.value.trim(), date=newsDateI.value||new Date().toISOString().slice(0,10);
   const file=newsPhotoI.files[0];
   if(!title||!body){toast('Тақырып пен мәтінді толтырыңыз.','error');return;}
   if(file && file.size>10*1024*1024){toast('Фото 10 МБ-тан аспауы керек.','error');return;}
   setBusy(newsAddBtn,true,editingNewsId?'Өзгерісті сақтау':'Жаңалықты жариялау');
   try{
     const payload={title,content:body,published_date:date};
     if(file){
       const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`news/${Date.now()}_${safe}`;
       const up=await sb.storage.from('documents').upload(path,file,{upsert:false});
       if(up.error)throw new Error('upload');
       payload.photo_path=path;
       payload.photo_url=sb.storage.from('documents').getPublicUrl(path).data.publicUrl;
       if(editingNewsId && editingNewsPhotoPath)await sb.storage.from('documents').remove([editingNewsPhotoPath]);
     }
     let error;
     if(editingNewsId){
       ({error}=await sb.from('news').update(payload).eq('id',editingNewsId));
     } else {
       ({error}=await sb.from('news').insert(payload));
     }
     if(error)throw error;
     const wasEditing=!!editingNewsId; stopEditNews();
     await loadPublic(); await refreshAdminLists();
     toast(wasEditing?'Жаңалық жаңартылды!':'Жаңалық жарияланды!');
   }catch(err){
     toast('Жаңалықты сақтау кезінде қате шықты.','error');
   } finally {
     setBusy(newsAddBtn,false,editingNewsId?'Өзгерісті сақтау':'Жаңалықты жариялау');
   }
 };

 async function deleteNews(id,photoPath){
   if(!confirm('Бұл жаңалықты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('news').delete().eq('id',id);
   if(error){toast('Жаңалықты өшіру кезінде қате шықты.','error');return;}
   if(photoPath)await sb.storage.from('documents').remove([photoPath]);
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
 let editingBookId=null, editingBookPdfPath=null;
 const bookForm=document.getElementById('a-book-form');
 const bookIconI=document.getElementById('a-book-icon'), bookTitleI=document.getElementById('a-book-title'), bookAuthorI=document.getElementById('a-book-author'), bookTextI=document.getElementById('a-book-text'), bookGradeI=document.getElementById('a-book-grade');
 const bookPdfI=document.getElementById('a-book-pdf'), bookPdfHint=document.getElementById('a-book-pdf-hint');
 const bookAddBtn=document.getElementById('a-book-add'), bookCancelBtn=document.getElementById('a-book-cancel'), bookFormTitle=document.getElementById('a-book-form-title');

 function startEditBook(item){
   editingBookId=item.id; editingBookPdfPath=item.pdf_path||null; bookForm.classList.add('editing');
   bookFormTitle.textContent='✏️ Кітапты өңдеу';
   bookAddBtn.textContent='Өзгерісті сақтау';
   bookIconI.value=item.icon||''; bookTitleI.value=item.title||''; bookAuthorI.value=item.author||''; bookTextI.value=item.description||''; bookGradeI.value=item.grade||'';
   bookPdfI.value=''; bookPdfHint.hidden=false;
   bookForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditBook(){
   editingBookId=null; editingBookPdfPath=null; bookForm.classList.remove('editing');
   bookFormTitle.textContent='📖 Кітапханаға кітап қосу'; bookAddBtn.textContent='Кітапты қосу';
   bookIconI.value='';bookTitleI.value='';bookAuthorI.value='';bookTextI.value='';bookGradeI.value=''; bookPdfI.value=''; bookPdfHint.hidden=true;
 }
 bookCancelBtn.onclick=stopEditBook;

 bookAddBtn.onclick=async()=>{
   const icon=bookIconI.value.trim()||'📕', title=bookTitleI.value.trim(), author=bookAuthorI.value.trim(), description=bookTextI.value.trim(), grade=bookGradeI.value?parseInt(bookGradeI.value,10):null;
   const file=bookPdfI.files[0];
   if(!title){toast('Кітап атауын енгізіңіз.','error');return;}
   if(!grade){toast('Сыныпты таңдаңыз (6–10).','error');return;}
   if(!editingBookId && !file){toast('PDF файлын таңдаңыз.','error');return;}
   if(file && file.size>50*1024*1024){toast('PDF 50 МБ-тан аспауы керек.','error');return;}
   setBusy(bookAddBtn,true,editingBookId?'Өзгерісті сақтау':'Кітапты қосу');
   try{
     const payload={icon,title,author,description,grade};
     if(file){
       const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const path=`library/${Date.now()}_${safe}`;
       const up=await sb.storage.from('documents').upload(path,file,{upsert:false});
       if(up.error)throw new Error('upload');
       payload.pdf_path=path;
       payload.pdf_url=sb.storage.from('documents').getPublicUrl(path).data.publicUrl;
       if(editingBookId && editingBookPdfPath)await sb.storage.from('documents').remove([editingBookPdfPath]);
     }
     let error;
     if(editingBookId){
       ({error}=await sb.from('library_books').update(payload).eq('id',editingBookId));
     } else {
       ({error}=await sb.from('library_books').insert(payload));
     }
     if(error)throw error;
     const wasEditing=!!editingBookId; stopEditBook();
     await refreshAdminLists();
     toast(wasEditing?'Кітап жаңартылды!':'Кітап қосылды!');
   }catch(err){
     toast('Кітапты сақтау кезінде қате шықты.','error');
   } finally {
     setBusy(bookAddBtn,false,editingBookId?'Өзгерісті сақтау':'Кітапты қосу');
   }
 };

 async function deleteBook(id,pdfPath){
   if(!confirm('Бұл кітапты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('library_books').delete().eq('id',id);
   if(error){toast('Кітапты өшіру кезінде қате шықты.','error');return;}
   if(pdfPath)await sb.storage.from('documents').remove([pdfPath]);
   if(editingBookId===id)stopEditBook();
   await refreshAdminLists();
   toast('Кітап өшірілді.');
 }


 /* ---------- KITAPVERSE: Class XP (add points / edit total / delete) ---------- */
 const xpClassI=document.getElementById('a-xp-class'), xpAmountI=document.getElementById('a-xp-amount'), xpAddBtn=document.getElementById('a-xp-add');

 xpAddBtn.onclick=async()=>{
   const className=normalizeClassName(xpClassI.value), amount=parseInt(xpAmountI.value,10);
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

 /* ---------- KITAPVERSE: Battle (create/edit/delete + its own quiz questions) ---------- */
 let editingBattleId=null, editingBattleQId=null;
 const battleForm=document.getElementById('a-battle-form');
 const battleTitleI=document.getElementById('a-battle-title'), battleClassesI=document.getElementById('a-battle-classes'), battleDateI=document.getElementById('a-battle-date');
 const battleAddBtn=document.getElementById('a-battle-add'), battleCancelBtn=document.getElementById('a-battle-cancel'), battleFormTitle=document.getElementById('a-battle-form-title');

 function startEditBattle(item){
   editingBattleId=item.id; battleForm.classList.add('editing');
   battleFormTitle.textContent='✏️ Battle-ды өңдеу'; battleAddBtn.textContent='Өзгерісті сақтау';
   battleTitleI.value=item.title||''; battleClassesI.value=item.classes||'';
   battleDateI.value=item.battle_date?new Date(item.battle_date).toISOString().slice(0,16):'';
   battleForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditBattle(){
   editingBattleId=null; battleForm.classList.remove('editing');
   battleFormTitle.textContent='⚔️ Battle құру'; battleAddBtn.textContent='Battle-ды жариялау';
   battleTitleI.value='';battleClassesI.value='';battleDateI.value='';
 }
 battleCancelBtn.onclick=stopEditBattle;

 battleAddBtn.onclick=async()=>{
   const title=battleTitleI.value.trim(), classes=battleClassesI.value.trim(), battle_date=battleDateI.value;
   if(!title||!classes||!battle_date){toast('Атауын, сыныптарды және күнін толтырыңыз.','error');return;}
   setBusy(battleAddBtn,true,editingBattleId?'Өзгерісті сақтау':'Battle-ды жариялау');
   const iso=new Date(battle_date).toISOString();
   let error;
   if(editingBattleId){
     ({error}=await sb.from('battles').update({title,classes,battle_date:iso}).eq('id',editingBattleId));
   } else {
     ({error}=await sb.from('battles').insert({title,classes,battle_date:iso}));
   }
   setBusy(battleAddBtn,false,editingBattleId?'Өзгерісті сақтау':'Battle-ды жариялау');
   if(error){toast('Battle сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingBattleId; stopEditBattle();
   await refreshAdminLists();
   toast(wasEditing?'Battle жаңартылды!':'Battle жарияланды!');
 };

 async function deleteBattle(id){
   if(!confirm('Бұл battle-ды және оның барлық сұрақтары мен нәтижелерін өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('battles').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   if(editingBattleId===id)stopEditBattle();
   await refreshAdminLists();
   toast('Battle өшірілді.');
 }

 /* ---- Battle questions (tied to a battle_id) ---- */
 const battleQForm=document.getElementById('a-battle-q-form');
 const battleQBattleI=document.getElementById('a-battle-q-battle');
 const battleQQI=document.getElementById('a-battle-q-q'), battleQAI=document.getElementById('a-battle-q-a'), battleQBI=document.getElementById('a-battle-q-b'), battleQCI=document.getElementById('a-battle-q-c'), battleQDI=document.getElementById('a-battle-q-d'), battleQCorrectI=document.getElementById('a-battle-q-correct');
 const battleQAddBtn=document.getElementById('a-battle-q-add'), battleQCancelBtn=document.getElementById('a-battle-q-cancel'), battleQFormTitle=document.getElementById('a-battle-q-form-title');

 function startEditBattleQ(item){
   editingBattleQId=item.id; battleQForm.classList.add('editing');
   battleQFormTitle.textContent='✏️ Battle сұрағын өңдеу'; battleQAddBtn.textContent='Өзгерісті сақтау';
   battleQBattleI.value=item.battle_id; battleQQI.value=item.question||''; battleQAI.value=item.option_a||''; battleQBI.value=item.option_b||''; battleQCI.value=item.option_c||''; battleQDI.value=item.option_d||''; battleQCorrectI.value=item.correct_option||'a';
   battleQForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditBattleQ(){
   editingBattleQId=null; battleQForm.classList.remove('editing');
   battleQFormTitle.textContent='🧠 Battle сұрағын қосу'; battleQAddBtn.textContent='Сұрақты қосу';
   battleQQI.value='';battleQAI.value='';battleQBI.value='';battleQCI.value='';battleQDI.value='';battleQCorrectI.value='a';
 }
 battleQCancelBtn.onclick=stopEditBattleQ;

 battleQAddBtn.onclick=async()=>{
   const battle_id=parseInt(battleQBattleI.value,10);
   const question=battleQQI.value.trim(), option_a=battleQAI.value.trim(), option_b=battleQBI.value.trim(), option_c=battleQCI.value.trim(), option_d=battleQDI.value.trim(), correct_option=battleQCorrectI.value;
   if(!battle_id){toast('Алдымен Battle таңдаңыз.','error');return;}
   if(!question||!option_a||!option_b||!option_c||!option_d){toast('Сұрақ пен барлық 4 нұсқаны толтырыңыз.','error');return;}
   setBusy(battleQAddBtn,true,editingBattleQId?'Өзгерісті сақтау':'Сұрақты қосу');
   let error;
   if(editingBattleQId){
     ({error}=await sb.from('battle_questions').update({battle_id,question,option_a,option_b,option_c,option_d,correct_option}).eq('id',editingBattleQId));
   } else {
     ({error}=await sb.from('battle_questions').insert({battle_id,question,option_a,option_b,option_c,option_d,correct_option}));
   }
   setBusy(battleQAddBtn,false,editingBattleQId?'Өзгерісті сақтау':'Сұрақты қосу');
   if(error){toast('Сұрақты сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingBattleQId; stopEditBattleQ();
   await refreshAdminLists();
   toast(wasEditing?'Сұрақ жаңартылды!':'Battle сұрағы қосылды!');
 };

 async function deleteBattleQ(id){
   if(!confirm('Бұл сұрақты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('battle_questions').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   if(editingBattleQId===id)stopEditBattleQ();
   await refreshAdminLists();
   toast('Сұрақ өшірілді.');
 }

 function battleCountdownLabel(iso){
   const diff=new Date(iso).getTime()-Date.now();
   if(diff<=0)return 'Басталды';
   const days=Math.floor(diff/86400000), hours=Math.floor((diff%86400000)/3600000);
   return `${days} күн ${hours} сағ қалды`;
 }

 /* ---------- KITAPVERSE: Quest Google Forms link ---------- */
 const questLinkI=document.getElementById('a-quest-link'), questSaveBtn=document.getElementById('a-quest-save');

 async function loadQuestLink(){
   const {data}=await sb.from('kv_settings').select('*').eq('key','quest_link').maybeSingle();
   if(data && questLinkI)questLinkI.value=data.value||'';
 }

 questSaveBtn.onclick=async()=>{
   const link=questLinkI.value.trim();
   setBusy(questSaveBtn,true,'Сілтемені сақтау');
   const {error}=await sb.from('kv_settings').upsert({key:'quest_link',value:link});
   setBusy(questSaveBtn,false,'Сілтемені сақтау');
   if(error){toast('Сілтемені сақтау кезінде қате шықты.','error');return;}
   toast('Сілтеме сақталды!');
 };

 /* ---------- KITAPVERSE: Quiz questions (Викторина) ---------- */
 let editingQuizId=null;
 const quizForm=document.getElementById('a-quiz-form');
 const quizQI=document.getElementById('a-quiz-q'), quizAI=document.getElementById('a-quiz-a'), quizBI=document.getElementById('a-quiz-b'), quizCI=document.getElementById('a-quiz-c'), quizDI=document.getElementById('a-quiz-d'), quizCorrectI=document.getElementById('a-quiz-correct');
 const quizAddBtn=document.getElementById('a-quiz-add'), quizCancelBtn=document.getElementById('a-quiz-cancel'), quizFormTitle=document.getElementById('a-quiz-form-title');

 function startEditQuiz(item){
   editingQuizId=item.id; quizForm.classList.add('editing');
   quizFormTitle.textContent='✏️ Сұрақты өңдеу';
   quizAddBtn.textContent='Өзгерісті сақтау';
   quizQI.value=item.question||''; quizAI.value=item.option_a||''; quizBI.value=item.option_b||''; quizCI.value=item.option_c||''; quizDI.value=item.option_d||''; quizCorrectI.value=item.correct_option||'a';
   quizForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditQuiz(){
   editingQuizId=null; quizForm.classList.remove('editing');
   quizFormTitle.textContent='🧠 Викторина сұрағын қосу'; quizAddBtn.textContent='Сұрақты қосу';
   quizQI.value='';quizAI.value='';quizBI.value='';quizCI.value='';quizDI.value='';quizCorrectI.value='a';
 }
 quizCancelBtn.onclick=stopEditQuiz;

 quizAddBtn.onclick=async()=>{
   const question=quizQI.value.trim(), option_a=quizAI.value.trim(), option_b=quizBI.value.trim(), option_c=quizCI.value.trim(), option_d=quizDI.value.trim(), correct_option=quizCorrectI.value;
   if(!question||!option_a||!option_b||!option_c||!option_d){toast('Сұрақ пен барлық 4 нұсқаны толтырыңыз.','error');return;}
   setBusy(quizAddBtn,true,editingQuizId?'Өзгерісті сақтау':'Сұрақты қосу');
   let error;
   if(editingQuizId){
     ({error}=await sb.from('quiz_questions').update({question,option_a,option_b,option_c,option_d,correct_option}).eq('id',editingQuizId));
   } else {
     ({error}=await sb.from('quiz_questions').insert({question,option_a,option_b,option_c,option_d,correct_option}));
   }
   setBusy(quizAddBtn,false,editingQuizId?'Өзгерісті сақтау':'Сұрақты қосу');
   if(error){toast('Сұрақты сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingQuizId; stopEditQuiz();
   await refreshAdminLists();
   toast(wasEditing?'Сұрақ жаңартылды!':'Сұрақ қосылды!');
 };

 async function deleteQuiz(id){
   if(!confirm('Бұл сұрақты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('quiz_questions').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   if(editingQuizId===id)stopEditQuiz();
   await refreshAdminLists();
   toast('Сұрақ өшірілді.');
 }

 /* ---------- KITAPVERSE: Rewards (Марапаттау) ---------- */
 let editingRewardId=null;
 const rewardForm=document.getElementById('a-reward-form');
 const rewardPosI=document.getElementById('a-reward-position'), rewardIconI=document.getElementById('a-reward-icon'), rewardTitleI=document.getElementById('a-reward-title');
 const rewardAddBtn=document.getElementById('a-reward-add'), rewardCancelBtn=document.getElementById('a-reward-cancel'), rewardFormTitle=document.getElementById('a-reward-form-title');

 function startEditReward(item){
   editingRewardId=item.id; rewardForm.classList.add('editing');
   rewardFormTitle.textContent='✏️ Марапатты өңдеу';
   rewardAddBtn.textContent='Өзгерісті сақтау';
   rewardPosI.value=item.position||''; rewardIconI.value=item.icon||''; rewardTitleI.value=item.title||'';
   rewardForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditReward(){
   editingRewardId=null; rewardForm.classList.remove('editing');
   rewardFormTitle.textContent='🏅 Марапат қосу'; rewardAddBtn.textContent='Марапатты қосу';
   rewardPosI.value='';rewardIconI.value='';rewardTitleI.value='';
 }
 rewardCancelBtn.onclick=stopEditReward;

 rewardAddBtn.onclick=async()=>{
   const position=rewardPosI.value.trim(), icon=rewardIconI.value.trim()||'🏆', title=rewardTitleI.value.trim();
   if(!position||!title){toast('Орын мен сыйлық сипаттамасын толтырыңыз.','error');return;}
   setBusy(rewardAddBtn,true,editingRewardId?'Өзгерісті сақтау':'Марапатты қосу');
   let error;
   if(editingRewardId){
     ({error}=await sb.from('rewards').update({position,icon,title}).eq('id',editingRewardId));
   } else {
     ({error}=await sb.from('rewards').insert({position,icon,title}));
   }
   setBusy(rewardAddBtn,false,editingRewardId?'Өзгерісті сақтау':'Марапатты қосу');
   if(error){toast('Сақтау кезінде қате шықты.','error');return;}
   const wasEditing=!!editingRewardId; stopEditReward();
   await refreshAdminLists();
   toast(wasEditing?'Марапат жаңартылды!':'Марапат қосылды!');
 };

 async function deleteReward(id){
   if(!confirm('Бұл марапатты өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('rewards').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   if(editingRewardId===id)stopEditReward();
   await refreshAdminLists();
   toast('Марапат өшірілді.');
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
       el.innerHTML=`<div class="news-image">${x.photo_url?`<img src="${x.photo_url}" alt="">`:'ЖАҢАЛЫҚ'}</div><div class="news-body"><span class="date">${escapeHtml(x.published_date||'')}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.content)}</p><button class="read-more" data-title="${escapeHtml(x.title)}" data-text="${escapeHtml(x.content)}">Оқу →</button></div>`;
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
     row.querySelector('.icon-btn.danger').onclick=()=>deleteNews(item.id,item.photo_path);
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
     const b=await sb.from('library_books').select('*').order('grade',{ascending:true}).order('created_at',{ascending:false});
     bookBox.innerHTML='';
     if(!b.data || !b.data.length){ bookBox.innerHTML='<p class="admin-empty">Әзірге кітап жоқ.</p>'; }
     else b.data.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.icon||'📕')} ${escapeHtml(item.title)}</strong><small>${item.grade?item.grade+' сынып · ':''}${escapeHtml(item.author||'')}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditBook(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteBook(item.id,item.pdf_path);
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

   const battleBox=document.getElementById('a-battle-admin-list');
   let battlesData=[];
   if(battleBox){
     const bt=await sb.from('battles').select('*').order('battle_date',{ascending:true});
     battlesData=bt.data||[];
     battleBox.innerHTML='';
     if(!battlesData.length){ battleBox.innerHTML='<p class="admin-empty">Әзірге battle жарияланған жоқ.</p>'; }
     else battlesData.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       const when=new Date(item.battle_date).toLocaleString('kk-KZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
       row.innerHTML=`<div class="ali-info"><strong>⚔️ ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.classes)} · ${when} · ${battleCountdownLabel(item.battle_date)}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditBattle(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteBattle(item.id);
       battleBox.appendChild(row);
     });
   }

   const battleQSelect=document.getElementById('a-battle-q-battle');
   if(battleQSelect){
     const prev=battleQSelect.value;
     battleQSelect.innerHTML='<option value="">Battle таңдаңыз</option>'+battlesData.map(b=>`<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');
     if(prev)battleQSelect.value=prev;
   }

   const battleQBox=document.getElementById('a-battle-q-admin-list');
   if(battleQBox){
     const bq=await sb.from('battle_questions').select('*').order('created_at',{ascending:false});
     battleQBox.innerHTML='';
     if(!bq.data || !bq.data.length){ battleQBox.innerHTML='<p class="admin-empty">Әзірге battle сұрағы жоқ.</p>'; }
     else bq.data.forEach(item=>{
       const battleTitle=(battlesData.find(b=>b.id===item.battle_id)||{}).title||'—';
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.question)}</strong><small>${escapeHtml(battleTitle)} · Дұрыс жауап: ${item.correct_option.toUpperCase()}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditBattleQ(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteBattleQ(item.id);
       battleQBox.appendChild(row);
     });
   }

   const quizBox=document.getElementById('a-quiz-admin-list');
   if(quizBox){
     const q=await sb.from('quiz_questions').select('*').order('created_at',{ascending:false});
     quizBox.innerHTML='';
     if(!q.data || !q.data.length){ quizBox.innerHTML='<p class="admin-empty">Әзірге сұрақ жоқ.</p>'; }
     else q.data.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.question)}</strong><small>Дұрыс жауап: ${item.correct_option.toUpperCase()}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditQuiz(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteQuiz(item.id);
       quizBox.appendChild(row);
     });
   }

   const rewardBox=document.getElementById('a-reward-admin-list');
   if(rewardBox){
     const r=await sb.from('rewards').select('*').order('created_at',{ascending:true});
     rewardBox.innerHTML='';
     if(!r.data || !r.data.length){ rewardBox.innerHTML='<p class="admin-empty">Әзірге марапат жоқ.</p>'; }
     else r.data.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.icon||'🏆')} ${escapeHtml(item.position)}</strong><small>${escapeHtml(item.title)}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditReward(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteReward(item.id);
       rewardBox.appendChild(row);
     });
   }
 }

 await loadPublic();
})();
