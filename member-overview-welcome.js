(()=>{'use strict';
const boot=async()=>{
  if(window.__VMC_MEMBER_WELCOME)return; window.__VMC_MEMBER_WELCOME=true;
  if(typeof sb==='undefined')return;
  const overview=document.getElementById('vmcProfileView'); if(!overview)return;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const initials=n=>String(n||'V').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'V';
  const first=n=>String(n||'Member').trim().split(/\s+/)[0]||'Member';
  const render=async()=>{
    const r=await sb.auth.getUser(); const u=r.data?.user; if(!u)return;
    const q=await sb.from('profiles').select('*').eq('id',u.id).maybeSingle(); if(q.error||!q.data)return;
    const p=q.data, name=p.full_name||p.username||'VMC Member';
    let previous=false;
    const m=await sb.from('member_memberships').select('id',{count:'exact',head:true}).eq('member_id',u.id);
    if(!m.error&&Number(m.count||0)>1)previous=true;
    const created=p.created_at?new Date(p.created_at):null, start=p.membership_start_date?new Date(p.membership_start_date+'T00:00:00'):null;
    if(!previous&&created&&!isNaN(created)&&start&&!isNaN(start))previous=(Date.now()-created.getTime()>30*86400000);
    const welcome=previous
      ?`Welcome back, ${first(name)}! It’s great to have you with us again. Keep pushing, keep growing, and let’s make your next VMC chapter your strongest yet.`
      :`Welcome to VMC Xtreme, ${first(name)}! We’re excited to have you as part of the VMC family. Your journey starts here — stay consistent, stay strong, and enjoy every step.`;
    const avatar=p.avatar_url?`<img src="${esc(p.avatar_url)}?v=${Date.now()}" alt="${esc(name)} profile picture">`:`<span>${esc(initials(name))}</span>`;
    let hero=overview.querySelector('.member-welcome');
    const anchor=overview.querySelector('.member-progress')||overview.querySelector('.member-active-card')||overview.querySelector('.member-overview-grid')||overview.firstChild;
    if(!hero){hero=document.createElement('div');hero.className='member-welcome';overview.insertBefore(hero,anchor)}
    else if(anchor&&hero.nextElementSibling!==anchor)overview.insertBefore(hero,anchor);
    hero.innerHTML=`<div class="member-welcome-avatar">${avatar}</div><div class="member-welcome-copy"><div class="member-welcome-kicker">${previous?'WELCOME BACK':'WELCOME TO VMC XTREME'}</div><h3>${esc(welcome)}</h3><div class="member-welcome-user">@${esc(String(p.username||'').replace(/^@/,''))}</div></div>`;
  };
  try{await render()}catch(e){console.warn('Member welcome could not render',e)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();