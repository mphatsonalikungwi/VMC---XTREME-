(()=>{'use strict';
const init=()=>{
 const nav=document.getElementById('nav');
 const toggle=document.getElementById('menuToggle');
 if(!nav||!toggle)return;
 const links=nav.querySelector('.nav-links');
 const actions=nav.querySelector('.nav-actions');
 if(!links)return;
 if(!document.getElementById('vmc-public-nav-style')){
   const style=document.createElement('style');style.id='vmc-public-nav-style';
   style.textContent='@media(max-width:1000px){#menuToggle{display:block}.nav-links{display:none}.nav.mobile-open .nav-links{display:flex;position:absolute;left:0;right:0;top:76px;background:#0d0f12;border-bottom:1px solid var(--line);padding:10px 18px 0;flex-direction:column;align-items:stretch;gap:0;z-index:51}.nav.mobile-open .nav-links a{padding:13px 0;border-bottom:1px solid #202329}.nav.mobile-open .nav-links a:last-child{border-bottom:0}}@media(max-width:760px){.nav.mobile-open .nav-links{top:68px}.nav.mobile-open .nav-links a{padding:13px 0}}.management-portal-link{display:flex;align-items:center;gap:12px;margin-top:12px}.management-portal-link>span{font-size:.68rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#777c84}.management-portal-link .btn{padding:9px 13px;font-size:.72rem}';
   document.head.appendChild(style);
 }
 const close=()=>{nav.classList.remove('mobile-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');};
 const open=()=>{nav.classList.add('mobile-open');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Close navigation');};
 toggle.addEventListener('click',()=>nav.classList.contains('mobile-open')?close():open());
 links.addEventListener('click',e=>{if(e.target.closest('a'))close();});
 window.addEventListener('resize',()=>{if(window.innerWidth>1000)close();});
 const management=actions&&actions.querySelector('[data-open="admin"]');
 if(management){
   management.textContent='VMC Management Portal';
   management.classList.remove('btn-dark');management.classList.add('btn-red');
   management.setAttribute('aria-label','Open VMC Management Portal');
   const footer=document.querySelector('footer');
   if(footer){let section=footer.querySelector('.management-portal-link');if(!section){section=document.createElement('div');section.className='management-portal-link';section.innerHTML='<span>Management</span>';footer.appendChild(section)}section.appendChild(management)}
 }
 const member=actions&&actions.querySelector('[data-open="login"]');if(member)member.textContent='My VMC Account';
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
