(()=>{'use strict';
// Canonical member-portal shell. Removes legacy cards before async Phase 1/2/3 mounts and keeps the renewal form hidden until the new sections exist.
const layout=document.querySelector('.layout');
if(!layout)return;
const removeLegacy=()=>{
  [...layout.children].forEach(el=>{
    if(!(el instanceof HTMLElement)||el.id==='vmcPhase1Summary'||el.id==='vmcPhase2Membership'||el.id==='vmcPhase3Payments')return;
    const heading=el.querySelector(':scope > .title h2, :scope > h2')?.textContent.trim();
    if(heading==='Your Membership'||heading==='Your VMC Journey')el.remove();
  });
};
const getSubscription=()=>[...layout.children].find(el=>el instanceof HTMLElement&&!['vmcPhase1Summary','vmcPhase2Membership','vmcPhase3Payments'].includes(el.id)&&el.querySelector(':scope > h2')?.textContent.trim()==='Membership & Subscription');
const normalize=()=>{
  removeLegacy();
  const phase1=document.getElementById('vmcPhase1Summary');
  const phase2=document.getElementById('vmcPhase2Membership');
  const phase3=document.getElementById('vmcPhase3Payments');
  const subscription=getSubscription();
  const profile=[...layout.children].find(el=>el instanceof HTMLElement&&el.querySelector(':scope .username-display'));
  const quick=[...layout.children].find(el=>el instanceof HTMLElement&&el.querySelector(':scope > h2')?.textContent.trim()==='Quick Access');
  if(profile)profile.style.order='5';
  if(phase1)phase1.style.order='10';
  if(phase2)phase2.style.order='20';
  if(phase3)phase3.style.order='30';
  if(subscription){subscription.style.order='40';subscription.hidden=!phase3;}
  if(quick)quick.style.order='60';
  if(phase3&&subscription)subscription.hidden=false;
};
const style=document.createElement('style');
style.id='VMC_CUSTOMER_PORTAL_HIERARCHY_PHASE3_FIX';
style.textContent='#vmcPhase1Summary,.layout>#vmcPhase2Membership,.layout>#vmcPhase3Payments{grid-column:1/-1}@media(max-width:900px){#vmcPhase1Summary,.layout>#vmcPhase2Membership,.layout>#vmcPhase3Payments{grid-column:1}}';
document.head.appendChild(style);
removeLegacy();
normalize();
let attempts=0;
const timer=setInterval(()=>{normalize();if(document.getElementById('vmcPhase3Payments')||++attempts>=20){clearInterval(timer);normalize()}},100);
})();
