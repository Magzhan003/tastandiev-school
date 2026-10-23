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

 // Native school tests: same interaction model as KITAPVERSE quests.
 const schoolTestsList=document.getElementById('school-tests-list'), schoolTestWorkspace=document.getElementById('school-test-workspace');
 const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 async function loadSchoolTests(){
   if(!schoolTestsList)return;
   const {data,error}=await sb.from('school_tests').select('id,title,description,created_at').eq('published',true).order('created_at',{ascending:false});
   if(error||!data?.length){schoolTestsList.innerHTML='<div class="test-info"><span class="test-icon">📝</span><h3>Тесттер жақында қосылады</h3><p>Мұғалімдер мен әкімші жаңа тесттерді осы сайттың админ-панелінен қоса алады.</p></div>';return;}
   schoolTestsList.innerHTML=''; data.forEach(t=>{const card=document.createElement('div');card.className='test-info';card.innerHTML=`<span class="test-icon">📝</span><h3>${esc(t.title)}</h3><p>${esc(t.description||'Онлайн мектеп тесті')}</p><button class="btn btn-primary">Тестті бастау →</button>`;card.querySelector('button').onclick=()=>renderSchoolTest(t);schoolTestsList.appendChild(card);});
 }
 async function renderSchoolTest(test){
   if(!schoolTestWorkspace)return;
   const {data:questions,error}=await sb.from('school_test_questions_public').select('*').eq('test_id',test.id).order('sequence_no',{ascending:true});
   if(error||!questions?.length){schoolTestWorkspace.innerHTML='<p class="test-message">Бұл тесттің сұрақтары әлі дайын емес.</p>';return;}
   schoolTestWorkspace.innerHTML=`<div class="kv-quest-card kv-quest-wide"><b>📝</b><h3>${esc(test.title)}</h3><p>${esc(test.description||'Тестті орындаңыз.')}</p><input class="school-test-name" placeholder="Аты-жөніңіз"><input class="school-test-class" placeholder="Сыныбыңыз (мысалы 8А)"><div class="kv-quest-questions"></div><button class="btn btn-primary school-test-submit">Тестті аяқтау →</button><p class="kv-battle-note" style="margin-top:12px">⚠️ Бір оқушыға бір мүмкіндік.</p></div>`;
   const box=schoolTestWorkspace.querySelector('.kv-quest-questions');
   questions.forEach((q,i)=>{const c=document.createElement('div');c.className='kv-quest-question-card';c.innerHTML=`<div class="kv-quiz-progress">СҰРАҚ ${i+1} / ${questions.length}</div><div class="kv-quiz-question">${esc(q.question)}</div><label><input type="radio" name="st-${q.id}" value="a"> ${esc(q.option_a)}</label><label><input type="radio" name="st-${q.id}" value="b"> ${esc(q.option_b)}</label><label><input type="radio" name="st-${q.id}" value="c"> ${esc(q.option_c)}</label><label><input type="radio" name="st-${q.id}" value="d"> ${esc(q.option_d)}</label>`;box.appendChild(c);});
   schoolTestWorkspace.scrollIntoView({behavior:'smooth',block:'start'});
   schoolTestWorkspace.querySelector('.school-test-submit').onclick=async()=>{const name=schoolTestWorkspace.querySelector('.school-test-name').value.trim(),cls=schoolTestWorkspace.querySelector('.school-test-class').value.trim();if(!name||!cls){toast('Аты-жөніңіз бен сыныбыңызды жазыңыз.','error');return;}const answers=questions.map(q=>{const x=schoolTestWorkspace.querySelector(`input[name="st-${q.id}"]:checked`);return {question_id:q.id,answer:x?x.value:null};});const btn=schoolTestWorkspace.querySelector('.school-test-submit');btn.disabled=true;const {data,error}=await sb.rpc('submit_school_test_attempt',{p_test_id:test.id,p_student_name:name,p_class_name:cls,p_answers:answers});if(error){btn.disabled=false;toast(String(error.message||'Тестті жіберу қатесі.'),'error');return;}const r=Array.isArray(data)?data[0]:data;schoolTestWorkspace.innerHTML=`<div class="kv-quiz-result"><p>🎉 Тест аяқталды!</p><div class="score">${r.score} / ${r.total}</div><p>Нәтиже сақталды.</p></div>`;};
 }
 loadSchoolTests();

 // Class capacity manager for daily quiz + Battle.
 const classLimitList=document.getElementById('a-class-limit-list'), classAdd=document.getElementById('a-class-add'), classSave=document.getElementById('a-class-save');
 function addClassLimitRow(v={}){if(!classLimitList)return;const row=document.createElement('div');row.className='admin-class-limit-row';row.innerHTML=`<input class="cl-name" placeholder="Мысалы 8А" value="${esc(v.class_name||'')}"><input class="cl-limit" type="number" min="1" value="${Number(v.attempt_limit||20)}"><button type="button" class="icon-btn danger">🗑</button>`;row.querySelector('.danger').onclick=()=>row.remove();classLimitList.appendChild(row);}
 async function loadClassLimits(){if(!classLimitList)return;const {data,error}=await sb.from('class_limits').select('*').order('class_name');classLimitList.innerHTML='';if(error||!data?.length){for(let i=0;i<8;i++)addClassLimitRow({attempt_limit:20});return;}data.forEach(addClassLimitRow);}
 classAdd?.addEventListener('click',()=>addClassLimitRow({attempt_limit:20}));
 classSave?.addEventListener('click',async()=>{const rows=[...classLimitList.querySelectorAll('.admin-class-limit-row')].map(r=>({class_name:r.querySelector('.cl-name').value.trim(),attempt_limit:Number(r.querySelector('.cl-limit').value)})).filter(x=>x.class_name);if(!rows.length){toast('Кемінде бір сынып қосыңыз.','error');return;}const {error}=await sb.rpc('save_class_limits',{p_classes:rows});if(error){toast('Сынып лимиттерін сақтау қатесі.','error');return;}toast('Сыныптар мен лимиттер сақталды!');loadClassLimits();});
 loadClassLimits();

 // Native school-test admin bulk form.
 const testBulkList=document.getElementById('a-test-bulk-list'), testAdd=document.getElementById('a-test-add-card'), testSave=document.getElementById('a-test-bulk-save'), testTitle=document.getElementById('a-test-title'), testDesc=document.getElementById('a-test-description'); let testCount=0;
 function addTestCard(v={}){if(!testBulkList)return;testCount++;const n=testCount,c=document.createElement('div');c.className='quiz-admin-card';c.innerHTML=`<div class="quiz-admin-card-head"><strong>${n}-сұрақ</strong><button type="button" class="icon-btn danger">🗑</button></div><input class="q-question" placeholder="Сұрақ мәтіні" value="${esc(v.question||'')}"><div class="quiz-admin-options"><input class="q-a" placeholder="A нұсқасы" value="${esc(v.option_a||'')}"><input class="q-b" placeholder="B нұсқасы" value="${esc(v.option_b||'')}"><input class="q-c" placeholder="C нұсқасы" value="${esc(v.option_c||'')}"><input class="q-d" placeholder="D нұсқасы" value="${esc(v.option_d||'')}"></div><select class="q-correct"><option value="a">Дұрыс жауап: A</option><option value="b">Дұрыс жауап: B</option><option value="c">Дұрыс жауап: C</option><option value="d">Дұрыс жауап: D</option></select>`;c.querySelector('.q-correct').value=v.correct_option||'a';c.querySelector('.danger').onclick=()=>{c.remove();renumberTests();};testBulkList.appendChild(c);}
 function renumberTests(){testBulkList?.querySelectorAll('.quiz-admin-card').forEach((c,i)=>c.querySelector('.quiz-admin-card-head strong').textContent=`${i+1}-сұрақ`);testCount=testBulkList?.querySelectorAll('.quiz-admin-card').length||0;}
 if(testBulkList&&!testBulkList.children.length){for(let i=0;i<10;i++)addTestCard();} testAdd?.addEventListener('click',()=>addTestCard());
 testSave?.addEventListener('click',async()=>{const title=testTitle?.value.trim(),description=testDesc?.value.trim(),cards=[...(testBulkList?.querySelectorAll('.quiz-admin-card')||[])];if(!title||!cards.length){toast('Тест атауын және сұрақтарды толтырыңыз.','error');return;}const questions=cards.map(c=>({question:c.querySelector('.q-question').value.trim(),option_a:c.querySelector('.q-a').value.trim(),option_b:c.querySelector('.q-b').value.trim(),option_c:c.querySelector('.q-c').value.trim(),option_d:c.querySelector('.q-d').value.trim(),correct_option:c.querySelector('.q-correct').value}));if(questions.some(q=>!q.question||!q.option_a||!q.option_b||!q.option_c||!q.option_d)){toast('Барлық сұрақ пен 4 нұсқаны толтырыңыз.','error');return;}const {error}=await sb.rpc('create_school_test_batch',{p_title:title,p_description:description,p_questions:questions});if(error){toast('Тестті сақтау қатесі.','error');return;}testTitle.value='';testDesc.value='';testBulkList.innerHTML='';testCount=0;for(let i=0;i<10;i++)addTestCard();await refreshAdminLists();await loadQuestBookOptions();await loadSchoolTests();toast('Тест жарияланды!');});

 const login=document.getElementById('admin-login'), content=document.getElementById('admin-content'), password=document.getElementById('admin-password');
 // Separate admin areas: public school content vs KITAPVERSE.
 document.querySelectorAll('.admin-tab').forEach(tab=>tab.addEventListener('click',()=>{
   const key=tab.dataset.adminTab;
   document.querySelectorAll('.admin-tab').forEach(x=>x.classList.toggle('active',x===tab));
   document.querySelectorAll('.admin-tab-panel').forEach(x=>x.classList.toggle('active',x.dataset.adminPanel===key));
 }));

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
 let editingBookId=null;
 const bookForm=document.getElementById('a-book-form');
 const bookIconI=document.getElementById('a-book-icon'), bookTitleI=document.getElementById('a-book-title'), bookAuthorI=document.getElementById('a-book-author'), bookTextI=document.getElementById('a-book-text'), bookGradeI=document.getElementById('a-book-grade');
 const bookBonusI=document.getElementById('a-book-bonus');
 const bookDriveI=document.getElementById('a-book-drive'), bookPdfHint=document.getElementById('a-book-pdf-hint');
 const bookAddBtn=document.getElementById('a-book-add'), bookCancelBtn=document.getElementById('a-book-cancel'), bookFormTitle=document.getElementById('a-book-form-title');

 function startEditBook(item){
   editingBookId=item.id; bookForm.classList.add('editing');
   bookFormTitle.textContent='✏️ Кітапты өңдеу';
   bookAddBtn.textContent='Өзгерісті сақтау';
   bookIconI.value=item.icon||''; bookTitleI.value=item.title||''; bookAuthorI.value=item.author||''; bookTextI.value=item.description||''; bookGradeI.value=item.grade||'';
   bookDriveI.value=item.drive_url||item.pdf_url||''; if(bookBonusI)bookBonusI.checked=!!item.is_bonus; bookPdfHint.hidden=false;
   bookForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditBook(){
   editingBookId=null; bookForm.classList.remove('editing');
   bookFormTitle.textContent='📖 Кітапханаға кітап қосу'; bookAddBtn.textContent='Кітапты қосу';
   bookIconI.value='';bookTitleI.value='';bookAuthorI.value='';bookTextI.value='';bookGradeI.value=''; bookDriveI.value=''; if(bookBonusI)bookBonusI.checked=false; bookPdfHint.hidden=true;
 }
 bookCancelBtn.onclick=stopEditBook;

 bookAddBtn.onclick=async()=>{
   const icon=bookIconI.value.trim()||'📕', title=bookTitleI.value.trim(), author=bookAuthorI.value.trim(), description=bookTextI.value.trim(), grade=bookGradeI.value?parseInt(bookGradeI.value,10):null, drive_url=bookDriveI.value.trim();
   if(!title){toast('Кітап атауын енгізіңіз.','error');return;}
   if(!grade){toast('Сыныпты таңдаңыз (6–10).','error');return;}
   if(!drive_url){toast('Google Drive сілтемесін енгізіңіз.','error');return;}
   setBusy(bookAddBtn,true,editingBookId?'Өзгерісті сақтау':'Кітапты қосу');
   try{
     const payload={icon,title,author,description,grade,drive_url,is_bonus:!!bookBonusI?.checked};
     let error;
     if(editingBookId){
       ({error}=await sb.from('library_books').update(payload).eq('id',editingBookId));
     } else {
       const last=await sb.from('library_books').select('sort_order').eq('grade',grade).order('sort_order',{ascending:false}).limit(1);
       payload.sort_order=((last.data&&last.data[0]&&last.data[0].sort_order)||0)+1;
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

async function moveBook(list,pos,dir){
   const arr=[...list],to=pos+dir;if(to<0||to>=arr.length)return;
   [arr[pos],arr[to]]=[arr[to],arr[pos]];
   const res=await Promise.all(arr.map((x,i)=>sb.from('library_books').update({sort_order:i+1}).eq('id',x.id)));
   if(res.some(r=>r&&r.error)){toast('Тәртіпті сақтау қатесі.','error');return;}
   await refreshAdminLists();
 }
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

 /* ---------- KITAPVERSE: Battle (бірнеше сынып + кітап топтары, әр топтың өз сұрақтары) ---------- */
 const BATTLE_CLASSES=['6А','6Б','7А','8А','8Б','9А','9Б','10А','10Б'];
 const battleGroupsBox=document.getElementById('a-battle-groups');
 function questionCardHtml(n,values={}){
   return `<div class="quiz-admin-card-head"><strong>${n}-сұрақ</strong><button type="button" class="icon-btn danger q-remove" title="Өшіру">🗑</button></div><input class="q-question" placeholder="Сұрақ мәтіні" value="${escapeHtml(values.question||'')}"><div class="quiz-admin-options"><input class="q-a" placeholder="A нұсқасы" value="${escapeHtml(values.option_a||'')}"><input class="q-b" placeholder="B нұсқасы" value="${escapeHtml(values.option_b||'')}"><input class="q-c" placeholder="C нұсқасы" value="${escapeHtml(values.option_c||'')}"><input class="q-d" placeholder="D нұсқасы" value="${escapeHtml(values.option_d||'')}"></div><select class="q-correct"><option value="a">Дұрыс жауап: A</option><option value="b">Дұрыс жауап: B</option><option value="c">Дұрыс жауап: C</option><option value="d">Дұрыс жауап: D</option></select>`;
 }
 function addQuestionCard(list,values){
   const card=document.createElement('div');card.className='quiz-admin-card';
   card.innerHTML=questionCardHtml(list.children.length+1,values);
   card.querySelector('.q-correct').value=(values&&values.correct_option)||'a';
   card.querySelector('.q-remove').onclick=()=>{card.remove();[...list.children].forEach((c,i)=>c.querySelector('.quiz-admin-card-head strong').textContent=`${i+1}-сұрақ`);};
   list.appendChild(card);
 }
 function readQuestions(list){
   const out=[];let bad=false;
   [...list.querySelectorAll('.quiz-admin-card')].forEach(c=>{
     const q={question:c.querySelector('.q-question').value.trim(),option_a:c.querySelector('.q-a').value.trim(),option_b:c.querySelector('.q-b').value.trim(),option_c:c.querySelector('.q-c').value.trim(),option_d:c.querySelector('.q-d').value.trim(),correct_option:c.querySelector('.q-correct').value};
     const filled=Object.entries(q).filter(([k,v])=>k!=='correct_option'&&v).length;
     if(filled===0)return;            // бос карточка өткізіледі
     if(filled<5){bad=true;return;}
     out.push(q);
   });
   return {questions:out,bad};
 }
 function addBattleGroup(){
   if(!battleGroupsBox)return;
   const card=document.createElement('div');card.className='a-bgroup';
   const n=battleGroupsBox.children.length+1;
   card.innerHTML=`<div class="a-bgroup-head"><h4>${n}-топ</h4><button type="button" class="icon-btn danger bg-remove" title="Топты өшіру">🗑</button></div><div class="a-bgroup-classes">${BATTLE_CLASSES.map(c=>`<label class="a-chip"><input type="checkbox" value="${c}"><span>${c}</span></label>`).join('')}</div><input class="bg-book" placeholder="Осы топтың кітап атауы (орыс сыныпқа — орысша)"><div class="bg-questions"></div><button type="button" class="btn btn-light bg-add-q">➕ Сұрақ қосу</button>`;
   const qs=card.querySelector('.bg-questions');
   for(let i=0;i<5;i++)addQuestionCard(qs);
   card.querySelector('.bg-add-q').onclick=()=>addQuestionCard(qs);
   card.querySelector('.bg-remove').onclick=()=>{card.remove();[...battleGroupsBox.children].forEach((c,i)=>c.querySelector('h4').textContent=`${i+1}-топ`);};
   battleGroupsBox.appendChild(card);
 }
 if(battleGroupsBox){
   addBattleGroup();
   document.getElementById('a-battle-add-group').onclick=addBattleGroup;
 }
 const battleSaveBtn=document.getElementById('a-battle-save');
 if(battleSaveBtn)battleSaveBtn.onclick=async()=>{
   const title=document.getElementById('a-battle-title').value.trim(), dateV=document.getElementById('a-battle-date').value;
   if(!title||!dateV){toast('Атауын және басталу күнін толтырыңыз.','error');return;}
   const groups=[];const used=new Set();
   const cards=[...battleGroupsBox.querySelectorAll('.a-bgroup')];
   for(let i=0;i<cards.length;i++){
     const c=cards[i];
     const classes=[...c.querySelectorAll('.a-bgroup-classes input:checked')].map(x=>x.value);
     const book=c.querySelector('.bg-book').value.trim();
     const {questions,bad}=readQuestions(c.querySelector('.bg-questions'));
     if(!classes.length){toast(`${i+1}-топ: кемінде бір сынып таңдаңыз.`,'error');return;}
     if(classes.some(x=>used.has(x))){toast(`${i+1}-топ: бір сынып екі топта болмайды.`,'error');return;}
     classes.forEach(x=>used.add(x));
     if(!book){toast(`${i+1}-топ: кітап атауын жазыңыз.`,'error');return;}
     if(bad){toast(`${i+1}-топ: сұрақтың барлық өрісін (сұрақ + 4 нұсқа) толтырыңыз.`,'error');return;}
     if(!questions.length){toast(`${i+1}-топ: кемінде бір сұрақ қосыңыз.`,'error');return;}
     groups.push({classes,book_title:book,questions});
   }
   if(!groups.length){toast('Кемінде бір топ қосыңыз.','error');return;}
   setBusy(battleSaveBtn,true,'Battle-ды жариялау');
   const {error}=await sb.rpc('create_battle_full',{p_title:title,p_date:new Date(dateV).toISOString(),p_groups:groups});
   setBusy(battleSaveBtn,false,'Battle-ды жариялау');
   if(error){toast('Battle сақтау кезінде қате шықты: '+(error.message||''),'error');return;}
   document.getElementById('a-battle-title').value='';document.getElementById('a-battle-date').value='';
   battleGroupsBox.innerHTML='';addBattleGroup();
   await refreshAdminLists();
   toast('Battle жарияланды!');
 };

 async function deleteBattle(id){
   if(!confirm('Бұл battle-ды және оның барлық сұрақтары мен нәтижелерін өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('battles').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   await refreshAdminLists();
   toast('Battle өшірілді.');
 }
 async function rescheduleBattle(item){
   const cur=new Date(item.battle_date);const p=n=>String(n).padStart(2,'0');
   const def=`${cur.getFullYear()}-${p(cur.getMonth()+1)}-${p(cur.getDate())} ${p(cur.getHours())}:${p(cur.getMinutes())}`;
   const v=prompt('Жаңа басталу уақыты (ЖЖЖЖ-АА-КК СС:ММ):',def);if(!v)return;
   const d=new Date(v.trim().replace(' ','T'));
   if(isNaN(d.getTime())){toast('Уақыт форматы қате.','error');return;}
   const {error}=await sb.from('battles').update({battle_date:d.toISOString()}).eq('id',item.id);
   if(error){toast('Уақытты сақтау кезінде қате шықты.','error');return;}
   await refreshAdminLists();toast('Уақыт жаңартылды.');
 }

 /* ---------- KITAPVERSE: Мектептер лигасы (admin) ---------- */
 const leagueQBox=document.getElementById('a-league-questions');
 if(leagueQBox){for(let i=0;i<5;i++)addQuestionCard(leagueQBox);document.getElementById('a-league-add-q').onclick=()=>addQuestionCard(leagueQBox);}
 const leagueSaveBtn=document.getElementById('a-league-save');
 if(leagueSaveBtn)leagueSaveBtn.onclick=async()=>{
   const g=id=>document.getElementById(id).value.trim();
   const a=g('a-league-school-a'),b=g('a-league-school-b'),book=g('a-league-book'),dateV=document.getElementById('a-league-date').value,dur=parseInt(g('a-league-duration'),10)||30;
   if(!a||!b||!book||!dateV){toast('Екі мектеп атауын, кітапты және басталу уақытын толтырыңыз.','error');return;}
   if(a.toLowerCase()===b.toLowerCase()){toast('Мектеп атаулары әртүрлі болуы керек.','error');return;}
   const {questions,bad}=readQuestions(leagueQBox);
   if(bad){toast('Сұрақтың барлық өрісін (сұрақ + 4 нұсқа) толтырыңыз.','error');return;}
   if(!questions.length){toast('Кемінде бір сұрақ қосыңыз.','error');return;}
   setBusy(leagueSaveBtn,true,'Турды жариялау');
   const {error}=await sb.rpc('create_league_round',{p_title:g('a-league-title'),p_school_a:a,p_school_b:b,p_book:book,p_starts:new Date(dateV).toISOString(),p_duration:dur,p_questions:questions});
   setBusy(leagueSaveBtn,false,'Турды жариялау');
   if(error){toast('Турды сақтау кезінде қате шықты: '+(error.message||''),'error');return;}
   ['a-league-title','a-league-book','a-league-date'].forEach(id=>{document.getElementById(id).value='';});
   leagueQBox.innerHTML='';for(let i=0;i<5;i++)addQuestionCard(leagueQBox);
   await refreshAdminLists();toast('Тур жарияланды!');
 };
 async function deleteLeagueRound(id){
   if(!confirm('Бұл турды, сұрақтарды және барлық нәтижелерді өшіруге сенімдісіз бе?'))return;
   const {error}=await sb.from('league_rounds').delete().eq('id',id);
   if(error){toast('Өшіру кезінде қате шықты.','error');return;}
   await refreshAdminLists();toast('Тур өшірілді.');
 }
 async function copyLeagueLink(id){
   const url=location.origin+location.pathname.replace(/[^/]*$/,'')+'league.html?round='+id;
   try{await navigator.clipboard.writeText(url);toast('Сілтеме көшірілді!');}catch(e){window.prompt('Сілтемені көшіріңіз:',url);}
 }

 function battleCountdownLabel(iso){
   const diff=new Date(iso).getTime()-Date.now();
   if(diff<=0)return 'Басталды';
   const days=Math.floor(diff/86400000), hours=Math.floor((diff%86400000)/3600000);
   return `${days} күн ${hours} сағ қалды`;
 }

 /* ---------- KITAPVERSE: Native Quest batches ---------- */
 const questTitleI=document.getElementById('a-quest-title'), questDescI=document.getElementById('a-quest-description'), questBookI=document.getElementById('a-quest-book');
 const questBulkList=document.getElementById('a-quest-bulk-list'), questAddCard=document.getElementById('a-quest-add-card'), questBulkSave=document.getElementById('a-quest-bulk-save');
 let questCardCount=0;
 function addQuestCard(values={}){if(!questBulkList)return;questCardCount++;const n=questCardCount;const card=document.createElement('div');card.className='quiz-admin-card';card.innerHTML=`<div class="quiz-admin-card-head"><strong>${n}-сұрақ</strong><button type="button" class="icon-btn danger quest-remove">🗑</button></div><input class="q-question" placeholder="Сұрақ мәтіні" value="${escapeHtml(values.question||'')}"><div class="quiz-admin-options"><input class="q-a" placeholder="A нұсқасы" value="${escapeHtml(values.option_a||'')}"><input class="q-b" placeholder="B нұсқасы" value="${escapeHtml(values.option_b||'')}"><input class="q-c" placeholder="C нұсқасы" value="${escapeHtml(values.option_c||'')}"><input class="q-d" placeholder="D нұсқасы" value="${escapeHtml(values.option_d||'')}"></div><select class="q-correct"><option value="a">Дұрыс жауап: A</option><option value="b">Дұрыс жауап: B</option><option value="c">Дұрыс жауап: C</option><option value="d">Дұрыс жауап: D</option></select>`;card.querySelector('.q-correct').value=values.correct_option||'a';card.querySelector('.quest-remove').onclick=()=>{card.remove();renumberQuestCards();};questBulkList.appendChild(card);}
 function renumberQuestCards(){questBulkList?.querySelectorAll('.quiz-admin-card').forEach((c,i)=>c.querySelector('.quiz-admin-card-head strong').textContent=`${i+1}-сұрақ`);questCardCount=questBulkList?.querySelectorAll('.quiz-admin-card').length||0;}
 async function loadQuestBookOptions(){ if(!questBookI)return; const {data}=await sb.from('library_books').select('id,title,grade').order('grade').order('title'); questBookI.innerHTML='<option value="">Кітаппен байланыстырмау</option>'+(data||[]).map(b=>`<option value="${b.id}">${escapeHtml(b.grade+' сынып · '+b.title)}</option>`).join(''); }
if(questAddCard)questAddCard.onclick=()=>addQuestCard(); if(questBulkList&&!questBulkList.children.length){for(let i=0;i<10;i++)addQuestCard();}
 if(questBulkSave)questBulkSave.onclick=async()=>{const title=questTitleI?.value.trim(),description=questDescI?.value.trim(),bookId=questBookI?.value?Number(questBookI.value):null;const cards=[...(questBulkList?.querySelectorAll('.quiz-admin-card')||[])];if(!title){toast('Квест атауын енгізіңіз.','error');return;}if(!cards.length){toast('Кемінде бір сұрақ қосыңыз.','error');return;}const questions=cards.map(card=>({question:card.querySelector('.q-question').value.trim(),option_a:card.querySelector('.q-a').value.trim(),option_b:card.querySelector('.q-b').value.trim(),option_c:card.querySelector('.q-c').value.trim(),option_d:card.querySelector('.q-d').value.trim(),correct_option:card.querySelector('.q-correct').value}));if(questions.some(q=>!q.question||!q.option_a||!q.option_b||!q.option_c||!q.option_d)){toast('Барлық сұрақ пен 4 нұсқаны толтырыңыз.','error');return;}setBusy(questBulkSave,true,'Квестті жариялау');const {error}=await sb.rpc('create_quest_batch',{p_title:title,p_description:description,p_book_id:bookId,p_questions:questions});setBusy(questBulkSave,false,'Квестті жариялау');if(error){toast('Квестті сақтау кезінде қате шықты.','error');return;}if(questTitleI)questTitleI.value='';if(questDescI)questDescI.value='';if(questBulkList){questBulkList.innerHTML='';questCardCount=0;for(let i=0;i<10;i++)addQuestCard();}await refreshAdminLists();await loadQuestBookOptions();toast('Квест жарияланды!');};

/* ---------- KITAPVERSE: bulk quest import from kitapverse-quests.json ----------
   Each quest is matched to a library book by grade + normalized title, so the same
   book in two grades (e.g. Гауһартас in 8 and 9) gets its own separate quest.
   Books that already have a quest are skipped, so running it twice never duplicates. */
const qImportFile=document.getElementById('a-quest-import-file'), qImportBtn=document.getElementById('a-quest-import-btn'), qImportCheck=document.getElementById('a-quest-import-check'), qImportLog=document.getElementById('a-quest-import-log');
const KV_TITLE_ALIASES={'Я — Малала':'Мен — Малаламын','Суровые дни':'Қаһарлы күндер','Путешествия Гулливера':'Гулливердің саяхаттары','Властелин колец: Братство кольца':'Сақиналар әміршісі: сақина бауырластығы','Кочевники: заговорённый меч':'Көшпенділер: Алмас қылыш','Стрела Махамбета':'Махамбеттің жебесі','Как завоевать друзей и оказывать влияние на людей':'Дос табу және адамдарға ықпал ету өнері','Истина и легенда':'Ақиқат пен аңыз','Белый пароход':'Ақ кеме'};
function kvNormTitle(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"“”'’.,:;!?—–\-]/g,' ').replace(/\s+/g,' ').trim();}
async function importQuestsFromJson(dry){
  const file=qImportFile?.files?.[0];
  if(!file){toast('Алдымен JSON файлын таңдаңыз.','error');return;}
  let list;
  try{list=JSON.parse(await file.text());}catch(e){toast('Файл оқылмады: JSON дұрыс емес.','error');return;}
  if(!Array.isArray(list)||!list.length||list.some(x=>!x||!x.title||!x.grade||!Array.isArray(x.questions)||!x.questions.length)){toast('Файл форматы дұрыс емес.','error');return;}
  const btn=dry?qImportCheck:qImportBtn, idle=dry?'Алдымен тексеру':'Квесттерді жүктеу';
  if(qImportBtn)qImportBtn.disabled=true; if(qImportCheck)qImportCheck.disabled=true;
  if(btn)btn.textContent='Жүктелуде...';
  try{
    const [bk,qs]=await Promise.all([sb.from('library_books').select('id,title,grade,quest_id').order('id',{ascending:true}),sb.from('quests').select('id,book_id')]);
    if(bk.error||qs.error){toast('Кітаптар тізімін оқу кезінде қате шықты.','error');return;}
    const books=bk.data||[];
    const used=new Set([...(qs.data||[]).filter(q=>q.book_id!=null).map(q=>String(q.book_id)),...books.filter(b=>b.quest_id!=null).map(b=>String(b.id))]);
    const res={done:0,skipped:[],missing:[],failed:[]};
    for(let i=0;i<list.length;i++){
      const item=list[i], label=item.grade+' сынып · '+item.title;
      const keys=[kvNormTitle(item.title)]; if(KV_TITLE_ALIASES[item.title])keys.push(kvNormTitle(KV_TITLE_ALIASES[item.title]));
      const cands=books.filter(b=>Number(b.grade)===Number(item.grade)&&keys.includes(kvNormTitle(b.title)));
      if(!cands.length){res.missing.push(label);continue;}
      const free=cands.find(b=>!used.has(String(b.id)));
      if(!free){res.skipped.push(label);continue;}
      if(!dry){
        if(btn)btn.textContent=`Жүктелуде ${i+1}/${list.length}...`;
        const {error}=await sb.rpc('create_quest_batch',{p_title:item.title,p_description:`«${item.title}» кітабы бойынша оқу квесті. ${item.questions.length} сұрақ, 4 жауап нұсқасы.`,p_book_id:free.id,p_questions:item.questions});
        if(error){res.failed.push(label);continue;}
      }
      used.add(String(free.id)); res.done++;
    }
    const part=(t,a)=>a.length?`<br><b>${t} (${a.length}):</b> ${a.slice(0,12).map(escapeHtml).join('; ')}${a.length>12?' …':''}`:'';
    qImportLog.innerHTML=`${dry?'<b>Тексеру нәтижесі (ештеңе қосылған жоқ):</b>':'<b>Жүктеу аяқталды:</b>'} ${dry?'қосылатын':'қосылды'} — ${res.done} квест, файлда — ${list.length}.`+part('Кітапханада табылмады',res.missing)+part('Квесті бар немесе бос кітап қалмады',res.skipped)+part('Қате шықты',res.failed);
    if(!dry){await refreshAdminLists();await loadQuestBookOptions();toast(`${res.done} квест жарияланды!`);}
  }finally{
    if(btn)btn.textContent=idle; if(qImportBtn)qImportBtn.disabled=false; if(qImportCheck)qImportCheck.disabled=false;
  }
}
if(qImportBtn)qImportBtn.onclick=()=>importQuestsFromJson(false);
if(qImportCheck)qImportCheck.onclick=()=>importQuestsFromJson(true);

 /* ---------- KITAPVERSE: Daily quiz batches (10 questions / 24h each) ---------- */
 const quizBulkList=document.getElementById('a-quiz-bulk-list');
 const quizStartAt=document.getElementById('a-quiz-start-at');
 const quizAddCard=document.getElementById('a-quiz-add-card');
 const quizBulkSave=document.getElementById('a-quiz-bulk-save');
 let quizCardCount=0;
 function localDateTimeValue(d){ const x=new Date(d.getTime()-d.getTimezoneOffset()*60000); return x.toISOString().slice(0,16); }
 if(quizStartAt && !quizStartAt.value) quizStartAt.value=localDateTimeValue(new Date());
 function addQuizCard(values={}){
   if(!quizBulkList)return;
   quizCardCount++;
   const n=quizCardCount;
   const card=document.createElement('div'); card.className='quiz-admin-card'; card.dataset.index=n;
   card.innerHTML=`<div class="quiz-admin-card-head"><strong>${n}-сұрақ</strong><button type="button" class="icon-btn danger quiz-remove" title="Өшіру">🗑</button></div>
     <input class="q-question" placeholder="Сұрақ мәтіні" value="${escapeHtml(values.question||'')}">
     <div class="quiz-admin-options"><input class="q-a" placeholder="A нұсқасы" value="${escapeHtml(values.option_a||'')}"/><input class="q-b" placeholder="B нұсқасы" value="${escapeHtml(values.option_b||'')}"/><input class="q-c" placeholder="C нұсқасы" value="${escapeHtml(values.option_c||'')}"/><input class="q-d" placeholder="D нұсқасы" value="${escapeHtml(values.option_d||'')}"/></div>
     <select class="q-correct"><option value="a">Дұрыс жауап: A</option><option value="b">Дұрыс жауап: B</option><option value="c">Дұрыс жауап: C</option><option value="d">Дұрыс жауап: D</option></select>`;
   card.querySelector('.q-correct').value=values.correct_option||'a';
   card.querySelector('.quiz-remove').onclick=()=>{card.remove(); renumberQuizCards();};
   quizBulkList.appendChild(card);
 }
 function renumberQuizCards(){quizBulkList?.querySelectorAll('.quiz-admin-card').forEach((c,i)=>{c.dataset.index=i+1;c.querySelector('.quiz-admin-card-head strong').textContent=`${i+1}-сұрақ`;});quizCardCount=quizBulkList?.querySelectorAll('.quiz-admin-card').length||0;}
 if(quizAddCard)quizAddCard.onclick=()=>addQuizCard();
 if(quizBulkList && !quizBulkList.children.length){for(let i=0;i<10;i++)addQuizCard();}
 if(quizBulkSave)quizBulkSave.onclick=async()=>{
   const cards=[...(quizBulkList?.querySelectorAll('.quiz-admin-card')||[])];
   if(!cards.length){toast('Кемінде бір сұрақ қосыңыз.','error');return;}
   const startAt=quizStartAt?.value;
   if(!startAt){toast('Басталу уақытын таңдаңыз.','error');return;}
   const questions=cards.map(card=>({
     question:card.querySelector('.q-question').value.trim(), option_a:card.querySelector('.q-a').value.trim(), option_b:card.querySelector('.q-b').value.trim(), option_c:card.querySelector('.q-c').value.trim(), option_d:card.querySelector('.q-d').value.trim(), correct_option:card.querySelector('.q-correct').value
   }));
   if(questions.some(q=>!q.question||!q.option_a||!q.option_b||!q.option_c||!q.option_d)){toast('Барлық сұрақ пен 4 нұсқаны толтырыңыз.','error');return;}
   setBusy(quizBulkSave,true,'Жариялануда...');
   const {error}=await sb.rpc('create_daily_quiz_batch',{p_start_at:new Date(startAt).toISOString(),p_questions:questions});
   setBusy(quizBulkSave,false,'10 сұрақты жариялау');
   if(error){toast('Викторина пакетін сақтау кезінде қате шықты. SQL миграциясын тексеріңіз.','error');return;}
   quizBulkList.innerHTML='';quizCardCount=0;for(let i=0;i<10;i++)addQuizCard();
   await refreshAdminLists(); toast(`${questions.length} сұрақтан тұратын пакет жасалды! Әр сұрақ 24 сағаттан кейін келесісіне ауысады.`);
 };

 /* Archived questions are intentionally not deletable from here — their
    results feed the historical rating, so deleting them would corrupt it. */

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
   if(docFolderI)docFolderI.value=item.folder_id!=null?String(item.folder_id):'';
   docForm.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditDoc(){
   editingDoc=null; docForm.classList.remove('editing');
   docFormTitle.textContent='📄 Құжат қосу'; docAddBtn.textContent='Құжатты қосу';
   docTitleI.value='';docFileI.value='';docFileHint.hidden=true;
   if(docFolderI)docFolderI.value='';
 }
 docCancelBtn.onclick=stopEditDoc;

 docAddBtn.onclick=async()=>{
   const title=docTitleI.value.trim(), file=docFileI.files[0];
   const folderId=docFolderI&&docFolderI.value?Number(docFolderI.value):null;
   if(!title){toast('Құжат атауын енгізіңіз.','error');return;}
   if(!editingDoc && !file){toast('Файлды таңдаңыз.','error');return;}
   if(file && file.size>50*1024*1024){toast('Файл 50 МБ-тан аспауы керек.','error');return;}

   setBusy(docAddBtn,true,editingDoc?'Өзгерісті сақтау':'Құжатты қосу');
   try{
     if(editingDoc){
       const updates={title,folder_id:folderId};
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
       const {error}=await sb.from('documents').insert({title,folder_id:folderId,file_name:file.name,storage_path:path,file_url:sb.storage.from('documents').getPublicUrl(path).data.publicUrl});
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

 /* ---------- Document folders: add / edit / delete ---------- */
 let editingFolder=null; // {id}
 const folderForm=document.getElementById('a-folder-form');
 const folderNameI=document.getElementById('a-folder-name'), folderPasswordI=document.getElementById('a-folder-password'), folderPasswordHint=document.getElementById('a-folder-password-hint');
 const folderAddBtn=document.getElementById('a-folder-add'), folderCancelBtn=document.getElementById('a-folder-cancel'), folderFormTitle=document.getElementById('a-folder-form-title');
 const docFolderI=document.getElementById('a-doc-folder');

 function startEditFolder(item){
   editingFolder={id:item.id}; folderForm?.classList.add('editing');
   if(folderFormTitle)folderFormTitle.textContent='✏️ Папканы өңдеу';
   if(folderAddBtn)folderAddBtn.textContent='Өзгерісті сақтау';
   if(folderNameI)folderNameI.value=item.name||'';
   if(folderPasswordI)folderPasswordI.value='';
   if(folderPasswordHint)folderPasswordHint.hidden=!item.is_locked;
   folderForm?.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function stopEditFolder(){
   editingFolder=null; folderForm?.classList.remove('editing');
   if(folderFormTitle)folderFormTitle.textContent='📁 Жаңа папка құру';
   if(folderAddBtn)folderAddBtn.textContent='Папканы құру';
   if(folderNameI)folderNameI.value=''; if(folderPasswordI)folderPasswordI.value='';
   if(folderPasswordHint)folderPasswordHint.hidden=true;
 }
 if(folderCancelBtn)folderCancelBtn.onclick=stopEditFolder;

 async function loadFolderOptions(){
   if(!docFolderI)return;
   const current=docFolderI.value;
   const {data}=await sb.rpc('list_document_folders');
   docFolderI.innerHTML='<option value="">Жалпы (топсыз, бәрі көреді)</option>'+(data||[]).map(f=>`<option value="${f.id}">${escapeHtml(f.name)}${f.is_locked?' 🔒':''}</option>`).join('');
   if(current && [...docFolderI.options].some(o=>o.value===current))docFolderI.value=current;
 }

 if(folderAddBtn)folderAddBtn.onclick=async()=>{
   const name=folderNameI?.value.trim(); const pw=folderPasswordI?.value.trim();
   if(!name){toast('Папка атауын енгізіңіз.','error');return;}
   setBusy(folderAddBtn,true,editingFolder?'Өзгерісті сақтау':'Папканы құру');
   try{
     if(editingFolder){
       const updates={name}; if(pw)updates.password=pw;
       const {error}=await sb.from('document_folders').update(updates).eq('id',editingFolder.id);
       if(error)throw new Error('update');
       stopEditFolder(); toast('Папка жаңартылды!');
     } else {
       const {error}=await sb.from('document_folders').insert({name,password:pw||null});
       if(error)throw new Error('insert');
       stopEditFolder(); toast('Папка құрылды!');
     }
     await loadPublic(); await refreshAdminLists(); await loadFolderOptions();
   }catch(err){
     toast('Папканы сақтау кезінде қате шықты.','error');
   } finally {
     setBusy(folderAddBtn,false,editingFolder?'Өзгерісті сақтау':'Папканы құру');
   }
 };

 async function unlockFolderRemovePassword(id){
   if(!confirm('Осы папканың құпиясөзін алып тастап, ашық ету керек пе? Оны енді бәрі көре алады.'))return;
   const {error}=await sb.from('document_folders').update({password:null}).eq('id',id);
   if(error){toast('Қате шықты.','error');return;}
   await loadPublic(); await refreshAdminLists(); await loadFolderOptions();
   toast('Папка ашық болды.');
 }

 async function deleteFolder(id){
   if(!confirm('Бұл папканы өшіруге сенімдісіз бе? Ішіндегі құжаттар өшірілмейді, олар "Жалпы" топқа өтеді.'))return;
   const {error}=await sb.from('document_folders').delete().eq('id',id);
   if(error){toast('Папканы өшіру кезінде қате шықты.','error');return;}
   if(editingFolder?.id===id)stopEditFolder();
   await loadPublic(); await refreshAdminLists(); await loadFolderOptions();
   toast('Папка өшірілді.');
 }

 /* ---------- Public (visitor-facing) lists ---------- */
 function toggleEmpty(container,emptyId,hasItems){
   const empty=document.getElementById(emptyId);
   if(empty)empty.style.display=hasItems?'none':'';
 }

 async function loadPublic(){
   const n=await sb.from('news').select('*').order('published_date',{ascending:false}).order('created_at',{ascending:false});
   const a=await sb.from('achievements').select('*').order('created_at',{ascending:false});

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

   // Documents are grouped into folders. "list_document_folders" hides any
   // folder password — visitors only ever learn whether a folder is locked.
   const dl=document.getElementById('documents-list');
   if(dl){
     const fRes=await sb.rpc('list_document_folders');
     const folders=fRes.data||[];
     let ungroupedCount=0;
     const ug=await sb.from('documents').select('id',{count:'exact',head:true}).is('folder_id',null);
     if(!ug.error){ ungroupedCount=ug.count||0; }
     else { const all=await sb.from('documents').select('id',{count:'exact',head:true}); ungroupedCount=all.count||0; }

     dl.querySelectorAll('[data-cloud-item]').forEach(el=>el.remove());
     let total=0;
     if(ungroupedCount>0){
       total++;
       const el=document.createElement('button');
       el.type='button'; el.className='folder-card card-in'; el.setAttribute('data-cloud-item','');
       el.innerHTML=`<span class="folder-icon">📂</span><h3>Жалпы құжаттар</h3><span class="folder-meta">${ungroupedCount} құжат</span>`;
       el.addEventListener('click',()=>openFolderModal({id:null,name:'Жалпы құжаттар',is_locked:false}));
       dl.appendChild(el);
     }
     folders.forEach(f=>{
       total++;
       const el=document.createElement('button');
       el.type='button'; el.className='folder-card card-in'+(f.is_locked?' locked':''); el.setAttribute('data-cloud-item','');
       el.innerHTML=`<span class="folder-icon">${f.is_locked?'🔒':'📁'}</span><h3>${escapeHtml(f.name)}</h3><span class="folder-meta">${f.is_locked?'<span class="folder-lock-badge">🔒 Құпиясөзбен</span>':(Number(f.doc_count||0)+' құжат')}</span>`;
       el.addEventListener('click',()=>openFolderModal(f));
       dl.appendChild(el);
     });
     toggleEmpty(dl,'documents-empty-msg',total>0);
   }
 }

 /* ---------- Public folder modal: shows a folder's documents, gated by password ---------- */
 const folderModal=document.getElementById('folder-modal');
 const folderModalTitle=document.getElementById('folder-modal-title');
 const folderModalLock=document.getElementById('folder-modal-lock');
 const folderModalPassword=document.getElementById('folder-modal-password');
 const folderModalUnlock=document.getElementById('folder-modal-unlock');
 const folderModalError=document.getElementById('folder-modal-error');
 const folderModalDocs=document.getElementById('folder-modal-docs');
 const folderModalEmpty=document.getElementById('folder-modal-empty');
 let currentFolder=null;
 const unlockedFolders=new Set(); // folder ids already unlocked this visit

 function closeFolderModal(){ folderModal?.classList.remove('show'); folderModal?.setAttribute('aria-hidden','true'); }
 document.getElementById('folder-modal-close')?.addEventListener('click',closeFolderModal);
 folderModal?.addEventListener('click',e=>{if(e.target===folderModal)closeFolderModal();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&folderModal?.classList.contains('show'))closeFolderModal();});

 function renderFolderDocs(docs){
   if(!folderModalDocs)return;
   folderModalDocs.innerHTML='';
   (docs||[]).forEach(x=>{
     const url=x.file_url || (x.storage_path ? sb.storage.from('documents').getPublicUrl(x.storage_path).data.publicUrl : '#');
     const el=document.createElement('a');
     el.className='doc-card'; el.href=url; el.target='_blank'; el.rel='noopener';
     el.innerHTML=`<span>📄</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.file_name||'')}</p><span class="status">Ашу / жүктеу</span>`;
     folderModalDocs.appendChild(el);
   });
   const hasDocs=!!(docs&&docs.length);
   folderModalDocs.hidden=!hasDocs; if(folderModalEmpty)folderModalEmpty.hidden=hasDocs;
 }

 async function fetchAndShowDocs(folder,password){
   let res=await sb.rpc('get_folder_documents',{p_folder_id:folder.id,p_password:password||null});
   if(res.error && folder.id===null){ res=await sb.from('documents').select('*').order('created_at',{ascending:false}); }
   if(res.error)return false;
   renderFolderDocs(res.data);
   if(folder.id!=null)unlockedFolders.add(folder.id);
   return true;
 }

 async function openFolderModal(folder){
   if(!folderModal)return;
   currentFolder=folder;
   if(folderModalTitle)folderModalTitle.textContent=folder.name;
   if(folderModalDocs)folderModalDocs.hidden=true; if(folderModalEmpty)folderModalEmpty.hidden=true;
   if(folderModalError)folderModalError.hidden=true;
   if(folderModalPassword)folderModalPassword.value='';
   const needsPassword=!!folder.is_locked && !unlockedFolders.has(folder.id);
   if(folderModalLock)folderModalLock.hidden=!needsPassword;
   folderModal.classList.add('show'); folderModal.setAttribute('aria-hidden','false');
   if(!needsPassword){ await fetchAndShowDocs(folder,null); }
   else { folderModalPassword?.focus(); }
 }

 folderModalUnlock?.addEventListener('click',async()=>{
   if(!currentFolder)return;
   setBusy(folderModalUnlock,true,'Ашу');
   const ok=await fetchAndShowDocs(currentFolder,folderModalPassword?.value.trim());
   setBusy(folderModalUnlock,false,'Ашу');
   if(ok){ if(folderModalLock)folderModalLock.hidden=true; if(folderModalError)folderModalError.hidden=true; }
   else if(folderModalError){ folderModalError.hidden=false; }
 });
 folderModalPassword?.addEventListener('keydown',e=>{if(e.key==='Enter')folderModalUnlock?.click();});

 /* ---------- Admin-facing lists (with edit / delete buttons) ---------- */
 /* ---------- Test results (admin) ---------- */
 let resultsCache=[];
 function filteredResults(){
   const tid=document.getElementById('a-results-test')?.value||'';
   const cls=(document.getElementById('a-results-class')?.value||'').trim().toLowerCase().replace(/\s+/g,'');
   return resultsCache.filter(r=>(!tid||String(r.test_id)===tid)&&(!cls||String(r.class_name||'').toLowerCase().replace(/\s+/g,'').includes(cls)));
 }
 function renderTestResults(){
   const box=document.getElementById('a-results-list'); if(!box)return;
   const rows=filteredResults(); box.innerHTML='';
   if(!rows.length){ box.innerHTML='<p class="admin-empty">Нәтиже жоқ.</p>'; return; }
   rows.forEach(r=>{
     const row=document.createElement('div'); row.className='admin-list-item';
     const d=r.created_at?new Date(r.created_at).toLocaleString('kk-KZ'):'';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(r.student_name)} · ${escapeHtml(r.class_name)}</strong><small>${escapeHtml(r.test_title||'')} · ${d}</small></div><div class="ali-actions"><strong>${r.score} / ${r.total}</strong></div>`;
     box.appendChild(row);
   });
 }
 async function loadTestResults(){
   const box=document.getElementById('a-results-list'); if(!box)return;
   const [a,t]=await Promise.all([
     sb.from('school_test_attempts').select('*').order('created_at',{ascending:false}),
     sb.from('school_tests').select('id,title')
   ]);
   if(a.error){ box.innerHTML='<p class="admin-empty">Нәтижелерді жүктеу мүмкін болмады.</p>'; return; }
   const titles={}; (t.data||[]).forEach(x=>{titles[x.id]=x.title;});
   resultsCache=(a.data||[]).map(r=>({...r,test_title:titles[r.test_id]||''}));
   const sel=document.getElementById('a-results-test');
   if(sel){ const cur=sel.value; sel.innerHTML='<option value="">Барлық тесттер</option>'+(t.data||[]).map(x=>`<option value="${x.id}">${escapeHtml(x.title)}</option>`).join(''); sel.value=cur; }
   renderTestResults();
 }
 document.getElementById('a-results-test')?.addEventListener('change',renderTestResults);
 document.getElementById('a-results-class')?.addEventListener('input',renderTestResults);
 document.getElementById('a-results-refresh')?.addEventListener('click',loadTestResults);
 document.getElementById('a-results-export')?.addEventListener('click',()=>{
   const rows=filteredResults(); if(!rows.length){toast('Жүктейтін нәтиже жоқ.','error');return;}
   const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
   const lines=[['Тест','Аты-жөні','Сынып','Балл','Барлығы','Күні'].map(esc).join(';')];
   rows.forEach(r=>lines.push([r.test_title,r.student_name,r.class_name,r.score,r.total,r.created_at?new Date(r.created_at).toLocaleString('kk-KZ'):''].map(esc).join(';')));
   const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
   const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='test-results.csv'; document.body.appendChild(a); a.click(); a.remove();
 });

 /* ---------- Lesson schedule ---------- */
 const DAY_NAMES=['ДҮЙСЕНБІ','СЕЙСЕНБІ','СӘРСЕНБІ','БЕЙСЕНБІ','ЖҰМА'];
 const DAY_SHORT=['Дс','Сс','Ср','Бс','Жм'];
 let scheduleData={}; // class -> [rows sorted by lesson_no]
 let schedPublicClass=null;
 const schedTable=document.getElementById('schedule-table');
 const schedChips=document.getElementById('schedule-classes');
 const aSchedClass=document.getElementById('a-sched-class');
 const aSchedEditor=document.getElementById('a-sched-editor');

 function sortClasses(list){
   return list.slice().sort((a,b)=>{
     const na=parseInt(a,10), nb=parseInt(b,10);
     return na!==nb?na-nb:a.localeCompare(b,'kk');
   });
 }
 function renderPublicSchedule(){
   if(!schedTable||!schedChips)return;
   const classes=sortClasses(Object.keys(scheduleData));
   if(!classes.length){ schedChips.innerHTML=''; schedTable.innerHTML='<p class="admin-empty">Кесте жақында қосылады.</p>'; return; }
   if(!schedPublicClass||!scheduleData[schedPublicClass])schedPublicClass=classes[0];
   schedChips.innerHTML='';
   classes.forEach(c=>{
     const b=document.createElement('button'); b.type='button';
     b.className='sched-chip'+(c===schedPublicClass?' active':''); b.textContent=c;
     b.addEventListener('click',()=>{schedPublicClass=c; renderPublicSchedule();});
     schedChips.appendChild(b);
   });
   const today=new Date().getDay(); // 1..5 = Mon..Fri
   const rows=scheduleData[schedPublicClass]||[];
   let html='<table class="sched-table"><thead><tr><th>№</th><th>Уақыты</th>'+DAY_NAMES.map((d,i)=>`<th class="${today===i+1?'today':''}">${d}</th>`).join('')+'</tr></thead><tbody>';
   rows.forEach(r=>{
     html+=`<tr><td class="sched-no">${r.lesson_no}</td><td class="sched-time">${escapeHtml(r.time_text||'')}${r.break_text?`<small>${escapeHtml(r.break_text)}</small>`:''}</td>`;
     [r.d1,r.d2,r.d3,r.d4,r.d5].forEach((v,i)=>{ html+=`<td class="${today===i+1?'today':''}">${v?escapeHtml(v):'<span class="sched-empty">—</span>'}</td>`; });
     html+='</tr>';
   });
   html+='</tbody></table>';
   schedTable.innerHTML=html;
 }

 // Admin editor keeps its own working copy of the selected class
 let schedEditRows=[];
 function renderAdminSchedule(){
   if(!aSchedClass||!aSchedEditor)return;
   const classes=sortClasses(Object.keys(scheduleData));
   const cur=aSchedClass.value;
   aSchedClass.innerHTML=classes.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)} сынып</option>`).join('');
   if(cur&&classes.includes(cur))aSchedClass.value=cur;
   loadSchedEditor();
 }
 function loadSchedEditor(){
   const c=aSchedClass?.value;
   schedEditRows=(scheduleData[c]||[]).map(r=>({...r}));
   drawSchedEditor();
 }
 function drawSchedEditor(){
   if(!aSchedEditor)return;
   if(!aSchedClass?.value){ aSchedEditor.innerHTML='<p class="admin-empty">Кесте әлі қосылмаған (SQL скриптін орындаңыз).</p>'; return; }
   aSchedEditor.innerHTML='';
   schedEditRows.forEach((r,idx)=>{
     const box=document.createElement('div'); box.className='sched-ed-lesson';
     const days=[r.d1,r.d2,r.d3,r.d4,r.d5];
     box.innerHTML=`<div class="sched-ed-head"><strong>${r.lesson_no}-сабақ</strong><input data-f="time_text" placeholder="Уақыты (8:00–8:45)" value="${escapeHtml(r.time_text||'')}"><input data-f="break_text" placeholder="Үзіліс" value="${escapeHtml(r.break_text||'')}"><button type="button" class="icon-btn danger" title="Өшіру">🗑</button></div><div class="sched-ed-days">${days.map((v,i)=>`<div><label>${DAY_SHORT[i]}</label><input data-f="d${i+1}" value="${escapeHtml(v||'')}"></div>`).join('')}</div>`;
     box.querySelectorAll('input[data-f]').forEach(inp=>inp.addEventListener('input',()=>{schedEditRows[idx][inp.dataset.f]=inp.value;}));
     box.querySelector('.danger').onclick=async()=>{
       if(!confirm(`${r.lesson_no}-сабақты өшіру керек пе?`))return;
       if(r.id){ const {error}=await sb.from('lesson_schedule').delete().eq('id',r.id); if(error){toast('Өшіру кезінде қате шықты.','error');return;} }
       schedEditRows.splice(idx,1); await loadSchedule(); toast('Сабақ өшірілді.');
     };
     aSchedEditor.appendChild(box);
   });
   if(!schedEditRows.length)aSchedEditor.innerHTML='<p class="admin-empty">Бұл сыныпта сабақ жоқ. «+ Сабақ қосу» басыңыз.</p>';
 }
 aSchedClass?.addEventListener('change',loadSchedEditor);
 document.getElementById('a-sched-add')?.addEventListener('click',()=>{
   const c=aSchedClass?.value; if(!c)return;
   const next=schedEditRows.reduce((m,r)=>Math.max(m,r.lesson_no),0)+1;
   schedEditRows.push({class_name:c,lesson_no:next,time_text:'',break_text:'',d1:'',d2:'',d3:'',d4:'',d5:''});
   drawSchedEditor();
 });
 document.getElementById('a-sched-save')?.addEventListener('click',async()=>{
   const c=aSchedClass?.value; if(!c||!schedEditRows.length)return;
   const btn=document.getElementById('a-sched-save');
   const payload=schedEditRows.map(r=>({class_name:c,lesson_no:r.lesson_no,time_text:(r.time_text||'').trim(),break_text:(r.break_text||'').trim(),d1:(r.d1||'').trim(),d2:(r.d2||'').trim(),d3:(r.d3||'').trim(),d4:(r.d4||'').trim(),d5:(r.d5||'').trim()}));
   setBusy(btn,true,'Кестені сақтау');
   const {error}=await sb.from('lesson_schedule').upsert(payload,{onConflict:'class_name,lesson_no'});
   setBusy(btn,false,'Кестені сақтау');
   if(error){toast('Кестені сақтау кезінде қате шықты.','error');return;}
   await loadSchedule(); toast('Кесте сақталды!');
 });
 async function loadSchedule(){
   const {data,error}=await sb.from('lesson_schedule').select('*').order('lesson_no',{ascending:true});
   scheduleData={};
   if(!error)(data||[]).forEach(r=>{(scheduleData[r.class_name]=scheduleData[r.class_name]||[]).push(r);});
   renderPublicSchedule(); renderAdminSchedule();
 }

 /* ---------- KITAPVERSE: жаңа оқушыларды қосу (admin) ---------- */
const KV_CLASS_RE=/^\d{1,2}[A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]$/;
function kvParseStudents(text){
  return String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map((line,idx)=>{
    const toks=line.split(/[\t;,|]+/).map(t=>t.trim()).filter(Boolean);
    const r={line:idx+1,iin:'',class_name:'',full_name:'',password:'',errors:[]};
    const rest=[];
    toks.forEach(t=>{
      const compact=t.replace(/\s/g,'');
      if(!r.iin&&/^\d{12}$/.test(compact))r.iin=compact;
      else if(!r.class_name&&KV_CLASS_RE.test(compact))r.class_name=compact;
      else rest.push(t);
    });
    if(rest.length){r.full_name=rest[0].replace(/\s+/g,' ');if(rest[1])r.password=rest[1];}
    if(rest.length>2)r.errors.push('артық баған');
    if(!r.iin)r.errors.push('ИИН (12 сан) жоқ');
    if(!r.class_name)r.errors.push('сынып жоқ');
    if(!r.full_name)r.errors.push('аты-жөні жоқ');
    if(r.password&&r.password.length<6)r.errors.push('пароль кемінде 6 таңба');
    return r;
  });
}
window.kvParseStudents=kvParseStudents;
let kvLastStudentResult=[];
document.getElementById('a-students-add')?.addEventListener('click',async e=>{
  const btn=e.currentTarget,box=document.getElementById('a-students-result');
  const rows=kvParseStudents(document.getElementById('a-students-text').value);
  if(!rows.length){toast('Алдымен оқушылар тізімін жазыңыз.','error');return;}
  const iins=rows.map(r=>r.iin).filter(Boolean);const dup=iins.find((x,i)=>iins.indexOf(x)!==i);
  const bad=rows.filter(r=>r.errors.length);
  if(bad.length){toast(`${bad[0].line}-жолда қате: ${bad[0].errors.join(', ')}. Алдын ала қарауды тексеріңіз.`,'error');return;}
  if(dup){toast('Тізімде бір ИИН екі рет кездеседі: '+dup,'error');return;}
  const reset=document.getElementById('a-students-reset').checked;
  if(!confirm(`${rows.length} оқушыны қосуға сенімдісіз бе?${reset?'\nБар оқушылардың парольдері жаңартылады!':''}`))return;
  setBusy(btn,true,'Оқушыларды қосу');
  const {data,error}=await sb.rpc('kv_add_students',{p_students:rows.map(r=>({iin:r.iin,full_name:r.full_name,class_name:r.class_name,password:r.password||null})),p_reset_password:reset});
  setBusy(btn,false,'Оқушыларды қосу');
  if(error){toast('Қосу кезінде қате шықты: '+(error.message||''),'error');return;}
  kvLastStudentResult=data||[];
  const okN=kvLastStudentResult.filter(r=>!String(r.status).startsWith('қате')).length;
  box.innerHTML=`<div class="a-st-result"><p><b>${okN} / ${kvLastStudentResult.length}</b> оқушы сақталды. ⚠️ Парольдер тек қазір көрсетіледі — көшіріп алыңыз немесе CSV жүктеңіз, оқушыларға беріңіз.</p><div class="a-st-table-wrap"><table class="a-st-table"><thead><tr><th>Аты-жөні</th><th>Сынып</th><th>Логин (ИИН)</th><th>Пароль</th><th>Нәтиже</th></tr></thead><tbody>${kvLastStudentResult.map(r=>`<tr class="${String(r.status).startsWith('қате')?'bad':''}"><td>${escapeHtml(r.full_name||'')}</td><td>${escapeHtml(r.class_name||'')}</td><td>${escapeHtml(r.iin||'')}</td><td><code>${escapeHtml(r.password||'—')}</code></td><td>${escapeHtml(r.status||'')}</td></tr>`).join('')}</tbody></table></div><div class="admin-actions"><button class="btn btn-light" id="a-students-copy" type="button">📋 Көшіру</button><button class="btn btn-primary" id="a-students-csv" type="button">⬇ CSV жүктеу</button></div></div>`;
  document.getElementById('a-students-copy').onclick=async()=>{const t=kvLastStudentResult.filter(r=>r.password).map(r=>`${r.full_name}\t${r.class_name}\t${r.iin}\t${r.password}`).join('\n');try{await navigator.clipboard.writeText(t);toast('Көшірілді!');}catch(e){window.prompt('Көшіріңіз:',t);}};
  document.getElementById('a-students-csv').onclick=()=>{const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const csv='﻿'+['full_name,class_name,iin_login,password,email,status'].concat(kvLastStudentResult.map(r=>[r.full_name,r.class_name,r.iin,r.password||'',r.iin+'@students.kitapverse.local',r.status].map(q).join(','))).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='new-students.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);};
  if(okN)toast(`${okN} оқушы қосылды!`);
  if(okN<kvLastStudentResult.length)toast('Кейбір жолдарда қате бар — кестені қараңыз.','error');
});

/* ---------- KITAPVERSE: сынып жетекшілері (admin) ---------- */
async function loadTeachers(){
  const box=document.getElementById('a-teachers-list');if(!box)return;
  const classes=['6А','6Б','7А','8А','8Б','9А','9Б','10А','10Б'];
  const {data}=await sb.from('class_teachers').select('*');
  const map={};(data||[]).forEach(r=>{map[r.class_name]=r.teacher_name;});
  const cur={};box.querySelectorAll('input[data-class]').forEach(i=>{cur[i.dataset.class]=i.value;});
  box.innerHTML=classes.map(c=>`<label class="a-teacher-row"><b>${c}</b><input data-class="${c}" placeholder="Жетекшінің аты-жөні" maxlength="120" value="${escapeHtml(cur[c]!==undefined?cur[c]:(map[c]||''))}"></label>`).join('');
  box.dispatchEvent(new Event('input',{bubbles:true}));
}
document.getElementById('a-teachers-save')?.addEventListener('click',async e=>{
  const btn=e.currentTarget;const inputs=[...document.querySelectorAll('#a-teachers-list input[data-class]')];
  setBusy(btn,true,'Жетекшілерді сақтау');
  const res=await Promise.all(inputs.map(i=>sb.rpc('kv_set_class_teacher',{p_class:i.dataset.class,p_name:i.value.trim()})));
  setBusy(btn,false,'Жетекшілерді сақтау');
  const err=res.find(r=>r.error);
  if(err){toast('Сақтау кезінде қате шықты: '+(err.error.message||''),'error');return;}
  toast('Сынып жетекшілері сақталды!');
});
async function refreshAdminLists(){
  loadTeachers().catch(()=>{});
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

   const folderBox=document.getElementById('a-folder-admin-list');
   let foldersAdmin=[];
   if(folderBox){
     const ff=await sb.from('document_folders').select('*').order('created_at',{ascending:false});
     foldersAdmin=ff.data||[];
     folderBox.innerHTML='';
     if(ff.error){ folderBox.innerHTML='<p class="admin-empty">Папка кестесі әлі қосылмаған (SQL скриптін орындаңыз).</p>'; }
     else if(!foldersAdmin.length){ folderBox.innerHTML='<p class="admin-empty">Әзірге папка жоқ.</p>'; }
     else foldersAdmin.forEach(item=>{
       const locked=!!(item.password&&item.password.trim());
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${locked?'🔒':'📁'} ${escapeHtml(item.name)}</strong><small>${locked?'Құпиясөзбен қорғалған':'Ашық — бәрі көреді'}</small></div><div class="ali-actions"></div>`;
       const actions=row.querySelector('.ali-actions');
       if(locked){
         const unlockBtn=document.createElement('button'); unlockBtn.type='button'; unlockBtn.className='icon-btn'; unlockBtn.title='Құпиясөзді алып тастау (ашық ету)'; unlockBtn.textContent='🔓';
         unlockBtn.onclick=()=>unlockFolderRemovePassword(item.id);
         actions.appendChild(unlockBtn);
       }
       const editBtn=document.createElement('button'); editBtn.type='button'; editBtn.className='icon-btn'; editBtn.title='Өңдеу'; editBtn.textContent='✎';
       editBtn.onclick=()=>startEditFolder({...item,is_locked:locked});
       const delBtn=document.createElement('button'); delBtn.type='button'; delBtn.className='icon-btn danger'; delBtn.title='Өшіру'; delBtn.textContent='🗑';
       delBtn.onclick=()=>deleteFolder(item.id);
       actions.appendChild(editBtn); actions.appendChild(delBtn);
       folderBox.appendChild(row);
     });
   }
   const folderNameById={}; foldersAdmin.forEach(f=>{folderNameById[f.id]=f.name;});

   const d=await sb.from('documents').select('*').order('created_at',{ascending:false});
   docBox.innerHTML='';
   if(!d.data || !d.data.length){ docBox.innerHTML='<p class="admin-empty">Әзірге құжат жоқ.</p>'; }
   else d.data.forEach(item=>{
     const row=document.createElement('div'); row.className='admin-list-item';
     const folderLabel=item.folder_id&&folderNameById[item.folder_id]?` · 📁 ${escapeHtml(folderNameById[item.folder_id])}`:'';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.file_name||'')}${folderLabel}</small></div><div class="ali-actions"><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
     row.querySelector('.icon-btn:not(.danger)').onclick=()=>startEditDoc(item);
     row.querySelector('.icon-btn.danger').onclick=()=>deleteDoc(item.id,item.storage_path);
     docBox.appendChild(row);
   });

   const bookBox=document.getElementById('a-book-admin-list');
   if(bookBox){
     const b=await sb.from('library_books').select('*').order('grade',{ascending:true}).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
     bookBox.innerHTML='';
     if(!b.data || !b.data.length){ bookBox.innerHTML='<p class="admin-empty">Әзірге кітап жоқ.</p>'; }
     else b.data.forEach((item,idx)=>{
       const same=b.data.filter(x=>x.grade===item.grade),pos=same.findIndex(x=>x.id===item.id);
       const row=document.createElement('div'); row.className='admin-list-item';
       row.innerHTML=`<div class="ali-info"><strong>${item.is_bonus?'🎁':'№'+(pos+1)} ${escapeHtml(item.icon||'📕')} ${escapeHtml(item.title)}</strong><small>${item.grade?item.grade+' сынып · ':''}${escapeHtml(item.author||'')}</small></div><div class="ali-actions"><button class="icon-btn up" title="Жоғары (ертерек беріледі)" ${pos===0?'disabled':''}>↑</button><button class="icon-btn down" title="Төмен (кейінірек беріледі)" ${pos===same.length-1?'disabled':''}>↓</button><button class="icon-btn" title="Өңдеу" aria-label="Өңдеу">✎</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.up').onclick=()=>moveBook(same,pos,-1);
       row.querySelector('.down').onclick=()=>moveBook(same,pos,1);
       row.querySelector('.icon-btn:not(.danger):not(.up):not(.down)').onclick=()=>startEditBook(item);
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

   const battleBox=document.getElementById('a-battle-admin-list');
   if(battleBox){
     const [bt,bg,bq]=await Promise.all([sb.from('battles').select('*').order('battle_date',{ascending:true}),sb.from('battle_groups').select('*').order('id'),sb.from('battle_questions').select('id,battle_id,group_id')]);
     const battlesData=bt.data||[];
     battleBox.innerHTML='';
     if(!battlesData.length){ battleBox.innerHTML='<p class="admin-empty">Әзірге battle жарияланған жоқ.</p>'; }
     else battlesData.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       const when=new Date(item.battle_date).toLocaleString('kk-KZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
       const groups=(bg.data||[]).filter(g=>g.battle_id===item.id);
       const qcount=g=>(bq.data||[]).filter(q=>q.group_id===g.id).length;
       const gtxt=groups.length?groups.map(g=>`${g.classes} — «${g.book_title}» (${qcount(g)} сұрақ)`).join(' · '):`${item.classes} (ескі формат)`;
       row.innerHTML=`<div class="ali-info"><strong>⚔️ ${escapeHtml(item.title)}</strong><small>${escapeHtml(gtxt)}</small><small>${when} · ${battleCountdownLabel(item.battle_date)}</small></div><div class="ali-actions"><button class="icon-btn" title="Уақытын өзгерту" aria-label="Уақытын өзгерту">🕒</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>rescheduleBattle(item);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteBattle(item.id);
       battleBox.appendChild(row);
     });
   }

   const leagueBox=document.getElementById('a-league-admin-list');
   if(leagueBox){
     const lr=await sb.from('league_rounds').select('*').order('starts_at',{ascending:false});
     leagueBox.innerHTML='';
     if(lr.error){leagueBox.innerHTML='<p class="admin-empty">Лига кестелері әлі құрылмаған (KITAPVERSE-V4-SETUP.sql іске қосылмаған).</p>';}
     else if(!(lr.data||[]).length){leagueBox.innerHTML='<p class="admin-empty">Әзірге тур жоқ.</p>';}
     else lr.data.forEach(item=>{
       const row=document.createElement('div'); row.className='admin-list-item';
       const when=new Date(item.starts_at).toLocaleString('kk-KZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
       row.innerHTML=`<div class="ali-info"><strong>🏟️ ${escapeHtml(item.title)}: ${escapeHtml(item.school_a)} vs ${escapeHtml(item.school_b)}</strong><small>📖 ${escapeHtml(item.book_title)} · ${when} · ${item.duration_min} мин</small></div><div class="ali-actions"><button class="icon-btn" title="Сілтемені көшіру" aria-label="Сілтемені көшіру">🔗</button><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;
       row.querySelector('.icon-btn:not(.danger)').onclick=()=>copyLeagueLink(item.id);
       row.querySelector('.icon-btn.danger').onclick=()=>deleteLeagueRound(item.id);
       leagueBox.appendChild(row);
     });
   }

   const questBox=document.getElementById('a-quest-admin-list');
   if(questBox){
     const qst=await sb.from('quests').select('*').order('created_at',{ascending:false}); questBox.innerHTML='';
     if(!qst.data||!qst.data.length)questBox.innerHTML='<p class="admin-empty">Әзірге квест жоқ.</p>';
     else qst.data.forEach(item=>{const row=document.createElement('div');row.className='admin-list-item';row.innerHTML=`<div class="ali-info"><strong>🎮 ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description||'Оқу квесті')}</small></div><div class="ali-actions"><button class="icon-btn danger" title="Өшіру" aria-label="Өшіру">🗑</button></div>`;row.querySelector('.icon-btn.danger').onclick=async()=>{if(!confirm('Бұл квестті және оның нәтижелерін өшіруге сенімдісіз бе?'))return;const {error}=await sb.from('quests').delete().eq('id',item.id);if(error)toast('Квестті өшіру кезінде қате шықты.','error');else{await refreshAdminLists();toast('Квест өшірілді.');}};questBox.appendChild(row);});
   }

   const quizBox=document.getElementById('a-quiz-admin-list');
   if(quizBox){
     const q=await sb.from('quiz_questions').select('*').order('starts_at',{ascending:false}).order('sequence_no',{ascending:true});
     quizBox.innerHTML='';
     if(!q.data || !q.data.length){ quizBox.innerHTML='<p class="admin-empty">Әзірге викторина пакеті жоқ.</p>'; }
     else {
       const groups={};
       q.data.forEach(item=>{const key=item.batch_id||`single-${item.id}`;(groups[key]??=[]).push(item);});
       Object.values(groups).sort((a,b)=>new Date(b[0].starts_at||b[0].created_at)-new Date(a[0].starts_at||a[0].created_at)).forEach(group=>{
         const first=group[0], now=Date.now(), start=first.starts_at?new Date(first.starts_at).getTime():0, end=first.ends_at?new Date(first.ends_at).getTime():0;
         const status=now<start?'Күтілуде':now<end?'🟢 Қазір':'Архив';
         const row=document.createElement('div'); row.className='admin-list-item';
         row.innerHTML=`<div class="ali-info"><strong>🧠 ${group.length} сұрақ · ${escapeHtml(status)}</strong><small>${first.starts_at?new Date(first.starts_at).toLocaleString('kk-KZ'):''} бастап · әр сұрақ 24 сағат</small></div>`;
         quizBox.appendChild(row);
       });
     }
   }

   const testBox=document.getElementById('a-test-admin-list'); loadTestResults();
   if(testBox){const t=await sb.from('school_tests').select('*').order('created_at',{ascending:false});testBox.innerHTML='';if(!t.data?.length)testBox.innerHTML='<p class="admin-empty">Әзірге тест жоқ.</p>';else t.data.forEach(item=>{const row=document.createElement('div');row.className='admin-list-item';row.innerHTML=`<div class="ali-info"><strong>📝 ${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description||'Мектеп тесті')}</small></div><div class="ali-actions"><button class="icon-btn danger">🗑</button></div>`;row.querySelector('.danger').onclick=async()=>{if(!confirm('Тестті өшіру керек пе?'))return;const {error}=await sb.from('school_tests').delete().eq('id',item.id);if(error)toast('Тестті өшіру қатесі.','error');else{await refreshAdminLists();await loadSchoolTests();toast('Тест өшірілді.');}};testBox.appendChild(row);});}

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


 /* ---------- KITAPVERSE: оқушылар прогресі (кітаптар, квесттер, тесттер) ---------- */
 const PG_STATUS={done:'✅ өтті',pending:'⏳ тексеруде',failed:'❌ өтпеді',violation:'⛔ ереже бұзылды',started:'⏳ үзілген',zeroed:'0️⃣ нөлденген',open:'⬜ әлі жоқ'};
 const PG_REASON={tab:'басқа қойынды',blur:'басқа терезе',unload:'бетті жапты',reopened:'бетті жаңартты',timeout:'уақыт бітті',hidden:'басқа қойынды',left:'шықты'};
 const pgFmt=d=>d?new Date(d).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
 let pgRows=[], pgOpenId=null;
 async function loadPgSettings(){
   const {data}=await sb.from('kv_quest_settings').select('*').eq('id',1).maybeSingle();
   if(data){document.getElementById('a-pg-perweek').value=data.per_week;document.getElementById('a-pg-limit').value=data.time_limit_min;}
 }
 document.getElementById('a-pg-save-settings')?.addEventListener('click',async()=>{
   const per=parseInt(document.getElementById('a-pg-perweek').value,10),lim=parseInt(document.getElementById('a-pg-limit').value,10);
   if(!(per>=1&&per<=10&&lim>=3&&lim<=120)){toast('Мәндерді тексеріңіз.','error');return;}
   const {error}=await sb.from('kv_quest_settings').update({per_week:per,time_limit_min:lim}).eq('id',1);
   toast(error?'Сақтау қатесі.':'Баптаулар сақталды.',error?'error':'success');
 });
 async function loadStudentProgress(){
   const box=document.getElementById('a-pg-list');if(!box)return;
   box.innerHTML='<p class="admin-empty">Жүктелуде...</p>';
   loadPgSettings();loadReviewers();
   const {data,error}=await sb.rpc('kv_admin_students_overview');
   if(error){box.innerHTML='<p class="admin-empty">Қате: KITAPVERSE-V5-QUESTS.sql Supabase-те орындалғанын тексеріңіз.</p>';return;}
   pgRows=data||[];
   const sel=document.getElementById('a-pg-class'),cur=sel.value;
   const classes=[...new Set(pgRows.map(r=>r.class_name))];
   sel.innerHTML='<option value="">Барлық сыныптар</option>'+classes.map(c=>`<option>${escapeHtml(c)}</option>`).join('');sel.value=classes.includes(cur)?cur:'';
   renderPgList();
 }
 function renderPgList(){
   const box=document.getElementById('a-pg-list'),cls=document.getElementById('a-pg-class').value,q=document.getElementById('a-pg-search').value.trim().toLowerCase();
   const rows=pgRows.filter(r=>(!cls||r.class_name===cls)&&(!q||r.full_name.toLowerCase().includes(q)));
   if(!rows.length){box.innerHTML='<p class="admin-empty">Оқушы табылмады.</p>';return;}
   box.innerHTML='';
   rows.forEach(r=>{
     const row=document.createElement('div');row.className='admin-list-item';row.style.cursor='pointer';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(r.full_name)} · ${escapeHtml(r.class_name)}</strong><small>📚 ${r.books_read} кітап · ✅ ${r.quests_done} квест (${r.quest_points} ұпай) · ⏳ ${r.quests_pending} тексеруде · ⛔ ${r.quests_bad} · 🧪 ${r.tests} тест · 📝 ${r.retellings} мазмұндама</small></div><div class="ali-actions"><button class="icon-btn" title="Ашу">›</button></div>`;
     row.onclick=()=>openPgDetail(r.student_id);box.appendChild(row);
   });
 }
 document.getElementById('a-pg-class')?.addEventListener('change',renderPgList);
 document.getElementById('a-pg-search')?.addEventListener('input',renderPgList);
 document.querySelector('[data-admin-tab="progress"]')?.addEventListener('click',loadStudentProgress);
 async function openPgDetail(id){
   pgOpenId=id;const box=document.getElementById('a-pg-detail');box.hidden=false;box.innerHTML='<p class="admin-empty">Жүктелуде...</p>';
   const {data,error}=await sb.rpc('kv_admin_student_detail',{p_student_id:id});
   if(error||!data){box.innerHTML='<p class="admin-empty">Деректер жүктелмеді.</p>';return;}
   const e=escapeHtml,st=s=>PG_STATUS[s]||s;
   const list=(arr,fn,empty)=>arr&&arr.length?arr.map(fn).join(''):`<p class="admin-empty">${empty}</p>`;
   box.innerHTML=`<h3>👤 ${e(data.student.full_name)} · ${e(data.student.class_name)}</h3>
   <div class="admin-actions"><button class="btn btn-light" data-pg="reroll">🎲 Аптаны қайта таңдау</button><button class="btn btn-light" data-pg="reset" style="color:#c0392b">🗑 Барлық квест нәтижесін нөлдеу</button><button class="btn btn-light" data-pg="close">Жабу</button></div>
   <h4>📅 Осы кезең (${e(String(data.period.start).slice(5))} – ${e(String(data.period.end).slice(5))})</h4>
   ${list(data.schedule,s=>`<div class="admin-list-item"><div class="ali-info"><strong>${e(s.book||s.quest)}</strong><small>${s.grade?s.grade+' сынып · ':''}дедлайн ${e(String(s.deadline).slice(5))} · ${st(s.state)}</small></div></div>`,'Әзірге жоқ')}
   <h4>🧩 Квесттер тарихы</h4>
   ${list(data.quests,x=>`<div class="admin-list-item"><div class="ali-info"><strong>${e(x.book||x.quest)}</strong><small>${st(x.status)}${x.reason?' ('+e(PG_REASON[x.reason]||x.reason)+')':''} · ${x.score}/${x.total} · ${pgFmt(x.at)}${x.video_url&&/^https?:\/\//i.test(x.video_url)?` · <a href="${e(x.video_url)}" target="_blank" rel="noopener">🎥 видео</a>`:''}${x.comment?' · «'+e(x.comment)+'»':''}</small></div><div class="ali-actions"><button class="btn btn-light" data-pg="chance" data-id="${x.attempt_id}" title="Квестті қайта өтуге рұқсат">🔁 Мүмкіндік</button>${x.status==='done'&&x.score>0?`<button class="btn btn-light" data-pg="zero" data-id="${x.attempt_id}">0️⃣ Нөлдеу</button>`:''}</div></div>`,'Квест өтпеген')}
   <h4>📚 Оқыған кітаптар (${data.books.length})</h4>
   ${list(data.books,b=>`<div class="admin-list-item"><div class="ali-info"><strong>${e(b.title)}${b.bonus?' 🎁':''}</strong><small>${b.grade?b.grade+' сынып · ':''}${pgFmt(b.read_at)}</small></div></div>`,'Әзірге жоқ')}
   <h4>🧪 Тесттер</h4>
   ${list(data.tests,t=>`<div class="admin-list-item"><div class="ali-info"><strong>${e(t.test)}</strong><small>${t.score}/${t.total} · ${pgFmt(t.at)}</small></div><div class="ali-actions"><button class="btn btn-light" data-pg="tchance" data-id="${t.attempt_id}">🔁 Мүмкіндік</button></div></div>`,'Тест тапсырмаған')}
   <p class="admin-hint">🧠 Викторина: ${data.quiz.count} жауап, ${data.quiz.points} ұпай · ⚔️ Battle: ${data.battles.count} қатысу, ${data.battles.points} ұпай</p>
   <h4>📝 Мазмұндамалар (${data.retellings.length})</h4>
   ${list(data.retellings,r=>`<details class="admin-list-item" style="display:block"><summary><strong>${e(r.book)}</strong> <small>${pgFmt(r.at)}</small></summary><p style="white-space:pre-wrap;margin:10px 0 0">${e(r.body)}</p></details>`,'Жоқ')}`;
   box.scrollIntoView({behavior:'smooth',block:'start'});
 }
 document.getElementById('a-pg-detail')?.addEventListener('click',async ev=>{
   const b=ev.target.closest('[data-pg]');if(!b)return;
   const act=b.dataset.pg,id=Number(b.dataset.id||0);
   const call=async(fn,args,msg)=>{const {error}=await sb.rpc(fn,args);if(error){toast('Қате шықты.','error');return false;}toast(msg);await openPgDetail(pgOpenId);loadStudentProgress();return true;};
   if(act==='close'){document.getElementById('a-pg-detail').hidden=true;return;}
   if(act==='chance'){if(confirm('Оқушыға бұл квесті қайта өтуге мүмкіндік берілсін бе? Ұпай қайтарылады.'))await call('kv_admin_quest_chance',{p_attempt_id:id},'Мүмкіндік берілді.');}
   else if(act==='zero'){if(confirm('Бұл квесттің нәтижесін нөлдейміз бе? Ұпай рейтингтен алынады.'))await call('kv_admin_quest_zero',{p_attempt_id:id},'Нәтиже нөлденді.');}
   else if(act==='tchance'){if(confirm('Оқушы бұл тестті қайта тапсыра алсын ба?'))await call('kv_admin_test_chance',{p_attempt_id:id},'Мүмкіндік берілді.');}
   else if(act==='reset'){if(confirm('БАРЛЫҚ квест нәтижелері, оқыған кітаптар және апталық кесте өшіріледі, ұпайлар рейтингтен алынады. Жалғастырасыз ба?'))await call('kv_admin_reset_student',{p_student_id:pgOpenId},'Оқушының нәтижелері нөлденді.');}
   else if(act==='reroll'){await call('kv_admin_reroll_week',{p_student_id:pgOpenId},'Апта қайта таңдалды.');}
 });

 /* ---------- Тексеруші мұғалімдер + толық нөлдеу ---------- */
 async function loadReviewers(){
   const box=document.getElementById('a-rv-list');if(!box)return;
   const {data,error}=await sb.rpc('kv_admin_reviewers');
   if(error){box.innerHTML='<p class="admin-empty">Қате: V6 SQL орындалғанын тексеріңіз.</p>';return;}
   if(!data||!data.length){box.innerHTML='<p class="admin-empty">Мұғалім әлі қосылмаған.</p>';return;}
   box.innerHTML='';
   data.forEach(r=>{
     const row=document.createElement('div');row.className='admin-list-item';
     row.innerHTML=`<div class="ali-info"><strong>${escapeHtml(r.name||r.email)}</strong><small>${escapeHtml(r.email||'')} · ${r.classes&&r.classes.length?escapeHtml(r.classes.join(', ')):'барлық сынып'}</small></div><div class="ali-actions"><button class="icon-btn danger" title="Өшіру">🗑</button></div>`;
     row.querySelector('.icon-btn').onclick=async()=>{if(!confirm('Бұл мұғалімнің тексеру рұқсаты өшірілсін бе?'))return;await sb.rpc('kv_admin_remove_reviewer',{p_uid:r.uid});loadReviewers();};
     box.appendChild(row);
   });
 }
 document.getElementById('a-rv-add')?.addEventListener('click',async()=>{
   const email=document.getElementById('a-rv-email').value.trim(),name=document.getElementById('a-rv-name').value.trim(),classes=document.getElementById('a-rv-classes').value.trim();
   if(!email){toast('Поштаны енгізіңіз.','error');return;}
   const {data,error}=await sb.rpc('kv_admin_add_reviewer',{p_email:email,p_name:name,p_classes:classes});
   if(error||!data||!data.ok){toast(data&&data.error==='no_user'?'Бұл пошта Supabase → Authentication → Users ішінде жоқ. Алдымен сол жерде аккаунт жасаңыз.':'Қате шықты.','error');return;}
   ['a-rv-email','a-rv-name','a-rv-classes'].forEach(i=>document.getElementById(i).value='');
   toast('Мұғалім қосылды.');loadReviewers();
 });
 async function resetAll(full){
   const {data,error}=await sb.rpc('kv_admin_reset_all',{p_full:full});
   if(error||!data||!data.ok){toast('Нөлдеу кезінде қате шықты.','error');return;}
   toast(`Нөлденді: ${data.attempts} квест нәтижесі, ${data.books} оқылған кітап.`);
   document.getElementById('a-pg-detail').hidden=true;loadStudentProgress();refreshAdminLists();
 }
 document.getElementById('a-reset-quests')?.addEventListener('click',()=>{
   if(confirm('Барлық оқушының квест нәтижелері, оқылған кітаптары және ай кестесі нөлденеді. Бәрі қайтадан басталады. Жалғастырасыз ба?'))resetAll(false);
 });
 document.getElementById('a-reset-full')?.addEventListener('click',()=>{
   if(!confirm('ТОЛЫҚ нөлдеу: квесттер, мазмұндамалар, тест, викторина, battle және сынып ұпайлары. Қайтару мүмкін емес!'))return;
   if((prompt('Растау үшін НӨЛДЕУ деп жазыңыз')||'').trim().toUpperCase()!=='НӨЛДЕУ'){toast('Бас тартылды.','error');return;}
   resetAll(true);
 });

 await loadPublic(); await loadQuestBookOptions(); await loadFolderOptions(); await loadSchedule();
})();
