(()=>{'use strict';
const run=()=>{
 if(window.__VMC_MEMBER_LAYOUT)return;
 const overview=document.getElementById('vmcProfileView'); if(!overview)return;
 const grid=overview.querySelector('.member-overview-grid'); if(!grid)return;
 window.__VMC_MEMBER_LAYOUT=true;
 const style=document.createElement('style');style.id='VMC_MEMBER_LAYOUT_STYLE';style.textContent=`
.member-overview-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;align-items:stretch!important}
.member-overview-grid>.member-panel{min-width:0}
.member-account-card,.member-active-card{min-width:0}
.member-active-card{display:flex;flex-direction:column;min-height:100%}
.member-active-card .member-head{min-height:45px}
.member-active-main{padding:16px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex:1}
.member-active-main strong{font-size:1.15rem;color:#48c774!important;letter-spacing:.01em}
.member-active-main small{display:block;color:#777d86;text-transform:uppercase;font-size:.58rem;font-weight:900;margin-bottom:5px}
.member-active-dot{width:10px;height:10px;border-radius:50%;background:#48c774;box-shadow:0 0 0 5px rgba(72,199,116,.10);flex:0 0 auto}
.member-status-panel{grid-column:1/-1!important}
.member-status-panel .member-head b{color:#f7f7f5}
.member-status-panel .member-card strong.active-value{color:#48c774!important}
/* Desired vertical order: welcome, progress, two top cards, full-width status */
.member-welcome{margin-bottom:12px!important}
.member-progress{display:block!important;width:100%!important;margin:0 0 12px!important}
#vmcViewerProfile,#vmcViewerDelete,#vmcViewerClose{display:none!important}
/* Two-column treatment wherever practical across the member dashboard. */
.member-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
.settings-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.badge.g,.badge.green,.member-badge.green,.success,.active-value{color:#48c774!important}
@media(max-width:700px){.member-overview-grid,.member-grid,.settings-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.gallery-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.member-active-main{padding:13px;gap:9px}.member-active-main strong{font-size:.95rem}}
@media(max-width:380px){.member-overview-grid,.member-grid,.settings-grid,.gallery-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.member-card{padding:10px}.member-card strong{font-size:.76rem}}
`;
document.head.appendChild(style);
 const panels=[...grid.querySelectorAll(':scope > .member-panel')]; if(panels.length<2)return;
 const account=panels[0],status=panels[1]; account.classList.add('member-account-card');
 /* Keep Member Account intact as the entire left card. Keep Membership as the entire right card. */
 if(!overview.querySelector('.member-active-card')){
   const active=document.createElement('div');active.className='member-panel member-active-card';
   active.innerHTML='<div class="member-head"><b>Membership</b><span class="member-active-dot" aria-label="Active"></span></div><div class="member-active-main"><div><small>Status</small><strong class="active-value">Active</strong></div><div><small>Plan</small><strong id="memberActivePlan">—</strong></div></div>';
   grid.insertBefore(active,status);
   const plan=document.getElementById('vmcPlanCard'),activePlan=document.getElementById('memberActivePlan');
   if(plan&&activePlan){const sync=()=>activePlan.textContent=plan.textContent||'—';sync();new MutationObserver(sync).observe(plan,{childList:true,subtree:true,characterData:true})}
 }
 status.classList.add('member-status-panel');
 grid.appendChild(status);
 /* Progress must sit outside the two-card grid, directly above it. */
 const progress=overview.querySelector('.member-progress'); if(progress)overview.insertBefore(progress,grid);
 const title=overview.querySelector('.member-title h2'),subtitle=overview.querySelector('.member-title p');
 if(title)title.textContent='Member Overview';
 if(subtitle)subtitle.textContent='Everything you need to know about your membership.';
 const clean=()=>overview.querySelectorAll('.member-status-panel .member-card strong').forEach(el=>{const t=(el.textContent||'').trim().toLowerCase();if(t==='active member'||t==='active')el.classList.add('active-value')});
 clean();setTimeout(clean,900);setTimeout(clean,1900);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();