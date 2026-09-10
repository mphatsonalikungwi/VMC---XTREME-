(()=>{'use strict';
// Surgical member-portal hierarchy fix. No membership/auth/data logic is changed.
const apply=()=>{
  const layout=document.querySelector('.layout');
  if(!layout)return;
  const duplicate=[...layout.children].find(el=>{
    if(!(el instanceof HTMLElement)||el.id==='vmcPhase1Summary'||el.id==='vmcPhase2Membership')return false;
    const heading=el.querySelector(':scope > h2');
    return heading&&heading.textContent.trim()==='Your VMC Journey';
  });
  if(duplicate)duplicate.remove();
};
const style=document.createElement('style');
style.id='VMC_CUSTOMER_PORTAL_HIERARCHY_FIX';
style.textContent='#vmcPhase1Summary{grid-column:auto}.layout>#vmcPhase2Membership{grid-column:1/-1}@media(max-width:900px){#vmcPhase1Summary{grid-column:1}}';
const boot=()=>{document.head.appendChild(style);apply()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
