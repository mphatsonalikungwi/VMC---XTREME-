(()=>{'use strict';
const boot=()=>{
  if(window.__VMC_MEMBER_OVERVIEW_PRIORITY_V2)return;
  const overview=document.getElementById('vmcProfileView');
  if(!overview)return;
  window.__VMC_MEMBER_OVERVIEW_PRIORITY_V2=true;

  const style=document.createElement('style');
  style.id='VMC_MEMBER_OVERVIEW_PRIORITY_STYLE';
  style.textContent=`
    #vmcProfileView .member-overview-grid{display:block!important;margin-bottom:0}
    #vmcProfileView .member-overview-grid>.member-panel{display:block!important;width:100%!important;margin-bottom:12px!important}
    #vmcProfileView .member-overview-grid>.member-progress{display:block!important;width:100%!important;margin:0 0 12px!important}
    #vmcProfileView .vmc-profile-moved{display:flex!important;align-items:center;gap:16px;margin:0 0 12px!important;padding:14px!important;border:1px solid #292d34!important;background:#15171b!important;border-radius:12px!important;min-width:0}
    #vmcProfileView .vmc-profile-moved img{width:86px;height:86px;flex:0 0 86px;border-radius:50%;object-fit:cover}
    #vmcProfileView .vmc-profile-moved .member-profile-avatar{width:86px;height:86px;flex:0 0 86px}
    #vmcProfileView .vmc-status-active{color:#48c774!important}
    #vmcProfileView .vmc-status-expired{color:#e31b2d!important}
    @media(max-width:520px){#vmcProfileView .vmc-profile-moved{gap:12px;padding:12px!important}#vmcProfileView .vmc-profile-moved img,#vmcProfileView .vmc-profile-moved .member-profile-avatar{width:72px;height:72px;flex-basis:72px}}
  `;
  document.head.appendChild(style);

  const layout=overview.querySelector('.member-overview-grid');
  if(!layout)return;
  const panels=[...layout.querySelectorAll(':scope > .member-panel')];
  const accountPanel=panels[0];
  const subscriptionPanel=panels[1];
  const progress=subscriptionPanel?.querySelector(':scope > .member-progress');
  if(!accountPanel||!subscriptionPanel||!progress)return;

  // Keep the progress card separate and directly above the account information.
  layout.insertBefore(progress,accountPanel);

  const isProfileText=el=>{
    const text=(el.textContent||'').trim();
    return /welcome back/i.test(text)&&/@[a-z0-9_]+/i.test(text)&&!!el.querySelector('img')&&text.length<700;
  };
  const candidates=[...overview.querySelectorAll('*')].filter(isProfileText);
  let profile=null;
  for(const candidate of candidates){
    const parent=candidate.parentElement;
    if(parent&&isProfileText(parent))continue;
    profile=candidate;
    break;
  }

  // Remove only duplicate profile cards accidentally placed inside Membership Status.
  [...subscriptionPanel.querySelectorAll('*')].forEach(node=>{
    if(node===subscriptionPanel||node===progress)return;
    if(isProfileText(node)){
      let card=node;
      while(card.parentElement&&card.parentElement!==subscriptionPanel&&card.parentElement!==overview)card=card.parentElement;
      if(card!==progress)card.remove();
    }
  });

  if(profile&&profile!==progress&&!subscriptionPanel.contains(profile)){
    profile.classList.add('vmc-profile-moved');
    layout.insertBefore(profile,progress);
  }

  const exactTextElements=(root,text)=>[...root.querySelectorAll('*')].filter(node=>(node.textContent||'').trim().toLowerCase()===text.toLowerCase());
  const hideExact=(root,text)=>{
    exactTextElements(root,text).forEach(node=>{node.style.display='none';});
  };

  // The compact Membership Status card above remains unchanged. Remove the redundant
  // Active Member labels from the two detailed information cards only.
  hideExact(accountPanel,'Active Member');
  hideExact(subscriptionPanel,'Active Member');

  // Rename the detailed Membership Status card without affecting the compact status card.
  exactTextElements(subscriptionPanel,'Membership Status').forEach(node=>{
    node.textContent='Subscription information';
    node.style.textTransform='uppercase';
  });

  const applyStatusColors=()=>{
    const nodes=overview.querySelectorAll('.badge,.member-badge,.member-head span,.member-card strong,.member-progress-top strong,span,b,strong');
    nodes.forEach(node=>{
      const text=(node.textContent||'').trim();
      if(!text||text.length>80)return;
      node.classList.remove('vmc-status-active','vmc-status-expired');
      if(/active|healthy/i.test(text)&&!/inactive/i.test(text))node.classList.add('vmc-status-active');
      if(/expired/i.test(text))node.classList.add('vmc-status-expired');
    });
  };
  applyStatusColors();
  new MutationObserver(applyStatusColors).observe(overview,{subtree:true,childList:true,characterData:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
