(()=>{'use strict';
const boot=()=>{
  const section=document.getElementById('account');
  if(!section||window.__vmcAccountUpgradeV2)return;
  window.__vmcAccountUpgradeV2=true;

  const style=document.createElement('style');
  style.textContent=`
    #account .account-v2{display:grid;gap:12px}
    #account .account-hero-v2{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:18px;border:1px solid #4b1a22;border-radius:16px;background:radial-gradient(circle at 92% 18%,rgba(227,27,45,.18),transparent 34%),linear-gradient(135deg,#171014,#101216);box-shadow:0 12px 30px rgba(0,0,0,.18)}
    #account .account-hero-v2:after{content:'VMC';position:absolute;right:-10px;bottom:-25px;font-size:5rem;font-weight:1000;letter-spacing:-.08em;color:rgba(255,255,255,.025);pointer-events:none}
    #account .account-avatar-v2{position:relative;z-index:1;width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:#181a1f;border:1px solid #6a2630;color:#fff;font-size:1.2rem;font-weight:1000;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025)}
    #account .account-kicker-v2{position:relative;z-index:1;font-size:.58rem;text-transform:uppercase;letter-spacing:.12em;color:#ff8792;font-weight:1000}
    #account .account-hero-v2 h3{position:relative;z-index:1;margin:4px 0 2px;font-size:1.15rem;letter-spacing:-.02em}
    #account .account-hero-v2 p{position:relative;z-index:1;margin:0;color:#8e949c;font-size:.72rem}
    #account .account-status-v2{position:relative;z-index:1;padding:8px 11px;border-radius:999px;border:1px solid #285d38;background:#11271a;color:#8ce5a8;font-size:.58rem;font-weight:1000;text-transform:uppercase;white-space:nowrap}
    #account .account-section-v2{border:1px solid #292d34;background:#111317;border-radius:14px;overflow:hidden}
    #account .account-section-head-v2{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border-bottom:1px solid #292d34}
    #account .account-section-head-v2 b{font-size:.72rem;letter-spacing:.04em}
    #account .account-section-head-v2 small{color:#777d86;font-size:.6rem}
    #account .account-grid-v2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px}
    #account .account-field-v2{padding:12px;border:1px solid #292d34;background:#0d0f12;border-radius:10px;min-width:0}
    #account .account-field-v2 span{display:block;color:#777d86;font-size:.54rem;text-transform:uppercase;letter-spacing:.07em;font-weight:1000}
    #account .account-field-v2 strong{display:block;margin-top:5px;font-size:.78rem;overflow-wrap:anywhere}
    #account .account-security-v2{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px}
    #account .account-security-copy b{display:block;font-size:.76rem}.account-security-copy small{display:block;color:#777d86;font-size:.62rem;margin-top:3px;line-height:1.45}
    #account .security-pill-v2{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:5px 8px;border-radius:999px;border:1px solid #285d38;background:#11271a;color:#8ce5a8;font-size:.55rem;font-weight:1000;text-transform:uppercase}
    #account .security-dot-v2{width:6px;height:6px;border-radius:50%;background:#48c774;box-shadow:0 0 8px rgba(72,199,116,.65)}
    #account .account-actions-v2{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px;border-top:1px solid #292d34}
    #account .account-actions-v2 .btn{min-height:42px}
    #account .account-original-v2{display:none!important}
    @media(max-width:700px){
      #account .account-hero-v2{grid-template-columns:auto minmax(0,1fr);gap:11px;padding:14px}
      #account .account-avatar-v2{width:56px;height:56px;border-radius:15px;font-size:1rem}
      #account .account-status-v2{grid-column:1/-1;width:max-content}
      #account .account-grid-v2{grid-template-columns:1fr;gap:7px;padding:9px}
      #account .account-field-v2{padding:10px 11px}
      #account .account-security-v2{grid-template-columns:1fr;gap:9px;padding:12px}
      #account .account-security-v2 .btn{width:100%;min-height:42px}
      #account .account-actions-v2{grid-template-columns:1fr;gap:7px}
    }
  `;
  document.head.appendChild(style);

  const text=id=>document.getElementById(id)?.textContent?.trim()||'';
  const getName=()=>text('acctName')||'VMC Management';
  const getRole=()=>text('acctRole')||'Management';
  const getEmail=()=>text('acctEmail')||'—';
  const getStatus=()=>text('acctStatus')||'Active';
  const initials=()=>getName().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'VM';
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};

  const original=section.querySelector('.panel');
  if(original)original.classList.add('account-original-v2');

  let shell=section.querySelector('.account-v2');
  if(!shell){
    shell=document.createElement('div');shell.className='account-v2';
    shell.innerHTML=`
      <div class="account-hero-v2">
        <div class="account-avatar-v2" id="accountAvatarV2">VM</div>
        <div><div class="account-kicker-v2">VMC management account</div><h3 id="accountHeroNameV2">VMC Management</h3><p id="accountHeroRoleV2">Management account</p></div>
        <span class="account-status-v2" id="accountHeroStatusV2">ACTIVE</span>
      </div>
      <div class="account-section-v2">
        <div class="account-section-head-v2"><div><b>Account details</b><small> Your management identity</small></div></div>
        <div class="account-grid-v2">
          <div class="account-field-v2"><span>Name</span><strong id="accountCardNameV2">—</strong></div>
          <div class="account-field-v2"><span>Role</span><strong id="accountCardRoleV2">—</strong></div>
          <div class="account-field-v2"><span>Email</span><strong id="accountCardEmailV2">—</strong></div>
          <div class="account-field-v2"><span>Account status</span><strong id="accountCardStatusV2">—</strong></div>
        </div>
      </div>
      <div class="account-section-v2">
        <div class="account-section-head-v2"><div><b>Security</b><small> Keep your account protected</small></div></div>
        <div class="account-security-v2">
          <div class="account-security-copy"><b>Password & sign-in</b><small>Use a strong password and change it whenever you suspect it may have been exposed.</small><span class="security-pill-v2"><i class="security-dot-v2"></i>Account protected</span></div>
          <button class="btn dark" id="accountPasswordV2">Change Password</button>
        </div>
        <div class="account-actions-v2"><button class="btn dark" id="accountRefreshV2">Refresh Account</button><button class="btn red" id="accountLogoutV2">Log Out</button></div>
      </div>`;
    section.querySelector('.title')?.insertAdjacentElement('afterend',shell);
  }

  const sync=()=>{
    const n=getName(),r=getRole(),e=getEmail(),s=getStatus();
    set('accountAvatarV2',initials());set('accountHeroNameV2',n);set('accountHeroRoleV2',r);set('accountHeroStatusV2',s||'ACTIVE');set('accountCardNameV2',n);set('accountCardRoleV2',r);set('accountCardEmailV2',e);set('accountCardStatusV2',s);
  };
  sync();
  setTimeout(sync,250);setTimeout(sync,800);setTimeout(sync,1600);

  document.getElementById('accountPasswordV2')?.addEventListener('click',()=>document.getElementById('changeOwnPassword')?.click());
  document.getElementById('accountLogoutV2')?.addEventListener('click',()=>document.getElementById('logout2')?.click()||document.getElementById('logout')?.click());
  document.getElementById('accountRefreshV2')?.addEventListener('click',()=>location.reload());
};

const start=()=>{
  if(document.getElementById('account'))boot();
  else setTimeout(start,120);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
