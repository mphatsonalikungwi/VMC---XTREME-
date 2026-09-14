(()=>{'use strict';
const boot=()=>{
  const root=document.getElementById('vmcProfileView');
  const grid=root?.querySelector('.member-overview-grid');
  if(!root||!grid||window.__VMC_MEMBER_OVERVIEW_DESIGN_V5)return;
  window.__VMC_MEMBER_OVERVIEW_DESIGN_V5=true;
  const css=document.createElement('style');
  css.id='VMC_MEMBER_OVERVIEW_DESIGN_V5_STYLE';
  css.textContent=`
    #vmcProfileView .member-overview-grid{display:flex!important;flex-direction:column!important;gap:0!important}
    #vmcProfileView .member-panel,#vmcProfileView .member-progress{width:100%!important;flex:none!important}
    #vmcProfileView .vmc-welcome-card{display:flex!important;align-items:center!important;gap:26px!important;padding:24px!important;margin:0 0 12px!important;border:1px solid #087d4d!important;border-radius:14px!important;background:linear-gradient(105deg,#0d1720 0%,#07151a 55%,#063c2b 100%)!important;min-height:170px!important}
    #vmcProfileView .vmc-welcome-avatar{width:128px!important;height:128px!important;min-width:128px!important;border-radius:50%!important;object-fit:cover!important;display:block!important;border:4px solid #20e58b!important;background:#15171b!important;box-shadow:0 0 0 5px rgba(32,229,139,.08)!important}
    #vmcProfileView .vmc-welcome-copy{min-width:0!important}
    #vmcProfileView .vmc-welcome-label{color:#20e58b!important;font-weight:900!important;font-size:1rem!important;letter-spacing:.04em!important;margin-bottom:5px!important}
    #vmcProfileView .vmc-welcome-name{font-size:1.55rem!important;font-weight:900!important;margin:0 0 5px!important;color:#fff!important}
    #vmcProfileView .vmc-welcome-message{font-size:1rem!important;line-height:1.45!important;color:#f1f4f5!important;margin:0!important}
    #vmcProfileView .vmc-welcome-username{display:block!important;color:#8ac7ef!important;font-size:.95rem!important;margin-top:10px!important}
    #vmcProfileView .member-progress{order:2!important;margin:0 0 12px!important;padding:18px!important;border:1px solid #087d4d!important;border-radius:14px!important;background:linear-gradient(105deg,#111820,#0c171c)!important}
    #vmcProfileView .member-panel{margin:0 0 12px!important;border-radius:14px!important;background:#111317!important}
    #vmcProfileView .member-panel .member-head{padding:18px 22px!important}
    #vmcProfileView .member-panel .member-head b{font-size:1rem!important;letter-spacing:.02em!important}
    #vmcProfileView .member-grid{gap:14px!important;padding:14px 22px 22px!important}
    #vmcProfileView .member-card{padding:18px!important;border-radius:12px!important;background:#15171b!important}
    #vmcProfileView .member-card small{font-size:.72rem!important;color:#62a8d4!important}
    #vmcProfileView .member-card strong{font-size:1.05rem!important;margin-top:7px!important}
    #vmcProfileView .vmc-status-layout{display:grid!important;grid-template-columns:1fr 2fr!important;padding:0 22px 22px!important;border:1px solid #1c3445!important;border-radius:12px!important;margin:0 22px 22px!important}
    #vmcProfileView .vmc-status-cell{padding:15px 18px!important;min-width:0!important}
    #vmcProfileView .vmc-status-cell+ .vmc-status-cell{border-left:1px solid #1c3445!important}
    #vmcProfileView .vmc-status-label{display:block!important;color:#62a8d4!important;font-size:.72rem!important;font-weight:900!important;text-transform:uppercase!important}
    #vmcProfileView .vmc-status-value{display:block!important;color:#20e58b!important;font-size:1.2rem!important;font-weight:900!important;margin-top:5px!important}
    #vmcProfileView .vmc-status-plan{color:#fff!important}
    #vmcProfileView .vmc-status-pill{color:#20e58b!important;border:1px solid #087d4d!important;background:#09271c!important;border-radius:99px!important;padding:7px 14px!important;font-weight:900!important}
    #vmcProfileView .vmc-status-active{color:#20e58b!important}
    #vmcProfileView .vmc-status-expired{color:#e31b2d!important}
    @media(max-width:600px){#vmcProfileView .vmc-welcome-card{gap:16px!important;padding:18px!important;min-height:0!important}#vmcProfileView .vmc-welcome-avatar{width:104px!important;height:104px!important;min-width:104px!important}#vmcProfileView .vmc-welcome-name{font-size:1.2rem!important}#vmcProfileView .vmc-welcome-message{font-size:.9rem!important}#vmcProfileView .member-panel .member-head{padding:16px!important}#vmcProfileView .member-grid{padding:12px 16px 16px!important;gap:10px!important}#vmcProfileView .member-card{padding:14px!important}#vmcProfileView .vmc-status-layout{margin:0 16px 16px!important;padding:0!important}}
    @media(max-width:430px){#vmcProfileView .vmc-welcome-card{align-items:flex-start!important;gap:13px!important}.vmc-welcome-avatar{width:82px!important;height:82px!important;min-width:82px!important}.vmc-welcome-name{font-size:1.05rem!important}.vmc-welcome-message{font-size:.82rem!important}.vmc-welcome-username{font-size:.78rem!important}}
  `;
  document.head.appendChild(css);
  const panels=[...grid.querySelectorAll(':scope > .member-panel')];
  const account=panels[0], oldDetails=panels[1];
  if(!account||!oldDetails)return;
  const oldGrid=oldDetails.querySelector('.member-grid');
  const progress=oldDetails.querySelector('.member-progress');
  if(progress)grid.insertBefore(progress,account);
  let status=grid.querySelector('.vmc-status-panel');
  if(!status){
    status=document.createElement('div');status.className='member-panel vmc-status-panel';
    status.innerHTML='<div class="member-head"><b>Membership Status</b><span class="vmc-status-pill" id="vmcStatusPill">Active Member</span></div><div class="vmc-status-layout"><div class="vmc-status-cell"><span class="vmc-status-label">Status</span><strong class="vmc-status-value" id="vmcStatusValue">Active</strong></div><div class="vmc-status-cell"><span class="vmc-status-label">Plan</span><strong class="vmc-status-value vmc-status-plan" id="vmcStatusPlan">—</strong></div></div>';
    grid.insertBefore(status,account);
  }
  if(oldGrid&&!oldDetails.classList.contains('vmc-details-panel')){
    oldDetails.classList.add('vmc-details-panel');
    const h=oldDetails.querySelector('.member-head');
    if(h){const title=h.querySelector('b');if(title)title.textContent='Membership Details';const badge=h.querySelector('#vmcPaymentStatus');if(badge)badge.remove();}
    oldDetails.querySelectorAll('.member-grid .member-card').forEach(c=>{const label=c.querySelector('small')?.textContent?.trim().toLowerCase();if(['payment amount','payment method','reference','progress'].includes(label))c.remove()});
    if(progress)oldDetails.appendChild(progress);
  }
  let welcome=grid.querySelector('.vmc-welcome-card');
  if(!welcome){
    welcome=document.createElement('div');welcome.className='vmc-welcome-card';
    welcome.innerHTML='<img class="vmc-welcome-avatar" id="vmcWelcomeAvatar" src="assets/logo.png" alt="Member profile picture"><div class="vmc-welcome-copy"><div class="vmc-welcome-label">WELCOME BACK</div><div class="vmc-welcome-name" id="vmcWelcomeFullName">VMC Member</div><p class="vmc-welcome-message" id="vmcWelcomeMessage">Welcome back! It’s great to have you with us again. Keep pushing, keep growing, and let’s make your next VMC chapter your strongest yet.</p><span class="vmc-welcome-username" id="vmcWelcomeUsername">@username</span></div>';
    grid.insertBefore(welcome,grid.firstElementChild);
  }
  const sync=async()=>{
    const name=document.getElementById('vmcName')?.textContent?.trim()||'VMC Member';
    const username=document.getElementById('vmcUsername')?.textContent?.trim()||'@username';
    const plan=document.getElementById('vmcPlanCard')?.textContent?.trim()||document.getElementById('vmcPlan')?.textContent?.trim()||'—';
    const statusText=document.getElementById('vmcPaymentStatus')?.textContent?.trim()||document.getElementById('vmcStatus')?.textContent?.trim()||'Active';
    document.getElementById('vmcWelcomeFullName').textContent=name;
    document.getElementById('vmcWelcomeUsername').textContent=username;
    document.getElementById('vmcStatusPlan').textContent=plan;
    document.getElementById('vmcStatusValue').textContent=/expired/i.test(statusText)?'Expired':'Active';
    document.getElementById('vmcStatusPill').textContent=/expired/i.test(statusText)?'Membership Expired':'Active Member';
    try{if(typeof sb!=='undefined'){const r=await sb.auth.getUser();const id=r.data.user?.id;if(id){const q=await sb.from('profiles').select('avatar_url,full_name,username').eq('id',id).maybeSingle();const avatar=q.data?.avatar_url;if(avatar)document.getElementById('vmcWelcomeAvatar').src=avatar+'?v='+Date.now();}}}catch(e){}
  };
  sync();
  new MutationObserver(sync).observe(root,{subtree:true,childList:true,characterData:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();