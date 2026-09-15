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
 const questLink=document.getElementById('kv-quest-link');
 const quizBox=document.getElementById('kv-quiz-box');
 const battleListBox=document.getElementById('kv-battle-list');
 const studentsBox=document.getElementById('kv-students');
 const rewardsBox=document.getElementById('kv-rewards');

 if(!configured){
   if(booksBox)booksBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(barsBox)barsBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(quizBox)quizBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(battleListBox)battleListBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(studentsBox)studentsBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   return;
 }

 const {createClient}=window.supabase; const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);

 /* ---- Quest link ---- */
 async function loadQuestLink(){
   if(!questLink)return;
   const {data}=await sb.from('kv_settings').select('*').eq('key','quest_link').maybeSingle();
   if(data && data.value){ questLink.href=data.value; } else { questLink.href='#'; questLink.textContent='Сілтеме жақында қосылады'; questLink.classList.add('disabled'); }
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
     el.innerHTML=`<b>${escapeHtml(x.icon||'📕')}</b><h3>${escapeHtml(x.title)}</h3>${x.author?`<span>${escapeHtml(x.author)}</span>`:''}${x.description?`<p>${escapeHtml(x.description)}</p>`:''}${x.pdf_url?`<a class="kv-book-pdf" href="${x.pdf_url}" target="_blank" rel="noopener">PDF оқу →</a>`:''}`;
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

 /* ---- Battles: countdown → live quiz → results, one arena card per battle ---- */
 const battleTimers=[];
 function clearBattleTimers(){ battleTimers.forEach(t=>clearInterval(t)); battleTimers.length=0; }

 function formatCountdown(ms){
   if(ms<=0)return null;
   const s=Math.floor(ms/1000);
   const days=Math.floor(s/86400), hours=Math.floor((s%86400)/3600), mins=Math.floor((s%3600)/60), secs=s%60;
   return {days,hours,mins,secs};
 }

 async function renderBattleResults(box,battle){
   const {data}=await sb.from('battle_attempts').select('*').eq('battle_id',battle.id);
   if(!data||!data.length){ box.innerHTML='<p class="kv-empty">Бұл battle бойынша нәтиже әлі жоқ. Бірінші болып тапсырып көр!</p>'; return; }
   const byClass={};
   data.forEach(a=>{
     const key=normalizeClassName(a.class_name);
     if(!byClass[key])byClass[key]={sum:0,count:0,label:a.class_name};
     byClass[key].sum+=a.score; byClass[key].count+=1;
   });
   const rows=Object.values(byClass).map(r=>({label:r.label,avg:r.sum/r.count,count:r.count}));
   rows.sort((a,b)=>b.avg-a.avg);
   box.innerHTML='';
   const grid=document.createElement('div'); grid.className='kv-grid';
   rows.forEach((r,i)=>{
     const el=document.createElement('div');
     el.className='kv-battle-card'+(i===0?' winner':'');
     el.innerHTML=`${i===0?'<div class="crown">👑</div>':''}<h3>${escapeHtml(r.label)}</h3><div class="avg">${r.avg.toFixed(1)}</div><small>орташа ұпай · ${r.count} қатысушы</small>`;
     grid.appendChild(el);
   });
   box.appendChild(grid);
 }

 function renderBattleQuizIntro(box,battle,questions){
   box.innerHTML=`
     <p class="kv-battle-note">Қатысатын сыныптар: <b>${escapeHtml(battle.classes)}</b></p>
     <input class="bq-name" placeholder="Аты-жөніңіз">
     <input class="bq-class" placeholder="Сыныбыңыз (мысалы 8А)">
     <div class="admin-actions" style="margin-top:14px"><button class="btn btn-primary bq-start">⚔️ Battle-ге қатысу (${questions.length} сұрақ)</button></div>
   `;
   box.querySelector('.bq-start').onclick=()=>{
     const name=box.querySelector('.bq-name').value.trim();
     const cls=box.querySelector('.bq-class').value.trim();
     if(!name||!cls){ toast('Аты-жөніңіз бен сыныбыңызды жазыңыз.','error'); return; }
     const allowed=normalizeClassList(battle.classes);
     if(allowed.length && !allowed.includes(normalizeClassName(cls))){
       toast('Бұл сынып осы battle-ге қатыспайды.','error'); return;
     }
     runBattleQuiz(box,battle,questions,name,cls,0,0);
   };
 }

 function runBattleQuiz(box,battle,questions,name,cls,index,score){
   if(index>=questions.length){ finishBattleQuiz(box,battle,name,cls,score,questions.length); return; }
   const q=questions[index];
   box.innerHTML=`
     <div class="kv-quiz-progress">СҰРАҚ ${index+1} / ${questions.length}</div>
     <div class="kv-quiz-question">${escapeHtml(q.question)}</div>
     <button class="kv-quiz-option" data-opt="a">${escapeHtml(q.option_a)}</button>
     <button class="kv-quiz-option" data-opt="b">${escapeHtml(q.option_b)}</button>
     <button class="kv-quiz-option" data-opt="c">${escapeHtml(q.option_c)}</button>
     <button class="kv-quiz-option" data-opt="d">${escapeHtml(q.option_d)}</button>
   `;
   box.querySelectorAll('.kv-quiz-option').forEach(btn=>{
     btn.onclick=()=>{
       box.querySelectorAll('.kv-quiz-option').forEach(b=>{b.disabled=true;});
       btn.classList.add('picked');
       const correct=btn.dataset.opt===q.correct_option;
       setTimeout(()=>runBattleQuiz(box,battle,questions,name,cls,index+1,score+(correct?1:0)),450);
     };
   });
 }

 async function finishBattleQuiz(box,battle,name,cls,score,total){
   box.innerHTML='<div class="kv-quiz-result"><p>Нәтиже дайын...</p></div>';
   try{
     await sb.from('battle_attempts').insert({battle_id:battle.id,student_name:name,class_name:cls,score,total});
     box.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже:</p><div class="score">${score} / ${total}</div><p>⚔️ ${escapeHtml(cls)} сыныбы battle-ге ұпай қосты!</p></div>`;
     toast(`Battle нәтижесі сақталды: ${score}/${total}`);
     const resultsBox=box.closest('.kv-battle-arena').querySelector('.kv-battle-results');
     await Promise.all([renderBattleResults(resultsBox,battle),loadRating()]);
   }catch(err){
     box.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже: ${score} / ${total}</p><p style="color:#e5484d">Сақтау кезінде қате шықты, кейінірек қайталап көріңіз.</p></div>`;
   }
 }

 function renderBattleCard(battle){
   const target=new Date(battle.battle_date).getTime();
   const el=document.createElement('div');
   el.className='kv-battle-arena';
   el.innerHTML=`
     <div class="kv-battle-arena-head">
       <span class="kv-badge kv-badge-fire">⚔️ BATTLE</span>
       <h3>${escapeHtml(battle.title)}</h3>
       <p class="kv-battle-note">Қатысатын сыныптар: <b>${escapeHtml(battle.classes)}</b></p>
     </div>
     <div class="kv-battle-timer" hidden>
       <div><b class="bt-d">0</b><span>күн</span></div><div><b class="bt-h">0</b><span>сағат</span></div><div><b class="bt-m">0</b><span>мин</span></div><div><b class="bt-s">0</b><span>сек</span></div>
     </div>
     <div class="kv-battle-live" hidden></div>
     <div class="kv-battle-results"></div>
   `;
   battleListBox.appendChild(el);

   const timerBox=el.querySelector('.kv-battle-timer');
   const liveBox=el.querySelector('.kv-battle-live');
   const resultsBox=el.querySelector('.kv-battle-results');

   async function goLive(){
     timerBox.hidden=true; liveBox.hidden=false;
     const {data}=await sb.from('battle_questions').select('*').eq('battle_id',battle.id).order('created_at',{ascending:true});
     if(!data||!data.length){
       liveBox.innerHTML='<p class="kv-empty">⚔️ Battle басталды! Сұрақтар жақында қосылады.</p>';
     } else {
       renderBattleQuizIntro(liveBox,battle,data);
     }
     await renderBattleResults(resultsBox,battle);
   }

   function tick(){
     const diff=target-Date.now();
     const c=formatCountdown(diff);
     if(!c){ clearInterval(intervalId); goLive(); return; }
     timerBox.hidden=false;
     el.querySelector('.bt-d').textContent=c.days;
     el.querySelector('.bt-h').textContent=String(c.hours).padStart(2,'0');
     el.querySelector('.bt-m').textContent=String(c.mins).padStart(2,'0');
     el.querySelector('.bt-s').textContent=String(c.secs).padStart(2,'0');
   }

   if(target>Date.now()){
     tick();
     const intervalId=setInterval(tick,1000);
     battleTimers.push(intervalId);
   } else {
     goLive();
   }
 }

 async function loadBattles(){
   if(!battleListBox)return;
   clearBattleTimers();
   const {data,error}=await sb.from('battles').select('*').order('battle_date',{ascending:true});
   if(error||!data||!data.length){ battleListBox.innerHTML='<p class="kv-empty">Battle жақында жарияланады. Күнін білу үшін жаңалықтарды бақылап отырыңыз!</p>'; return; }
   battleListBox.innerHTML='';
   data.forEach(renderBattleCard);
 }

 /* ---- Student rating (top 5, sum of general quiz scores) ---- */
 async function loadStudents(){
   if(!studentsBox)return;
   const {data,error}=await sb.from('quiz_attempts').select('*');
   if(error||!data||!data.length){ studentsBox.innerHTML='<p class="kv-empty">Викторина нәтижелерінен кейін рейтинг осы жерде шығады.</p>'; return; }
   const byStudent={};
   data.forEach(a=>{
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

 /* ---- Live quiz with automatic XP (general, not battle) ---- */
 let quizQuestions=[];
 async function loadQuizIntro(){
   if(!quizBox)return;
   const {data,error}=await sb.from('quiz_questions').select('*').order('created_at',{ascending:true});
   quizQuestions=(!error && data)?data:[];
   if(!quizQuestions.length){ quizBox.innerHTML='<p class="kv-empty">Викторина сұрақтары жақында қосылады.</p>'; return; }
   quizBox.innerHTML=`
     <input id="kv-quiz-name" placeholder="Аты-жөніңіз">
     <input id="kv-quiz-class" placeholder="Сыныбыңыз (мысалы 7А)">
     <div class="admin-actions" style="margin-top:14px"><button class="btn btn-primary" id="kv-quiz-start">Викторинаны бастау (${quizQuestions.length} сұрақ)</button></div>
   `;
   document.getElementById('kv-quiz-start').onclick=startQuiz;
 }

 function startQuiz(){
   const name=document.getElementById('kv-quiz-name').value.trim();
   const cls=document.getElementById('kv-quiz-class').value.trim();
   if(!name||!cls){ toast('Аты-жөніңіз бен сыныбыңызды жазыңыз.','error'); return; }
   runQuiz(name,cls,0,0);
 }

 function runQuiz(name,cls,index,score){
   if(index>=quizQuestions.length){ finishQuiz(name,cls,score); return; }
   const q=quizQuestions[index];
   quizBox.innerHTML=`
     <div class="kv-quiz-progress">СҰРАҚ ${index+1} / ${quizQuestions.length}</div>
     <div class="kv-quiz-question">${escapeHtml(q.question)}</div>
     <button class="kv-quiz-option" data-opt="a">${escapeHtml(q.option_a)}</button>
     <button class="kv-quiz-option" data-opt="b">${escapeHtml(q.option_b)}</button>
     <button class="kv-quiz-option" data-opt="c">${escapeHtml(q.option_c)}</button>
     <button class="kv-quiz-option" data-opt="d">${escapeHtml(q.option_d)}</button>
   `;
   quizBox.querySelectorAll('.kv-quiz-option').forEach(btn=>{
     btn.onclick=()=>{
       quizBox.querySelectorAll('.kv-quiz-option').forEach(b=>{b.disabled=true;});
       btn.classList.add('picked');
       const correct=btn.dataset.opt===q.correct_option;
       setTimeout(()=>runQuiz(name,cls,index+1,score+(correct?1:0)),450);
     };
   });
 }

 async function finishQuiz(name,cls,score){
   const total=quizQuestions.length;
   quizBox.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже дайын...</p></div>`;
   try{
     const normCls=normalizeClassName(cls);
     await sb.from('quiz_attempts').insert({student_name:name,class_name:cls,score,total});
     const existing=await sb.from('class_xp').select('*').eq('class_name',normCls).maybeSingle();
     if(existing.data){
       await sb.from('class_xp').update({xp:existing.data.xp+score,updated_at:new Date().toISOString()}).eq('id',existing.data.id);
     } else {
       await sb.from('class_xp').insert({class_name:normCls,xp:score});
     }
     quizBox.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже:</p><div class="score">${score} / ${total}</div><p>🔥 ${escapeHtml(cls)} сыныбына +${score} XP қосылды!</p><div class="admin-actions" style="justify-content:center"><button class="btn btn-light" id="kv-quiz-again">Қайта тапсыру</button></div></div>`;
     document.getElementById('kv-quiz-again').onclick=loadQuizIntro;
     toast(`Нәтиже сақталды: ${score}/${total}`);
     await Promise.all([loadRating(),loadStudents()]);
   }catch(err){
     quizBox.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже: ${score} / ${total}</p><p style="color:#e5484d">Сақтау кезінде қате шықты, кейінірек қайталап көріңіз.</p></div>`;
   }
 }

 await Promise.all([loadQuestLink(),loadBooks(),loadRating(),loadBattles(),loadStudents(),loadRewards(),loadQuizIntro()]);
})();
