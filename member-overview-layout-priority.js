(()=>{'use strict';
const boot=()=>{
  if(window.__VMC_MEMBER_OVERVIEW_PRIORITY_V3)return;
  const overview=document.getElementById('vmcProfileView');
  const layout=overview?.querySelector('.member-overview-grid');
  if(!overview||!layout)return;
  window.__VMC_MEMBER_OVERVIEW_PRIORITY_V3=true;
  const style=document.createElement('style');
  style.id='VMC_MEMBER_OVERVIEW_PRIORITY_STYLE_V3';
  style.textContent=`
    #vmcProfileView .member-overview-grid{display:block!important;margin-bottom:0}
    #vmcProfileView .member-overview-grid>.member-panel{display:block!important;width:100%!important;margin-bottom:12px!important}
    #vmcProfileView .member-overview-grid>.member-progress{display:block!important;width:100%!important;margin:0 0 12px!important}
    #vmcProfileView .vmc-profile-moved{display:flex!important;align-items:center;gap:16px;margin:0 0 12px!important;padding:14px!important;border:1px solid #292d34!important;background:#15171b!important;border-radius:12px!important;min-width:0}
    #vmcProfileView .vmc-profile-moved img{width:86px;height:86px;flex:0 0 86px;border-radius:50%;object-fit:cover}
    #vmcProfileView .vmc-status-active{color:#48c774!important}
    #vmcProfileView .vmc-status-expired{color:#e31b2d!important}
    @media(max-width:520px){#vmcProfileView .vmc-profile-moved{gap:12px;padding:12px!important}#vmcProfileView .vmc-profile-moved img{width:72px;height:72px;flex-basis:72px}}
  `;
  document.head.appendChild(style);
  const panels=[...layout.querySelectorAll(':scope > .member-panel')];
  const accountPanel=panels[0];
  const detailsPanel=panels[1];
  if(!accountPanel||!detailsPanel)return;
  const progress=detailsPanel.querySelector(':scope > .member-progress');
  if(progress)layout.insertBefore(progress,accountPanel);
  const profileMatch=el=>{
    if(!el||el===overview||el===layout)return false;
    const text=(el.textContent||'').trim();
    return /welcome back/i.test(text)&&/@[a-z0-9_]+/i.test(text)&&!!el.querySelector('img')&&text.length<900;
  };
  let profile=null;
  const matches=[...overview.querySelectorAll('*')].filter(profileMatch);
  for(const node of matches){
    if(node.parentElement&&profileMatch(node.parentElement))continue;
    profile=node;
    break;
  }
  if(profile){
    let card=profile;
    while(card.parentElement&&card.parentElement!==overview&&card.parentElement!==layout&&card.parentElement!==detailsPanel)card=card.parentElement;
    if(card!==progress){
      card.classList.add('vmc-profile-moved');
      layout.insertBefore(card,layout.firstElementChild);
    }
  }
  const exact=(root,text)=>[...root.querySelectorAll('*')].filter(n=>(n.textContent||'').trim().toLowerCase()===text.toLowerCase());
  exact(accountPanel,'Active Member').forEach(n=>n.style.display='none');
  exact(detailsPanel,'Active Member').forEach(n=>n.style.display='none');
  exact(detailsPanel,'Membership Status').forEach(n=>{n.textContent='Membership Details';});
  const colors=()=>overview.querySelectorAll('.badge,.member-badge,.member-head span,.member-card strong,.member-progress-top strong').forEach(n=>{const t=(n.textContent||'').trim();n.classList.remove('vmc-status-active','vmc-status-expired');if(/active|healthy/i.test(t)&&!/inactive/i.test(t))n.classList.add('vmc-status-active');if(/expired/i.test(t))n.classList.add('vmc-status-expired');});
  colors();
  new MutationObserver(colors).observe(overview,{subtree:true,childList:true,characterData:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
