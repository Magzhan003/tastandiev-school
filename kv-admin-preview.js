/* Админка: толық бет + әр форманың жанында «Алдын ала қарау» (сайтта қалай көрінеді). Деректер өзгермейді — тек көрсетеді. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const val=id=>{const e=$(id);return e?String(e.value||'').trim():'';};
 const nl=s=>esc(s).replace(/\n/g,'<br>');
 const fmtDate=(v,withTime)=>{if(!v)return '';const d=new Date(v);if(isNaN(d))return esc(v);return withTime?d.toLocaleString('kk-KZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('kk-KZ',{day:'2-digit',month:'2-digit',year:'numeric'});};
 const empty=t=>`<span class="pv-ph">${esc(t)}</span>`;
 let photoUrl=null,photoFile=null;
 function newsPhoto(){
   const f=$('a-news-photo')&&$('a-news-photo').files&&$('a-news-photo').files[0];
   if(f!==photoFile){if(photoUrl){try{URL.revokeObjectURL(photoUrl);}catch(e){}photoUrl=null;}photoFile=f||null;if(f)photoUrl=URL.createObjectURL(f);}
   if(photoUrl)return photoUrl;
   const old=$('a-news-photo-preview');return old&&!old.hidden&&old.getAttribute('src')?old.getAttribute('src'):'';
 }
 function questions(list){
   if(!list)return [];
   return [...list.querySelectorAll('.quiz-admin-card')].map(c=>{
     const g=cls=>{const e=c.querySelector('.'+cls);return e?String(e.value||'').trim():'';};
     return {q:g('q-question'),a:g('q-a'),b:g('q-b'),c:g('q-c'),d:g('q-d'),ok:g('q-correct')||'a'};
   });
 }
 function qHtml(qs,max){
   const filled=qs.filter(x=>x.q);
   const show=filled.slice(0,max).map((x,i)=>`<div class="pv-q"><b>${i+1}. ${esc(x.q)}</b>${['a','b','c','d'].map(k=>x[k]?`<div class="pv-opt${x.ok===k?' ok':''}"><i>${k.toUpperCase()}</i>${esc(x[k])}</div>`:'').join('')}</div>`).join('');
   const more=filled.length>max?`<p class="pv-more">… тағы ${filled.length-max} сұрақ</p>`:'';
   return `<p class="pv-count">❓ Сұрақ саны: <b>${filled.length}</b>${qs.length!==filled.length?` <small>(толтырылмаған: ${qs.length-filled.length})</small>`:''}</p>${show||empty('Сұрақтарды толтырсаңыз, осында көрінеді')}${more}`;
 }
 const CONFIG=[
  {form:'a-news-form',title:'Жаңалық карточкасы',render(){
    const p=newsPhoto();
    return `<article class="pv-news"><div class="pv-news-img">${p?`<img src="${esc(p)}" alt="">`:'ЖАҢАЛЫҚ'}</div><div class="pv-body"><span class="pv-date">${fmtDate(val('a-news-date'))||empty('күні')}</span><h3>${esc(val('a-news-title'))||empty('Жаңалық тақырыбы')}</h3><p>${nl(val('a-news-text'))||empty('Жаңалық мәтіні')}</p><span class="pv-btn">Оқу →</span></div></article>`;}},
  {form:'a-ach-form',title:'Жетістік карточкасы',render(){
    return `<div class="pv-ach"><b>${esc(val('a-ach-icon'))||'🏆'}</b><h3>${esc(val('a-ach-title'))||empty('Жетістік тақырыбы')}</h3><p>${nl(val('a-ach-text'))||empty('Қысқаша сипаттама')}</p></div>`;}},
  {form:'a-test-form',title:'Тест',render(){
    return `<div class="pv-test"><h3>📝 ${esc(val('a-test-title'))||empty('Тест атауы')}</h3><p>${nl(val('a-test-description'))||''}</p>${qHtml(questions($('a-test-bulk-list')),3)}</div>`;}},
  {form:'a-book-form',dark:true,title:'Кітап карточкасы (KITAPVERSE)',render(){
    const g=val('a-book-grade');
    return `<div class="pv-book"><div class="pv-book-icon">${esc(val('a-book-icon'))||'📕'}</div><div><h3>${esc(val('a-book-title'))||empty('Кітап атауы')}</h3><small>${esc(val('a-book-author'))||empty('Авторы')} · ${g?g+' сынып':empty('сынып')}</small><p>${nl(val('a-book-text'))}</p><div class="pv-book-actions">${$('a-book-bonus')&&$('a-book-bonus').checked?'<span class="pv-btn">🎁 Бонус кітап</span>':''}${val('a-book-drive')?'<span class="pv-btn ghost">📄 Оқу (PDF)</span>':''}</div></div></div>`;}},
  {form:'a-quest-form',dark:true,title:'Квест (KITAPVERSE)',render(){
    const sel=$('a-quest-book');const book=sel&&sel.value?sel.options[sel.selectedIndex].text:'';
    return `<div class="pv-quest"><span class="pv-eyebrow">🎮 КВЕСТ</span><h3>${esc(val('a-quest-title'))||empty('Квест атауы')}</h3>${book?`<small>📖 ${esc(book)}</small>`:''}<p>${nl(val('a-quest-description'))}</p>${qHtml(questions($('a-quest-bulk-list')),3)}</div>`;}},
  {form:'a-battle-form',dark:true,title:'Battle (KITAPVERSE)',render(){
    const groups=[...document.querySelectorAll('#a-battle-groups .a-bgroup')].map(c=>{
      const cls=[...c.querySelectorAll('.a-bgroup-classes input:checked')].map(x=>x.value).join(', ');
      const qn=questions(c.querySelector('.bg-questions')).filter(x=>x.q).length;
      const b=c.querySelector('.bg-book');
      return `<li><b>${esc(cls)||empty('сыныптар')}</b><span>📖 ${esc(b&&b.value.trim())||empty('кітап')} · ❓ ${qn}</span></li>`;}).join('');
    return `<div class="pv-battle"><span class="pv-eyebrow">⚔️ BATTLE</span><h3>${esc(val('a-battle-title'))||empty('Battle атауы')}</h3><ul class="pv-groups">${groups||'<li>'+empty('топ қосыңыз')+'</li>'}</ul><div class="pv-timer"><div><b>--</b><small>күн</small></div><div><b>--</b><small>сағат</small></div><div><b>--</b><small>мин</small></div><div><b>--</b><small>сек</small></div></div><p class="pv-when">🗓 Басталуы: ${fmtDate(val('a-battle-date'),true)||empty('күні мен уақыты')}</p></div>`;}},
  {form:'a-league-form',dark:true,title:'Лига туры (KITAPVERSE)',render(){
    const dur=val('a-league-duration');
    return `<div class="pv-league"><small class="pv-eyebrow">${esc(val('a-league-title'))||'1-тур'}</small><h3>${esc(val('a-league-school-a'))||empty('1-мектеп')} <i>vs</i> ${esc(val('a-league-school-b'))||empty('2-мектеп')}</h3><p>📖 ${esc(val('a-league-book'))||empty('кітап')} · ${fmtDate(val('a-league-date'),true)||empty('күні')} · ${esc(dur||'30')} мин</p><span class="pv-badge">Жақында</span>${qHtml(questions($('a-league-questions')),2)}</div>`;}},
  {form:'a-students-form',title:'Оқушылар тізімі (қосылар алдында)',render(){
    const f=window.kvParseStudents;if(!f)return empty('Алдын ала қарау қолжетімсіз');
    const rows=f(val('a-students-text'));
    if(!rows.length)return empty('Оқушылар тізімін жазсаңыз, осында кесте болып көрінеді');
    const bad=rows.filter(r=>r.errors.length).length;
    return `<p class="pv-count">Барлығы: <b>${rows.length}</b> · дайын: <b>${rows.length-bad}</b>${bad?` · <span class="pv-bad">қате: ${bad}</span>`:''}</p><div class="pv-table-wrap"><table class="pv-table"><thead><tr><th>#</th><th>Аты-жөні</th><th>Сынып</th><th>ИИН</th><th>Пароль</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.errors.length?'bad':''}"><td>${r.line}</td><td>${esc(r.full_name)||'—'}</td><td>${esc(r.class_name)||'—'}</td><td>${esc(r.iin)||'—'}</td><td>${r.password?esc(r.password):'<i>авто</i>'}</td></tr>${r.errors.length?`<tr class="err"><td></td><td colspan="4">⚠ ${esc(r.errors.join(', '))}</td></tr>`:''}`).join('')}</tbody></table></div>`;}},
  {form:'a-teachers-form',dark:true,title:'Сыныптар белсенділігі картасы',render(){
    const rows=[...document.querySelectorAll('#a-teachers-list input[data-class]')].filter(i=>i.value.trim()).slice(0,3);
    if(!rows.length)return empty('Жетекшінің атын жазсаңыз, сынып картасында осылай көрінеді');
    return rows.map(i=>`<div class="pv-stcard"><div class="pv-sthead"><h3>${esc(i.dataset.class)}</h3><span>20 оқушы</span></div><div class="pv-teacher">👩‍🏫 Сынып жетекшісі: <b>${esc(i.value.trim())}</b></div><div class="pv-line"><span>🟢 Бүгін кірді</span><i><u style="width:60%"></u></i><b>12/20</b></div></div>`).join('');}}
 ];
 function setup(cfg){
   const form=$(cfg.form);if(!form||form.dataset.pv)return null;form.dataset.pv='1';
   const wrap=document.createElement('div');wrap.className='admin-form-fields';
   while(form.firstChild)wrap.appendChild(form.firstChild);
   const aside=document.createElement('aside');aside.className='admin-preview'+(cfg.dark?' pv-dark':'');
   aside.innerHTML=`<div class="admin-preview-label">👁 Алдын ала қарау — ${esc(cfg.title)}</div><div class="admin-preview-body"></div>`;
   form.append(wrap,aside);form.classList.add('has-preview');
   return {cfg,form,body:aside.querySelector('.admin-preview-body'),last:null};
 }
 let items=[];
 function paint(it){
   if(!it.form.offsetParent)return;
   let html;try{html=it.cfg.render();}catch(e){html=empty('Алдын ала қарау қолжетімсіз');}
   if(html!==it.last){it.last=html;it.body.innerHTML=html;}
 }
 function paintAll(){items.forEach(paint);}
 let raf=0;const soon=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(paintAll);};
 function init(){
   items=CONFIG.map(setup).filter(Boolean);
   if(!items.length)return;
   const root=$('admin-content')||document;
   ['input','change','click'].forEach(ev=>root.addEventListener(ev,soon,true));
   setInterval(()=>{if(!document.hidden)paintAll();},600);
   paintAll();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
