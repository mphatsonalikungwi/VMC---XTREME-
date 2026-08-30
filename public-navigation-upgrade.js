(()=>{'use strict';
const init=()=>{
 const nav=document.getElementById('nav');
 if(!nav)return;
 if(!document.getElementById('vmc-public-nav-style')){
  const style=document.createElement('style');style.id='vmc-public-nav-style';
  style.textContent='@media(max-width:1000px){.nav-links{display:none!important}.nav-actions{display:none!important}.vmc-public-menu-toggle{display:flex!important}.nav.mobile-open .nav-links{display:flex!important;position:absolute;left:0;right:0;top:76px;background:#0d0f12;border-bottom:1px solid var(--line);padding:10px 18px 14px;flex-direction:column;align-items:stretch;gap:0;z-index:51}.nav.mobile-open .nav-links a{padding:13px 0;border-bottom:1px solid #202329}.mobile-nav-actions{display:flex;flex-direction:column;gap:8px;padding-top:12px;margin-top:4px;border-top:1px solid #202329}.mobile-nav-actions .btn{width:100%}}@media(max-width:760px){.nav.mobile-open .nav-links{top:68px}.nav.mobile-open .nav-links a{padding:13px 0}}.vmc-public-menu-toggle{display:none;width:44px;height:44px;align-items:center;justify-content:center;border:1px solid var(--line);background:#111318;color:#fff;border-radius:12px;font-size:1.35rem;line-height:1}.management-portal-link{display:flex;align-items:center;gap:12px;margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}.management-portal-link>span{font-size:.68rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#777c84}.management-portal-link .btn{padding:9px 13px;font-size:.72rem}';
  document.head.appendChild(style);
 }
 let toggle=document.getElementById('menuToggle');
 if(!toggle){toggle=document.createElement('button');toggle.id='menuToggle';toggle.className='vmc-public-menu-toggle';toggle.type='button';toggle.textContent='☰';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');nav.appendChild(toggle)}
 const links=nav.querySelector('.nav-links');
 if(!links)return;
 const close=()=>{nav.classList.remove('mobile-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');toggle.textContent='☰'};
 const open=()=>{nav.classList.add('mobile-open');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Close navigation');toggle.textContent='×'};
 if(!toggle.dataset.vmcBound){toggle.dataset.vmcBound='1';toggle.addEventListener('click',()=>nav.classList.contains('mobile-open')?close():open());window.addEventListener('resize',()=>{if(window.innerWidth>1000)close()})}
 links.addEventListener('click',e=>{if(e.target.closest('a'))close()},{once:false});
 const actions=nav.querySelector('.nav-actions');
 const management=actions&&actions.querySelector('[data-open="admin"]');
 if(management){management.textContent='VMC Management Portal';management.classList.remove('btn-dark');management.classList.add('btn-red');management.setAttribute('aria-label','Open VMC Management Portal');const footer=document.querySelector('footer');if(footer){let section=footer.querySelector('.management-portal-link');if(!section){section=document.createElement('div');section.className='management-portal-link';section.innerHTML='<span>Management</span>';footer.appendChild(section)}if(!section.contains(management))section.appendChild(management)}}
 const member=actions&&actions.querySelector('[data-open="login"]');const join=actions&&actions.querySelector('[data-open="register"]');if(member)member.textContent='My VMC Account';
 const mobileActions=links.querySelector('.mobile-nav-actions');
 if(!mobileActions){const box=document.createElement('div');box.className='mobile-nav-actions';if(member)box.appendChild(member.cloneNode(true));if(join)box.appendChild(join.cloneNode(true));links.appendChild(box)}
};
const boot=()=>{init();let runs=0;const observer=new MutationObserver(()=>{if(runs++<20)init()});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
