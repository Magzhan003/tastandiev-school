/* KITAPVERSE — Мектептер лигасы.
   Екі мектеп арасындағы турлар: таймер → тест → нәтиже → лига кестесі (жеңіс 3, тең 1, жеңіліс 0).
   Басқа мектептің оқушысына аккаунт керек емес: ол сілтеме арқылы (league.html?round=ID) аты-жөні мен сыныбын жазып қатысады.
   Бұл файл kitapverse.html ішінде де, жеке league.html бетінде де жұмыс істейді. */
(function(){
 const root=document.getElementById('kv-league-root');
 if(!root)return;
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 function note(msg,type){
   if(typeof window.toast==='function'){window.toast(msg,type||'success');return;}
   const box=document.getElementById('toast-container');if(!box)return;
   const el=document.createElement('div');el.className='toast '+(type||'success');el.textContent=msg;box.appendChild(el);
   setTimeout(()=>{el.classList.add('hide');setTimeout(()=>el.remove(),250);},3200);
 }
 const fmtDur=sec=>{sec=Math.max(0,Math.round(sec||0));return Math.floor(sec/60)+' мин '+String(sec%60).padStart(2,'0')+' сек';};
 const pad=n=>String(n).padStart(2,'0');
 const ERR=[
   ['already submitted','Сіз бұл турға қатысып қойғансыз.'],
   ['round is not active','Тур әлі басталған жоқ.'],
   ['round is over','Бұл тур аяқталды.'],
   ['not participating','Бұл мектеп осы турға қатыспайды.'],
   ['name is required','Аты-жөніңізді жазыңыз.'],
   ['school limit','Бұл мектептен қатысушылар лимиті толды.'],
   ['time expired','Уақыт аяқталды.'],
   ['not available','Бұл талпыныс қолжетімсіз.']
 ];
 const errText=e=>{const m=String(e&&e.message||'');const f=ERR.find(x=>m.includes(x[0]));return f?f[1]:'Қате шықты. Интернетті тексеріп, қайталаңыз.';};

 let loading=false, sb=null, rounds=[], table=[], resultsCache={}, tickId=0, modal=null;
 const ls={get(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},del(k){try{localStorage.removeItem(k);}catch(e){}}};

 function getKV(){
   if(window.KV)return window.KV;
   if(window.KV_STANDALONE&&window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
     const c=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
     window.KV={sb:c,student:()=>window.__kvStudent||null};
     c.auth.getSession().then(async({data:{session}})=>{
       if(!session)return;
       const {data}=await c.from('student_profiles').select('full_name,class_name').eq('auth_user_id',session.user.id).maybeSingle();
       if(data)window.__kvStudent=data;
     }).catch(()=>{});
     return window.KV;
   }
   return null;
 }

 const startMs=r=>new Date(r.starts_at).getTime();
 const endMs=r=>startMs(r)+r.duration_min*60000;
 const stateOf=(r,now)=>now<startMs(r)?'soon':now<endMs(r)?'live':'done';
 function cd(ms){const s=Math.max(0,Math.floor(ms/1000));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;return (d?d+' күн ':'')+pad(h)+':'+pad(m)+':'+pad(x);}
 function shareLink(id){const base=location.origin+location.pathname.replace(/[^/]*$/,'');return base+'league.html?round='+id;}

 async function load(){
   const [r,t]=await Promise.all([sb.from('league_rounds').select('*').order('starts_at',{ascending:true}),sb.rpc('league_table')]);
   if(r.error){root.innerHTML='<p class="kv-empty">Лига жақында қосылады.</p>';return false;}
   rounds=r.data||[];table=t.error?[]:(t.data||[]);
   render();return true;
 }

 function renderTable(){
   const map={};
   table.forEach(x=>{map[x.school]={school:x.school,played:x.played,wins:x.wins,draws:x.draws,losses:x.losses,points:x.points,avg:x.avg_percent};});
   rounds.forEach(r=>[r.school_a,r.school_b].forEach(n=>{if(!map[n])map[n]={school:n,played:0,wins:0,draws:0,losses:0,points:0,avg:null};}));
   const rows=Object.values(map).sort((a,b)=>b.points-a.points||(b.avg??-1)-(a.avg??-1)||a.school.localeCompare(b.school));
   if(!rows.length)return '';
   return `<div class="kv-lg-table-wrap"><table class="kv-lg-table"><thead><tr><th>#</th><th class="l">Мектеп</th><th title="Ойын">О</th><th title="Жеңіс">+</th><th title="Тең">=</th><th title="Жеңіліс">−</th><th title="Ұпай">Ұпай</th><th title="Орташа пайыз">%</th></tr></thead><tbody>${rows.map((x,i)=>`<tr class="${i===0&&x.played>0?'lead':''}"><td>${i===0&&x.played>0?'🥇':i+1}</td><td class="l">${esc(x.school)}</td><td>${x.played}</td><td>${x.wins}</td><td>${x.draws}</td><td>${x.losses}</td><td><b>${x.points}</b></td><td>${x.avg==null?'—':Math.round(x.avg)+'%'}</td></tr>`).join('')}</tbody></table></div><p class="kv-lg-legend">+ жеңіс (3 ұпай) · = тең (1) · − жеңіліс (0) · % — тур нәтижесінің орташасы</p>`;
 }

 function teamBox(t,win){return `<div class="kv-lg-team${win?' win':''}"><b>${win?'🏆 ':''}${esc(t.school)}</b><div class="kv-lg-pct">${t.percent}%</div><small>${t.participants} қатысушы · ${t.total_score} ұпай</small></div>`;}
 function resultHtml(res){
   if(!res)return '<p class="kv-empty">Нәтиже есептелуде…</p>';
   const a=res.school_a,b=res.school_b;
   if(a.participants+b.participants===0)return '<p class="kv-empty">Бұл турға ешкім қатыспады.</p>';
   const banner=res.winner?`🏆 Жеңімпаз: <b>${esc(res.winner)}</b> (+3 ұпай)`:'🤝 Тең ойын (екі мектепке де +1 ұпай)';
   const best=(res.best||[])[0];
   return `<div class="kv-lg-teams">${teamBox(a,res.winner===a.school)}<span class="kv-lg-vs">VS</span>${teamBox(b,res.winner===b.school)}</div><div class="kv-lg-banner">${banner}</div>${best?`<p class="kv-lg-best">🥇 Үздік оқушы: <b>${esc(best.student_name)}</b> (${esc(best.school)}${best.class_name?', '+esc(best.class_name):''}) — ${best.total} сұрақтың ${best.score}-на дұрыс, ⏱ ${fmtDur(best.duration_seconds)}</p>`:''}`;
 }

 function render(){
   const now=Date.now();
   const list=[...rounds].sort((a,b)=>startMs(b)-startMs(a));
   const cards=list.map(r=>{
     const st=stateOf(r,now);
     const saved=ls.get('kvl_'+r.id);
     let body='';
     if(st==='soon')body=`<div class="kv-lg-timer" data-t="${startMs(r)}" data-mode="soon"></div><small class="kv-lg-hint">Тур басталғанға дейін</small>`;
     else if(st==='live')body=`<div class="kv-lg-timer live" data-t="${endMs(r)}" data-mode="live"></div><small class="kv-lg-hint">Тур аяқталуға дейін</small><button class="btn btn-primary kv-lg-join" data-join="${r.id}">${saved&&saved.ends>now?'▶ Жалғастыру':'⚔️ Қатысу'}</button>`;
     else body=`<div class="kv-lg-result" data-res="${r.id}">${resultsCache[r.id]?resultHtml(resultsCache[r.id]):'<p class="kv-empty">Нәтиже жүктелуде…</p>'}</div>`;
     const badge=st==='soon'?'<span class="kv-lg-badge soon">Жақында</span>':st==='live'?'<span class="kv-lg-badge live">● Тікелей</span>':'<span class="kv-lg-badge done">Аяқталды</span>';
     return `<article class="kv-lg-round" id="kv-round-${r.id}" data-state="${st}"><header><div><small>${esc(r.title)}</small><h3>${esc(r.school_a)} <i>vs</i> ${esc(r.school_b)}</h3><p>📖 ${esc(r.book_title)} · ${new Date(r.starts_at).toLocaleString('kk-KZ',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${r.duration_min} мин</p></div>${badge}</header>${body}<button class="kv-lg-share" data-share="${r.id}" type="button">🔗 Сілтемені көшіру</button></article>`;
   }).join('');
   root.innerHTML=renderTable()+(cards?`<div class="kv-lg-rounds">${cards}</div>`:'<p class="kv-empty">Лига турлары жақында жарияланады.</p>');
   root.querySelectorAll('[data-join]').forEach(b=>b.onclick=()=>openModal(rounds.find(r=>String(r.id)===b.dataset.join)));
   root.querySelectorAll('[data-share]').forEach(b=>b.onclick=async()=>{const url=shareLink(b.dataset.share);try{await navigator.clipboard.writeText(url);note('Сілтеме көшірілді!');}catch(e){window.prompt('Сілтемені көшіріңіз:',url);}});
   // finished rounds → fetch results once
   rounds.filter(r=>stateOf(r,now)==='done'&&!resultsCache[r.id]).forEach(async r=>{
     const {data,error}=await sb.rpc('league_round_results',{p_round_id:r.id});
     if(error)return;resultsCache[r.id]=data;
     const el=root.querySelector(`[data-res="${r.id}"]`);if(el)el.innerHTML=resultHtml(data);
   });
   updateTimers();
 }

 function updateTimers(){
   const now=Date.now();let changed=false;
   root.querySelectorAll('.kv-lg-timer').forEach(el=>{el.textContent=cd(Number(el.dataset.t)-now);});
   root.querySelectorAll('.kv-lg-round').forEach(card=>{
     const id=card.id.replace('kv-round-','');const r=rounds.find(x=>String(x.id)===id);
     if(r&&stateOf(r,now)!==card.dataset.state)changed=true;
   });
   if(changed&&!loading){loading=true;load().finally(()=>{loading=false;});}
 }

 /* ---------- Қатысу терезесі ---------- */
 function ensureModal(){
   if(modal)return modal;
   modal=document.createElement('div');modal.className='kv-modal kv-lg-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
   modal.innerHTML='<div class="kv-modal-box"><button type="button" class="kv-modal-close" aria-label="Жабу">×</button><div id="kv-lg-modal-body"></div></div>';
   document.body.appendChild(modal);
   const close=()=>{if(modal.dataset.busy==='1'){if(!confirm('Тест жүріп жатыр. Терезені жапсаңыз да, уақыт тоқтамайды. Жабу керек пе?'))return;}hideModal();};
   modal.addEventListener('click',e=>{if(e.target===modal)close();});
   modal.querySelector('.kv-modal-close').onclick=close;
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
   return modal;
 }
 let quizTimer=0;
 function hideModal(){if(!modal)return;modal.hidden=true;modal.dataset.busy='0';document.body.classList.remove('kv-modal-open');clearInterval(quizTimer);}
 function showModal(){ensureModal().hidden=false;document.body.classList.add('kv-modal-open');}
 const body=()=>ensureModal().querySelector('#kv-lg-modal-body');

 function homeGuess(r){const t=s=>/(№?\s*11\b|тастандиев)/i.test(s);return t(r.school_a)?r.school_a:t(r.school_b)?r.school_b:'';}

 function openModal(r){
   if(!r)return;
   if(stateOf(r,Date.now())!=='live'){note('Тур қазір жүріп жатқан жоқ.','error');return;}
   const saved=ls.get('kvl_'+r.id);
   if(saved&&saved.ends>Date.now()){resumeQuiz(r,saved);return;}
   const kv=getKV();const stu=kv&&kv.student?kv.student():null;
   const pre=stu?homeGuess(r):'';
   body().innerHTML=`<h3>⚔️ ${esc(r.title)}</h3><p class="kv-up-hint">📖 ${esc(r.book_title)} · ${r.duration_min} минут</p>
   <fieldset class="kv-lg-schools"><legend>Мектебіңізді таңдаңыз</legend>
    <label><input type="radio" name="kvl-school" value="${esc(r.school_a)}"${pre===r.school_a?' checked':''}><span>${esc(r.school_a)}</span></label>
    <label><input type="radio" name="kvl-school" value="${esc(r.school_b)}"${pre===r.school_b?' checked':''}><span>${esc(r.school_b)}</span></label></fieldset>
   <label class="kv-up-label">Аты-жөніңіз<input id="kvl-name" maxlength="80" autocomplete="name" value="${esc(stu?stu.full_name:'')}" placeholder="Мысалы: Алия Ермекова"></label>
   <label class="kv-up-label">Сынып<input id="kvl-class" maxlength="20" value="${esc(stu?stu.class_name:'')}" placeholder="Мысалы: 8А"></label>
   <p class="kv-up-status" id="kvl-status" role="status"></p>
   <button type="button" class="btn btn-primary kv-up-send" id="kvl-start">⚔️ Бастау</button>
   <p class="kv-battle-note">Тест ортақ таймермен жүреді. Әр оқушыға тек бір талпыныс беріледі.</p>`;
   showModal();
   const m=ensureModal(),st=m.querySelector('#kvl-status'),btn=m.querySelector('#kvl-start');
   btn.onclick=async()=>{
     const school=(m.querySelector('input[name="kvl-school"]:checked')||{}).value,name=m.querySelector('#kvl-name').value.trim(),cls=m.querySelector('#kvl-class').value.trim();
     st.className='kv-up-status';
     if(!school){st.textContent='Мектебіңізді таңдаңыз.';st.className='kv-up-status error';return;}
     if(!name){st.textContent='Аты-жөніңізді жазыңыз.';st.className='kv-up-status error';return;}
     btn.disabled=true;st.textContent='Басталуда…';
     try{
       const {data,error}=await sb.rpc('league_start',{p_round_id:r.id,p_school:school,p_name:name,p_class:cls});
       if(error)throw error;
       const a=Array.isArray(data)?data[0]:data;
       const info={attempt:a.attempt_id,ends:new Date(a.ends_at).getTime(),school,name};
       ls.set('kvl_'+r.id,info);
       await runQuiz(r,info);
     }catch(e){btn.disabled=false;st.textContent='❌ '+errText(e);st.className='kv-up-status error';}
   };
 }

 async function resumeQuiz(r,info){showModal();body().innerHTML='<p class="kv-view-msg">Жүктелуде…</p>';try{await runQuiz(r,info);}catch(e){ls.del('kvl_'+r.id);body().innerHTML='<p class="kv-view-msg error">❌ '+esc(errText(e))+'</p>';}}

 async function runQuiz(r,info){
   const {data,error}=await sb.rpc('league_get_questions',{p_attempt_id:info.attempt});
   if(error)throw error;
   const qs=data||[];if(!qs.length)throw new Error('no questions');
   const m=ensureModal();m.dataset.busy='1';showModal();
   body().innerHTML=`<div class="kv-battle-test-head"><b>⚔️ ${esc(info.school)}</b><span class="bt-test-timer" id="kvl-timer">--:--</span></div><p class="kv-battle-note">${esc(info.name)} · 📖 ${esc(r.book_title)}</p><div class="kv-battle-questions">${qs.map((q,i)=>`<div class="kv-battle-question-card"><div class="kv-quiz-progress">СҰРАҚ ${i+1} / ${qs.length}</div><div class="kv-quiz-question">${esc(q.question)}</div>${['a','b','c','d'].map(k=>`<label><input type="radio" name="kvlq-${q.id}" value="${k}"> ${esc(q['option_'+k])}</label>`).join('')}</div>`).join('')}</div><p class="kv-up-status" id="kvl-qstatus" role="status"></p><button class="btn btn-primary kv-up-send" id="kvl-submit">Аяқтау және жіберу</button>`;
   let done=false;
   const submit=async()=>{
     if(done)return;done=true;
     const btn=m.querySelector('#kvl-submit');if(btn)btn.disabled=true;
     const answers=qs.map(q=>{const c=m.querySelector(`input[name="kvlq-${q.id}"]:checked`);return {question_id:q.id,answer:c?c.value:null};});
     try{
       const {data:res,error:err}=await sb.rpc('league_submit',{p_attempt_id:info.attempt,p_answers:answers});
       if(err)throw err;
       const x=Array.isArray(res)?res[0]:res;
       clearInterval(quizTimer);m.dataset.busy='0';ls.del('kvl_'+r.id);
       body().innerHTML=`<div class="kv-quiz-result"><p>✅ Жауаптарыңыз қабылданды.</p><div class="score">${x.score} / ${x.total}</div><p>⏱ ${fmtDur(x.duration_seconds)}</p><p>Тур нәтижесі таймер біткенде жарияланады.</p></div>`;
     }catch(e){
       done=false;if(btn)btn.disabled=false;
       const t=errText(e);const s=m.querySelector('#kvl-qstatus');if(s){s.textContent='❌ '+t;s.className='kv-up-status error';}
       if(String(e&&e.message||'').includes('expired')){clearInterval(quizTimer);m.dataset.busy='0';ls.del('kvl_'+r.id);}
     }
   };
   m.querySelector('#kvl-submit').onclick=submit;
   const timerEl=m.querySelector('#kvl-timer');
   const tick=()=>{const left=info.ends-Date.now();if(left<=0){timerEl.textContent='00:00';clearInterval(quizTimer);submit();return;}timerEl.textContent=pad(Math.floor(left/60000))+':'+pad(Math.floor(left%60000/1000));};
   clearInterval(quizTimer);tick();quizTimer=setInterval(tick,500);
 }

 /* ---------- Іске қосу ---------- */
 async function boot(){
   const kv=getKV();if(!kv)return false;
   sb=kv.sb;
   const ok=await load();
   if(!ok)return true;
   clearInterval(tickId);tickId=setInterval(updateTimers,1000);
   const want=new URLSearchParams(location.search).get('round');
   if(want){
     const card=document.getElementById('kv-round-'+want);
     if(card){card.classList.add('kv-lg-focus');setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'center'}),250);
       const r=rounds.find(x=>String(x.id)===want);if(r&&stateOf(r,Date.now())==='live')setTimeout(()=>openModal(r),700);}
   }
   return true;
 }
 let tries=0;
 (function wait(){
   if(window.SUPABASE_URL&&String(window.SUPABASE_URL).includes('PASTE_')){root.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';return;}
   boot().then(ok=>{if(!ok&&++tries<100)setTimeout(wait,100);else if(!ok)root.innerHTML='<p class="kv-empty">Лига жүктелмеді.</p>';});
 })();
})();
