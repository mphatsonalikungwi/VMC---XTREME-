(()=>{'use strict';
const install=()=>{
  if(document.getElementById('vmcProfileHeaderUpgrade'))return;
  const card=document.querySelector('.layout .card .profile')?.closest('.card');
  if(!card)return;
  const profile=card.querySelector('.profile');
  if(!profile)return;
  const style=document.createElement('style');
  style.id='vmcProfileHeaderUpgrade';
  style.textContent=`
    .vmc-profile-header{position:relative;overflow:hidden;margin:0 0 16px;border:1px solid #292d35;border-radius:18px;background:#111318}
    .vmc-profile-cover{height:78px;background:radial-gradient(circle at 85% 15%,rgba(255,105,119,.34),transparent 42%),linear-gradient(120deg,#241116 0%,#17191e 52%,#101216 100%);border-bottom:1px solid #3b252b}
    .vmc-profile-header-body{display:flex;align-items:flex-end;gap:13px;padding:0 15px 15px}
    .vmc-profile-header-avatar{width:70px;height:70px;flex:0 0 70px;margin-top:-30px;border:3px solid #111318;border-radius:50%;overflow:hidden;background:#292d35;display:grid;place-items:center;color:#ff6977;font-size:22px;font-weight:950}
    .vmc-profile-header-avatar img{width:100%;height:100%;object-fit:cover}
    .vmc-profile-header-copy{min-width:0;padding-top:10px}
    .vmc-profile-header-name{margin:0;color:#f4f5f7;font-size:18px;font-weight:950;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vmc-profile-header-username{margin:4px 0 0;color:#9da4ae;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vmc-profile-header-status{display:inline-flex;align-items:center;gap:5px;margin-top:9px;padding:5px 8px;border:1px solid #3b4540;border-radius:999px;background:#151b17;color:#a9d8b4;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
    .vmc-profile-header-status::before{content:'';width:5px;height:5px;border-radius:50%;background:#72d18a}
    @media(max-width:520px){.vmc-profile-cover{height:68px}.vmc-profile-header-body{padding:0 12px 13px}.vmc-profile-header-avatar{width:62px;height:62px;flex-basis:62px}.vmc-profile-header-name{font-size:16px}}
  `;
  document.head.appendChild(style);
  const header=document.createElement('div');header.className='vmc-profile-header';header.innerHTML='<div class="vmc-profile-cover"></div><div class="vmc-profile-header-body"><div class="vmc-profile-header-avatar" id="vmcProfileHeaderAvatar">VMC</div><div class="vmc-profile-header-copy"><h3 class="vmc-profile-header-name" id="vmcProfileHeaderName">VMC Member</h3><p class="vmc-profile-header-username" id="vmcProfileHeaderUsername">VMC username</p><span class="vmc-profile-header-status" id="vmcProfileHeaderStatus">Active account</span></div></div>';
  card.insertBefore(header,card.firstChild);
  const set=(id,value,fallback)=>{const el=document.getElementById(id);if(el)el.textContent=value||fallback};
  const load=async()=>{try{if(typeof sb==='undefined')return;const {data:{user}}=await sb.auth.getUser();if(!user)return;const {data:p}=await sb.from('profiles').select('full_name,username,account_status').eq('id',user.id).maybeSingle();if(!p)return;const name=p.full_name||'VMC Member';set('vmcProfileHeaderName',name,'VMC Member');set('vmcProfileHeaderUsername',p.username?`@${String(p.username).replace(/^@/,'')}`:'VMC username','VMC username');set('vmcProfileHeaderStatus',p.account_status||'Active account','Active account');const avatar=document.querySelector('.profile img');const target=document.getElementById('vmcProfileHeaderAvatar');if(avatar?.src&&target){target.innerHTML='';const img=document.createElement('img');img.src=avatar.src;img.alt='';target.appendChild(img)}else if(target){target.textContent=(name.trim()[0]||'V').toUpperCase()}}catch(error){console.warn('VMC profile header upgrade failed',error)}};
  load();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();