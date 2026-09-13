(()=>{'use strict';
const boot=()=>{
 const root=document.querySelector('.portal');
 if(!root)return;
 const $=s=>document.querySelector(s);
 const bar=$('.bar'),side=$('.side'),content=$('.content');
 if(!bar||!side||!content)return;
 const views={profile:$('#vmcProfileView'),gallery:$('#vmcGalleryView'),settings:$('#vmcSettingsView')};

 const css=document.createElement('style');
 css.id='vmc-portal-final-layout';
 css.textContent=`
 :root{--vmc-bg:#f3f6f8;--vmc-card:#fff;--vmc-ink:#17242b;--vmc-muted:#687982;--vmc-line:#dce5e8;--vmc-teal:#168b87;--vmc-teal-dark:#0d6c69;--vmc-teal-soft:#e4f5f2}
 body{background:var(--vmc-bg)!important;color:var(--vmc-ink)!important}
 .top{height:84px!important;background:#fff!important;color:var(--vmc-ink)!important;border-bottom:1px solid var(--vmc-line)!important}
 .bar{height:84px!important;max-width:1240px!important}
 .brand{display:flex!important;align-items:center!important;width:auto!important;height:62px!important;font-size:0!important;line-height:0!important}
 .brand img{display:block!important;width:164px!important;height:auto!important;max-height:62px!important;object-fit:contain!important;object-position:left center!important}
 .portal{display:block!important;min-height:calc(100vh - 84px)!important;background:var(--vmc-bg)!important}
 .content{max-width:1240px!important;margin:0 auto!important;padding:28px!important;background:var(--vmc-bg)!important}
 .content>.hero{display:none!important}
 .view{display:none!important}
 .view.vmc-view-active{display:block!important}
 .vmc-portal-home{display:none!important}
 .vmc-portal-home.vmc-view-active{display:block!important}
 .side{position:fixed!important;z-index:1000!important;top:84px!important;left:0!important;width:min(340px,86vw)!important;height:calc(100vh - 84px)!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:6px!important;padding:22px 18px!important;background:#fff!important;color:var(--vmc-ink)!important;border-right:1px solid var(--vmc-line)!important;box-shadow:18px 0 55px rgba(23,36,43,.16)!important;transform:translateX(-110%)!important;transition:transform .24s ease!important;overflow-y:auto!important}
 .side.vmc-open{transform:translateX(0)!important}
 .nav-btn{display:flex!important;align-items:center!important;width:100%!important;min-height:50px!important;margin:0!important;padding:13px 15px!important;border:0!important;border-radius:11px!important;background:transparent!important;color:#53666d!important;text-align:left!important;font:inherit!important;font-weight:800!important;cursor:pointer!important}
 .nav-btn:hover,.nav-btn.active{background:var(--vmc-teal-soft)!important;color:var(--vmc-teal-dark)!important}
 #vmcLogout{margin-top:12px!important;border-top:1px solid var(--vmc-line)!important;border-radius:0!important;padding-top:22px!important}
 .vmc-drawer-heading{padding:0 10px 18px;margin-bottom:8px;border-bottom:1px solid var(--vmc-line)}
 .vmc-drawer-heading strong{display:block;font-size:18px;color:var(--vmc-ink)}
 .vmc-drawer-heading span{display:block;margin-top:3px;font-size:12px;color:var(--vmc-muted)}
 .vmc-menu-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:46px!important;height:46px!important;margin-left:16px!important;border:1px solid var(--vmc-line)!important;border-radius:12px!important;background:#fff!important;color:var(--vmc-ink)!important;font-size:24px!important;cursor:pointer!important}
 .vmc-menu-backdrop{display:none;position:fixed;inset:84px 0 0;background:rgba(23,36,43,.34);z-index:900}
 .vmc-menu-backdrop.open{display:block}
 .vmc-home{background:#fff;border:1px solid var(--vmc-line);border-radius:22px;overflow:hidden;box-shadow:0 8px 28px rgba(23,36,43,.06)}
 .vmc-home-main{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,.7fr);gap:28px;align-items:center;padding:42px;background:linear-gradient(120deg,#edf8f6 0%,#fff 64%)}
 .vmc-home-kicker{color:var(--vmc-teal-dark);font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
 .vmc-home h1{margin:13px 0 12px;font-size:clamp(34px,5vw,58px);line-height:1.02;letter-spacing:-.055em;color:var(--vmc-ink)}
 .vmc-home p{max-width:590px;margin:0;color:var(--vmc-muted);font-size:16px;line-height:1.7}
 .vmc-home-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
 .vmc-home-action{border:0;border-radius:10px;padding:13px 17px;background:var(--vmc-teal);color:#fff;font:inherit;font-weight:850;cursor:pointer}
 .vmc-home-action.alt{background:#edf3f4;color:var(--vmc-teal-dark)}
 .vmc-home-member{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
 .vmc-home-avatar{width:148px;height:148px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--vmc-teal-soft);border:7px solid #fff;box-shadow:0 8px 28px rgba(23,36,43,.14);font-size:42px;font-weight:950;color:var(--vmc-teal-dark)}
 .vmc-home-avatar img{width:100%;height:100%;object-fit:cover}
 .vmc-home-member strong{margin-top:14px;font-size:20px;color:var(--vmc-ink)}
 .vmc-home-member span{margin-top:3px;color:var(--vmc-muted);font-size:13px}
 .vmc-home-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--vmc-line);border-top:1px solid var(--vmc-line)}
 .vmc-home-stat{background:#fff;padding:22px 25px}.vmc-home-stat small{display:block;color:var(--vmc-muted);font-size:10px;font-weight:900;text-transform:uppercase}.vmc-home-stat b{display:block;margin-top:6px;font-size:21px;color:var(--vmc-ink)}
 .vmc-home-footer{padding:20px 25px;color:var(--vmc-muted);font-size:13px;background:#fbfdfd}
 .identity,.card{background:var(--vmc-card)!important;color:var(--vmc-ink)!important;border-color:var(--vmc-line)!important;box-shadow:0 6px 22px rgba(23,36,43,.045)!important}
 .avatar{background:var(--vmc-teal-soft)!important;color:var(--vmc-teal-dark)!important}.btn{background:var(--vmc-teal)!important;color:#fff!important;border:0!important}.btn.gold,.btn.red{background:var(--vmc-teal)!important;color:#fff!important}
 .field input{background:#fff!important;color:var(--vmc-ink)!important;border-color:#cbd8dc!important}
 @media(max-width:800px){.content{padding:16px!important}.vmc-home-main{grid-template-columns:1fr;padding:28px 24px;gap:22px}.vmc-home-member{order:-1;align-items:flex-start;text-align:left}.vmc-home-avatar{width:104px;height:104px}.vmc-home-member strong{margin-top:10px}.vmc-home-summary{grid-template-columns:1fr 1fr}.vmc-home-stat:last-child{grid-column:1/-1}.grid{grid-template-columns:1fr 1fr!important}.subgrid,.settings-grid{grid-template-columns:1fr!important}}
 @media(max-width:520px){.top,.bar{height:76px!important}.brand img{width:137px!important}.vmc-menu-toggle{width:43px;height:43px;margin-left:8px}.side{top:76px;height:calc(100vh - 76px)}.vmc-menu-backdrop{inset:76px 0 0}.vmc-home h1{font-size:37px}.vmc-home p{font-size:14px}.vmc-home-summary{grid-template-columns:1fr}.vmc-home-stat:last-child{grid-column:auto}.grid{grid-template-columns:1fr!important}}
 `;
 document.getElementById(css.id)?.remove();document.head.appendChild(css);

 // Use the real VMC logo asset used by the public website.
 const brand=$('.brand');
 if(brand){brand.innerHTML='<img src="/assets/logo.png" alt="VMC Xtreme Fitness logo">';}

 // Build a proper mobile/desktop drawer without exposing the horizontal nav.
 let toggle=$('.vmc-menu-toggle');
 if(!toggle){toggle=document.createElement('button');toggle.className='vmc-menu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Open navigation menu');toggle.textContent='☰';bar.appendChild(toggle)}
 let backdrop=$('.vmc-menu-backdrop');
 if(!backdrop){backdrop=document.createElement('div');backdrop.className='vmc-menu-backdrop';document.body.appendChild(backdrop)}
 if(!side.querySelector('.vmc-drawer-heading')){const h=document.createElement('div');h.className='vmc-drawer-heading';h.innerHTML='<strong>My VMC</strong><span>Your membership space</span>';side.insertBefore(h,side.firstChild)}
 if(!side.querySelector('[data-vmc-view="home"]')){const b=document.createElement('button');b.type='button';b.className='nav-btn';b.dataset.vmcView='home';b.textContent='⌂  Home';side.insertBefore(b,side.querySelector('.nav-btn'))}

 // Turn the existing generated homepage into a real independent view.
 let home=$('#vmcPortalHome');
 if(!home){
  home=document.createElement('section');home.id='vmcPortalHome';home.className='vmc-portal-home';
  home.innerHTML='<section class="vmc-home"><div class="vmc-home-main"><div><div class="vmc-home-kicker">MY VMC · MEMBER SPACE</div><h1>Welcome back, <span id="vmcHomeName">Member</span> 👋</h1><p>Your VMC portal brings your membership, progress, personal details and gallery together in one simple space. Check your membership, keep your information updated and celebrate your journey with VMC.</p><div class="vmc-home-actions"><button class="vmc-home-action" data-home-view="profile">View my profile →</button><button class="vmc-home-action alt" data-home-view="gallery">Open my gallery →</button></div></div><div class="vmc-home-member"><div class="vmc-home-avatar" id="vmcHomeAvatar">V</div><strong id="vmcHomeMemberName">Member</strong><span id="vmcHomeUsername">@username</span></div></div><div class="vmc-home-summary"><div class="vmc-home-stat"><small>Membership</small><b id="vmcHomePlan">—</b></div><div class="vmc-home-stat"><small>Status</small><b id="vmcHomeStatus">Checking…</b></div><div class="vmc-home-stat"><small>Subscription</small><b id="vmcHomeRemaining">—</b></div></div><div class="vmc-home-footer">Stay informed, manage your account and keep building a stronger, healthier you.</div></section>';
  content.insertBefore(home,content.firstChild);
 }
 home.classList.add('view');

 const close=()=>{side.classList.remove('vmc-open');backdrop.classList.remove('open');toggle.textContent='☰';toggle.setAttribute('aria-label','Open navigation menu')};
 toggle.onclick=()=>{const open=!side.classList.contains('vmc-open');side.classList.toggle('vmc-open',open);backdrop.classList.toggle('open',open);toggle.textContent=open?'×':'☰';toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')};
 backdrop.onclick=close;

 const allViews=()=>[home,views.profile,views.gallery,views.settings].filter(Boolean);
 const show=(name)=>{
  allViews().forEach(v=>{v.classList.remove('vmc-view-active','active');v.style.display='none'});
  const target=name==='home'?home:views[name];
  if(target){target.classList.add('vmc-view-active');target.style.display='block'}
  side.querySelectorAll('[data-vmc-view]').forEach(b=>b.classList.toggle('active',b.dataset.vmcView===name));
  close();
  if(name==='gallery'&&typeof window.vmcLoadGallery==='function')window.vmcLoadGallery();
 };
 side.querySelectorAll('[data-vmc-view]').forEach(b=>{b.onclick=e=>{e.preventDefault();show(b.dataset.vmcView)}});
 content.querySelectorAll('[data-home-view]').forEach(b=>b.onclick=()=>show(b.dataset.homeView));
 const logout=$('#vmcLogout');if(logout)logout.onclick=()=>{if(typeof window.vmcLogout==='function')window.vmcLogout();};

 const copyProfileToHome=()=>{
  const name=$('#vmcName')?.textContent?.trim()||$('#vmcWelcomeName')?.textContent?.trim()||'Member';
  const username=$('#vmcUsername')?.textContent?.trim()||'@username';
  const plan=$('#vmcPlan')?.textContent?.trim()||$('#vmcPlanCard')?.textContent?.trim()||'—';
  const status=$('#vmcStatus')?.textContent?.trim()||'Checking…';
  const expiry=$('#vmcExpiry')?.textContent?.trim()||'—';
  $('#vmcHomeName')&&( $('#vmcHomeName').textContent=name.split(' ')[0] );
  $('#vmcHomeMemberName')&&($('#vmcHomeMemberName').textContent=name);
  $('#vmcHomeUsername')&&($('#vmcHomeUsername').textContent=username);
  $('#vmcHomePlan')&&($('#vmcHomePlan').textContent=plan);
  $('#vmcHomeStatus')&&($('#vmcHomeStatus').textContent=status);
  $('#vmcHomeRemaining')&&($('#vmcHomeRemaining').textContent=expiry==='—'?'—':'Until '+expiry);
  const source=$('#vmcAvatar img');const av=$('#vmcHomeAvatar');
  if(av&&source){av.innerHTML='<img src="'+source.src+'" alt="Profile photo">'}else if(av){av.textContent=(name.match(/[A-Za-z]/)||['V'])[0].toUpperCase()}
 };

 // Home is the only initial view. Profile/Gallery/Settings never remain visible beneath it.
 show('home');
 copyProfileToHome();
 const observer=new MutationObserver(copyProfileToHome);observer.observe(content,{subtree:true,childList:true,characterData:true});
 setTimeout(copyProfileToHome,1000);setTimeout(copyProfileToHome,2500);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();