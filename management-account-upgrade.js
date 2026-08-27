(()=>{'use strict';
const boot=()=>{
  const section=document.getElementById('account');
  if(!section||window.__vmcAccountUpgrade)return;
  window.__vmcAccountUpgrade=true;
  const style=document.createElement('style');
  style.textContent=`
    #account .account-hero{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;margin-bottom:10px;border:1px solid #3b2026;border-radius:14px;background:linear-gradient(135deg,#171014,#111317)}
    #account .account-avatar{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#17191e;border:1px solid #6a2630;color:#fff;font-size:1.15rem;font-weight:900;text-transform:uppercase}
    #account .account-kicker{font-size:.55rem;text-transform:uppercase;letter-spacing:.1em;color:#ff8792;font-weight:900}
    #account .account-hero h3{margin:3px 0 2px;font-size:1rem}
    #account .account-hero p{margin:0;color:#8e949c;font-size:.7rem}
    #account .account-status{padding:7px 9px;border-radius:999px;border:1px solid #285d38;background:#11271a;color:#8ce5a8;font-size:.55rem;font-weight:900;text-transform:uppercase}
    #account .account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #account .account-field{padding:11px 12px;border:1px solid #292d34;background:#0d0f12;border-radius:10px}
    #account .account-field span{display:block;color:#777d86;font-size:.53rem;text-transform:uppercase;letter-spacing:.06em;font-weight:900}
    #account .account-field strong{display:block;margin-top:4px;font-size:.76rem;overflow-wrap:anywhere}
    #account .account-security{margin-top:10px;padding:12px;border:1px solid #292d34;border-radius:10px;background:#101216;display:flex;align-items:center;justify-content:space-between;gap:10px}
    #account .account-security b{display:block;font-size:.72rem}.account-security small{display:block;color:#777d86;font-size:.6rem;margin-top:2px}
    #account .account-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
    @media(max-width:700px){
      #account .account-hero{grid-template-columns:auto minmax(0,1fr);gap:10px;padding:13px}
      #account .account-status{grid-column:1/-1;width:max-content}
      #account .account-grid{grid-template-columns:1fr;gap:7px}
      #account .account-field{padding:10px 11px}
      #account .account-security{align-items:flex-start;flex-direction:column}
      #account .account-security .btn{width:100%;min-height:38px}
      #account .account-actions{display:grid;grid-template-columns:1fr;gap:7px}
      #account .account-actions .btn{min-height:40px}
    }
  `;
  document.head.appendChild(style);
  const name=()=>document.getElementById('acctName')?.textContent?.trim()||'VMC Management';
  const role=()=>document.getElementById('acctRole')?.textContent?.trim()||'Management';
  const initials=()=>name().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'VM';
  if(!section.querySelector('.account-hero')){
    const hero=document.createElement('div');hero.className='account-hero';
    hero.innerHTML='<div class="account-avatar" id="accountAvatar">VM</div><div><div class="account-kicker">VMC management account</div><h3 id="accountHeroName">VMC Management</h3><p id="accountHeroRole">Management</p></div><span class="account-status" id="accountHeroStatus">Active</span>';
    section.querySelector('.title').insertAdjacentElement('afterend',hero);
  }
  if(!section.querySelector('.account-grid')){
    const panel=section.querySelector('.panel');
    const grid=document.createElement('div');grid.className='account-grid';
    grid.innerHTML='<div class="account-field"><span>Name</span><strong id="accountCardName">—</strong></div><div class="account-field"><span>Role</span><strong id="accountCardRole">—</strong></div><div class="account-field"><span>Email</span><strong id="accountCardEmail">—</strong></div><div class="account-field"><span>Account status</span><strong id="accountCardStatus">—</strong></div>';
    panel.parentNode.insertBefore(grid,panel);
    const security=document.createElement('div');security.className='account-security';security.innerHTML='<div><b>Account security</b><small>Keep your management password up to date.</small></div><button class="btn dark" id="accountSecurityPassword">Change Password</button>';
    grid.insertAdjacentElement('afterend',security);
    security.querySelector('button').addEventListener('click',()=>document.getElementById('changeOwnPassword')?.click());
    const actions=section.querySelector('.panel .actions');if(actions){actions.classList.add('account-actions');}
  }
  const sync=()=>{
    const n=name(),r=role(),e=document.getElementById('acctEmail')?.textContent?.trim()||'—',s=document.getElementById('acctStatus')?.textContent?.trim()||'—';
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
    set('accountAvatar',initials());set('accountHeroName',n);set('accountHeroRole',r);set('accountHeroStatus',s||'Active');set('accountCardName',n);set('accountCardRole',r);set('accountCardEmail',e);set('accountCardStatus',s);
  };
  sync();setTimeout(sync,250);setTimeout(sync,1000);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
