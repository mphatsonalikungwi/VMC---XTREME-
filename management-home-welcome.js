(()=>{'use strict';
const start=()=>{
 if(window.__vmcWelcomeHomeInstalled)return;
 const overview=document.getElementById('overview');
 if(!overview)return;
 window.__vmcWelcomeHomeInstalled=true;
 const style=document.createElement('style');
 style.textContent=`
#overview>.title{display:none!important}
#overview>.vmc-overview-hero,#overview>.vmc-command{display:none!important}
.vmc-welcome-home{display:grid;gap:14px}
.vmc-welcome-hero{position:relative;overflow:hidden;padding:28px 26px 25px;border:1px solid #3a2027;border-radius:18px;background:radial-gradient(circle at 92% 8%,rgba(227,27,45,.19),transparent 34%),linear-gradient(135deg,#181116 0%,#111318 57%,#0c0f12 100%);box-shadow:0 16px 42px rgba(0,0,0,.24)}
.vmc-welcome-hero:before{content:'VMC';position:absolute;right:-15px;bottom:-46px;font-size:10rem;font-weight:1000;letter-spacing:-.1em;color:rgba(255,255,255,.022);pointer-events:none}
.vmc-welcome-kicker{position:relative;z-index:1;color:#ff6471;font-size:.62rem;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}
.vmc-welcome-hero h2{position:relative;z-index:1;margin:7px 0 9px;font-size:clamp(1.8rem,4vw,2.7rem);line-height:1.05;letter-spacing:-.055em}
.vmc-welcome-hero p{position:relative;z-index:1;margin:0;max-width:720px;color:#a7abb2;font-size:.84rem;line-height:1.65}
.vmc-welcome-line{position:relative;z-index:1;width:58px;height:3px;margin:18px 0 13px;border-radius:99px;background:#e31b2d}
.vmc-welcome-note{position:relative;z-index:1;color:#d7d9dd;font-size:.72rem}
.vmc-home-badge{display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:4px 8px;border:1px solid #285d38;border-radius:999px;background:#11271a;color:#8ce5a8;font-size:.54rem;vertical-align:middle}
.vmc-home-badge i{width:6px;height:6px;border-radius:50%;background:#48c774}
.vmc-home-stats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;width:100%!important;margin-bottom:0!important}
.vmc-home-stat{width:100%!important;min-width:0!important}
.vmc-home-stat:nth-child(2){border-color:#21482d}.vmc-home-stat:nth-child(2) strong{color:#66d990}
.vmc-home-stat:nth-child(3){border-color:#4b1a22}.vmc-home-stat:nth-child(3) strong{color:#ff6977}
.vmc-home-attention{margin-bottom:0!important}
.vmc-home-attention .head{padding:12px 14px}.vmc-home-attention .attention-item{padding:10px 14px}
#vmcDashboardCustomerForm .vmc-reg-progress span:first-child{font-size:0}
#vmcDashboardCustomerForm .vmc-reg-progress span:first-child:after{content:'1. Account & Payment';font-size:.7rem}
#vmcDashboardCustomerForm .vmc-reg-progress span:nth-child(2){font-size:0}
#vmcDashboardCustomerForm .vmc-reg-progress span:nth-child(2):after{content:'2. Personal Details (Optional)';font-size:.7rem}
@media(max-width:700px){.vmc-welcome-hero{padding:21px 17px}.vmc-welcome-hero h2{font-size:1.8rem}.vmc-welcome-hero p{font-size:.75rem}.vmc-home-stats{grid-template-columns:1fr!important}}
`;
 document.head.appendChild(style);
 const cards=overview.querySelector(':scope>.cards');
 const panel=overview.querySelector(':scope>.panel');
 if(!cards||!panel)return;
 cards.classList.add('vmc-home-stats');
 const keep=['sMembers','sActive','sExpired'];
 cards.querySelectorAll(':scope>.stat').forEach(el=>{
  const id=el.querySelector('strong')?.id;
  if(id&&keep.includes(id)){
   el.classList.add('vmc-home-stat');
   el.style.display='flex';
   const span=el.querySelector('span');
   if(span)span.textContent=id==='sMembers'?'Total Customers Registered':id==='sActive'?'Active Subscriptions':'Expired Subscriptions';
  }else el.style.display='none';
 });
 panel.classList.add('vmc-home-attention');
 let home=overview.querySelector(':scope>.vmc-welcome-home');
 if(!home){
  home=document.createElement('div');
  home.className='vmc-welcome-home';
  overview.insertBefore(home,cards);
 }
 const who=document.getElementById('who')?.textContent?.trim();
 const first=who&&who!=='Loading…'?who.split(/\s+/)[0]:'';
 const greeting=first?`It is great to have you here, ${first}.`:'Welcome to your VMC workspace.';
 home.innerHTML='<div class="vmc-welcome-hero"><div class="vmc-welcome-kicker">VMC Xtreme <span class="vmc-home-badge"><i></i> Dashboard</span></div><h2>'+greeting+'</h2><div class="vmc-welcome-line"></div><p>This is your central VMC workspace — designed to give you a clear view of the business and make everyday management simple, organised and professional.</p><div class="vmc-welcome-note">Use the navigation menu to move between customers, approvals, financial information, reports, team management and your account.</div></div>';
 home.appendChild(cards);
 home.appendChild(panel);
 const polishCustomerForm=()=>{
  const form=document.getElementById('vmcDashboardCustomerForm');
  if(!form)return;
  const replacements=[
   ['username','VMC Username','Username'],
   ['password','Initial Password','Password'],
   ['membership_tier','Membership','Membership Plan'],
   ['session_type','Session Type','Training Option'],
   ['payment_channel','Payment Channel','Payment Method'],
   ['payment_reference','Payment Reference','Payment Reference'],
   ['date_of_birth','Date of Birth','Date of Birth'],
   ['gender','Gender','Gender'],
   ['emergency_contact','Emergency Contact','Emergency Contact'],
   ['email','Email','Email']
  ];
  form.querySelectorAll('.field').forEach(field=>{
   const input=field.querySelector('input,select,textarea');
   if(!input)return;
   const row=replacements.find(x=>x[0]===input.name);
   const label=field.querySelector('label');
   if(row&&label){
    const optional=label.querySelector('.vmc-optional');
    label.textContent=row[2];
    if(optional)label.appendChild(optional);
    if(input.required&&!label.textContent.includes('*'))label.appendChild(document.createTextNode(' *'));
   }
  });
  const note=form.querySelector('.notice');
  if(note)note.textContent='Enter the customer’s details below. Any additional profile information can be completed later.';
 };
 polishCustomerForm();
 const modalBody=document.getElementById('modalBody');
 if(modalBody){
  const obs=new MutationObserver(()=>polishCustomerForm());
  obs.observe(modalBody,{childList:true,subtree:true});
 }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
