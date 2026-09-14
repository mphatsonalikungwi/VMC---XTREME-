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
/* Keep the profile/welcome section clearly visible above Membership Progress. */
.member-welcome{position:relative!important;display:flex!important;align-items:center!important;gap:16px!important;width:100%!important;margin:0 0 12px!important;box-sizing:border-box!important}
.member-welcome-avatar{width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;border-radius:50%!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 72px!important}
.member-welcome-avatar img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important}
.member-welcome-avatar span{display:flex!important;width:100%!important;height:100%!important;align-items:center!important;justify-content:center!important;border-radius:50%!important}
.member-welcome-copy{min-width:0!important;flex:1 1 auto!important}
/* Membership summary: one compact horizontal card directly below Membership Progress. */
.member-active-card{display:flex;align-items:center;gap:18px;width:100%;margin:0 0 12px;padding:11px 14px;background:#111318;border:1px solid #292d35;border-radius:10px;box-sizing:border-box;min-height:48px}
.member-active-card .member-head{min-height:0;padding:0!important;margin:0;display:flex;align-items:center;flex:0 0 auto}
.member-active-card .member-head b{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:#f7f7f5;white-space:nowrap}
.member-active-main{display:flex;align-items:center;justify-content:flex-start;gap:22px;min-width:0;flex:1;padding:0}
.member-active-main>div{display:flex;align-items:center;gap:7px;min-width:0;white-space:nowrap}
.member-active-main small{display:inline;color:#777d86;text-transform:uppercase;font-size:.56rem;font-weight:900;letter-spacing:.04em}
.member-active-main strong{font-size:.82rem;color:#f7f7f5!important;letter-spacing:.01em;white-space:nowrap}
.member-active-main strong.active-value{color:#48c774!important}
.member-active-dot{width:8px;height:8px;border-radius:50%;background:#48c774;box-shadow:0 0 0 4px rgba(72,199,116,.10);flex:0 0 auto}
.member-status-panel{grid-column:1/-1!important}
.member-status-panel .member-head b{color:#f7f7f5}
.member-status-panel .member-card strong.active-value{color:#48c774!important}
/* Strict order: profile/welcome, progress, compact membership summary, existing detail grid. */
.member-progress{display:block!important;width:100%!important;margin:0 0 12px!important}
#vmcViewerProfile,#vmcViewerDelete,#vmcViewerClose{display:none!important}
/* Two-column treatment wherever practical across the member dashboard. */
.member-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
.settings-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.badge.g,.badge.green,.member-badge.green,.success,.active-value{color:#48c774!important}
@media(max-width:700px){.member-overview-grid,.member-grid,.settings-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.gallery-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.member-welcome{gap:12px!important}.member-welcome-avatar{width:64px!important;height:64px!important;min-width:64px!important;min-height:64px!important;flex-basis:64px!important}.member-active-card{gap:11px;padding:10px 11px}.member-active-main{gap:12px}.member-active-card .member-head b{font-size:.7rem}.member-active-main small{font-size:.5rem}.member-active-main strong{font-size:.72rem}}
@media(max-width:380px){.member-overview-grid,.member-grid,.settings-grid,.gallery-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.member-card{padding:10px}.member-card strong{font-size:.76rem}.member-welcome{gap:9px!important}.member-welcome-avatar{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;flex-basis:58px!important}.member-active-card{gap:8px;padding:9px 10px}.member-active-main{gap:8px}.member-active-main>div{gap:5px}.member-active-main small{font-size:.46rem}.member-active-main strong{font-size:.66rem}}
`;
document.head.appendChild(style);
 const panels=[...grid.querySelectorAll(':scope > .member-panel')]; if(panels.length<2)return;
 const account=panels[0],status=panels[1]; account.classList.add('member-account-card');
 /* Membership is a standalone summary, never a child of the two-column detail grid. */
 let active=overview.querySelector('.member-active-card');
 if(!active){
   active=document.createElement('div');active.className='member-panel member-active-card';
   active.innerHTML='<div class="member-head"><b>Membership</b></div><div class="member-active-main"><div><span class="member-active-dot" aria-hidden="true"></span><small>Status</small><strong class="active-value">Active</strong></div><div><small>Plan</small><strong id="memberActivePlan">Per Month</strong></div></div>';
   const plan=document.getElementById('vmcPlanCard'),activePlan=active.querySelector('#memberActivePlan');
   if(plan&&activePlan){const sync=()=>activePlan.textContent=plan.textContent.trim()||'Per Month';sync();new MutationObserver(sync).observe(plan,{childList:true,subtree:true,characterData:true})}
 }
 const progress=overview.querySelector('.member-progress');
 if(progress)overview.insertBefore(progress,active||grid);
 overview.insertBefore(active,grid);
 status.classList.add('member-status-panel');
 grid.appendChild(status);
 const title=overview.querySelector('.member-title h2'),subtitle=overview.querySelector('.member-title p');
 if(title)title.textContent='Member Overview';
 if(subtitle)subtitle.textContent='Everything you need to know about your membership.';
 const clean=()=>overview.querySelectorAll('.member-status-panel .member-card strong').forEach(el=>{const t=(el.textContent||'').trim().toLowerCase();if(t==='active member'||t==='active')el.classList.add('active-value')});
 clean();setTimeout(clean,900);setTimeout(clean,1900);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();