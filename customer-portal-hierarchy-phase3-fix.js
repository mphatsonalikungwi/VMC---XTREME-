(()=>{'use strict';
// Surgical Phase 3 hierarchy fix. Removes legacy duplicate cards and keeps member sections in the intended order.
const normalize=()=>{
  const layout=document.querySelector('.layout');
  if(!layout)return;
  [...layout.children].forEach(el=>{
    if(!(el instanceof HTMLElement)||el.id==='vmcPhase1Summary'||el.id==='vmcPhase2Membership'||el.id==='vmcPhase3Payments')return;
    const heading=el.querySelector(':scope > .title h2, :scope > h2')?.textContent.trim();
    if(heading==='Your Membership'||heading==='Your VMC Journey')el.remove();
  });
  const phase1=document.getElementById('vmcPhase1Summary');
  const phase2=document.getElementById('vmcPhase2Membership');
  const phase3=document.getElementById('vmcPhase3Payments');
  const subscription=[...layout.children].find(el=>el instanceof HTMLElement&&!['vmcPhase1Summary','vmcPhase2Membership','vmcPhase3Payments'].includes(el.id)&&el.querySelector(':scope > h2')?.textContent.trim()==='Membership & Subscription');
  if(phase1)phase1.style.order='10';
  if(phase2)phase2.style.order='20';
  if(phase3)phase3.style.order='30';
  if(subscription)subscription.style.order='40';
};
const style=document.createElement('style');
style.id='VMC_CUSTOMER_PORTAL_HIERARCHY_PHASE3_FIX';
style.textContent='#vmcPhase1Summary,.layout>#vmcPhase2Membership,.layout>#vmcPhase3Payments{grid-column:1/-1}@media(max-width:900px){#vmcPhase1Summary,.layout>#vmcPhase2Membership,.layout>#vmcPhase3Payments{grid-column:1}}';
const boot=()=>{document.head.appendChild(style);normalize();setTimeout(normalize,700);setTimeout(normalize,1400)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
