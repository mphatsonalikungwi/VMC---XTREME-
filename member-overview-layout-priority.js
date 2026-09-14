(()=>{'use strict';
const boot=()=>{
  if(window.__VMC_MEMBER_OVERVIEW_PRIORITY)return;
  const overview=document.getElementById('vmcProfileView');
  if(!overview)return;
  window.__VMC_MEMBER_OVERVIEW_PRIORITY=true;

  const style=document.createElement('style');
  style.id='VMC_MEMBER_OVERVIEW_PRIORITY_STYLE';
  style.textContent=`
    #vmcProfileView .member-overview-grid{display:block!important;margin-bottom:0}
    #vmcProfileView .member-overview-grid>.member-panel{width:100%!important;margin-bottom:12px!important}
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
  const panels=layout?.querySelectorAll(':scope > .member-panel');
  const statusPanel=panels?.[1];
  const progress=statusPanel?.querySelector('.member-progress');
  if(!layout||!statusPanel||!progress)return;

  const existing=overview.querySelector('.member-profile-strip');
  if(existing)existing.remove();

  const findWelcomeCard=()=>{
    const nodes=[...overview.querySelectorAll('*')].filter(node=>node.children.length===0&&/welcome back/i.test(node.textContent||''));
    for(const node of nodes){
      let current=node;
      for(let i=0;i<7&&current&&current!==overview;i++,current=current.parentElement){
        const text=(current.textContent||'').trim();
        if(current.querySelector('img')&&/@[a-z0-9_]+/i.test(text)&&text.length<600)return current;
      }
    }
    return null;
  };

  const source=findWelcomeCard();
  if(source){
    source.classList.add('member-profile-strip');
    const image=source.querySelector('img');
    if(image){
      image.classList.add('member-profile-avatar-image');
      const avatar=document.createElement('div');
      avatar.className='member-profile-avatar';
      avatar.appendChild(image.cloneNode(true));
      image.replaceWith(avatar);
    }
    const copy=document.createElement('div');
    copy.className='member-profile-copy';
    const children=[...source.children];
    if(children.length>=2){
      const avatar=source.querySelector('.member-profile-avatar');
      const textNodes=children.filter(child=>child!==avatar);
      textNodes.forEach(child=>copy.appendChild(child));
      source.appendChild(copy);
    }
    statusPanel.insertBefore(source,progress);
  }else{
    const strip=document.createElement('div');
    strip.className='member-profile-strip';
    strip.innerHTML='<div class="member-profile-avatar" id="memberOverviewAvatar">V</div><div class="member-profile-copy"><p class="member-profile-eyebrow">Welcome back</p><h3 id="memberOverviewWelcome">Welcome back, VMC member.</h3><p id="memberOverviewUsername">Your VMC journey continues here.</p></div>';
    statusPanel.insertBefore(strip,progress);
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
