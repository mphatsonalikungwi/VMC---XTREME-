(()=>{'use strict';
const boot=()=>{
  if(window.__VMC_MEMBER_OVERVIEW_PRIORITY)return;
  const overview=document.getElementById('vmcProfileView');
  if(!overview)return;
  window.__VMC_MEMBER_OVERVIEW_PRIORITY=true;

  const style=document.createElement('style');
  style.id='VMC_MEMBER_OVERVIEW_PRIORITY_STYLE';
  style.textContent=`
    #vmcProfileView .member-overview-stack{display:block!important;margin-bottom:0}
    #vmcProfileView .member-overview-stack>.member-panel{width:100%;margin-bottom:12px}
    #vmcProfileView .member-profile-strip{display:flex;align-items:center;gap:16px;margin:0 12px 12px;padding:14px;border:1px solid #292d34;background:#15171b;border-radius:12px;min-width:0}
    #vmcProfileView .member-profile-avatar{width:86px;height:86px;flex:0 0 86px;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0b0c0f;border:2px solid #343842;color:#d9dde3;font-size:1.4rem;font-weight:900;letter-spacing:.02em}
    #vmcProfileView .member-profile-avatar img{display:block;width:100%;height:100%;object-fit:cover}
    #vmcProfileView .member-profile-copy{min-width:0}
    #vmcProfileView .member-profile-eyebrow{margin:0 0 4px;color:#e31b2d;font-size:.68rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
    #vmcProfileView .member-profile-copy h3{margin:0;color:#f7f7f5;font-size:1.08rem;line-height:1.35}
    #vmcProfileView .member-profile-copy p{margin:8px 0 0;color:#8e949c;font-size:.76rem;word-break:break-word}
    @media(max-width:520px){
      #vmcProfileView .member-profile-strip{gap:12px;padding:12px}
      #vmcProfileView .member-profile-avatar{width:72px;height:72px;flex-basis:72px}
      #vmcProfileView .member-profile-copy h3{font-size:.95rem}
      #vmcProfileView .member-profile-copy p{font-size:.7rem}
    }
  `;
  document.head.appendChild(style);

  const layout=overview.querySelector('.member-overview-grid');
  if(layout)layout.className='member-overview-stack';

  const statusPanel=overview.querySelector('.member-overview-stack>.member-panel:nth-child(2)');
  const progress=statusPanel?.querySelector('.member-progress');
  if(!statusPanel||!progress)return;

  const strip=document.createElement('div');
  strip.className='member-profile-strip';
  strip.innerHTML='<div class="member-profile-avatar" id="memberOverviewAvatar">V</div><div class="member-profile-copy"><p class="member-profile-eyebrow">Welcome back</p><h3 id="memberOverviewWelcome">Welcome back, VMC member.</h3><p id="memberOverviewUsername">Your VMC journey continues here.</p></div>';
  statusPanel.insertBefore(strip,progress);

  const initials=name=>String(name||'V').trim().split(/\\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'V';
  const load=async()=>{
    try{
      if(typeof sb==='undefined')return;
      const {data:{user},error:userError}=await sb.auth.getUser();
      if(userError||!user)return;
      const {data:p,error}=await sb.from('profiles').select('full_name,username,avatar_url').eq('id',user.id).maybeSingle();
      if(error||!p)return;
      const name=p.full_name||p.username||'VMC member';
      const first=String(name).trim().split(/\\s+/)[0]||'member';
      const welcome=document.getElementById('memberOverviewWelcome');
      const username=document.getElementById('memberOverviewUsername');
      const avatar=document.getElementById('memberOverviewAvatar');
      if(welcome)welcome.textContent=`Welcome back, ${name}. It’s great to have you with us again.`;
      if(username)username.textContent=p.username?`@${String(p.username).replace(/^@/,'')}`:'Your VMC journey continues here.';
      if(avatar){
        avatar.textContent=initials(name);
        if(p.avatar_url){
          const image=document.createElement('img');
          image.src=`${p.avatar_url}${String(p.avatar_url).includes('?')?'&':'?'}v=${Date.now()}`;
          image.alt=`${first}'s profile picture`;
          image.onload=()=>{avatar.textContent='';avatar.appendChild(image)};
        }
      }
    }catch(error){console.warn('VMC overview profile section failed',error)}
  };
  load();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
