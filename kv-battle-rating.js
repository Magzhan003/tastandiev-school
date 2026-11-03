/* KITAPVERSE: Battle рейтингі — жалпы «Сыныптар рейтингінен» төмен жеке кесте.
   Деректер: kv_battle_rating() (V24). Жалпы рейтингке әсер етпейді. */
(function(){
  'use strict';
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var fmtDate=function(s){try{var d=new Date(s);return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear();}catch(e){return '';}};
  var css='.kvb-note{color:#aeb8df;font-size:14px;margin:6px 0 16px;line-height:1.5}'
   +'.kvb-row{display:grid;grid-template-columns:48px 80px 1fr 150px;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid #ffffff14}'
   +'.kvb-row:last-child{border-bottom:0}.kvb-rank{font-size:22px;text-align:center}.kvb-cls{font-weight:800;font-size:18px}'
   +'.kvb-track{position:relative;height:30px;border-radius:999px;background:#ffffff12;overflow:hidden}'
   +'.kvb-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#ff9f6b,#ffcf6b);width:0;transition:width .9s ease}'
   +'.kvb-pct{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-weight:800;font-size:14px;color:#1a1033;text-shadow:0 0 6px #ffffff80}'
   +'.kvb-pct.z{color:#cfd6f7;text-shadow:none;left:22px}.kvb-meta{font-size:12.5px;color:#cfd6f7;text-align:right;line-height:1.35}'
   +'.kvb-head{display:grid;grid-template-columns:48px 80px 1fr 150px;gap:14px;font-size:12px;color:#8e98c9;text-transform:uppercase;letter-spacing:.5px;padding-bottom:6px;border-bottom:1px solid #ffffff22}'
   +'.kvb-det{margin-top:18px;border:1px solid #ffffff1f;border-radius:14px;padding:4px 14px;background:#ffffff08}'
   +'.kvb-det summary{cursor:pointer;font-weight:700;padding:12px 0}.kvb-det .kvb-row{grid-template-columns:44px 70px 1fr 170px}'
   +'.kvb-book{color:#aeb8df;font-size:12px;font-weight:400}'
   +'@media(max-width:640px){.kvb-row,.kvb-head,.kvb-det .kvb-row{grid-template-columns:36px 58px 1fr;gap:8px}.kvb-meta{grid-column:1/-1;text-align:left}.kvb-head span:last-child{display:none}}';
  function medal(i){return ['🥇','🥈','🥉'][i]||String(i+1);}
  function render(box,data){
    var ov=(data&&data.overall)||[],bt=(data&&data.battles)||[];
    if(!ov.length){box.innerHTML='<p class="kv-empty">Battle аяқталған соң нәтижелер осында шығады.</p>';return;}
    var max=Math.max.apply(null,ov.map(function(x){return Number(x.points)||0;}).concat([1]));
    var html='<div class="kvb-head"><span></span><span>Сынып</span><span>Балл (жеңіс × 50)</span><span>Батл · орташа %</span></div>';
    ov.forEach(function(x,i){
      var w=Math.max(4,Math.round((Number(x.points)||0)/max*100));
      html+='<div class="kvb-row"><div class="kvb-rank">'+medal(i)+'</div><div class="kvb-cls">'+esc(x.class_name)+'</div>'
        +'<div class="kvb-track"><div class="kvb-fill" data-w="'+w+'"></div><span class="kvb-pct'+((Number(x.points)||0)?'':' z')+'">'+esc(x.points)+' балл</span></div>'
        +'<div class="kvb-meta">'+esc(x.battles)+' батл · 🏆 '+esc(x.wins)+' жеңіс<br>орташа '+esc(x.avg_pct)+'%</div></div>';
    });
    var det='';
    bt.forEach(function(b){
      det+='<details class="kvb-det"><summary>⚔️ '+esc(b.title)+' · '+fmtDate(b.date)+'</summary>';
      (b.classes||[]).forEach(function(c){
        det+='<div class="kvb-row"><div class="kvb-rank">'+(c.place?medal(c.place-1):'—')+'</div><div class="kvb-cls">'+esc(c.class_name)+'</div>'
          +'<div><b>'+esc(c.pct)+'%</b> <span class="kvb-book">'+(c.book_title?'📖 '+esc(c.book_title):'')+'</span></div>'
          +'<div class="kvb-meta">'+esc(c.score)+' / '+esc(c.max_score)+' · '+esc(c.participants)+' / '+esc(c.students)+' оқушы</div></div>';
      });
      det+='</details>';
    });
    box.innerHTML=html+det;
    requestAnimationFrame(function(){box.querySelectorAll('.kvb-fill').forEach(function(el){el.style.width=el.getAttribute('data-w')+'%';});});
  }
  function init(){
    var anchor=document.getElementById('kv-rating');
    if(!anchor||document.getElementById('kv-battle-rating'))return;
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var sec=document.createElement('section');sec.id='kv-battle-rating';sec.className='kv-section';
    sec.innerHTML='<div class="container"><div class="kv-board"><div class="kv-board-title"><span class="section-label">BATTLE</span><h2>Battle рейтингі</h2></div>'
      +'<p class="kvb-note">Әр Battle-дің жеңімпаз сыныбы <b>+50 балл</b> алады (оқушы санына бөлінбейді — оқушысы аз сынып та, көп сынып та бірдей). Жеңімпаз — сыныптың жиған дұрыс жауабы ÷ (сыныптағы барлық оқушы × сұрақ саны) пайызы жоғары сынып. Рейтингте орын: балл, тең болса — орташа пайыз.</p>'
      +'<div id="kvb-body"><p class="kv-empty">Жүктелуде...</p></div></div></div>';
    anchor.parentNode.insertBefore(sec,anchor.nextSibling);
    var body=sec.querySelector('#kvb-body');
    try{
      var sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
      sb.rpc('kv_battle_rating').then(function(r){
        if(r.error||!r.data){body.innerHTML='<p class="kv-empty">Battle рейтингі әзірге қолжетімсіз.</p>';return;}
        render(body,r.data);
      },function(){body.innerHTML='<p class="kv-empty">Battle рейтингі әзірге қолжетімсіз.</p>';});
    }catch(e){body.innerHTML='<p class="kv-empty">Battle рейтингі әзірге қолжетімсіз.</p>';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
