/* KITAPVERSE — хабарландырулар (қалқымалы терезе). index.html және kitapverse.html қосады. */
(function(){
  var CSS='.kva-back{position:fixed;inset:0;z-index:9999;background:rgba(4,6,24,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:kvaIn .25s ease}'
  +'.kva-card{position:relative;width:min(620px,100%);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;border-radius:26px;padding:30px 28px 24px;color:#eef1ff;'
  +'background:linear-gradient(160deg,#1b1f5e,#0d1036 70%);border:1px solid rgba(140,160,255,.35);box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 60px rgba(110,100,255,.35);animation:kvaPop .35s cubic-bezier(.2,.9,.3,1.2);font-family:inherit}'
  +'.kva-icon{width:68px;height:68px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:36px;background:linear-gradient(135deg,#3978ff,#8a55ff);box-shadow:0 0 30px rgba(120,110,255,.6);margin-bottom:16px}'
  +'.kva-card h2{margin:0 0 6px;font-size:24px;line-height:1.25;color:#fff}'
  +'.kva-date{font-size:13px;color:#9aa5d8;margin-bottom:14px}'
  +'.kva-body{white-space:pre-line;font-size:16px;line-height:1.6;color:#d6dcff}'
  +'.kva-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;flex-wrap:wrap}'
  +'.kva-count{font-size:13px;color:#9aa5d8}'
  +'.kva-ok{font:inherit;font-weight:800;font-size:16px;border:0;border-radius:14px;padding:13px 26px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#3978ff,#8a55ff);box-shadow:0 0 22px rgba(110,100,255,.5)}'
  +'.kva-ok:focus-visible{outline:3px solid #78dcff;outline-offset:2px}'
  +'.kva-x{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:12px;border:1px solid rgba(140,160,255,.3);background:transparent;color:#cfd6ff;font-size:20px;cursor:pointer}'
  +'@keyframes kvaIn{from{opacity:0}}@keyframes kvaPop{from{opacity:0;transform:translateY(20px) scale(.95)}}'
  +'@media (prefers-reduced-motion:reduce){.kva-back,.kva-card{animation:none}}';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
  function key(a,student){return 'kv_ann_seen_'+a.id+'_'+(a.audience==='students'&&student?student.id:'all');}
  function seen(a,s){try{return localStorage.getItem(key(a,s))==='1';}catch(e){return false;}}
  function markSeen(a,s){try{localStorage.setItem(key(a,s),'1');}catch(e){}}
  var busy=false;
  async function show(sb,student){
    if(!sb||busy)return;
    if(document.querySelector('.kva-back'))return;
    busy=true;
    try{
      var aud=student?['all','students']:['all'];
      var r=await sb.from('kv_announcements').select('id,title,body,icon,audience,created_at').in('audience',aud).order('created_at',{ascending:true});
      var list=(r.data||[]).filter(function(a){return !seen(a,student);});
      if(!list.length)return;
      if(!document.getElementById('kva-style')){var st=document.createElement('style');st.id='kva-style';st.textContent=CSS;document.head.appendChild(st);}
      var i=0,prev=document.activeElement;
      var back=document.createElement('div');back.className='kva-back';back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-labelledby','kva-title');
      document.body.appendChild(back);
      var close=function(){markSeen(list[i],student);i++;if(i<list.length){render();return;}back.remove();document.removeEventListener('keydown',onKey);if(prev&&prev.focus)prev.focus();};
      var onKey=function(e){if(e.key==='Escape')close();};
      document.addEventListener('keydown',onKey);
      function render(){
        var a=list[i];
        back.innerHTML='<div class="kva-card"><button class="kva-x" type="button" aria-label="Жабу">✕</button>'
          +'<div class="kva-icon" aria-hidden="true">'+esc(a.icon||'📢')+'</div>'
          +'<h2 id="kva-title">'+esc(a.title)+'</h2>'
          +'<div class="kva-date">📢 Хабарландыру · '+new Date(a.created_at).toLocaleDateString('ru-RU')+'</div>'
          +'<div class="kva-body">'+esc(a.body)+'</div>'
          +'<div class="kva-foot"><span class="kva-count">'+(list.length>1?(i+1)+' / '+list.length:'')+'</span><button class="kva-ok" type="button">'+(i<list.length-1?'Келесі →':'Түсіндім ✓')+'</button></div></div>';
        back.querySelector('.kva-ok').onclick=close;back.querySelector('.kva-x').onclick=close;
        back.querySelector('.kva-ok').focus({preventScroll:true});back.querySelector('.kva-card').scrollTop=0;
      }
      render();
    }catch(e){/* хабарландыру міндетті емес */}
    finally{busy=false;}
  }
  window.KVAnnounce={show:show};
})();
