(()=>{'use strict';
const installMyProfile=()=>{
  if(document.getElementById('vmcMyProfileUpgrade'))return;
  const profileCard=document.querySelector('.layout .card .profile')?.closest('.card');
  if(!profileCard||typeof sb==='undefined')return;
  const style=document.createElement('style');
  style.id='vmcMyProfileUpgrade';
  style.textContent=`
    .vmc-profile-label{margin-bottom:14px;color:#ff6977;font-size:10px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}
    .vmc-profile-intro{margin:-5px 0 15px;color:#858c97;font-size:11px;line-height:1.55}
    .vmc-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
    .vmc-profile-field{min-width:0;padding:11px 12px;border:1px solid #292d35;border-radius:14px;background:#17191e}
    .vmc-profile-field small{display:block;color:#747b86;font-size:8px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
    .vmc-profile-field strong{display:block;margin-top:4px;color:#f0f2f5;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vmc-profile-field.accent{border-color:#54232c;background:linear-gradient(145deg,#211116,#17191e)}
    .vmc-profile-field.accent strong{color:#ff6977}
    .vmc-profile-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
    .vmc-profile-chip{padding:6px 9px;border:1px solid #292d35;border-radius:999px;background:#111318;color:#aeb4bd;font-size:9px;font-weight:850}
    .vmc-profile-chip strong{color:#f0f2f5}
    @media(max-width:760px){.vmc-profile-grid{grid-template-columns:1fr}.vmc-profile-field strong{font-size:11px}}
  `;
  document.head.appendChild(style);
  const label=document.createElement('div');label.className='vmc-profile-label';label.textContent='MY PROFILE';
  profileCard.insertBefore(label,profileCard.firstChild);
  const intro=document.createElement('p');intro.className='vmc-profile-intro';intro.textContent='Your VMC identity, contact details and membership profile — kept together in one place.';
  profileCard.insertBefore(intro,profileCard.querySelector('.profile'));
  const grid=document.createElement('div');grid.className='vmc-profile-grid';grid.innerHTML=`
    <div class="vmc-profile-field accent"><small>VMC Username</small><strong id="vmcProfileUsername">—</strong></div>
    <div class="vmc-profile-field"><small>Full Name</small><strong id="vmcProfileName">—</strong></div>
    <div class="vmc-profile-field"><small>Phone Number</small><strong id="vmcProfilePhone">—</strong></div>
    <div class="vmc-profile-field"><small>Email</small><strong id="vmcProfileEmail">—</strong></div>`;
  profileCard.appendChild(grid);
  const meta=document.createElement('div');meta.className='vmc-profile-meta';meta.innerHTML='<span class="vmc-profile-chip">Membership: <strong id="vmcProfilePlan">—</strong></span><span class="vmc-profile-chip">Session: <strong id="vmcProfileSession">—</strong></span><span class="vmc-profile-chip">Member since: <strong id="vmcProfileSince">—</strong></span>';
  profileCard.appendChild(meta);
  const set=(id,value,fallback='Not provided')=>{const el=document.getElementById(id);if(el)el.textContent=value||fallback};
  const formatDate=value=>{if(!value)return'Not available';const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
  const load=async()=>{
    try{
      const {data:{user},error:userError}=await sb.auth.getUser();
      if(userError||!user)return;
      const {data:p,error}=await sb.from('profiles').select('full_name,username,phone_number,membership_tier,session_type,created_at').eq('id',user.id).maybeSingle();
      if(error||!p)return;
      set('vmcProfileUsername',p.username||'—','Not assigned');
      set('vmcProfileName',p.full_name||'—');
      set('vmcProfilePhone',p.phone_number||'—');
      set('vmcProfileEmail',user.email||'—');
      set('vmcProfilePlan',p.membership_tier||'Not active');
      set('vmcProfileSession',p.session_type||'Not set');
      set('vmcProfileSince',formatDate(p.created_at),'Not available');
    }catch(error){console.warn('VMC My Profile upgrade failed',error)}
  };
  load();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMyProfile,{once:true});else installMyProfile();
})();
