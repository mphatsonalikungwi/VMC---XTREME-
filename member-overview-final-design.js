(()=>{'use strict';
const boot=()=>{
 const root=document.getElementById('vmcProfileView'),grid=root?.querySelector('.member-overview-grid');
 if(!root||!grid||window.__VMC_MEMBER_OVERVIEW_FINAL)return;
 window.__VMC_MEMBER_OVERVIEW_FINAL=true;
 const run=()=>{
  const welcome=grid.querySelector('.vmc-welcome-card');
  const progress=grid.querySelector('.member-progress');
  const status=grid.querySelector('.vmc-status-panel');
  const panels=[...grid.querySelectorAll(':scope > .member-panel')].filter(p=>!p.classList.contains('vmc-status-panel'));
  const account=panels[0],details=panels[1];
  if(!welcome||!progress||!status||!account||!details)return;
  if(progress.parentElement!==grid)grid.insertBefore(progress,grid.firstElementChild);
  [welcome,progress,status,account,details].forEach(el=>{if(el.parentElement===grid)grid.appendChild(el)});
  const badge=account.querySelector('#vmcStatus');if(badge)badge.remove();
  const detailsBadge=details.querySelector('#vmcPaymentStatus');if(detailsBadge)detailsBadge.remove();
  const labels=[...details.querySelectorAll('.member-card small')];
  labels.forEach(label=>{const card=label.closest('.member-card');const t=label.textContent.trim().toLowerCase();if(['payment amount','payment method','reference','progress'].includes(t))card?.remove()});
  const sync=async()=>{try{if(typeof sb==='undefined')return;const r=await sb.auth.getUser(),id=r.data.user?.id;if(!id)return;const q=await sb.from('profiles').select('avatar_url,full_name,username').eq('id',id).maybeSingle();const avatar=q.data?.avatar_url;if(avatar){const img=document.getElementById('vmcWelcomeAvatar');if(img&&!img.src.includes(avatar))img.src=avatar+'?v='+Date.now()}}catch(e){}};
  sync();
 };
 run();
 new MutationObserver(run).observe(root,{subtree:true,childList:true,characterData:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();