(()=>{'use strict';
const boot=()=>{
 const section=document.getElementById('overview');
 if(!section||window.__vmcNativeHome)return;
 window.__vmcNativeHome=true;
 const title=section.querySelector('.title');
 if(title){
  const h=title.querySelector('h2'),p=title.querySelector('p');
  if(h)h.textContent='Management Home';
  if(p)p.textContent='A clean command centre for your VMC operations.';
  title.querySelector('#addCustomerBtn')?.remove();
  title.querySelector('#refreshBtn')?.remove();
 }
 const nav=document.querySelector('.nav [data-sec="overview"]');
 if(nav)nav.textContent='Home';
 const pageTitle=document.getElementById('pageTitle');
 if(pageTitle)pageTitle.textContent='Management Home';
 const cards=section.querySelector('.cards');
 if(cards){
  const keep=['sMembers','sPayments','sExpiring'];
  // Do not remove native dashboard stat nodes: renderOverview() still writes to
  // all of their IDs asynchronously after authentication. Hiding them preserves
  // those DOM targets and prevents null.textContent crashes caused by a race.
  [...cards.children].forEach(card=>{
   const value=card.querySelector('strong');
   if(value&&!keep.includes(value.id))card.classList.add('vmc-home-hidden');
  });
  const labels=[['sMembers','Customers'],['sPayments','Payments waiting'],['sExpiring','Expiring soon']];
  labels.forEach(([id,label])=>{const v=document.getElementById(id);if(v){const span=v.parentElement.querySelector('span');if(span)span.textContent=label}});
  const income=document.createElement('div');income.className='stat';income.innerHTML='<span>VMC Status</span><strong style="font-size:1rem">READY</strong>';cards.appendChild(income);
 }
 const attention=section.querySelector('#attention');
 if(attention){
  const head=attention.closest('.panel')?.querySelector('.head');
  if(head){const b=head.querySelector('b');if(b)b.textContent='Needs Attention';head.querySelector('[data-sec-link="approvals"]')?.remove()}
 }
 const style=document.createElement('style');style.textContent=`.vmc-home-hidden{display:none!important}#overview .title{padding:16px 18px;border:1px solid #292d34;border-radius:14px;background:linear-gradient(135deg,#15171c,#0e1013);margin-bottom:12px}#overview .title h2{text-transform:none;font-size:1.5rem;letter-spacing:-.04em}#overview .title p{font-size:.74rem}#overview .cards{grid-template-columns:repeat(4,minmax(0,1fr));width:100%}#overview .stat{width:100%;height:104px}#overview .panel{margin-top:2px}@media(max-width:700px){#overview .title{padding:14px}#overview .title h2{font-size:1.2rem}#overview .cards{grid-template-columns:repeat(2,minmax(0,1fr))}#overview .stat{height:94px}}`;
 document.head.appendChild(style);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();