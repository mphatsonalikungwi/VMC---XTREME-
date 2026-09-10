(()=>{'use strict';
// Surgical Phase 3 hierarchy fix. Removes the legacy duplicate membership card and keeps member sections in order.
const normalize=()=>{
  const layout=document.querySelector('.layout');
  if(!layout)return;
  const duplicate=[...layout.children].find(el=>{
    if(!(el instanceof HTMLElement)||el.id==='vmcPhase1Summary'||el.id==='vmcPhase2Membership'||el.id==='vmcPhase3Payments')return false;
    const heading=el.querySelector(':scope > .title h2');
    return heading&&heading.textContent.trim()==='Your Membership';
  });
  if(duplicate)duplicate.remove();
  const phase1=document.getElementById('vmcPhase1Summary');
  const phase2=document.getElementById('vmcPhase2Membership');
  const phase3=document.getElementById('vmcPhase3Payments');
  if(phase1&&phase2)phase1.insertAdjacentElement('afterend',phase2);
  if(phase2&&phase3)phase2.insertAdjacentElement('afterend',phase3);
};
const style=document.createElement('style');
style.id='VMC_CUSTOMER_PORTAL_HIERARCHY_PHASE3_FIX';
style.textContent='#vmcPhase1Summary,.layout>#vmcPhase2Membership,.layout>#vmcPhase3Payments{grid-column:1/-1}@media(max-width:900px){#vmcPhase1Summary,.layout>#vmcPhase2Membership,.layout>#vmcPhase3Payments{grid-column:1}}';
const boot=()=>{document.head.appendChild(style);normalize();setTimeout(normalize,700)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
