(()=>{'use strict';
const boot=()=>{
 const root=document.querySelector('.portal');
 if(!root)return;
 const $=s=>document.querySelector(s);
 const content=$('.content'), side=$('.side'), top=$('.top'), bar=$('.bar');
 if(!content||!side||!bar)return;
 document.querySelector('#vmcPortalHome')?.remove();
 document.querySelector('.vmc-subscription-progress')?.remove();
 document.querySelector('.vmc-menu-backdrop')?.remove();
 document.querySelector('.vmc-menu-toggle')?.remove();
 const views={profile:$('#vmcProfileView'),gallery:$('#vmcGalleryView'),settings:$('#vmcSettingsView')};
 const nav=[...side.querySelectorAll('[data-vmc-view]')];
 const style=document.createElement('style');
 style.id='vmc-clean-portal-style';
 style.textContent=`
 :root{--vmc-bg:#f4f7f6;--vmc-card:#fff;--vmc-ink:#17212b;--vmc-muted:#687582;--vmc-line:#dce5e2;--vmc-accent:#0f766e;--vmc-accent-dark:#115e59;--vmc-soft:#e7f3f0;--vmc-warn:#b7791f;--vmc-danger:#c2414d}
 body{background:var(--vmc-bg)!important;color:var(--vmc-ink)!important}
 .top{height:76px!important;background:#fff!important;color:var(--vmc-ink)!important;border-bottom:1px solid var(--vmc-line)!important}
 .bar{height:76px!important}
 .brand{color:#17212b!important;font-size:24px!important}
 .brand span{color:#e31b3b!important}
 .brand small{color:#718096!important}
 .top-user{color:var(--vmc-ink)!important}
 .mini-avatar{background:var(--vmc-soft)!important;color:var(--vmc-accent-dark)!important}
 .portal{display:block!important;min-height:calc(100vh - 76px)!important;background:var(--vmc-bg)!important}
 .side{position:fixed!important;z-index:100!important;top:76px!important;left:0!important;width:min(340px,88vw)!important;height:calc(100vh - 76px)!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:5px!important;padding:28px 20px!important;background:#fff!important;color:var(--vmc-ink)!important;border-right:1px solid var(--vmc-line)!important;box-shadow:20px 0 55px rgba(23,33,43,.16)!important;transform:translateX(-110%)!important;transition:transform .24s ease!important;overflow-y:auto!important}
 .side.vmc-open{transform:translateX(0)!important}
 .side:before{content:'MY VMC';display:block;color:var(--vmc-accent);font-size:12px;font-weight:900;letter-spacing:.16em;margin:0 10px 18px}
 .nav-btn{display:flex!important;align-items:center!important;width:100%!important;min-height:52px!important;margin:0!important;padding:14px 16px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#52606d!important;text-align:left!important;font:inherit!important;font-weight:800!important;cursor:pointer!important}
 .nav-btn:hover,.nav-btn.active{background:var(--vmc-soft)!important;color:var(--vmc-accent-dark)!important}
 #vmcLogout{margin-top:12px!important;border-top:1px solid var(--vmc-line)!important;border-radius:0!important;padding-top:25px!important}
 .side-note{display:block!important;margin-top:auto!important;padding:28px 10px 8px!important;color:#718096!important;font-size:11px!important}
 .side-note b{color:var(--vmc-ink)!important}
 .side-note strong{color:var(--vmc-accent)!important}
 .content{padding:28px!important;max-width:1180px!important;margin:0 auto!important;background:var(--vmc-bg)!important}
 .content>.hero{display:none!important}
 .view{display:none!important}.view.active{display:block!important}
 .identity,.card{background:var(--vmc-card)!important;color:var(--vmc-ink)!important;border:1px solid var(--vmc-line)!important;box-shadow:0 5px 18px rgba(23,33,43,.045)!important}
 .identity{margin-top:0!important;border-radius:18px!important}
 .identity h2,.card h2,.card h3{color:var(--vmc-ink)!important}
 .username,.label,.card small{color:var(--vmc-muted)!important}
 .avatar{background:var(--vmc-soft)!important;color:var(--vmc-accent-dark)!important;border-color:#fff!important}
 .btn,.btn.gold,.btn.red{background:var(--vmc-accent)!important;color:#fff!important;border:0!important}
 .btn:hover{background:var(--vmc-accent-dark)!important}
 .field input{background:#fff!important;color:var(--vmc-ink)!important;border:1px solid #cbd8d4!important}
 .settings-grid>.card{background:#fbfdfc!important}
 .payment{background:#173b3a!important;color:#fff!important;border-color:#173b3a!important}
 .payment h2,.payment .muted,.payment .row b{color:#fff!important}.payment .muted,.payment .row small{color:#c9e1dc!important}
 .status.active{background:#d9f3e7!important;color:#176b46!important}.status.danger{background:#fde2e5!important;color:#a52d3b!important}
 .vmc-menu-toggle{display:inline-flex!important;align-items:center;justify-content:center;width:46px;height:46px;margin-left:12px;border:1px solid #cbd8d4;border-radius:12px;background:#fff;color:var(--vmc-ink);font-size:24px;cursor:pointer}
 .vmc-menu-backdrop{display:none;position:fixed;inset:76px 0 0;background:rgba(23,33,43,.42);z-index:90}.vmc-menu-backdrop.open{display:block}
 .vmc-portal-home{display:block;margin-bottom:18px}
 .vmc-home-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);gap:18px}
 .vmc-home-card{background:var(--vmc-card);border:1px solid var(--vmc-line);border-radius:22px;padding:34px;box-shadow:0 5px 18px rgba(23,33,43,.045)}
 .vmc-home-card.primary{background:linear-gradient(135deg,#e7f3f0 0%,#fff 72%);border-color:#c8e2dc}
 .vmc-home-kicker{color:var(--vmc-accent);font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
 .vmc-home-card h1{font-size:clamp(30px,4vw,52px);line-height:1.04;letter-spacing:-.045em;margin:12px 0;color:var(--vmc-ink)}
 .vmc-home-card p{color:var(--vmc-muted);font-size:15px;max-width:590px;margin:0}
 .vmc-home-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:25px}.vmc-home-action{border:1px solid var(--vmc-accent);background:var(--vmc-accent);color:#fff;border-radius:10px;padding:13px 16px;font:inherit;font-weight:850;cursor:pointer}.vmc-home-action.secondary{background:#fff;color:var(--vmc-accent-dark)}
 .vmc-home-summary{display:grid;gap:12px}.vmc-summary-item{background:var(--vmc-card);border:1px solid var(--vmc-line);border-radius:18px;padding:22px}.vmc-summary-item strong{display:block;font-size:24px;color:var(--vmc-ink);margin-top:5px}.vmc-summary-item span{color:var(--vmc-muted);font-size:12px}
 .vmc-subscription-progress{margin-top:16px!important}.vmc-progress-track{height:12px;background:#dce6e3;border-radius:99px;overflow:hidden;margin:14px 0 8px}.vmc-progress-fill{height:100%;width:0;border-radius:99px;transition:width .35s,background .35s}.vmc-progress-line{display:flex;justify-content:space-between;gap:12px;color:var(--vmc-muted);font-size:12px}.vmc-progress-line strong{color:var(--vmc-ink)}
 @media(max-width:800px){.content{padding:16px!important}.vmc-home-layout{grid-template-columns:1fr}.vmc-home-card{padding:24px}.vmc-home-card h1{font-size:36px}.identity{margin-top:0!important}.grid{grid-template-columns:1fr 1fr!important}.subgrid,.settings-grid{grid-template-columns:1fr!important}}
 @media(max-width:520px){.top-user>div:first-child{display:none}.vmc-menu-toggle{margin-left:8px}.grid{grid-template-columns:1fr!important}.identity{padding:16px!important}.vmc-home-card h1{font-size:32px}.vmc-home-actions{display:grid}.vmc-home-action{width:100%;text-align:left}}
 `;
 document.getElementById('vmc-clean-portal-style')?.remove();document.head.appendChild(style);
 const toggle=document.createElement('button');toggle.className='vmc-menu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Open navigation menu');toggle.textContent='☰';
 const topUser=$('.top-user');if(topUser)topUser.prepend(toggle);else bar.append(toggle);
 const backdrop=document.createElement('div');backdrop.className='vmc-menu-backdrop';document.body.appendChild(backdrop);
 const home=document.createElement('section');home.className='vmc-portal-home';home.id='vmcPortalHome';home.innerHTML=`<div class="vmc-home-layout"><section class="vmc-home-card primary"><div class="vmc-home-kicker">MY VMC · MEMBER SPACE</div><h1 id="vmcHomeTitle">Welcome to your VMC space.</h1><p>Manage your membership, view your progress and keep your VMC account up to date—all from one place.</p><div class="vmc-home-actions"><button class="vmc-home-action" data-home-view="profile">View my membership</button><button class="vmc-home-action secondary" data-home-view="gallery">Open my gallery</button></div></section><section class="vmc-home-summary"><div class="vmc-summary-item"><div class="vmc-home-kicker">Membership</div><strong id="vmcHomePlan">Checking…</strong><span id="vmcHomeStatus">Loading your membership status</span></div><div class="vmc-summary-item"><div class="vmc-home-kicker">Account</div><strong>My VMC</strong><span>Profile, gallery and settings are available from the menu.</span></div></section></div>`;
 content.insertBefore(home,content.firstChild);
 const progress=document.createElement('section');progress.className='card vmc-subscription-progress';progress.innerHTML='<div class="section-head"><div><h2>Subscription Progress</h2><p style="color:var(--vmc-muted);margin:4px 0 0">Time elapsed and time remaining on your current plan.</p></div><b class="status" id="vmcProgressStatus">Checking…</b></div><div style="display:flex;justify-content:space-between;align-items:end;gap:10px;flex-wrap:wrap"><div><div class="big" id="vmcProgressPlan">—</div><span class="label" id="vmcProgressDates">—</span></div><strong id="vmcProgressRemaining">—</strong></div><div class="vmc-progress-track"><div class="vmc-progress-fill" id="vmcProgressFill"></div></div><div class="vmc-progress-line"><span id="vmcProgressUsed">—</span><strong id="vmcProgressEnd">—</strong></div>';
 const grid=views.profile?.querySelector('.grid');if(grid)grid.insertAdjacentElement('afterend',progress);
 const duplicate=views.profile?.querySelector('.subgrid>.card:not(.payment)');if(duplicate)duplicate.remove();
 const closeMenu=()=>{side.classList.remove('vmc-open');backdrop.classList.remove('open');toggle.textContent='☰';toggle.setAttribute('aria-label','Open navigation menu')};
 toggle.onclick=()=>{const open=!side.classList.contains('vmc-open');side.classList.toggle('vmc-open',open);backdrop.classList.toggle('open',open);toggle.textContent=open?'×':'☰';toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')};backdrop.onclick=closeMenu;
 const show=v=>{home.style.display=v==='home'?'block':'none';Object.entries(views).forEach(([k,e])=>e&&e.classList.toggle('active',k===v));nav.forEach(b=>b.classList.toggle('active',b.dataset.vmcView===v));closeMenu();window.scrollTo({top:0,behavior:'smooth'})};
 nav.forEach(b=>{if(b.dataset.vmcView)b.onclick=e=>{e.preventDefault();show(b.dataset.vmcView)}});home.querySelectorAll('[data-home-view]').forEach(b=>b.onclick=()=>show(b.dataset.homeView));
 const text=(id,v)=>{const e=$('#'+id);if(e)e.textContent=v};
 const fmt=v=>{if(!v)return'Not available';const d=new Date(String(v).length<11?v+'T00:00:00':v);return isNaN(d)?String(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
 const renderProgress=p=>{const start=p.membership_start_date,end=p.membership_expiry_date,fill=$('#vmcProgressFill'),status=$('#vmcProgressStatus');const plan=p.membership_tier?`${p.membership_tier} · ${p.session_type||'Session'}`:'Membership awaiting activation';text('vmcProgressPlan',plan);text('vmcHomePlan',p.membership_tier||'Not active');text('vmcHomeStatus',p.payment_status==='verified'?'Active membership':'Membership status: '+(p.payment_status||'pending'));text('vmcProgressDates',start&&end?`${fmt(start)} → ${fmt(end)}`:'Dates appear after payment verification');if(!start||!end){fill.style.width='0%';fill.style.background='var(--vmc-warn)';text('vmcProgressRemaining','Awaiting verification');text('vmcProgressUsed','Subscription has not started');text('vmcProgressEnd','—');status.textContent='Pending';status.className='status';return}const s=new Date(start+'T00:00:00Z'),e=new Date(end+'T23:59:59Z'),now=new Date(),total=Math.max(1,e-s),left=Math.max(0,e-now),days=Math.ceil(left/86400000),used=Math.max(0,Math.min(100,((now-s)/total)*100));const remaining=days>30?`${Math.floor(days/30)} month${Math.floor(days/30)===1?'':'s'} · ${days%30} days left`:`${days} day${days===1?'':'s'} left`;fill.style.width=`${days>0?Math.max(1,used):100}%`;fill.style.background=days<=7?'var(--vmc-danger)':used>=50?'var(--vmc-warn)':'var(--vmc-accent)';text('vmcProgressRemaining',days>0?remaining:'Expired');text('vmcProgressUsed',days>0?`${Math.round(used)}% of subscription elapsed`:'Subscription ended');text('vmcProgressEnd',`Ends ${fmt(end)}`);status.textContent=days<=0?'Expired':days<=7?'Ending soon':'Active';status.className='status '+(days<=0||days<=7?'danger':'active')};
 const load=async()=>{try{if(typeof sb==='undefined')return;const {data:{user}}=await sb.auth.getUser();if(!user)return;const {data:p}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();if(p)renderProgress(p)}catch(e){console.warn('VMC portal data unavailable',e)}};load();setInterval(load,60000);show('home');
 const saveUsername=$('#vmcSaveUsername');if(saveUsername){saveUsername.onclick=async()=>{const input=$('#vmcNewUsername'),message=$('#vmcUsernameMessage'),value=String(input?.value||'').trim().toLowerCase().replace(/^@/,'');if(!message)return;if(!/^[a-z0-9_]{3,30}$/.test(value)){message.className='message error';message.textContent='Use 3–30 letters, numbers or underscores.';return}message.className='message';message.textContent='Saving…';saveUsername.disabled=true;try{if(typeof sb==='undefined')throw Error('Account service is unavailable.');const {data,error}=await sb.functions.invoke('vmc-member-api-v2',{body:{action:'change-username',username:value}});if(error)throw error;const result=data||{};if(result.error)throw Error(result.error);message.className='message success';message.textContent=result.message||'Username updated successfully.';text('vmcUsername','@'+result.username);text('topUsername','@'+result.username);if(input)input.value=result.username}catch(e){message.className='message error';message.textContent=e?.context?.message||e?.message||'Unable to update username.'}finally{saveUsername.disabled=false}}}
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();