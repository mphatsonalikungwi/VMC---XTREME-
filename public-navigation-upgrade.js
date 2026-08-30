(()=>{'use strict';
const init=()=>{
 const nav=document.getElementById('nav');
 const toggle=document.getElementById('menuToggle');
 if(!nav||!toggle)return;
 const links=nav.querySelector('.nav-links');
 const actions=nav.querySelector('.nav-actions');
 if(!links)return;
 // Keep the existing navigation and action buttons; only change presentation at compact widths.
 const close=()=>{nav.classList.remove('mobile-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');};
 const open=()=>{nav.classList.add('mobile-open');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Close navigation');};
 toggle.addEventListener('click',()=>nav.classList.contains('mobile-open')?close():open());
 links.addEventListener('click',e=>{if(e.target.closest('a'))close();});
 window.addEventListener('resize',()=>{if(window.innerWidth>1000)close();});
 // Keep management access separate from the customer account in the public header.
 const management=actions&&actions.querySelector('[data-open="admin"]');
 if(management){
   management.textContent='VMC Management Portal';
   management.classList.remove('btn-dark');
   management.classList.add('btn-red');
   management.setAttribute('aria-label','Open VMC Management Portal');
   let footer=document.querySelector('footer');
   if(footer){
     let section=footer.querySelector('.management-portal-link');
     if(!section){
       section=document.createElement('div');
       section.className='management-portal-link';
       section.innerHTML='<span>Management</span>';
       footer.appendChild(section);
     }
     section.appendChild(management);
   }
 }
 const member=actions&&actions.querySelector('[data-open="login"]');
 if(member)member.textContent='My VMC Account';
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
