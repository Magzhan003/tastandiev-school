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

/* ========================= KITAPVERSE data + interactions ========================= */
(async function(){
 const configured=window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('PASTE_') && window.SUPABASE_ANON_KEY.length>20;
 const booksBox=document.getElementById('kv-books');
 const barsBox=document.getElementById('kv-bars');
 const gapBox=document.getElementById('kv-gap');
 const questLink=document.getElementById('kv-quest-link');
 const quizBox=document.getElementById('kv-quiz-box');
 const battleBox=document.getElementById('kv-battle');
 const studentsBox=document.getElementById('kv-students');
 const rewardsBox=document.getElementById('kv-rewards');

 if(!configured){
   if(booksBox)booksBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(barsBox)barsBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(quizBox)quizBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(battleBox)battleBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
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

 /* ---- Class leaderboard (БҮГІНГІ КІТАП) ---- */
 async function loadRating(){
   if(!barsBox)return;
   const {data,error}=await sb.from('class_xp').select('*').order('xp',{ascending:false});
   if(error||!data||!data.length){ barsBox.innerHTML='<p class="kv-empty">Рейтинг жақында қосылады.</p>'; if(gapBox)gapBox.textContent=''; return; }
   const max=data[0].xp;
   const medals=['🥇','🥈','🥉'];
   barsBox.innerHTML='';
   data.forEach((item,i)=>{
     const row=document.createElement('div'); row.className='kv-bar-row';
     const pct=max>0?Math.max(4,Math.round((item.xp/max)*100)):0;
     row.innerHTML=`<div class="kv-bar-rank">${medals[i]||(i+1)}</div><div class="kv-bar-class">${escapeHtml(item.class_name)}</div><div class="kv-bar-track"><div class="kv-bar-fill${i===0?' gold':''}" data-pct="${pct}"></div></div><div class="kv-bar-xp">${item.xp} XP</div>`;
     barsBox.appendChild(row);
   });
   requestAnimationFrame(()=>{ barsBox.querySelectorAll('.kv-bar-fill').forEach(el=>{ el.style.width=el.dataset.pct+'%'; }); });
   if(gapBox){
     if(data.length>1){
       const gap=data[0].xp-data[1].xp;
       gapBox.textContent=gap>0?`🔥 ${data[0].class_name} көш бастап тұр! ${data[1].class_name}-ға дейін ${gap} XP қалды.`:'🔥 Топ екі сынып тең түсуде!';
     } else { gapBox.textContent=''; }
   }
 }

 /* ---- Battle: auto-computed class averages from quiz_attempts ---- */
 async function loadBattle(){
   if(!battleBox)return;
   const {data,error}=await sb.from('quiz_attempts').select('*');
   if(error||!data||!data.length){ battleBox.innerHTML='<p class="kv-empty">Викторинадан кейін battle нәтижелері осы жерде шығады.</p>'; return; }
   const byClass={};
   data.forEach(a=>{
     if(!byClass[a.class_name])byClass[a.class_name]={sum:0,count:0};
     byClass[a.class_name].sum+=a.score; byClass[a.class_name].count+=1;
   });
   const rows=Object.keys(byClass).map(cls=>({cls,avg:byClass[cls].sum/byClass[cls].count,count:byClass[cls].count}));
   rows.sort((a,b)=>b.avg-a.avg);
   battleBox.innerHTML='';
   rows.forEach((r,i)=>{
     const el=document.createElement('div');
     el.className='kv-battle-card'+(i===0?' winner':'');
     el.innerHTML=`${i===0?'<div class="crown">👑</div>':''}<h3>${escapeHtml(r.cls)}</h3><div class="avg">${r.avg.toFixed(1)}</div><small>орташа ұпай · ${r.count} қатысушы</small>`;
     battleBox.appendChild(el);
   });
 }

 /* ---- Student rating (top 5, sum of quiz scores) ---- */
 async function loadStudents(){
   if(!studentsBox)return;
   const {data,error}=await sb.from('quiz_attempts').select('*');
   if(error||!data||!data.length){ studentsBox.innerHTML='<p class="kv-empty">Викторина нәтижелерінен кейін рейтинг осы жерде шығады.</p>'; return; }
   const byStudent={};
   data.forEach(a=>{
     const key=a.student_name+'|'+a.class_name;
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

 /* ---- Live quiz with automatic XP ---- */
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
     await sb.from('quiz_attempts').insert({student_name:name,class_name:cls,score,total});
     const existing=await sb.from('class_xp').select('*').eq('class_name',cls).maybeSingle();
     if(existing.data){
       await sb.from('class_xp').update({xp:existing.data.xp+score,updated_at:new Date().toISOString()}).eq('id',existing.data.id);
     } else {
       await sb.from('class_xp').insert({class_name:cls,xp:score});
     }
     quizBox.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже:</p><div class="score">${score} / ${total}</div><p>🔥 ${escapeHtml(cls)} сыныбына +${score} XP қосылды!</p><div class="admin-actions" style="justify-content:center"><button class="btn btn-light" id="kv-quiz-again">Қайта тапсыру</button></div></div>`;
     document.getElementById('kv-quiz-again').onclick=loadQuizIntro;
     toast(`Нәтиже сақталды: ${score}/${total}`);
     await Promise.all([loadRating(),loadBattle(),loadStudents()]);
   }catch(err){
     quizBox.innerHTML=`<div class="kv-quiz-result"><p>Нәтиже: ${score} / ${total}</p><p style="color:#e5484d">Сақтау кезінде қате шықты, кейінірек қайталап көріңіз.</p></div>`;
   }
 }

 await Promise.all([loadQuestLink(),loadBooks(),loadRating(),loadBattle(),loadStudents(),loadRewards(),loadQuizIntro()]);
})();
