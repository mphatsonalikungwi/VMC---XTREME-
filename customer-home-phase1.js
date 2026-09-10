(()=>{'use strict';
const mount=async()=>{
  if(document.getElementById('vmcPhase1Summary')||!window.vmcMemberClient)return;
  try{
    const {data:{user}}=await window.vmcMemberClient.auth.getUser();
    if(!user)return;
    const {data:p,error}=await window.vmcMemberClient.from('profiles').select('membership_start_date,membership_expiry_date,payment_status,account_status').eq('id',user.id).maybeSingle();
    if(error||!p)return;
    const payment=String(p.payment_status||'').trim().toLowerCase();
    const account=String(p.account_status||'').trim().toLowerCase();
    const expiry=p.membership_expiry_date?new Date(p.membership_expiry_date+'T23:59:59'):null;
    const expired=Boolean(expiry&&expiry<new Date());
    let membershipLabel='Awaiting activation';
    if(account&&account!=='active')membershipLabel='Account needs attention';
    else if(expired)membershipLabel='Expired';
    else if(p.membership_start_date&&p.membership_expiry_date)membershipLabel='Active';
    let paymentLabel='Not yet verified',paymentClass='pending';
    if(/reject|declin|fail/.test(payment)){paymentLabel='Payment needs attention';paymentClass='attention'}
    else if(/verif|approv|paid|complete|success|confirm/.test(payment)){paymentLabel='Payment verified';paymentClass='verified'}
    else if(/pending|review/.test(payment))paymentLabel='Payment being reviewed';
    let next='Complete payment and wait for VMC verification.';
    if(account&&account!=='active')next='Your account needs attention. Use Reactivate Account below.';
    else if(/reject|declin|fail/.test(payment))next='Please check your payment details or contact VMC for assistance.';
    else if(expired)next='Your membership has expired. Renew your membership below.';
    else if(/pending|review/.test(payment))next='Your payment is being reviewed. VMC will confirm your membership shortly.';
    else if(p.membership_start_date&&p.membership_expiry_date)next='You are all set. Keep training consistently.';
    const box=document.createElement('section');
    box.id='vmcPhase1Summary';
    box.className='card wide';
    box.innerHTML=`<div class="title"><h2>Your VMC Status</h2><span class="status ${expired?'expired':membershipLabel==='Active'?'active':''}">${membershipLabel}</span></div><div class="vmc-phase1-grid"><div class="vmc-phase1-stat"><small>Membership Status</small><strong>${membershipLabel}</strong></div><div class="vmc-phase1-stat"><small>Payment Status</small><strong class="${paymentClass}">${paymentLabel}</strong></div><div class="vmc-phase1-stat"><small>Next Action</small><strong>${next}</strong></div></div>`;
    const membershipCard=document.querySelector('.layout > .card:first-child');
    if(membershipCard)membershipCard.insertAdjacentElement('afterend',box);else document.querySelector('.layout')?.prepend(box);
    const style=document.createElement('style');
    style.id='VMC_PHASE1_MEMBER_HOME_STYLE';
    style.textContent='#vmcPhase1Summary{grid-column:1/-1}.vmc-phase1-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.vmc-phase1-stat{background:#17191e;border:1px solid #292d35;border-radius:14px;padding:12px}.vmc-phase1-stat small{display:block;color:#747b86;text-transform:uppercase;font-size:9px;font-weight:900}.vmc-phase1-stat strong{display:block;margin-top:4px;font-size:12px}.vmc-phase1-stat strong.verified{color:#8ee9aa}.vmc-phase1-stat strong.pending{color:#ffdb82}.vmc-phase1-stat strong.attention{color:#ff9ca6}@media(max-width:760px){#vmcPhase1Summary{grid-column:auto}.vmc-phase1-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
  }catch(error){console.warn('VMC Phase 1 member home summary unavailable',error)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,250),{once:true});else setTimeout(mount,250);
})();
