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

/* ========================= Load library + leaderboard from Supabase ========================= */
(async function(){
 const configured=window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('PASTE_') && window.SUPABASE_ANON_KEY.length>20;
 const booksBox=document.getElementById('kv-books');
 const barsBox=document.getElementById('kv-bars');
 const gapBox=document.getElementById('kv-gap');

 if(!configured){
   if(booksBox)booksBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   if(barsBox)barsBox.innerHTML='<p class="kv-empty">Бұлттық қосылым әлі теңшелмеген.</p>';
   return;
 }

 const {createClient}=window.supabase; const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);

 /* ---- Library ---- */
 async function loadBooks(){
   if(!booksBox)return;
   const {data,error}=await sb.from('library_books').select('*').order('created_at',{ascending:false});
   if(error||!data||!data.length){ booksBox.innerHTML='<p class="kv-empty">Кітаптар жақында қосылады.</p>'; return; }
   booksBox.innerHTML='';
   data.forEach(x=>{
     const el=document.createElement('div');
     el.className='kv-book card-in';
     el.innerHTML=`<b>${escapeHtml(x.icon||'📕')}</b><h3>${escapeHtml(x.title)}</h3>${x.author?`<span>${escapeHtml(x.author)}</span>`:''}${x.description?`<p>${escapeHtml(x.description)}</p>`:''}`;
     booksBox.appendChild(el);
   });
 }

 /* ---- Leaderboard ---- */
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
   // animate bars in after insertion
   requestAnimationFrame(()=>{
     barsBox.querySelectorAll('.kv-bar-fill').forEach(el=>{ el.style.width=el.dataset.pct+'%'; });
   });

   if(gapBox){
     if(data.length>1){
       const gap=data[0].xp-data[1].xp;
       gapBox.textContent=gap>0?`🔥 ${data[0].class_name} көш бастап тұр! ${data[1].class_name}-ға дейін ${gap} XP қалды.`:'🔥 Топ екі сынып тең түсуде!';
     } else {
       gapBox.textContent='';
     }
   }
 }

 await Promise.all([loadBooks(),loadRating()]);
})();
