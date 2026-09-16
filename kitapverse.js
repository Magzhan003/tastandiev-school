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
 let currentStudent=null, currentProgress=new Set();

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
   let {data,error}=await sb.from('student_profiles').select('*').eq('auth_user_id',session.user.id).maybeSingle();
   if(!data){const claim=await sb.rpc('claim_my_student_profile'); if(!claim.error){data=Array.isArray(claim.data)?claim.data[0]:claim.data;error=null;}}
   if(error||!data){currentStudent=null;renderStudentBar();return;}
   currentStudent=data;
   const {data:prog}=await sb.from('book_progress').select('book_id,marked_read_at').eq('student_id',data.id);
   currentProgress=new Set((prog||[]).map(x=>String(x.book_id)));
   renderStudentBar();
   await loadStudentStats();
 }
 function renderStudentBar(){
   if(!authGuest||!authUser)return;
   authGuest.hidden=!!currentStudent;authUser.hidden=!currentStudent;
   if(currentStudent){userNameBox.textContent=currentStudent.full_name;userClassBox.textContent=currentStudent.class_name;}
   renderBooks();
 }
 async function loadStudentStats(){
   if(!currentStudent)return;
   const [xpRes, attemptsRes, progressRes]=await Promise.all([
     sb.from('quiz_attempts').select('score,total,student_name,class_name,xp_applied,created_at').ilike('student_name',currentStudent.full_name).ilike('class_name',currentStudent.class_name),
     sb.from('book_progress').select('book_id,marked_read_at').eq('student_id',currentStudent.id),
     sb.from('book_progress').select('book_id,marked_read_at').eq('student_id',currentStudent.id)
   ]);
   const xp=(xpRes.data||[]).reduce((sum,r)=>sum+(r.xp_applied===false?0:Number(r.score||0)),0);
   const books=(progressRes.data||[]).length;
   const level=Math.max(1,Math.floor(xp/25)+1);
   userXpBox.textContent=xp;userBooksBox.textContent=books;userLevelBox.textContent=level;
   const dates=new Set([...(xpRes.data||[]).map(r=>r.created_at),...(progressRes.data||[]).map(r=>r.marked_read_at)].filter(Boolean).map(x=>x.slice(0,10)));
   let streak=0, cursor=new Date(); cursor.setHours(0,0,0,0);
   while(dates.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-1);}
   userStreakBox.textContent=streak;
   const total=Math.max(allBooks.length,1), pct=Math.min(100,Math.round(books/total*100));
   if(readingProgressBox)readingProgressBox.innerHTML=`<div class="kv-progress-card"><strong>📚 Оқу прогресі</strong><span>${books} / ${allBooks.length} кітап · ${pct}%</span><div class="kv-progress-track"><i style="width:${pct}%"></i></div></div>`;
 }
 async function loginStudent(){
   const iin=(loginIin?.value||'').replace(/\s+/g,'').trim(), password=(loginPassword?.value||'').trim();
   if(!iin||!password){toast('ИИН және пароль енгізіңіз.','error');return;}
   setBusy(loginSubmit,true,'Кіру');
   const email=`${iin}@students.kitapverse.local`;
   const {error}=await sb.auth.signInWithPassword({email,password});
   setBusy(loginSubmit,false,'Кіру');
   if(error){toast('Логин немесе пароль қате.','error');return;}
   loginBox.hidden=true; await loadStudentProfile(); toast(`Қош келдіңіз, ${currentStudent?.full_name||'оқушы'}!`);
 }
 loginBtn?.addEventListener('click',()=>{loginBox.hidden=!loginBox.hidden;if(!loginBox.hidden)loginIin?.focus();});
 loginSubmit?.addEventListener('click',loginStudent);
 [loginIin,loginPassword].forEach(x=>x?.addEventListener('keydown',e=>{if(e.key==='Enter')loginStudent();}));
 logoutBtn?.addEventListener('click',async()=>{await sb.auth.signOut();currentStudent=null;currentProgress=new Set();renderStudentBar();toast('Профильден шықтыңыз.');});
 async function markBookRead(book){
   if(!currentStudent){loginBox.hidden=false;loginIin?.focus();toast('Алдымен оқушы аккаунтымен кіріңіз.','error');return;}
   if(currentProgress.has(String(book.id))){if(book.quest_id){document.getElementById(`kv-quest-${book.quest_id}`)?.scrollIntoView({behavior:'smooth',block:'center'});}return;}
   const {error}=await sb.from('book_progress').upsert({student_id:currentStudent.id,book_id:book.id},{onConflict:'student_id,book_id'});
   if(error){toast('Кітап прогресін сақтау кезінде қате шықты.','error');return;}
   currentProgress.add(String(book.id));renderBooks();await loadStudentStats();toast('Кітап «Прочитано» ретінде белгіленді. Квест ашылды!');
   if(book.quest_id)document.getElementById(`kv-quest-${book.quest_id}`)?.scrollIntoView({behavior:'smooth',block:'center'});
 }
 /* ---- Native quests ---- */
 async function submitQuestAttempt(questId,name,cls,answers){
   const {data,error}=await sb.rpc('submit_quest_attempt',{p_quest_id:questId,p_student_name:name,p_class_name:cls,p_answers:answers});
   if(error)throw error; return Array.isArray(data)?data[0]:data;
 }
 async function renderQuest(box,quest){
   const {data:questions,error}=await sb.from('quest_questions_public').select('*').eq('quest_id',quest.id).order('sequence_no',{ascending:true});
   if(error||!questions?.length){box.innerHTML='<p class="kv-empty">Бұл квесттің сұрақтары әлі дайын емес.</p>';return;}
   box.innerHTML=`<div class="kv-quest-card kv-quest-wide"><b>🎮</b><h3>${escapeHtml(quest.title)}</h3><p>${escapeHtml(quest.description||'Оқу квестін орындаңыз.')}</p><input class="quest-name" placeholder="Аты-жөніңіз" value="${escapeHtml(currentStudent?.full_name||'')}"><input class="quest-class" placeholder="Сыныбыңыз (мысалы 8А)" value="${escapeHtml(currentStudent?.class_name||'')}"><div class="kv-quest-questions"></div><button class="btn btn-primary quest-submit">Квестті аяқтау →</button><p class="kv-battle-note" style="margin-top:12px">⚠️ Бір оқушыға бір ғана мүмкіндік беріледі.</p></div>`;
   const qbox=box.querySelector('.kv-quest-questions');
   questions.forEach((q,i)=>{const card=document.createElement('div');card.className='kv-quest-question-card';card.innerHTML=`<div class="kv-quiz-progress">СҰРАҚ ${i+1} / ${questions.length}</div><div class="kv-quiz-question">${escapeHtml(q.question)}</div><label><input type="radio" name="qq-${q.id}" value="a"> ${escapeHtml(q.option_a)}</label><label><input type="radio" name="qq-${q.id}" value="b"> ${escapeHtml(q.option_b)}</label><label><input type="radio" name="qq-${q.id}" value="c"> ${escapeHtml(q.option_c)}</label><label><input type="radio" name="qq-${q.id}" value="d"> ${escapeHtml(q.option_d)}</label>`;qbox.appendChild(card);});
   box.querySelector('.quest-submit').onclick=async()=>{const name=box.querySelector('.quest-name').value.trim(),cls=box.querySelector('.quest-class').value.trim();if(!name||!cls){toast('Аты-жөніңіз бен сыныбыңызды жазыңыз.','error');return;}const answers=questions.map(q=>{const x=box.querySelector(`input[name="qq-${q.id}"]:checked`);return {question_id:q.id,answer:x?x.value:null};});const btn=box.querySelector('.quest-submit');btn.disabled=true;try{const r=await submitQuestAttempt(quest.id,name,cls,answers);box.innerHTML=`<div class="kv-quiz-result"><p>🎉 Квест аяқталды!</p><div class="score">${r.score} / ${r.total}</div><p>Нәтиже рейтингке қосылды.</p></div>`;await loadRating();await loadStudents();}catch(err){btn.disabled=false;const m=String(err?.message||'');if(m.includes('already submitted'))toast('Бұл квест бұрын тапсырылған.','error');else toast('Квест нәтижесін сақтау кезінде қате шықты.','error');}};
 }
 async function loadQuests(){
   if(!questListBox)return;
   const {data,error}=await sb.from('quests').select('id,title,description,created_at,book_id').eq('published',true).order('created_at',{ascending:false});
   if(error||!data?.length){questListBox.innerHTML='<p class="kv-empty">Жаңа квесттер жақында қосылады.</p>';return;}
   questListBox.innerHTML=''; data.forEach(q=>{const card=document.createElement('div');card.className='kv-quest-card';card.id=`kv-quest-${q.id}`;const locked=q.book_id && ![...allBooks].some(b=>String(b.quest_id)===String(q.id)&&currentProgress.has(String(b.id)));card.innerHTML=`<b>🎮</b><h3>${escapeHtml(q.title)}</h3><p>${escapeHtml(q.description||'Оқу квесті')}</p>${q.book_id?`<span class="kv-quest-lock">${locked?'🔒 Кітапты оқып «Я прочитал» басыңыз':'🔓 Квест ашық'}</span>`:''}<button class="btn btn-primary" ${locked?'disabled':''}>${locked?'🔒 Құлыпталған':'Квестті бастау →'}</button>`;if(!locked)card.querySelector('button').onclick=()=>renderQuest(card,q);questListBox.appendChild(card);});
 }
 /* ---- Library, grouped by grade ---- */
 let allBooks=[];
 let selectedGrade='6';
 function renderBooks(){
   if(!booksBox)return;
   const list=allBooks.filter(b=>String(b.grade)===selectedGrade);
   if(!list.length){ booksBox.innerHTML='<p class="kv-empty">Бұл сыныпқа кітаптар жақында қосылады.</p>'; return; }
   booksBox.innerHTML='';
   list.forEach(x=>{
     const el=document.createElement('div');
     el.className='kv-book card-in';
     const read=currentProgress.has(String(x.id)); const link=x.drive_url||x.pdf_url; el.innerHTML=`<b>${escapeHtml(x.icon||'📕')}</b><h3>${escapeHtml(x.title)}</h3>${x.author?`<span>${escapeHtml(x.author)}</span>`:''}${x.description?`<p>${escapeHtml(x.description)}</p>`:''}${link?`<a class="kv-book-pdf" href="${escapeHtml(link)}" target="_blank" rel="noopener">📖 Читать книгу</a>`:''}<button class="btn ${read?'btn-light':'btn-primary'} kv-book-read" ${read?'disabled':''}>${read?'✅ Прочитано':'✅ Я прочитал'}</button>${x.quest_id?`<small class="kv-book-quest">${read?'🧩 Квест доступен':'🧩 После отметки откроется квест'}</small>`:''}`; el.querySelector('.kv-book-read')?.addEventListener('click',()=>markBookRead(x));
     booksBox.appendChild(el);
   });
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

 /* ---- Class leaderboard: 2 columns — Жалпы балл (class_xp) + Battle ұпайы (battle_attempts avg) ---- */
 async function loadRating(){
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
       gapBox.textContent=gap>0?`🔥 ${rows[0].cls} көш бастап тұр! ${rows[1].cls}-ға дейін ${gap} XP қалды.`:'🔥 Топ екі сынып тең түсуде!';
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

 async function renderBattleResults(box,battle){
   try{await sb.rpc('finalize_battle_rewards',{p_battle_id:battle.id});}catch(e){}
   await loadRating(); await loadStudents();
   const {data,error}=await sb.from('battle_attempts').select('*').eq('battle_id',battle.id).eq('completed',true).order('score',{ascending:false}).order('duration_seconds',{ascending:true});
   if(error||!data||!data.length){ box.innerHTML='<p class="kv-empty">Battle нәтижелері есептелуде...</p>'; return; }
   const byClass={};
   data.forEach(a=>{const key=normalizeClassName(a.class_name);if(!byClass[key])byClass[key]={label:a.class_name,total:0,count:0};byClass[key].total+=a.score;byClass[key].count+=1;});
   const classes=Object.values(byClass).map(x=>({...x,avg:x.total/x.count})).sort((a,b)=>b.total-a.total||b.avg-a.avg);
   const winner=classes[0];
   const topScore=data[0].score;
   const top=data.filter(a=>a.score===topScore).sort((a,b)=>(a.duration_seconds||999999)-(b.duration_seconds||999999));
   const best=top[0];
   const tiedHtml=top.map((a,i)=>`<div class="kv-tie-row"><span>${i===0?'🥇':'👤'} ${escapeHtml(a.student_name)}</span><b>${a.score}/${a.total}</b><span>${formatDuration(a.duration_seconds)}</span></div>`).join('');
   box.innerHTML=`<div class="kv-battle-final"><div class="kv-battle-final-title">🏆 BATTLE АЯҚТАЛДЫ!</div><h3>Жеңімпаз сынып: ${escapeHtml(winner.label)}</h3><div class="kv-battle-final-score">${winner.total} ұпай</div><p>${winner.count} қатысушы · орташа ${winner.avg.toFixed(1)} ұпай</p><p>🎁 Жеңімпаз сыныптың жалпы рейтингіне <b>+50 XP</b>, үздік оқушының жеке рейтингіне <b>+10 XP</b> қосылды.</p><div class="kv-battle-best"><b>🥇 Ең жоғары жеке нәтиже</b>${tiedHtml}<small>${top.length>1?'Бірдей ең жоғары ұпай жинағандар арасында ең аз уақыт көрсеткен оқушы жеңімпаз болды.':'Ең жоғары ұпай және ең қысқа уақыт — жеңімпаз.'}</small></div></div><div class="kv-grid kv-battle-class-results">${classes.map((r,i)=>`<div class="kv-battle-card ${i===0?'winner':''}"><h3>${i===0?'👑 ':''}${escapeHtml(r.label)}</h3><div class="avg">${r.total}</div><small>жалпы ұпай · ${r.count} қатысушы · орташа ${r.avg.toFixed(1)}</small></div>`).join('')}</div>`;
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

 function renderBattleIntro(box,battle){
   box.innerHTML=`<p class="kv-battle-note">Қатысатын сыныптар: <b>${escapeHtml(battle.classes)}</b></p><input class="bq-name" placeholder="Аты-жөніңіз"><input class="bq-class" placeholder="Сыныбыңыз (мысалы 8А)"><div class="admin-actions" style="margin-top:14px"><button class="btn btn-primary bq-start">⚔️ Бастау</button></div><p class="kv-battle-note">«Бастау» батырмасы Battle басталғаннан кейін қолжетімді болады. Барлық қатысушыға ортақ 30 минуттық таймер жүреді.</p>`;
   box.querySelector('.bq-start').onclick=async()=>{
     const name=box.querySelector('.bq-name').value.trim(),cls=box.querySelector('.bq-class').value.trim();
     if(!name||!cls){toast('Аты-жөніңіз бен сыныбыңызды жазыңыз.','error');return;}
     if(!normalizeClassList(battle.classes).includes(normalizeClassName(cls))){toast('Бұл сынып осы battle-ге қатыспайды.','error');return;}
     try{const attempt=await startBattleAttempt(battle,name,cls);const {data,error}=await sb.from('battle_questions_public').select('*').eq('battle_id',battle.id).order('created_at',{ascending:true});if(error||!data?.length)throw new Error('questions');renderBattleQuiz(box,battle,attempt,data);}catch(err){toast('Battle бастау кезінде қате шықты.','error');}
   };
 }

 function renderBattleCard(battle){
   const target=new Date(battle.battle_date).getTime();
   const el=document.createElement('div');el.className='kv-battle-arena';
   el.innerHTML=`<div class="kv-battle-arena-head"><span class="kv-badge kv-badge-fire">⚔️ BATTLE</span><h3>${escapeHtml(battle.title)}</h3><p class="kv-battle-note">Қатысатын сыныптар: <b>${escapeHtml(battle.classes)}</b></p></div><div class="kv-battle-timer" hidden><div><b class="bt-d">0</b><span>күн</span></div><div><b class="bt-h">0</b><span>сағат</span></div><div><b class="bt-m">0</b><span>мин</span></div><div><b class="bt-s">0</b><span>сек</span></div></div><div class="kv-battle-live" hidden></div><div class="kv-battle-results"></div>`;
   battleListBox.appendChild(el);
   const timerBox=el.querySelector('.kv-battle-timer'),liveBox=el.querySelector('.kv-battle-live'),resultsBox=el.querySelector('.kv-battle-results');
   async function goLive(){timerBox.hidden=true;liveBox.hidden=false;const {data,error}=await sb.from('battle_questions_public').select('*').eq('battle_id',battle.id).order('created_at',{ascending:true});if(error||!data?.length)liveBox.innerHTML='<p class="kv-empty">⚔️ Battle басталды, сұрақтар дайын емес.</p>';else renderBattleIntro(liveBox,battle);}
   function tick(){const diff=target-Date.now(),c=formatCountdown(diff);if(!c){clearInterval(intervalId);goLive();return;}timerBox.hidden=false;el.querySelector('.bt-d').textContent=c.days;el.querySelector('.bt-h').textContent=String(c.hours).padStart(2,'0');el.querySelector('.bt-m').textContent=String(c.mins).padStart(2,'0');el.querySelector('.bt-s').textContent=String(c.secs).padStart(2,'0');}
   if(target>Date.now()){tick();const intervalId=setInterval(tick,1000);battleTimers.push(intervalId);}else{goLive();}
   // Results are only shown after battle start + 30 minutes.
   const resultTimer=setInterval(async()=>{if(Date.now()>=target+30*60*1000){clearInterval(resultTimer);await renderBattleResults(resultsBox,battle);}},1000);battleTimers.push(resultTimer);
 }
 async function loadBattles(){if(!battleListBox)return;clearBattleTimers();const {data,error}=await sb.from('battles').select('*').order('battle_date',{ascending:true});if(error||!data||!data.length){battleListBox.innerHTML='<p class="kv-empty">Battle жақында жарияланады.</p>';return;}battleListBox.innerHTML='';data.forEach(renderBattleCard);}

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
   quizBox.innerHTML=`<div class="kv-quiz-daily"><b>🧠 БҮГІНГІ ВИКТОРИНА</b><span>1 сұрақ · 1 мүмкіндік · дұрыс жауапқа 1 ұпай</span></div><div class="kv-daily-timer-wrap">Келесі сұраққа дейін: <strong class="kv-daily-timer">--:--:--</strong></div><input id="kv-quiz-name" placeholder="Аты-жөніңіз"><input id="kv-quiz-class" placeholder="Сыныбыңыз (мысалы 10А)"><div class="admin-actions" style="margin-top:14px"><button class="btn btn-primary" id="kv-quiz-start">Викторинаны бастау →</button></div>`;
   renderDailyCountdown(quizBox,activeQuiz.ends_at);
   document.getElementById('kv-quiz-start').onclick=startQuiz;
 }
 function startQuiz(){if(!activeQuiz)return;const name=document.getElementById('kv-quiz-name').value.trim(),cls=document.getElementById('kv-quiz-class').value.trim();if(!name||!cls){toast('Аты-жөніңіз бен сыныбыңызды жазыңыз.','error');return;}runQuiz(name,cls);}
 function runQuiz(name,cls){const q=activeQuiz;quizBox.innerHTML=`<div class="kv-quiz-progress">БҮГІНГІ СҰРАҚ</div><div class="kv-quiz-question">${escapeHtml(q.question)}</div><button class="kv-quiz-option" data-opt="a">${escapeHtml(q.option_a)}</button><button class="kv-quiz-option" data-opt="b">${escapeHtml(q.option_b)}</button><button class="kv-quiz-option" data-opt="c">${escapeHtml(q.option_c)}</button><button class="kv-quiz-option" data-opt="d">${escapeHtml(q.option_d)}</button><p class="kv-battle-note" style="margin-top:12px">⚠️ Жауапты бір рет таңдайсыз. Қайта тапсыруға мүмкіндік жоқ.</p>`;quizBox.querySelectorAll('.kv-quiz-option').forEach(btn=>btn.onclick=async()=>{quizBox.querySelectorAll('.kv-quiz-option').forEach(b=>b.disabled=true);btn.classList.add('picked');await finishQuiz(name,cls,btn.dataset.opt);});}
 async function finishQuiz(name,cls,answer){quizBox.innerHTML='<div class="kv-quiz-result"><p>Жауабыңыз сақталуда...</p></div>';try{const {data,error}=await sb.rpc('submit_daily_quiz',{p_question_id:activeQuiz.id,p_student_name:name,p_class_name:cls,p_answer:answer});if(error)throw error;quizBox.innerHTML='<div class="kv-quiz-result"><p>✅ Жауабыңыз қабылданды.</p><p>1 мүмкіндік пайдаланылды.</p><p>Нәтиже мен сынып рейтингі уақыт біткеннен кейін ғана жарияланады.</p></div>';toast('1 мүмкіндік пайдаланылды. Нәтиже кейін жарияланады!');}catch(err){const msg=String(err?.message||'');if(msg.includes('already submitted'))quizBox.innerHTML='<div class="kv-quiz-result"><p>⚠️ Бұл оқушы бүгінгі викторинаны бұрын тапсырған.</p><p>Бір сұраққа тек 1 мүмкіндік беріледі.</p></div>';else if(msg.includes('no longer active')||msg.includes('not active')){await syncDailyQuiz();}else quizBox.innerHTML='<div class="kv-quiz-result"><p>Жауапты сақтау кезінде қате шықты.</p><p style="color:#e5484d">Интернетті тексеріп, кейінірек қайталап көріңіз.</p></div>';}}

 await Promise.all([loadBooks(),loadRating(),loadBattles(),loadStudents(),loadRewards(),loadQuizIntro()]); await loadQuests(); await loadStudentProfile();
})();
