(()=>{'use strict';
// Surgical member-portal hierarchy + membership summary fix. No auth or renewal logic is changed.
const fillMembershipSummary=async()=>{
  const card=[...document.querySelectorAll('.layout>.card')].find(el=>el.querySelector(':scope > .title h2')?.textContent.trim()==='Your Membership');
  if(!card||typeof window.supabase==='undefined')return;
  try{
    const client=window.supabase.createClient('https://czdxwlioouuredaliplw.supabase.co','sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI',{auth:{persistSession:true,autoRefreshToken:true}});
    const {data:{user}}=await client.auth.getUser();
    if(!user)return;
    const {data:p,error}=await client.from('profiles').select('membership_tier,session_type,membership_start_date,membership_expiry_date,payment_status').eq('id',user.id).maybeSingle();
    if(error||!p)return;
    const plan=card.querySelector('#plan'),session=card.querySelector('#session'),start=card.querySelector('#start'),expiry=card.querySelector('#expiry'),status=card.querySelector('#status');
    if(plan)plan.textContent=p.membership_tier||'Membership awaiting activation';
    if(session)session.textContent=p.session_type||'—';
    const fmt=v=>{if(!v)return null;const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-MW',{day:'2-digit',month:'short',year:'numeric'})};
    if(start)start.textContent=fmt(p.membership_start_date)||'Not active';
    if(expiry)expiry.textContent=fmt(p.membership_expiry_date)||'Awaiting approval';
    if(status){const expired=p.membership_expiry_date&&new Date(p.membership_expiry_date+'T23:59:59')<new Date(),pending=String(p.payment_status||'').toLowerCase().includes('pending');status.className='status '+(expired?'expired':pending?'':'active');status.textContent=expired?'Membership Expired':pending?'Payment Being Reviewed':'Membership Active';}
  }catch(error){console.warn('VMC membership summary unavailable',error)}
};
const apply=()=>{
  const layout=document.querySelector('.layout');
  if(!layout)return;
  const duplicate=[...layout.children].find(el=>{
    if(!(el instanceof HTMLElement)||el.id==='vmcPhase1Summary'||el.id==='vmcPhase2Membership')return false;
    const heading=el.querySelector(':scope > h2');
    return heading&&heading.textContent.trim()==='Your VMC Journey';
  });
  if(duplicate)duplicate.remove();
  fillMembershipSummary();
};
const style=document.createElement('style');
style.id='VMC_CUSTOMER_PORTAL_HIERARCHY_FIX';
style.textContent='#vmcPhase1Summary{grid-column:auto}.layout>#vmcPhase2Membership{grid-column:1/-1}.layout>.sub{padding-top:16px;padding-bottom:16px}.layout>.sub p{margin:5px 0 10px}.layout>.sub .formgrid{margin-top:8px}@media(max-width:900px){#vmcPhase1Summary{grid-column:1}}';
const boot=()=>{document.head.appendChild(style);apply()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
