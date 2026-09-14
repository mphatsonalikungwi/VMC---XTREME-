(()=>{'use strict';
const arrange=()=>{
 const overview=document.getElementById('vmcProfileView');
 if(!overview)return false;
 const grid=overview.querySelector('.member-overview-grid');
 const welcome=overview.querySelector('.member-welcome');
 const progress=overview.querySelector('.member-progress');
 if(!grid||!welcome||!progress)return false;
 const panels=[...grid.querySelectorAll(':scope > .member-panel')];
 if(panels.length<2)return false;
 const account=panels[0];
 const details=panels[1];
 let status=overview.querySelector(':scope > .member-active-card');
 if(!status){
  status=document.createElement('section');
  status.className='member-panel member-active-card';
  status.innerHTML='<div class="member-head"><b>Membership Status</b></div><div class="member-active-main"><div class="member-status-item"><span class="member-active-dot"></span><small>Status</small><strong class="active-value">Active</strong></div><div class="member-status-item"><small>Plan</small><strong class="member-active-plan">Per Month</strong></div></div>';
 }
 const plan=document.getElementById('vmcPlanCard');
 const planOutput=status.querySelector('.member-active-plan');
 if(plan&&planOutput)planOutput.textContent=plan.textContent.trim()||'Per Month';
 const detailsTitle=details.querySelector('.member-head b');
 if(detailsTitle)detailsTitle.textContent='Membership Details';
 [account,details].forEach(panel=>{
  panel.querySelectorAll('.member-head .badge').forEach(el=>el.remove());
  [...panel.querySelectorAll('*')].filter(el=>el.children.length===0&&el.textContent.trim()==='Active Member').forEach(el=>el.remove());
 });
 grid.remove();
 [welcome,progress,status,account,details].forEach(el=>overview.appendChild(el));
 const style=document.createElement('style');
 style.id='VMC_FINAL_MEMBER_OVERVIEW_STYLE';
 style.textContent='#vmcProfileView>.member-welcome{order:1}#vmcProfileView>.member-progress{order:2}#vmcProfileView>.member-active-card{order:3;width:100%!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;gap:24px!important;padding:18px 20px!important}#vmcProfileView>.member-active-card .member-head{padding:0!important;margin:0!important;white-space:nowrap}#vmcProfileView>.member-active-card .member-active-main{display:flex;align-items:center;gap:28px}#vmcProfileView>.member-active-card .member-status-item{display:flex;align-items:center;gap:8px}#vmcProfileView>.member-active-card small{color:#777d86;text-transform:uppercase;font-size:.68rem;font-weight:900}#vmcProfileView>.member-active-card strong{color:#f7f7f5;font-size:1rem}#vmcProfileView>.member-active-card .active-value{color:#48c774!important}#vmcProfileView>.member-active-card .member-active-dot{width:12px;height:12px;border-radius:50%;background:#48c774;box-shadow:0 0 0 6px rgba(72,199,116,.12)}#vmcProfileView>.member-panel{width:100%!important;max-width:none!important;box-sizing:border-box!important}@media(max-width:700px){#vmcProfileView>.member-active-card{display:block!important;padding:16px!important}#vmcProfileView>.member-active-card .member-head{margin-bottom:12px!important}#vmcProfileView>.member-active-card .member-active-main{gap:18px!important;flex-wrap:wrap}}';
 if(!document.getElementById(style.id))document.head.appendChild(style);
 return true;
};
const boot=()=>{let tries=0;const tick=()=>{if(arrange()||++tries>30)return;setTimeout(tick,250)};tick()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();