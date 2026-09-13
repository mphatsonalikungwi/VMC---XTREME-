(()=>{'use strict';
const installMyProfile=()=>{
  if(document.getElementById('vmcMyProfileUpgrade'))return;
  const profileCard=document.querySelector('.layout .card .profile')?.closest('.card');
  if(!profileCard||typeof sb==='undefined')return;
  const style=document.createElement('style');
  style.id='vmcMyProfileUpgrade';
  style.textContent=`
    .vmc-profile-label{margin-bottom:8px;color:#ff6977;font-size:10px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}
    .vmc-profile-welcome{margin:0;color:#f0f2f5;font-size:18px;font-weight:950;line-height:1.2}
    .vmc-profile-intro{margin:6px 0 14px;color:#858c97;font-size:11px;line-height:1.55}
    .vmc-profile-anniversary{margin:0 0 15px;padding:13px 14px;border:1px solid #54232c;border-radius:15px;background:linear-gradient(145deg,#211116,#17191e)}
    .vmc-profile-anniversary small{display:block;color:#ff6977;font-size:9px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}
    .vmc-profile-anniversary strong{display:block;margin-top:5px;color:#f4f5f7;font-size:13px;line-height:1.45}
    .vmc-profile-anniversary p{margin:4px 0 0;color:#9da4ae;font-size:10px;line-height:1.5}
    .vmc-profile-section{margin-top:15px;padding-top:15px;border-top:1px solid #292d35}
    .vmc-profile-section-title{margin:0 0 10px;color:#f0f2f5;font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
    .vmc-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .vmc-profile-field{min-width:0;padding:11px 12px;border:1px solid #292d35;border-radius:14px;background:#17191e}
    .vmc-profile-field small{display:block;color:#747b86;font-size:8px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
    .vmc-profile-field strong{display:block;margin-top:4px;color:#f0f2f5;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vmc-profile-field.accent{border-color:#54232c;background:linear-gradient(145deg,#211116,#17191e)}
    .vmc-profile-field.accent strong{color:#ff6977}
    .vmc-profile-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
    .vmc-profile-chip{padding:6px 9px;border:1px solid #292d35;border-radius:999px;background:#111318;color:#8f96a0;font-size:9px;font-weight:850}
    .vmc-profile-chip strong{color:#d9dde3}
    .vmc-profile-journey{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .vmc-profile-journey-item{padding:11px 12px;border:1px solid #292d35;border-radius:14px;background:#17191e}
    .vmc-profile-journey-item small{display:block;color:#747b86;font-size:8px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
    .vmc-profile-journey-item strong{display:block;margin-top:4px;color:#f0f2f5;font-size:11px;line-height:1.35}
    @media(max-width:760px){.vmc-profile-grid,.vmc-profile-journey{grid-template-columns:1fr}.vmc-profile-field strong{font-size:11px}}
  `;
  document.head.appendChild(style);
  const label=document.createElement('div');label.className='vmc-profile-label';label.textContent='WELCOME TO YOUR VMC SPACE';
  profileCard.insertBefore(label,profileCard.firstChild);
  const welcome=document.createElement('h3');welcome.className='vmc-profile-welcome';welcome.id='vmcProfileWelcome';welcome.textContent='Welcome back.';
  profileCard.insertBefore(welcome,profileCard.querySelector('.profile'));
  const intro=document.createElement('p');intro.className='vmc-profile-intro';intro.textContent='Your personal VMC profile — keep your identity, memories and progress connected to your VMC journey.';
  profileCard.insertBefore(intro,profileCard.querySelector('.profile'));
  const anniversary=document.createElement('div');anniversary.className='vmc-profile-anniversary';anniversary.innerHTML='<small id="vmcProfileAnniversaryLabel">YOUR VMC WELCOME</small><strong id="vmcProfileAnniversaryTitle">Welcome to your VMC journey.</strong><p id="vmcProfileAnniversaryText">Your member-since date will be used to celebrate your VMC milestones automatically.</p>';
  profileCard.insertBefore(anniversary,profileCard.querySelector('.profile'));
  const identity=document.createElement('div');identity.className='vmc-profile-section';identity.innerHTML='<h4 class="vmc-profile-section-title">VMC Identity</h4><div class="vmc-profile-grid"><div class="vmc-profile-field accent"><small>VMC Username</small><strong id="vmcProfileUsername">—</strong></div><div class="vmc-profile-field"><small>Full Name</small><strong id="vmcProfileName">—</strong></div><div class="vmc-profile-field"><small>Phone Number</small><strong id="vmcProfilePhone">—</strong></div><div class="vmc-profile-field"><small>Email</small><strong id="vmcProfileEmail">—</strong></div></div><div class="vmc-profile-meta"><span class="vmc-profile-chip">Member since: <strong id="vmcProfileSince">—</strong></span></div>';
  profileCard.appendChild(identity);
  const journey=document.createElement('div');journey.className='vmc-profile-section';journey.innerHTML='<h4 class="vmc-profile-section-title">Your VMC Milestones</h4><div class="vmc-profile-journey"><div class="vmc-profile-journey-item"><small>Joined VMC</small><strong id="vmcProfileJoined">—</strong></div><div class="vmc-profile-journey-item"><small>Account Status</small><strong id="vmcProfileStatus">—</strong></div><div class="vmc-profile-journey-item"><small>Milestone</small><strong id="vmcProfileMilestone">—</strong></div></div>';
  profileCard.appendChild(journey);
  const set=(id,value,fallback='Not provided')=>{const el=document.getElementById(id);if(el)el.textContent=value||fallback};
  const formatDate=value=>{if(!value)return'Not available';const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
  const getAnniversary=(value,name)=>{
    if(!value)return{label:'YOUR VMC WELCOME',title:`Welcome to your VMC journey, ${name}.`,text:'Your member-since date will be used to celebrate your VMC milestones automatically.',milestone:'Starting your journey'};
    const start=new Date(value);if(Number.isNaN(start.getTime()))return{label:'YOUR VMC WELCOME',title:`Welcome to your VMC journey, ${name}.`,text:`Welcome to VMC, ${name}.`,milestone:'VMC member'};
    const now=new Date();let years=now.getFullYear()-start.getFullYear();const anniversaryThisYear=new Date(now.getFullYear(),start.getMonth(),start.getDate());if(now<anniversaryThisYear)years--;
    if(years<1){const startDay=new Date(start.getFullYear(),start.getMonth(),start.getDate());const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());const days=Math.max(0,Math.floor((today-startDay)/86400000));return{label:'YOUR VMC WELCOME',title:`Welcome to your VMC journey, ${name}.`,text:`You joined VMC on ${formatDate(value)}. Your first VMC anniversary will be a special milestone to celebrate.`,milestone:`${days} day${days===1?'':'s'} with VMC`}}
    const anniversaryToday=now.getMonth()===start.getMonth()&&now.getDate()===start.getDate();
    const ordinal=years===1?'1st':years===2?'2nd':years===3?'3rd':`${years}th`;
    if(anniversaryToday)return{label:'🎉 YOUR VMC ANNIVERSARY',title:`Happy ${ordinal} VMC Anniversary, ${name}!`,text:`You've officially been part of the VMC family for ${years} year${years===1?'':'s'}. Here's to another year of getting stronger, healthier and closer to your goals.`,milestone:`${years} year${years===1?'':'s'} with VMC`};
    return{label:'YOUR VMC JOURNEY',title:years===2?'Celebrating 2 years with VMC!':years>=3?'Another year stronger with VMC.':`You've been part of VMC for ${years} year${years===1?'':'s'}.`,text:'Keep showing up, keep improving and keep moving closer to your goals.',milestone:`${years} year${years===1?'':'s'} with VMC`};
  };
  const load=async()=>{
    try{
      const {data:{user},error:userError}=await sb.auth.getUser();if(userError||!user)return;
      const {data:p,error}=await sb.from('profiles').select('full_name,username,phone_number,membership_tier,session_type,created_at,account_status').eq('id',user.id).maybeSingle();if(error||!p)return;
      const name=p.full_name||'VMC Member',first=name.trim().split(/\s+/)[0]||'Member';
      set('vmcProfileWelcome',`Welcome back, ${first}.`,'Welcome back.');set('vmcProfileUsername',p.username||'—','Not assigned');set('vmcProfileName',p.full_name||'—');set('vmcProfilePhone',p.phone_number||'—');set('vmcProfileEmail',user.email||'—');set('vmcProfileSince',formatDate(p.created_at),'Not available');set('vmcProfileJoined',formatDate(p.created_at),'Not available');set('vmcProfileStatus',p.account_status||'Active','Active');
      const a=getAnniversary(p.created_at,first);set('vmcProfileAnniversaryLabel',a.label,'YOUR VMC WELCOME');set('vmcProfileAnniversaryTitle',a.title,'Welcome to your VMC journey.');set('vmcProfileAnniversaryText',a.text,'Keep showing up and keep improving.');set('vmcProfileMilestone',a.milestone,'VMC member');
    }catch(error){console.warn('VMC My Profile upgrade failed',error)}
  };
  load();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMyProfile,{once:true});else installMyProfile();
})();
