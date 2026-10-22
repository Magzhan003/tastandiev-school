/* ========================= Navigation ========================= */
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
if(toggle){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');});}
document.querySelectorAll('.nav a').forEach(link=>link.addEventListener('click',()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}));

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
 const box=document.getElementById('toast-container'); if(!box){return;}
 const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; box.appendChild(el);
 setTimeout(()=>{el.classList.add('hide'); setTimeout(()=>el.remove(),250);},3200);
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function setBusy(btn,busy,idleLabel){ if(!btn)return; btn.disabled=busy; btn.textContent=busy?'Жүктелуде...':idleLabel; }
/* Normalize a class name so lookalike input never creates a hidden duplicate
   row in the rating (e.g. "8 А", "8а", latin "8A" all become "8А"). */
function normalizeClassName(s){
 if(!s)return '';
 let out=String(s).trim().toUpperCase().replace(/\s+/g,'');
 const map={'A':'А','B':'В','E':'Е','K':'К','M':'М','H':'Н','O':'О','P':'Р','C':'С','T':'Т','X':'Х','Y':'У'};
 out=out.replace(/[ABEKMHOPCTXY]/g,ch=>map[ch]);
 return out;
}
/* Battle "classes" field can hold several class names separated by commas. */
function splitClassList(s){
 return String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
}
function normalizeClassList(s){
 return splitClassList(s).map(normalizeClassName);
}

/* ========================= KITAPVERSE data + interactions ========================= */
(async function(){
 const configured=window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('PASTE_') && window.SUPABASE_ANON_KEY.length>20;
 const booksBox=document.getElementById('kv-books');
 const barsBox=document.getElementById('kv-bars');
 const gapBox=document.getElementById('kv-gap');
 const questListBox=document.getElementById('kv-quest-list');
 const quizBox=document.getElementById('kv-quiz-box');
 const battleListBox=document.getElementById('kv-battle-list');
 const studentsBox=document.getElementById('kv-students');
 const rewardsBox=document.getElementById('kv-rewards');
 const authGuest=document.getElementById('kv-auth-guest'), authUser=document.getElementById('kv-auth-user'), loginBox=document.getElementById('kv-login-box');
 const loginBtn=document.getElementById('kv-login-btn'), loginSubmit=document.getElementById('kv-login-submit'), logoutBtn=document.getElementById('kv-logout-btn');
 const loginIin=document.getElementById('kv-login-iin'), loginPassword=document.getElementById('kv-login-password');
 const userNameBox=document.getElementById('kv-user-name'), userClassBox=document.getElementById('kv-user-class'), userXpBox=document.getElementById('kv-user-xp'), userStreakBox=document.getElementById('kv-user-streak'), userBooksBox=document.getElementById('kv-user-books'), userLevelBox=document.getElementById('kv-user-level');
 const readingProgressBox=document.getElementById('kv-reading-progress');
 const profileDashboard=document.getElementById('kv-profile-dashboard');
 const profileName=document.getElementById('kv-profile-name'), profileClass=document.getElementById('kv-profile-class'), profileLevel=document.getElementById('kv-profile-level');
 const profileXp=document.getElementById('kv-profile-xp'), profileStreak=document.getElementById('kv-profile-streak'), profileBooks=document.getElementById('kv-profile-books');
 const profileLevelText=document.getElementById('kv-profile-level-text'), profileLevelBar=document.getElementById('kv-profile-level-bar');
 const profileReadingText=document.getElementById('kv-profile-reading-text'), profileReadingBar=document.getElementById('kv-profile-reading-bar');
 const bookSearch=document.getElementById('kv-book-search');
 let bookFilter='all', bookSearchText='';
 let currentStudent=null, currentProgress=new Set(), openedQuests=new Set();

 if(!configured){
   if(booksBox)booksBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(barsBox)barsBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(quizBox)quizBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(battleListBox)battleListBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(studentsBox)studentsBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   return;
 }

 const {createClient}=window.supabase; const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);

 /* ---- Student profile / login / reading progress ---- */
 async function loadStudentProfile(){
   if(!sb?.auth)return;
   const {data:{session}}=await sb.auth.getSession();
   if(!session){currentStudent=null;currentProgress=new Set();renderStudentBar();return;}
   let {data,error}=await sb.from('student_profiles').select('*').eq('auth_user_id',session.user.id).eq('active',true).maybeSingle();
   if(!data){const claim=await sb.rpc('claim_my_student_profile');if(!claim.error){data=Array.isArray(claim.data)?claim.data[0]:claim.data;error=null;}}
   if(error||!data){currentStudent=null;currentProgress=new Set();renderStudentBar();toast('Бұл аккаунт үшін оқушы профилі табылмады. Әкімшілікке хабарласыңыз.','error');return;}
   currentStudent=data;
   try{Promise.resolve(sb.rpc('kv_touch_login')).then(()=>loadClassStats()).catch(()=>{});}catch(e){}
   const {data:prog}=await sb.from('book_progress').select('book_id,marked_read_at').eq('student_id',data.id);
   currentProgress=new Set((prog||[]).map(x=>String(x.book_id)));
   renderStudentBar();
   await loadStudentStats();
   await loadQuests();
   await loadQuizIntro();
   await loadBattles();
 }
 function renderStudentBar(){
   if(!authGuest||!authUser)return;
   const logged=!!currentStudent;
   authGuest.hidden=logged;authUser.hidden=!logged;
   if(profileDashboard)profileDashboard.hidden=!logged;
   if(logged){
     userNameBox.textContent=currentStudent.full_name;
     userClassBox.textContent=currentStudent.class_name;
     if(profileName)profileName.textContent=currentStudent.full_name;
     if(profileClass)profileClass.textContent=currentStudent.class_name;
     const initials=(currentStudent.full_name||'11').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
     const av=document.getElementById('kv-profile-avatar');if(av)av.textContent=initials||'11';
   }
   renderBooks();
 }
 async function loadStudentStats(){
   if(!currentStudent)return;
   const [xpRes,progressRes]=await Promise.all([
     sb.from('quiz_attempts').select('score,total,student_name,class_name,xp_applied,created_at').ilike('student_name',currentStudent.full_name).ilike('class_name',currentStudent.class_name),
     sb.from('book_progress').select('book_id,marked_read_at').eq('student_id',currentStudent.id)
   ]);
   const xp=(xpRes.data||[]).reduce((sum,r)=>sum+(r.xp_applied===false?0:Number(r.score||0)),0);
   const books=(progressRes.data||[]).length;
   const level=Math.max(1,Math.floor(xp/25)+1);
   const into=(xp%25), levelPct=Math.min(100,Math.round(into/25*100));
   if(userXpBox)userXpBox.textContent=xp;if(userBooksBox)userBooksBox.textContent=books;if(userLevelBox)userLevelBox.textContent=level;
   if(profileXp)profileXp.textContent=xp;if(profileBooks)profileBooks.textContent=books;if(profileLevel)profileLevel.textContent=level;
   if(profileLevelText)profileLevelText.textContent=`${into} / 25 XP`;
   if(profileLevelBar)profileLevelBar.style.width=`${levelPct}%`;
   const dates=new Set([...(xpRes.data||[]).map(r=>r.created_at),...(progressRes.data||[]).map(r=>r.marked_read_at)].filter(Boolean).map(x=>x.slice(0,10)));
   let streak=0,cursor=new Date();cursor.setHours(0,0,0,0);
   while(dates.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-1);}
   if(userStreakBox)userStreakBox.textContent=streak;if(profileStreak)profileStreak.textContent=streak;
   const total=Math.max(allBooks.length,1),pct=Math.min(100,Math.round(books/total*100));
   if(profileReadingText)profileReadingText.textContent=`${books} / ${allBooks.length} кітап`;
   if(profileReadingBar)profileReadingBar.style.width=`${pct}%`;
   if(readingProgressBox)readingProgressBox.innerHTML=`<div class="kv-progress-card"><strong>📚 Оқу прогресі</strong><span>${books} / ${allBooks.length} кітап · ${pct}%</span><div class="kv-progress-track"><i style="width:${pct}%"></i></div></div>`;
 }
 async function loginStudent(){
   const iin=(loginIin?.value||'').replace(/\D/g,'').trim(), password=(loginPassword?.value||'').trim();
   if(!iin||!password){toast('ИИН және пароль енгізіңіз.','error');return;}
   if(iin.length!==12){toast('ИИН 12 цифрдан тұруы керек.','error');return;}
   setBusy(loginSubmit,true,'Кіру');
   const email=`${iin}@students.kitapverse.local`;
   const {error}=await sb.auth.signInWithPassword({email,password});
   setBusy(loginSubmit,false,'Кіру');
   if(error){toast('Логин немесе пароль қате.','error');return;}
   loginBox.hidden=true; await loadStudentProfile();
   if(currentStudent)toast(`Қош келдіңіз, ${currentStudent.full_name}!`);
 }
 loginBtn?.addEventListener('click',()=>{loginBox.hidden=!loginBox.hidden;if(!loginBox.hidden)loginIin?.focus();});
 loginSubmit?.addEventListener('click',loginStudent);
 [loginIin,loginPassword].forEach(x=>x?.addEventListener('keydown',e=>{if(e.key==='Enter')loginStudent();}));
 logoutBtn?.addEventListener('click',async()=>{await sb.auth.signOut();currentStudent=null;currentProgress=new Set();if(loginIin)loginIin.value='';if(loginPassword)loginPassword.value='';if(loginBox)loginBox.hidden=true;renderStudentBar();toast('Профильден шықтыңыз.');});
 async function markBookRead(book){
   if(!currentStudent){loginBox.hidden=false;loginIin?.focus();toast('Алдымен оқушы аккаунтымен кіріңіз.','error');return;}
   const questId=questIdForBook(book);
   if(currentProgress.has(String(book.id))){
     if(questId){document.getElementById(`kv-quest-${questId}`)?.scrollIntoView({behavior:'smooth',block:'center'});}
     else toast('Бұл кітап бұрын расталған.','success');
     return;
   }
   if(!questId){
     toast('Бұл кітапқа квест әлі қосылмаған. Әкімшілік квестті байланыстырады.','error');
     return;
   }
   // "Мен оқыдым" does NOT mark the book as read. It only opens its quest.
   openedQuests.add(String(questId));
   await loadQuests();
   const card=document.getElementById(`kv-quest-${questId}`);
   if(card){card.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>card.querySelector('button')?.click(),250);}
   toast('🧩 Квест ашылды. Өткізіп болғаннан кейін кітап расталады!');
 }
 /* ---- Native quests ---- */
 async function submitQuestAttempt(questId,name,cls,answers){
   const {data,error}=await sb.rpc('submit_quest_attempt',{p_quest_id:questId,p_student_name:name,p_class_name:cls,p_answers:answers});
   if(error)throw error; return Array.isArray(data)?data[0]:data;
 }
 async function renderQuest(box,quest){
   const {data:questions,error}=await sb.from('quest_questions_public').select('*').eq('quest_id',quest.id).order('sequence_no',{ascending:true});
   if(error||!questions?.length){box.innerHTML='<p class="kv-empty">Бұл квесттің сұрақтары әлі дайын емес.</p>';return;}
   if(!currentStudent){box.innerHTML='<div class="kv-login-required"><span>🔐</span><div><b>Квестке қатысу үшін кіріңіз</b><small>Профиль арқылы нәтижеңіз бен XP дұрыс есептеледі.</small></div><button class="btn btn-primary" onclick="document.getElementById(\'kv-login-btn\')?.click()">Кіру →</button></div>';return;}
   box.innerHTML=`<div class="kv-quest-card kv-quest-wide"><div class="kv-quest-headline"><b>🎮</b><div><span class="kv-eyebrow">СЕНІҢ КВЕСТІҢ</span><h3>${escapeHtml(quest.title)}</h3></div><span class="kv-quest-player">👤 ${escapeHtml(currentStudent.full_name)}</span></div><p>${escapeHtml(quest.description||'Оқу квестін орындаңыз.')}</p><div class="kv-quest-questions"></div><button class="btn btn-primary quest-submit">Квестті аяқтау →</button><p class="kv-battle-note" style="margin-top:12px">⚠️ Бір оқушыға бір ғана мүмкіндік беріледі.</p></div>`;
   const qbox=box.querySelector('.kv-quest-questions');
   questions.forEach((q,i)=>{const card=document.createElement('div');card.className='kv-quest-question-card';card.innerHTML=`<div class="kv-quiz-progress">СҰРАҚ ${i+1} / ${questions.length}</div><div class="kv-quiz-question">${escapeHtml(q.question)}</div><label><input type="radio" name="qq-${q.id}" value="a"> ${escapeHtml(q.option_a)}</label><label><input type="radio" name="qq-${q.id}" value="b"> ${escapeHtml(q.option_b)}</label><label><input type="radio" name="qq-${q.id}" value="c"> ${escapeHtml(q.option_c)}</label><label><input type="radio" name="qq-${q.id}" value="d"> ${escapeHtml(q.option_d)}</label>`;qbox.appendChild(card);});
   box.querySelector('.quest-submit').onclick=async()=>{const name=currentStudent.full_name,cls=currentStudent.class_name;const answers=questions.map(q=>{const x=box.querySelector(`input[name="qq-${q.id}"]:checked`);return {question_id:q.id,answer:x?x.value:null};});const btn=box.querySelector('.quest-submit');btn.disabled=true;try{const r=await submitQuestAttempt(quest.id,name,cls,answers);
     // Only a successfully submitted quest confirms the linked book as read.
     const linkedBook=allBooks.find(b=>String(b.quest_id)===String(quest.id)||String(b.id)===String(quest.book_id));
     let bookConfirmed=false;
     if(linkedBook && !currentProgress.has(String(linkedBook.id))){
       const {error:progressError}=await sb.from('book_progress').upsert({student_id:currentStudent.id,book_id:linkedBook.id},{onConflict:'student_id,book_id'});
       if(!progressError){currentProgress.add(String(linkedBook.id));bookConfirmed=true;}
     } else if(linkedBook){bookConfirmed=true;}
     openedQuests.delete(String(quest.id));
     box.innerHTML=`<div class="kv-quiz-result"><p>🎉 Квест аяқталды!</p><div class="score">${r.score} / ${r.total}</div><p>${bookConfirmed?'📚 Кітап расталды. Нәтиже рейтингке қосылды.':'Нәтиже рейтингке қосылды. Кітап прогресін сақтау кезінде қайта байқап көріңіз.'}</p></div>`;
     await loadStudentStats();await loadBooks();await loadQuests();await loadRating();await loadStudents();}catch(err){btn.disabled=false;const m=String(err?.message||'');if(m.includes('already submitted'))toast('Бұл квест бұрын тапсырылған.','error');else toast('Квест нәтижесін сақтау кезінде қате шықты.','error');}};
 }
 let allQuestCards=[];
 let questsExpanded=false;
 const QUEST_PAGE_SIZE=3;
 async function loadQuests(){
   if(!questListBox)return;
   const {data,error}=await sb.from('quests').select('id,title,description,created_at,book_id').eq('published',true).order('created_at',{ascending:false});
   allQuests=(!error&&data)?data:[];
   if(error||!data?.length){questListBox.innerHTML='<p class="kv-empty">Жаңа квесттер жақында қосылады.</p>';allQuestCards=[];renderQuestToggle();renderBooks();return;}
   // A quest linked to a book stays HIDDEN until the student presses «Мен оқыдым» on that book
   // (openedQuests) or has already finished it (book is in currentProgress).
   // Standalone quests (not linked to any book) are always shown.
   const openedOrder=[...openedQuests].map(String).reverse();
   allQuestCards=data.map(q=>{
     const linkedBook=allBooks.find(b=>String(b.quest_id)===String(q.id)||String(b.id)===String(q.book_id));
     const isBookQuest=!!q.book_id||!!linkedBook;
     const opened=openedQuests.has(String(q.id));
     const done=!!linkedBook&&currentProgress.has(String(linkedBook.id));
     if(isBookQuest&&!opened&&!done)return null;
     const card=document.createElement('div');card.className='kv-quest-card';card.id=`kv-quest-${q.id}`;
     card.dataset.rank=String(opened&&!done?openedOrder.indexOf(String(q.id)):(done?1000:500));
     card.innerHTML=`<b>🎮</b><h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description||'Оқу квесті')}</p>${isBookQuest?`<span class="kv-quest-lock">${done?'✅ Квест тапсырылды':'🔓 Квест ашық'}</span>`:''}<button class="btn btn-primary" ${done?'disabled':''}>${done?'✅ Тапсырылды':'🧩 Квестті бастау →'}</button>`;
     if(!done)card.querySelector('button').onclick=()=>renderQuest(card,q);
     return card;
   }).filter(Boolean).sort((a,b)=>Number(a.dataset.rank)-Number(b.dataset.rank));
   renderQuestList();
   // Re-render the library so book cards immediately reflect quests linked via quest.book_id.
   renderBooks();
 }
 function renderQuestList(){
   if(!questListBox)return;
   questListBox.innerHTML='';
   if(!allQuestCards.length){
     questListBox.innerHTML='<p class="kv-empty">🧩 Квест осында ашылады. Кітапханадан кітап таңдап, оқып болған соң «Мен оқыдым» түймесін басыңыз.</p>';
     renderQuestToggle();
     return;
   }
   const visible=questsExpanded?allQuestCards:allQuestCards.slice(0,QUEST_PAGE_SIZE);
   visible.forEach(card=>questListBox.appendChild(card));
   renderQuestToggle();
 }
 function renderQuestToggle(){
   let toggle=document.getElementById('kv-quest-toggle');
   if(allQuestCards.length<=QUEST_PAGE_SIZE){toggle?.remove();return;}
   if(!toggle){
     toggle=document.createElement('button');
     toggle.id='kv-quest-toggle';
     toggle.className='btn btn-light kv-toggle-more';
     questListBox.insertAdjacentElement('afterend',toggle);
     toggle.onclick=()=>{questsExpanded=!questsExpanded;renderQuestList();};
   }
   toggle.textContent=questsExpanded?'▲ Жасыру':`▼ Барлық квесттер (${allQuestCards.length})`;
 }
 /* ---- Library, grouped by grade ---- */
 let allBooks=[];
 let allQuests=[];
 let booksExpanded=false;
 const BOOK_PAGE_SIZE=3;
 /* A quest can be linked to a book from either side: book.quest_id,
    or quest.book_id (this is what the admin panel actually sets when
    you pick a book while creating a quest). Always resolve both ways
    so the link never silently breaks. */
 function questIdForBook(book){
   if(book?.quest_id)return book.quest_id;
   const q=allQuests.find(q=>String(q.book_id)===String(book?.id));
   return q?q.id:null;
 }
 let selectedGrade='6';
 function renderBooks(){
   if(!booksBox)return;
   const query=bookSearchText.toLowerCase();
   const list=allBooks.filter(b=>{
     if(String(b.grade)!==selectedGrade)return false;
     const read=currentProgress.has(String(b.id));
     if(bookFilter==='read'&&!read)return false;
     if(bookFilter==='unread'&&read)return false;
     if(query&&!`${b.title||''} ${b.author||''} ${b.description||''}`.toLowerCase().includes(query))return false;
     return true;
   });
   const bookToggle=document.getElementById('kv-book-toggle');
   if(!list.length){booksBox.innerHTML=`<div class="kv-empty kv-empty-rich"><span>📚</span><b>Бұл сүзгіде кітап табылмады</b><small>Басқа сыныпты немесе іздеу сөзін көріңіз.</small></div>`;bookToggle?.remove();return;}
   const visibleList=booksExpanded?list:list.slice(0,BOOK_PAGE_SIZE);
   booksBox.innerHTML='';
   visibleList.forEach(x=>{
     const el=document.createElement('article');el.className=`kv-book card-in ${currentProgress.has(String(x.id))?'is-read':''}`;
     const read=currentProgress.has(String(x.id));const questId=questIdForBook(x);const link=x.drive_url||x.pdf_url;
     el.innerHTML=`<div class="kv-book-cover"><span>${escapeHtml(x.icon||'📕')}</span>${read?'<i>✓</i>':''}</div><div class="kv-book-content"><div class="kv-book-meta"><span>${String(x.grade||'')} СЫНЫП</span>${read?'<b>ОҚЫЛДЫ</b>':''}</div><h3>${escapeHtml(x.title)}</h3><div class="kv-book-actions">${link?`<a class="kv-book-pdf" href="${escapeHtml(link)}" target="_blank" rel="noopener">📖 Кітапты оқу <span>↗</span></a>`:''}<button class="btn ${read?'btn-light':'btn-primary'} kv-book-read" ${read?'disabled':''}>${read?'✓ Оқылды':'Мен оқыдым'}</button></div>${questId?`<small class="kv-book-quest">${read?'🧩 Квест дайын — төменге түсіңіз':'🔒 Кітапты оқып, «Мен оқыдым» басыңыз'}</small>`:''}</div>`;
     el.querySelector('.kv-book-read')?.addEventListener('click',()=>markBookRead(x));booksBox.appendChild(el);
   });
   renderBookToggle(list.length);
 }
 function renderBookToggle(total){
   let toggle=document.getElementById('kv-book-toggle');
   if(total<=BOOK_PAGE_SIZE){toggle?.remove();return;}
   if(!toggle){
     toggle=document.createElement('button');
     toggle.id='kv-book-toggle';
     toggle.className='btn btn-light kv-toggle-more';
     booksBox.insertAdjacentElement('afterend',toggle);
     toggle.onclick=()=>{booksExpanded=!booksExpanded;renderBooks();};
   } else {
     booksBox.insertAdjacentElement('afterend',toggle);
   }
   toggle.textContent=booksExpanded?'▲ Жасыру':`▼ Барлық кітаптар (${total})`;
 }
 async function loadBooks(){
   if(!booksBox)return;
   const {data,error}=await sb.from('library_books').select('*').order('created_at',{ascending:false});
   allBooks=(!error && data)?data:[];
   renderBooks();
 }
 document.querySelectorAll('.kv-grade-tab').forEach(btn=>btn.addEventListener('click',()=>{
   document.querySelectorAll('.kv-grade-tab').forEach(b=>b.classList.remove('selected'));
   btn.classList.add('selected'); selectedGrade=btn.dataset.grade; renderBooks();
 }));
 bookSearch?.addEventListener('input',e=>{bookSearchText=e.target.value.trim();renderBooks();});
 document.querySelectorAll('.kv-filter').forEach(btn=>btn.addEventListener('click',()=>{
   document.querySelectorAll('.kv-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
   bookFilter=btn.dataset.bookFilter||'all';renderBooks();
 }));

 /* ---- Class leaderboard: орташа балл (1 оқушыға шаққанда) + қатысу пайызы. Үлкен сыныпқа артықшылық жоқ. ---- */
 async function loadRating(){
   if(!barsBox)return;
   let res;
   try{res=await sb.rpc('kv_class_rating');}catch(e){res={error:e};}
   if(res.error||!Array.isArray(res.data)||!res.data.length){return loadRatingLegacy();}
   const rows=res.data.map(x=>({cls:x.class_name,total:Number(x.total)||0,xp:Number(x.xp)||0,avg:Number(x.avg_xp)||0,pct:Number(x.participation_pct)||0,participants:Number(x.participants)||0}));
   rows.sort((a,b)=>b.avg-a.avg||b.pct-a.pct||b.xp-a.xp||a.cls.localeCompare(b.cls));
   const max=Math.max(...rows.map(r=>r.avg),0);
   const medals=['🥇','🥈','🥉'];
   barsBox.innerHTML='';
   rows.forEach((item,i)=>{
     const row=document.createElement('div'); row.className='kv-bar-row';
     const pct=max>0?Math.max(item.avg>0?4:0,Math.round((item.avg/max)*100)):0;
     row.innerHTML=`<div class="kv-bar-rank">${medals[i]||(i+1)}</div><div class="kv-bar-class">${escapeHtml(item.cls)}<small>${item.total} оқушы</small></div><div class="kv-bar-track"><div class="kv-bar-fill${i===0&&item.avg>0?' gold':''}" data-pct="${pct}"></div><span class="kv-bar-xp">${item.avg.toFixed(1)} ұпай/оқушы</span></div><div class="kv-bar-battle" title="${item.participants} / ${item.total} оқушы белсенді"><b>${Math.round(item.pct)}%</b><small>${item.participants}/${item.total}</small></div>`;
     barsBox.appendChild(row);
   });
   requestAnimationFrame(()=>{ barsBox.querySelectorAll('.kv-bar-fill').forEach(el=>{ el.style.width=el.dataset.pct+'%'; }); });
   if(gapBox){
     if(rows.length>1&&rows[0].avg>0){
       const gap=rows[0].avg-rows[1].avg;
       gapBox.textContent=gap>0.05?`🔥 ${rows[0].cls} көш бастап тұр! ${rows[1].cls} үшін 1 оқушыға шаққанда ${gap.toFixed(1)} ұпай қалды.`:'🔥 Топ екі сынып тең түсуде!';
     } else { gapBox.textContent=''; }
   }
 }
 async function loadRatingLegacy(){
   if(!barsBox)return;
   const [xpRes,battleAttemptsRes]=await Promise.all([
     sb.from('class_xp').select('*'),
     sb.from('battle_attempts').select('*')
   ]);
   const xpMap={};
   (xpRes.data||[]).forEach(row=>{
     const key=normalizeClassName(row.class_name);
     xpMap[key]=(xpMap[key]||0)+row.xp; // merge if two rows normalize to the same class
   });
   const battleSum={};
   (battleAttemptsRes.data||[]).forEach(a=>{
     const key=normalizeClassName(a.class_name);
     if(!battleSum[key])battleSum[key]={sum:0,count:0};
     battleSum[key].sum+=a.score; battleSum[key].count+=1;
   });
   const names=new Set([...Object.keys(xpMap),...Object.keys(battleSum)]);
   if(!names.size){ barsBox.innerHTML='<p class="kv-empty">Рейтинг жақында қосылады.</p>'; if(gapBox)gapBox.textContent=''; return; }
   const rows=[...names].map(cls=>({
     cls,
     xp:xpMap[cls]||0,
     avg: battleSum[cls] ? (battleSum[cls].sum/battleSum[cls].count) : null
   }));
   rows.sort((a,b)=> b.xp-a.xp || (b.avg??-1)-(a.avg??-1));
   const max=rows[0].xp||1;
   const medals=['🥇','🥈','🥉'];
   barsBox.innerHTML='';
   rows.forEach((item,i)=>{
     const row=document.createElement('div'); row.className='kv-bar-row';
     const pct=max>0?Math.max(4,Math.round((item.xp/max)*100)):0;
     const avgText = item.avg==null ? '—' : item.avg.toFixed(1);
     row.innerHTML=`<div class="kv-bar-rank">${medals[i]||(i+1)}</div><div class="kv-bar-class">${escapeHtml(item.cls)}</div><div class="kv-bar-track"><div class="kv-bar-fill${i===0?' gold':''}" data-pct="${pct}"></div><span class="kv-bar-xp">${item.xp} XP</span></div><div class="kv-bar-battle">${avgText}</div>`;
     barsBox.appendChild(row);
   });
   requestAnimationFrame(()=>{ barsBox.querySelectorAll('.kv-bar-fill').forEach(el=>{ el.style.width=el.dataset.pct+'%'; }); });
   if(gapBox){
     if(rows.length>1){
       const gap=rows[0].xp-rows[1].xp;
       gapBox.textContent=gap>0?`🔥 ${rows[0].cls} көш бастап тұр! ${rows[1].cls} үшін ${gap} XP қалды.`:'🔥 Топ екі сынып тең түсуде!';
     } else { gapBox.textContent=''; }
   }
 }

 /* ---- Battles: countdown → 30-minute test → final results ---- */
 const battleTimers=[];
 function clearBattleTimers(){ battleTimers.forEach(t=>clearInterval(t)); battleTimers.length=0; }
 function formatCountdown(ms){
   if(ms<=0)return null;
   const s=Math.floor(ms/1000);
   const days=Math.floor(s/86400), hours=Math.floor((s%86400)/3600), mins=Math.floor((s%3600)/60), secs=s%60;
   return {days,hours,mins,secs};
 }
 function formatDuration(sec){
   sec=Math.max(0,Math.round(sec||0));
   return `${Math.floor(sec/60)} мин ${String(sec%60).padStart(2,'0')} сек`;
 }

 function fmtPlace(n){return `${n}-орын`;}
 async function renderBattleResults(box,battle,groups){
   try{await sb.rpc('finalize_battle_rewards',{p_battle_id:battle.id});}catch(e){}
   await loadRating(); await loadStudents();
   let res=null;
   try{const r=await sb.rpc('get_battle_results',{p_battle_id:battle.id});if(!r.error&&r.data&&Array.isArray(r.data.classes)&&r.data.classes.length)res=r.data;}catch(e){}
   if(!res){return renderBattleResultsLegacy(box,battle);}
   const classes=res.classes, best=res.best||[];
   const active=classes.filter(c=>c.participants>0);
   if(!active.length){box.innerHTML='<p class="kv-empty">Бұл Battle-ге ешкім қатыспады.</p>';return;}
   const w=classes[0];
   const b0=best[0];
   const bestHtml=best.length?`<div class="kv-battle-best"><b>🥇 Үздік оқушы</b>${best.map((a,i)=>`<div class="kv-tie-row"><span>${i===0?'🥇':i===1?'🥈':'🥉'} ${escapeHtml(a.student_name)} · ${escapeHtml(a.class_name)}</span><b>${a.total} сұрақтың ${a.score}-на дұрыс</b><span>⏱ ${formatDuration(a.duration_seconds)}</span></div>`).join('')}<small>Ең көп дұрыс жауап жинағандар арасында ең аз уақыт жұмсаған оқушы жеңеді.</small></div>`:'';
   box.innerHTML=`<div class="kv-battle-final"><div class="kv-battle-final-title">🏆 BATTLE АЯҚТАЛДЫ!</div><h3>Жеңімпаз сынып: ${escapeHtml(w.class_name)}</h3><div class="kv-battle-final-score">${w.total_score} ұпай · ${fmtPlace(1)}</div><p>${w.total_students} оқушының ${w.participants}-ы қатысты · нәтиже ${w.percent}% (${w.total_score} / ${w.max_score})</p>${b0?`<p>👑 Үздік оқушы: <b>${escapeHtml(b0.student_name)}</b> — ${b0.total} сұрақтың ${b0.score}-на жауап берді, уақыты ${formatDuration(b0.duration_seconds)}.</p>`:''}<p>🎁 Жеңімпаз сыныптың жалпы рейтингіне <b>+50 XP</b>, үздік оқушының жеке рейтингіне <b>+10 XP</b> қосылды.</p>${bestHtml}</div><div class="kv-grid kv-battle-class-results">${classes.map(r=>`<div class="kv-battle-card ${r.place===1?'winner':''}"><h3>${r.place===1?'👑 ':''}${r.place}. ${escapeHtml(r.class_name)}</h3>${r.book_title?`<p class="kv-battle-book">📖 ${escapeHtml(r.book_title)}</p>`:''}<div class="avg">${r.percent}%</div><small>${r.total_score} ұпай · ${r.total_students} оқушының ${r.participants}-ы қатысты · ${fmtPlace(r.place)}</small></div>`).join('')}</div><p class="kv-battle-note">Орын пайыз бойынша анықталады: сыныптың жиған балы ÷ (сыныптағы барлық оқушы × сұрақ саны). Сондықтан кіші және үлкен сыныптар тең жағдайда.</p>`;
 }
 async function renderBattleResultsLegacy(box,battle){
   const {data,error}=await sb.from('battle_attempts').select('*').eq('battle_id',battle.id).eq('completed',true).order('score',{ascending:false}).order('duration_seconds',{ascending:true});
   if(error||!data||!data.length){ box.innerHTML='<p class="kv-empty">Battle нәтижелері есептелуде...</p>'; return; }
   const byClass={};
   data.forEach(a=>{const key=normalizeClassName(a.class_name);if(!byClass[key])byClass[key]={label:a.class_name,total:0,count:0};byClass[key].total+=a.score;byClass[key].count+=1;});
   const classes=Object.values(byClass).map(x=>({...x,avg:x.total/x.count})).sort((a,b)=>b.total-a.total||b.avg-a.avg);
   const winner=classes[0];
   box.innerHTML=`<div class="kv-battle-final"><div class="kv-battle-final-title">🏆 BATTLE АЯҚТАЛДЫ!</div><h3>Жеңімпаз сынып: ${escapeHtml(winner.label)}</h3><div class="kv-battle-final-score">${winner.total} ұпай</div><p>${winner.count} қатысушы · орташа ${winner.avg.toFixed(1)} ұпай</p></div>`;
 }

 async function startBattleAttempt(battle,name,cls){
   const {data,error}=await sb.rpc('start_battle_attempt',{p_battle_id:battle.id,p_student_name:name,p_class_name:cls});
   if(error)throw error;
   return Array.isArray(data)?data[0]:data;
 }

 async function submitBattleAttempt(battle,attemptId,answers){
   const {data,error}=await sb.rpc('submit_battle_attempt',{p_attempt_id:attemptId,p_answers:answers});
   if(error)throw error;
   return Array.isArray(data)?data[0]:data;
 }

 async function renderBattleQuiz(box,battle,attempt,questions){
   const startedAt=new Date(battle.battle_date).getTime(), deadline=startedAt+30*60*1000;
   let finished=false;
   box.innerHTML=`<div class="kv-battle-test-head"><b>⚔️ BATTLE ТЕСТІ</b><span class="bt-test-timer">30:00</span></div><p class="kv-battle-note">Battle басталғаннан кейін барлығына ортақ дәл 30 минут беріледі. Уақыт біткенде жауаптар автоматты түрде жіберіледі.</p><div class="kv-battle-questions"></div><button class="btn btn-primary bq-submit">Батлды аяқтау және жіберу</button>`;
   const qbox=box.querySelector('.kv-battle-questions');
   questions.forEach((q,i)=>{
     const card=document.createElement('div');card.className='kv-battle-question-card';
     card.innerHTML=`<div class="kv-quiz-progress">СҰРАҚ ${i+1} / ${questions.length}</div><div class="kv-quiz-question">${escapeHtml(q.question)}</div><label><input type="radio" name="bq-${q.id}" value="a"> ${escapeHtml(q.option_a)}</label><label><input type="radio" name="bq-${q.id}" value="b"> ${escapeHtml(q.option_b)}</label><label><input type="radio" name="bq-${q.id}" value="c"> ${escapeHtml(q.option_c)}</label><label><input type="radio" name="bq-${q.id}" value="d"> ${escapeHtml(q.option_d)}</label>`;
     qbox.appendChild(card);
   });
   const submit=async(auto=false)=>{
     if(finished)return;finished=true;
     const answers=questions.map(q=>{const checked=box.querySelector(`input[name="bq-${q.id}"]:checked`);return {question_id:q.id,answer:checked?checked.value:null};});
     box.querySelector('.bq-submit').disabled=true;
     try{const result=await submitBattleAttempt(battle,attempt.attempt_id,answers);box.innerHTML=`<div class="kv-quiz-result"><p>✅ Жауаптарыңыз қабылданды.</p><div class="score">${result.score} / ${result.total}</div><p>Нәтиже battle таймері толық біткеннен кейін жарияланады.</p></div>`;}
     catch(err){finished=false;box.querySelector('.bq-submit').disabled=false;if(String(err?.message||'').includes('time'))toast('30 минуттық уақыт аяқталды.','error');else toast('Нәтижені сақтау кезінде қате шықты.','error');}
   };
   box.querySelector('.bq-submit').onclick=()=>submit(false);
   const timerEl=box.querySelector('.bt-test-timer');
   const timer=setInterval(async()=>{const left=deadline-Date.now();const c=formatCountdown(left);timerEl.textContent=c?`${String(c.mins).padStart(2,'0')}:${String(c.secs).padStart(2,'0')}`:'00:00';if(!c){clearInterval(timer);await submit(true);}},250);battleTimers.push(timer);
 }

 function groupForClass(groups,cls){
   const n=normalizeClassName(cls);
   return (groups||[]).find(g=>normalizeClassList(g.classes).includes(n))||null;
 }
 function renderBattleIntro(box,battle,groups){
   if(!currentStudent){box.innerHTML='<div class="kv-login-required"><span>⚔️</span><div><b>Battle-ге кіру керек</b><small>Қатысу профиліңізбен автоматты түрде байланысады.</small></div><button class="btn btn-primary" onclick="document.getElementById(\'kv-login-btn\')?.click()">Кіру →</button></div>';return;}
   const cls=currentStudent.class_name;
   const hasGroups=(groups||[]).length>0, group=groupForClass(groups,cls);
   const allowed=hasGroups?!!group:normalizeClassList(battle.classes).includes(normalizeClassName(cls));
   const bookLine=group?`<div><span>КІТАП</span><b>📖 ${escapeHtml(group.book_title)}</b></div>`:'';
   box.innerHTML=`<div class="kv-battle-player"><div><span>ҚАТЫСУШЫ</span><b>👤 ${escapeHtml(currentStudent.full_name)}</b></div><div><span>СЫНЫП</span><b>${escapeHtml(cls)}</b></div>${bookLine}</div>${allowed?'':'<p class="kv-battle-note">Сіздің сыныбыңыз бұл Battle-ге қатыспайды.</p>'}<div class="admin-actions" style="margin-top:14px"><button class="btn btn-primary bq-start"${allowed?'':' disabled'}>⚔️ Бастау</button></div><p class="kv-battle-note">Барлық қатысушыға ортақ 30 минуттық таймер жүреді. Нәтижеде жауап беру жылдамдығы да есептеледі.</p>`;
   box.querySelector('.bq-start').onclick=async()=>{
     if(!allowed){toast('Сіздің сыныбыңыз бұл Battle-ге қатыспайды.','error');return;}
     try{
       const attempt=await startBattleAttempt(battle,currentStudent.full_name,cls);
       let qy=sb.from('battle_questions_public').select('*').eq('battle_id',battle.id);
       if(group)qy=qy.eq('group_id',group.id);
       const {data,error}=await qy.order('created_at',{ascending:true}).order('id',{ascending:true});
       if(error||!data?.length)throw new Error('questions');
       renderBattleQuiz(box,battle,attempt,data);
     }catch(err){const msg=String(err?.message||'');toast(msg.includes('limit')?'Сыныптың барлық мүмкіндігі пайдаланылды.':msg.includes('already')?'Сіз бұл Battle-ге қатысып қойғансыз.':'Battle бастау кезінде қате шықты.','error');}
   };
 }

 function renderBattleCard(battle,groups){
   const target=new Date(battle.battle_date).getTime();
   const el=document.createElement('div');el.className='kv-battle-arena';
   const groupsHtml=(groups||[]).length
     ?`<ul class="kv-battle-groups">${groups.map(g=>`<li><b>${escapeHtml(splitClassList(g.classes).join(', '))}</b><span>📖 ${escapeHtml(g.book_title)}</span></li>`).join('')}</ul>`
     :`<p class="kv-battle-note">Қатысатын сыныптар: <b>${escapeHtml(battle.classes)}</b></p>`;
   el.innerHTML=`<div class="kv-battle-arena-head"><span class="kv-badge kv-badge-fire">⚔️ BATTLE</span><h3>${escapeHtml(battle.title)}</h3>${groupsHtml}</div><div class="kv-battle-timer" hidden><div><b class="bt-d">0</b><span>күн</span></div><div><b class="bt-h">0</b><span>сағат</span></div><div><b class="bt-m">0</b><span>мин</span></div><div><b class="bt-s">0</b><span>сек</span></div></div><div class="kv-battle-live" hidden></div><div class="kv-battle-results"></div>`;
   battleListBox.appendChild(el);
   const timerBox=el.querySelector('.kv-battle-timer'),liveBox=el.querySelector('.kv-battle-live'),resultsBox=el.querySelector('.kv-battle-results');
   async function goLive(){
     timerBox.hidden=true;
     if(Date.now()>=target+30*60*1000)return;
     liveBox.hidden=false;
     const {data,error}=await sb.from('battle_questions_public').select('id').eq('battle_id',battle.id).limit(1);
     if(error||!data?.length)liveBox.innerHTML='<p class="kv-empty">⚔️ Battle басталды, сұрақтар дайын емес.</p>';else renderBattleIntro(liveBox,battle,groups);
   }
   let intervalId;
   function tick(){const diff=target-Date.now(),c=formatCountdown(diff);if(!c){clearInterval(intervalId);goLive();return;}timerBox.hidden=false;el.querySelector('.bt-d').textContent=c.days;el.querySelector('.bt-h').textContent=String(c.hours).padStart(2,'0');el.querySelector('.bt-m').textContent=String(c.mins).padStart(2,'0');el.querySelector('.bt-s').textContent=String(c.secs).padStart(2,'0');}
   if(target>Date.now()){tick();intervalId=setInterval(tick,1000);battleTimers.push(intervalId);}else{goLive();}
   // Results are only shown after battle start + 30 minutes.
   const resultTimer=setInterval(async()=>{if(Date.now()>=target+30*60*1000){clearInterval(resultTimer);liveBox.hidden=true;await renderBattleResults(resultsBox,battle,groups);}},1000);battleTimers.push(resultTimer);
 }
 async function loadBattles(){
   if(!battleListBox)return;clearBattleTimers();
   const [bRes,gRes]=await Promise.all([sb.from('battles').select('*').order('battle_date',{ascending:true}),sb.from('battle_groups').select('*').order('id',{ascending:true})]);
   const data=bRes.data;
   if(bRes.error||!data||!data.length){battleListBox.innerHTML='<p class="kv-empty">Battle жақында жарияланады.</p>';return;}
   const groups=gRes.error?[]:(gRes.data||[]);
   battleListBox.innerHTML='';
   data.forEach(b=>renderBattleCard(b,groups.filter(g=>g.battle_id===b.id)));
 }

 /* ---- Student rating (top 5, sum of general quiz scores) ---- */
 async function loadStudents(){
   if(!studentsBox)return;
   const {data,error}=await sb.from('quiz_attempts').select('*');
   const visible=(data||[]).filter(a=>a.question_id==null || a.xp_applied===true);
   if(error||!visible.length){ studentsBox.innerHTML='<p class="kv-empty">Викторина нәтижелерінен кейін рейтинг осы жерде шығады.</p>'; return; }
   const byStudent={};
   visible.forEach(a=>{
     const key=a.student_name+'|'+normalizeClassName(a.class_name);
     if(!byStudent[key])byStudent[key]={name:a.student_name,cls:a.class_name,total:0};
     byStudent[key].total+=a.score;
   });
   const top=Object.values(byStudent).sort((a,b)=>b.total-a.total).slice(0,5);
   const medals=['🥇','🥈','🥉'];
   studentsBox.innerHTML='';
   top.forEach((s,i)=>{
     const row=document.createElement('div'); row.className='kv-student-row';
     row.innerHTML=`<div class="kv-student-rank">${medals[i]||(i+1)}</div><div class="kv-student-name">${escapeHtml(s.name)} <span class="kv-student-class">${escapeHtml(s.cls)}</span></div><div class="kv-student-score">${s.total} ұпай</div>`;
     studentsBox.appendChild(row);
   });
 }

 /* ---- Rewards ---- */
 async function loadRewards(){
   if(!rewardsBox)return;
   const {data,error}=await sb.from('rewards').select('*').order('created_at',{ascending:true});
   if(error||!data||!data.length){ rewardsBox.innerHTML=''; return; }
   rewardsBox.innerHTML='';
   data.forEach(r=>{
     const chip=document.createElement('div'); chip.className='kv-reward-chip';
     chip.innerHTML=`<b>${escapeHtml(r.icon||'🏆')}</b><div><strong>${escapeHtml(r.position)}</strong><span>${escapeHtml(r.title)}</span></div>`;
     rewardsBox.appendChild(chip);
   });
 }

 /* ---- Daily quiz: scheduled 24-hour questions ---- */
 let activeQuiz=null, dailyQuizTimer=null;
 function renderDailyCountdown(box,endsAt){
   if(dailyQuizTimer)clearInterval(dailyQuizTimer);
   const tick=()=>{const c=formatCountdown(new Date(endsAt).getTime()-Date.now());const el=box.querySelector('.kv-daily-timer');if(!el){clearInterval(dailyQuizTimer);return;}if(!c){el.textContent='00:00:00';clearInterval(dailyQuizTimer);syncDailyQuiz();return;}el.textContent=`${String(c.hours).padStart(2,'0')}:${String(c.mins).padStart(2,'0')}:${String(c.secs).padStart(2,'0')}`;};tick();dailyQuizTimer=setInterval(tick,1000);
 }
 async function syncDailyQuiz(){try{await sb.rpc('sync_daily_quiz_state');}catch(e){}await loadRating();await loadStudents();await loadQuizIntro();}
 async function loadQuizIntro(){
   if(!quizBox)return;
   try{await sb.rpc('sync_daily_quiz_state');}catch(e){}
   const {data,error}=await sb.rpc('get_current_daily_quiz');
   activeQuiz=(!error&&data)?(Array.isArray(data)?data[0]:data):null;
   if(!activeQuiz){quizBox.innerHTML='<p class="kv-empty">Бүгінгі викторина сұрағы жақында қосылады.</p>';return;}
   if(!currentStudent){quizBox.innerHTML='<div class="kv-login-required"><span>🧠</span><div><b>Бүгінгі викторинаға кіру керек</b><small>Кірген соң жауап сіздің профиліңізге байланысады.</small></div><button class="btn btn-primary" onclick="document.getElementById(\'kv-login-btn\')?.click()">Кіру →</button></div>';return;}
   quizBox.innerHTML=`<div class="kv-quiz-daily"><b>🧠 БҮГІНГІ ВИКТОРИНА</b><span>1 сұрақ · 1 мүмкіндік · дұрыс жауапқа 1 ұпай</span></div><div class="kv-daily-timer-wrap">Келесі сұраққа дейін: <strong class="kv-daily-timer">--:--:--</strong></div><div class="kv-player-chip">👤 ${escapeHtml(currentStudent.full_name)} · ${escapeHtml(currentStudent.class_name)}</div><div class="admin-actions" style="margin-top:14px"><button class="btn btn-primary" id="kv-quiz-start">Викторинаны бастау →</button></div>`;
   renderDailyCountdown(quizBox,activeQuiz.ends_at);
   document.getElementById('kv-quiz-start').onclick=startQuiz;
 }
 function startQuiz(){if(!activeQuiz||!currentStudent){loginBox.hidden=false;loginIin?.focus();return;}runQuiz(currentStudent.full_name,currentStudent.class_name);}
 function runQuiz(name,cls){const q=activeQuiz;quizBox.innerHTML=`<div class="kv-quiz-progress">БҮГІНГІ СҰРАҚ</div><div class="kv-quiz-question">${escapeHtml(q.question)}</div><button class="kv-quiz-option" data-opt="a">${escapeHtml(q.option_a)}</button><button class="kv-quiz-option" data-opt="b">${escapeHtml(q.option_b)}</button><button class="kv-quiz-option" data-opt="c">${escapeHtml(q.option_c)}</button><button class="kv-quiz-option" data-opt="d">${escapeHtml(q.option_d)}</button><p class="kv-battle-note" style="margin-top:12px">⚠️ Жауапты бір рет таңдайсыз. Қайта тапсыруға мүмкіндік жоқ.</p>`;quizBox.querySelectorAll('.kv-quiz-option').forEach(btn=>btn.onclick=async()=>{quizBox.querySelectorAll('.kv-quiz-option').forEach(b=>b.disabled=true);btn.classList.add('picked');await finishQuiz(name,cls,btn.dataset.opt);});}
 async function finishQuiz(name,cls,answer){quizBox.innerHTML='<div class="kv-quiz-result"><p>Жауабыңыз сақталуда...</p></div>';try{const {data,error}=await sb.rpc('submit_daily_quiz',{p_question_id:activeQuiz.id,p_student_name:name,p_class_name:cls,p_answer:answer});if(error)throw error;quizBox.innerHTML='<div class="kv-quiz-result"><p>✅ Жауабыңыз қабылданды.</p><p>1 мүмкіндік пайдаланылды.</p><p>Нәтиже мен сынып рейтингі уақыт біткеннен кейін ғана жарияланады.</p></div>';toast('1 мүмкіндік пайдаланылды. Нәтиже кейін жарияланады!');}catch(err){const msg=String(err?.message||'');if(msg.includes('already submitted'))quizBox.innerHTML='<div class="kv-quiz-result"><p>⚠️ Бұл оқушы бүгінгі викторинаны бұрын тапсырған.</p><p>Бір сұраққа тек 1 мүмкіндік беріледі.</p></div>';else if(msg.includes('no longer active')||msg.includes('not active')){await syncDailyQuiz();}else quizBox.innerHTML='<div class="kv-quiz-result"><p>Жауапты сақтау кезінде қате шықты.</p><p style="color:#e5484d">Интернетті тексеріп, кейінірек қайталап көріңіз.</p></div>';}}

 /* ---- Creative tasks: photo / video / text. Files go to Google Drive, the list lives in a Google Sheet,
        both are handled by a Google Apps Script (see kitapverse-upload.gs). Nothing is stored in Supabase. ---- */
 const KV_UPLOAD_URL=String(window.KV_UPLOAD_URL||'').trim();
 const KV_CREATIVE={
   video:{title:'Бейне-шолу',emoji:'🎬',kind:'video',accept:'video/*',maxMB:100,upBtn:'🎥 Бейне жүктеу',viewBtn:'👀 Бейне көру',hint:'Оқыған кітабың туралы қысқа бейне (30–60 секунд). Бейне үлкен болса, телефонда сапасын 720p-ге түсір.',descLabel:'Бейне туралы сипаттама',descPh:'Бейнеде не туралы айттың?'},
   illustration:{title:'Иллюстрация',emoji:'🎨',kind:'image',accept:'image/*',maxMB:15,upBtn:'📷 Фото жүктеу',viewBtn:'👀 Фото көру',hint:'Кітаптағы сүйікті сәтіңді салып, суретке түсір. Сурет анық, жарық жерде түсірілсін.',descLabel:'Сурет туралы сипаттама',descPh:'Суретте қандай сәт бейнеленген?'},
   continuation:{title:'Өз жалғасың',emoji:'✍️',kind:'text',viewBtn:'👀 Көру',upBtn:'✍️ Жазу',hint:'Кітаптың жаңа аяқталуын немесе жалғасын өзің жаз.',descLabel:'Жалғасың',descPh:'Мұнда жаз…'}
 };
 const KV_EXT={video:/\.(mp4|mov|m4v|webm|3gp|3gpp|avi|mkv)$/i,image:/\.(jpe?g|png|webp|heic|heif|gif)$/i};
 const KV_MIME={mp4:'video/mp4',mov:'video/quicktime',m4v:'video/x-m4v',webm:'video/webm','3gp':'video/3gpp','3gpp':'video/3gpp',avi:'video/x-msvideo',mkv:'video/x-matroska',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',heic:'image/heic',heif:'image/heif',gif:'image/gif'};
 const KV_UP_ERR={auth:'Сессия аяқталды. Шығып, қайта кіріңіз.',no_profile:'Оқушы профилі табылмады. Әкімшілікке хабарласыңыз.',type:'Бұл тапсырмаға басқа файл түрі керек.',size:'Файл немесе мәтін тым үлкен.',empty:'Файл немесе мәтін бос.',desc:'Сипаттама жазыңыз.',book:'Кітапты таңдаңыз.',limit:'Жүктеу лимиті бітті. Бірнеше сағаттан кейін қайталаңыз.',expired:'Жүктеу уақыты өтіп кетті. Қайта бастаңыз.',drive:'Google Drive файлды қабылдамады. Кейінірек қайталаңыз.',server:'Серверде қате шықты. Кейінірек қайталаңыз.',network:'Интернет байланысын тексеріп, қайталаңыз.'};
 function kvFileMime(f){return f.type||KV_MIME[(f.name.split('.').pop()||'').toLowerCase()]||'application/octet-stream';}
 function kvFileKind(f){const t=(f.type||'').toLowerCase();if(t.startsWith('video/'))return 'video';if(t.startsWith('image/'))return 'image';if(KV_EXT.video.test(f.name))return 'video';if(KV_EXT.image.test(f.name))return 'image';return null;}
 function kvBlobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const s=String(r.result);res(s.slice(s.indexOf(',')+1));};r.onerror=()=>rej(new Error('read'));r.readAsDataURL(blob);});}
 const kvSleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function kvCall(payload){
   let res;
   try{res=await fetch(KV_UPLOAD_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});}
   catch(e){throw Object.assign(new Error('network'),{kv:'network',retry:true});}
   if(!res.ok)throw Object.assign(new Error('network'),{kv:'network',retry:true});
   let j;try{j=await res.json();}catch(e){throw Object.assign(new Error('server'),{kv:'server',retry:true});}
   if(!j.ok)throw Object.assign(new Error(j.error||'server'),{kv:j.error||'server'});
   return j;
 }
 async function kvToken(){const {data:{session}}=await sb.auth.getSession();if(!session)throw Object.assign(new Error('auth'),{kv:'auth'});return session.access_token;}
 async function kvUploadFile(task,file,bookTitle,description,onProgress){
   const token=await kvToken();
   const start=await kvCall({action:'start',token,task,fileName:file.name,mimeType:kvFileMime(file),size:file.size,bookTitle,description});
   let offset=0,last=null;
   while(offset<file.size){
     const end=Math.min(offset+start.chunkSize,file.size);
     const data=await kvBlobToBase64(file.slice(offset,end));
     for(let attempt=1;;attempt++){
       try{last=await kvCall({action:'chunk',uploadId:start.uploadId,offset,data});break;}
       catch(e){if(!e.retry||attempt>=4)throw e;await kvSleep(900*attempt);}
     }
     offset=end;onProgress(offset/file.size);
   }
   if(!last||!last.done)throw Object.assign(new Error('server'),{kv:'server'});
   return last;
 }
 /* --- shared modal shell --- */
 let kvUpModal=null,kvViewModal=null,kvBusy=false;
 function kvShell(cls,inner){
   const m=document.createElement('div');m.className='kv-modal '+cls;m.hidden=true;m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
   m.innerHTML='<div class="kv-modal-box"><button type="button" class="kv-modal-close" aria-label="Жабу">×</button>'+inner+'</div>';
   document.body.appendChild(m);
   const close=()=>{if(kvBusy&&m===kvUpModal)return;kvHide(m);};
   m.addEventListener('click',e=>{if(e.target===m)close();});
   m.querySelector('.kv-modal-close').onclick=close;
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)close();});
   return m;
 }
 function kvHide(m){m.hidden=true;document.body.classList.remove('kv-modal-open');m.querySelectorAll('.kv-up-preview img,.kv-up-preview video').forEach(el=>{try{URL.revokeObjectURL(el.src);}catch(e){}});const p=m.querySelector('.kv-up-preview');if(p)p.innerHTML='';const l=m.querySelector('#kv-view-list');if(l)l.innerHTML='';}
 function kvShow(m){m.hidden=false;document.body.classList.add('kv-modal-open');}
 function kvNeedLogin(){loginBox.hidden=false;loginIin?.focus();loginBox.scrollIntoView({behavior:'smooth',block:'center'});toast('Алдымен оқушы аккаунтымен кіріңіз.','error');}

 /* --- upload / write --- */
 function kvOpenUpload(taskKey){
   const cfg=KV_CREATIVE[taskKey];if(!cfg)return;
   if(!currentStudent){kvNeedLogin();return;}
   if(!kvUpModal)kvUpModal=kvShell('kv-up-modal','<h3 id="kv-up-title"></h3><p class="kv-up-hint" id="kv-up-hint"></p><div class="kv-up-who" id="kv-up-who"></div><label class="kv-up-label">Қай кітап бойынша?<select id="kv-up-book"></select></label><label class="kv-up-file" id="kv-up-file-wrap"><input type="file" id="kv-up-file"><span id="kv-up-file-text"></span></label><div id="kv-up-preview" class="kv-up-preview"></div><label class="kv-up-label"><span id="kv-up-desc-label"></span><textarea id="kv-up-desc" rows="3"></textarea></label><small class="kv-up-count" id="kv-up-count"></small><div class="kv-up-progress" id="kv-up-progress" hidden><i></i></div><p class="kv-up-status" id="kv-up-status" role="status"></p><button type="button" class="btn btn-primary kv-up-send" id="kv-up-send" disabled>Жіберу</button>');
   const m=kvUpModal,q=s=>m.querySelector(s);
   const isText=cfg.kind==='text',maxDesc=isText?4000:500;
   q('#kv-up-title').textContent=cfg.emoji+' '+cfg.title;
   q('#kv-up-hint').textContent=cfg.hint;
   q('#kv-up-who').textContent='👤 '+(currentStudent.full_name||'Оқушы')+' · '+(currentStudent.class_name||'');
   const grade=parseInt(currentStudent.class_name,10);
   const books=allBooks.filter(b=>Number(b.grade)===grade);
   const list=books.length?books:allBooks;
   q('#kv-up-book').innerHTML='<option value="">Кітапты таңдаңыз…</option>'+list.map(b=>`<option value="${escapeHtml(b.title)}">${escapeHtml(b.title)}</option>`).join('');
   q('#kv-up-book').value='';
   const fileInput=q('#kv-up-file');fileInput.value='';if(!isText)fileInput.accept=cfg.accept;
   q('#kv-up-file-wrap').hidden=isText;
   q('#kv-up-file-text').textContent=cfg.kind==='video'?'🎥 Бейнені таңдау':'📷 Суретті таңдау';
   const desc=q('#kv-up-desc');desc.value='';desc.maxLength=maxDesc;desc.rows=isText?9:3;desc.placeholder=cfg.descPh;
   q('#kv-up-desc-label').textContent=cfg.descLabel;
   const count=q('#kv-up-count');const upd=()=>{count.textContent=desc.value.length+' / '+maxDesc;};upd();
   q('#kv-up-preview').innerHTML='';q('#kv-up-progress').hidden=true;q('#kv-up-progress i').style.width='0%';
   const send=q('#kv-up-send');send.disabled=true;send.textContent='Жіберу';
   const setStatus=(t,type)=>{const s=q('#kv-up-status');s.textContent=t||'';s.className='kv-up-status'+(type?' '+type:'');};setStatus('');
   let file=null;
   const refresh=()=>{send.disabled=kvBusy||!(q('#kv-up-book').value&&desc.value.trim()&&(isText||file));};
   q('#kv-up-book').onchange=refresh;desc.oninput=()=>{upd();refresh();};
   fileInput.onchange=()=>{
     file=null;q('#kv-up-preview').innerHTML='';setStatus('');
     const f=fileInput.files&&fileInput.files[0];
     if(!f){refresh();return;}
     if(kvFileKind(f)!==cfg.kind){setStatus(cfg.kind==='video'?'Тек бейне файлын таңдаңыз.':'Тек сурет (фото) таңдаңыз.','error');fileInput.value='';refresh();return;}
     if(f.size>cfg.maxMB*1024*1024){setStatus(`Файл тым үлкен: ${(f.size/1048576).toFixed(1)} МБ. Ең көбі — ${cfg.maxMB} МБ.`,'error');fileInput.value='';refresh();return;}
     if(f.size<1){setStatus('Файл бос.','error');fileInput.value='';refresh();return;}
     file=f;
     const el=document.createElement(cfg.kind==='video'?'video':'img');el.src=URL.createObjectURL(f);
     if(cfg.kind==='video'){el.controls=true;el.muted=true;el.playsInline=true;el.preload='metadata';}else{el.alt='Алдын ала көру';el.onerror=()=>{el.replaceWith(Object.assign(document.createElement('p'),{textContent:'📄 '+f.name}));};}
     q('#kv-up-preview').appendChild(el);
     setStatus(`${f.name} · ${(f.size/1048576).toFixed(1)} МБ`);refresh();
   };
   send.onclick=async()=>{
     if(kvBusy||send.disabled)return;
     kvBusy=true;send.disabled=true;fileInput.disabled=true;q('#kv-up-book').disabled=true;desc.disabled=true;
     const bar=q('#kv-up-progress');
     const onBeforeUnload=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',onBeforeUnload);
     try{
       if(isText){
         setStatus('Жіберілуде…');
         await kvCall({action:'text',token:await kvToken(),task:taskKey,bookTitle:q('#kv-up-book').value,text:desc.value.trim()});
       }else{
         bar.hidden=false;setStatus('Жүктелуде… 0%. Бетті жаппаңыз.');
         await kvUploadFile(taskKey,file,q('#kv-up-book').value,desc.value.trim(),p=>{const pc=Math.round(p*100);bar.querySelector('i').style.width=pc+'%';setStatus(`Жүктелуде… ${pc}%. Бетті жаппаңыз.`);});
         bar.querySelector('i').style.width='100%';
       }
       setStatus('✅ Жіберілді! Енді басқа оқушылар да көре алады.','ok');
       send.textContent='Дайын';toast('Жұмысың жіберілді!');
       kvDone=true;
       setTimeout(()=>{if(!kvBusy&&!m.hidden)kvHide(m);},2500);
     }catch(err){
       setStatus('❌ '+(KV_UP_ERR[err&&err.kv]||KV_UP_ERR.server),'error');
       send.textContent='Қайталау';
     }finally{
       window.removeEventListener('beforeunload',onBeforeUnload);
       kvBusy=false;fileInput.disabled=false;q('#kv-up-book').disabled=false;desc.disabled=false;
       if(send.textContent!=='Дайын')refresh();
     }
   };
   kvShow(m);
 }
 let kvDone=false;

 /* --- view works of other students --- */
 async function kvOpenView(taskKey){
   const cfg=KV_CREATIVE[taskKey];if(!cfg)return;
   if(!currentStudent){kvNeedLogin();return;}
   if(!kvViewModal)kvViewModal=kvShell('kv-view-modal','<h3 id="kv-view-title"></h3><div id="kv-view-list" class="kv-view-list"></div>');
   const m=kvViewModal,list=m.querySelector('#kv-view-list');
   m.querySelector('#kv-view-title').textContent=cfg.emoji+' '+cfg.title+' — оқушылар жұмыстары';
   list.innerHTML='<p class="kv-view-msg">Жүктелуде…</p>';kvShow(m);
   try{
     const r=await kvCall({action:'list',token:await kvToken(),task:taskKey});
     if(m.hidden)return;
     if(!r.items.length){list.innerHTML='<p class="kv-view-msg">Әзірге жұмыс жоқ. Бірінші болып жүктеп көр! 🚀</p>';return;}
     list.innerHTML='';
     r.items.forEach(it=>{
       const card=document.createElement('article');card.className='kv-work';
       const head=document.createElement('header');
       head.innerHTML=`<b>${escapeHtml(it.student)}</b><span>${escapeHtml(it.cls)}</span>`;
       card.appendChild(head);
       const meta=document.createElement('p');meta.className='kv-work-meta';meta.textContent='📖 '+it.book+(it.date?' · '+it.date:'');card.appendChild(meta);
       const id=encodeURIComponent(it.fileId||'');
       if(cfg.kind==='video'&&it.fileId){
         const w=document.createElement('div');w.className='kv-work-media kv-work-video';
         const btn=document.createElement('button');btn.type='button';btn.className='kv-work-play';btn.textContent='▶ Бейнені көру';
         btn.onclick=()=>{const f=document.createElement('iframe');f.src='https://drive.google.com/file/d/'+id+'/preview';f.allow='autoplay;fullscreen';f.allowFullscreen=true;f.title='Бейне';w.innerHTML='';w.appendChild(f);};
         w.appendChild(btn);card.appendChild(w);
       }else if(cfg.kind==='image'&&it.fileId){
         const a=document.createElement('a');a.className='kv-work-media';a.href='https://drive.google.com/file/d/'+id+'/view';a.target='_blank';a.rel='noopener';
         const img=document.createElement('img');img.loading='lazy';img.alt='Сурет';img.src='https://drive.google.com/thumbnail?id='+id+'&sz=w1000';
         a.appendChild(img);card.appendChild(a);
       }
       const body=document.createElement('p');body.className='kv-work-desc';body.textContent=cfg.kind==='text'?(it.text||''):(it.desc||'');card.appendChild(body);
       list.appendChild(card);
     });
   }catch(err){
     list.innerHTML='';const p=document.createElement('p');p.className='kv-view-msg error';p.textContent='❌ '+(KV_UP_ERR[err&&err.kv]||KV_UP_ERR.server);list.appendChild(p);
   }
 }
 (function kvInitCreative(){
   if(!KV_UPLOAD_URL)return;
   const badge=document.getElementById('kv-creative-badge');if(badge)badge.textContent='📖 ІСКЕ ҚОСЫЛДЫ';
   document.querySelectorAll('#kv-creative .kv-creative-card').forEach(card=>{
     const key=card.dataset.task,cfg=KV_CREATIVE[key];if(!cfg)return;
     card.classList.remove('kv-soon');card.classList.add('kv-creative-live');
     const st=card.querySelector('.status');if(st)st.remove();
     const row=document.createElement('div');row.className='kv-creative-actions';
     const up=document.createElement('button');up.type='button';up.className='btn btn-primary kv-upload-btn';up.textContent=cfg.upBtn;up.onclick=()=>kvOpenUpload(key);
     const view=document.createElement('button');view.type='button';view.className='btn kv-view-btn';view.textContent=cfg.viewBtn;view.onclick=()=>kvOpenView(key);
     row.append(up,view);card.appendChild(row);
   });
 })();


 /* ---- Сыныптар белсенділігі: оқушы саны / бүгін кірген / квест / викторина (барлығына ашық) ---- */
 const statsBox=document.getElementById('kv-class-stats');
 let statsMode='today', statsCache=null;
 function classSortKey(c){const m=/^(\d+)(.*)$/.exec(c||'');return m?[parseInt(m[1],10),m[2]]:[999,c||''];}
 function renderClassStats(){
   if(!statsBox)return;
   if(!statsCache||!statsCache.length){statsBox.innerHTML='<p class="kv-empty">Статистика жақында қосылады.</p>';return;}
   const rows=[...statsCache].sort((a,b)=>{const x=classSortKey(a.class_name),y=classSortKey(b.class_name);return x[0]-y[0]||String(x[1]).localeCompare(String(y[1]));});
   const t=rows.reduce((o,r)=>({total:o.total+r.total,login:o.login+r.logged_today,quest:o.quest+(statsMode==='today'?r.quest_today:r.quest_all),quiz:o.quiz+(statsMode==='today'?r.quiz_today:r.quiz_all)}),{total:0,login:0,quest:0,quiz:0});
   const bar=(label,cls,n,total)=>{const p=total>0?Math.min(100,Math.round(n/total*100)):0;return `<div class="kv-st-line"><span class="kv-st-label">${label}</span><div class="kv-st-track"><i class="${cls}" data-w="${p}"></i></div><b>${n}<small>/${total}</small></b></div>`;};
   const modeTxt=statsMode==='today'?'бүгін':'барлығы';
   statsBox.innerHTML=`<div class="kv-st-summary"><div><b>${t.total}</b><span>оқушы</span></div><div><b>${t.login}</b><span>бүгін кірді</span></div><div><b>${t.quest}</b><span>квест (${modeTxt})</span></div><div><b>${t.quiz}</b><span>викторина (${modeTxt})</span></div></div><div class="kv-st-grid">${rows.map(r=>{const q=statsMode==='today'?r.quest_today:r.quest_all,z=statsMode==='today'?r.quiz_today:r.quiz_all;return `<div class="kv-st-card"><div class="kv-st-head"><h3>${escapeHtml(r.class_name)}</h3><span>${r.total} оқушы</span></div>${bar('🟢 Бүгін кірді','login',r.logged_today,r.total)}${bar('🧩 Квест','quest',q,r.total)}${bar('🧠 Викторина','quiz',z,r.total)}</div>`;}).join('')}</div>`;
   requestAnimationFrame(()=>statsBox.querySelectorAll('.kv-st-track i').forEach(el=>{el.style.width=el.dataset.w+'%';}));
 }
 async function loadClassStats(){
   if(!statsBox)return;
   try{const {data,error}=await sb.rpc('kv_class_stats');if(error)throw error;statsCache=(data||[]).map(r=>({class_name:r.class_name,total:Number(r.total)||0,logged_today:Number(r.logged_today)||0,quest_today:Number(r.quest_today)||0,quest_all:Number(r.quest_all)||0,quiz_today:Number(r.quiz_today)||0,quiz_all:Number(r.quiz_all)||0}));}
   catch(e){statsCache=null;if(!statsBox.dataset.ok)statsBox.innerHTML='<p class="kv-empty">Статистика жақында қосылады.</p>';return;}
   statsBox.dataset.ok='1';renderClassStats();
 }
 document.querySelectorAll('[data-stats-mode]').forEach(btn=>btn.addEventListener('click',()=>{statsMode=btn.dataset.statsMode;document.querySelectorAll('[data-stats-mode]').forEach(b=>b.classList.toggle('active',b===btn));renderClassStats();}));
 setInterval(()=>{if(!document.hidden)loadClassStats();},90000);
 window.KV={sb,toast,escapeHtml,student:()=>currentStudent,formatDuration};
 document.dispatchEvent(new Event('kv-ready'));

 await Promise.all([loadBooks(),loadRating(),loadBattles(),loadStudents(),loadRewards(),loadQuizIntro(),loadClassStats()]); await loadQuests(); await loadStudentProfile();
})();
