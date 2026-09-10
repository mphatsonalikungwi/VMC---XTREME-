(()=>{'use strict';
// Phase 3: member-facing payment status and history. Read-only; uses existing member_memberships records.
const mount=async()=>{
  if(document.getElementById('vmcPhase3Payments')||!window.supabase)return;
  try{
    const client=window.supabase.createClient('https://czdxwlioouuredaliplw.supabase.co','sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI',{auth:{persistSession:true,autoRefreshToken:true}});
    const {data:{user}}=await client.auth.getUser();
    if(!user)return;
    const {data:rows,error}=await client.from('member_memberships').select('membership_tier,session_type,amount,payment_channel,receipt_reference,payment_status,start_date,expiry_date,created_at').eq('member_id',user.id).order('created_at',{ascending:false}).limit(10);
    if(error)throw error;
    const payments=Array.isArray(rows)?rows:[];
    const money=v=>Number.isFinite(Number(v))?'K'+Number(v).toLocaleString('en-MW'):'—';
    const date=v=>{if(!v)return '—';const d=new Date(v.includes('T')?v:v+'T00:00:00');return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-MW',{day:'2-digit',month:'short',year:'numeric'})};
    const clean=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const status=s=>{const x=String(s||'Pending Payment Verification');if(/verified/i.test(x))return ['verified','Payment Verified'];if(/reject/i.test(x))return ['rejected','Payment Rejected'];return ['pending','Payment Being Reviewed']};
    const latest=payments[0];
    const [latestClass,latestText]=status(latest?.payment_status);
    const history=payments.length?payments.map(p=>{const [cls,text]=status(p.payment_status);return `<div class="vmc-phase3-payment-row"><div><strong>${clean(p.membership_tier||'Membership')} · ${clean(p.session_type||'')}</strong><small>${date(p.created_at)}${p.start_date?' · '+date(p.start_date):''}</small></div><div class="vmc-phase3-payment-right"><b>${money(p.amount)}</b><small>${clean(p.payment_channel||'—')} · <span class="${cls}">${text}</span></small>${p.receipt_reference?`<small>Ref: ${clean(p.receipt_reference)}</small>`:''}</div></div>`}).join(''):'<div class="vmc-phase3-empty">No payment records yet.</div>';
    const box=document.createElement('section');box.id='vmcPhase3Payments';box.className='card wide';
    box.innerHTML=`<div class="title"><div><h2>Payments</h2><p class="vmc-phase3-sub">View your payment status, payment details and history.</p></div><span class="status ${latestClass}">${latestText}</span></div><div class="vmc-phase3-current"><div><small>Latest payment</small><strong>${money(latest?.amount)}</strong></div><div><small>Payment method</small><strong>${clean(latest?.payment_channel||'—')}</strong></div><div><small>Payment reference</small><strong>${clean(latest?.receipt_reference||'Not provided')}</strong></div></div><div class="vmc-phase3-history"><h3>Payment History</h3>${history}</div></section>`;
    const membership=document.getElementById('vmcPhase2Membership');
    if(membership)membership.insertAdjacentElement('afterend',box);else document.querySelector('.layout')?.prepend(box);
    const style=document.createElement('style');style.id='VMC_PHASE3_PAYMENT_STYLE';style.textContent='#vmcPhase3Payments{grid-column:1/-1}.vmc-phase3-sub{margin:2px 0 0;color:#8f96a0;font-size:12px}.vmc-phase3-current{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.vmc-phase3-current>div{background:#17191e;border:1px solid #292d35;border-radius:14px;padding:12px}.vmc-phase3-current small{display:block;color:#747b86;text-transform:uppercase;font-size:9px;font-weight:900}.vmc-phase3-current strong{display:block;margin-top:4px;font-size:12px}.vmc-phase3-history{margin-top:16px}.vmc-phase3-history h3{font-size:.9rem;margin:0 0 8px}.vmc-phase3-payment-row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #292d35}.vmc-phase3-payment-row strong,.vmc-phase3-payment-row b{font-size:12px}.vmc-phase3-payment-row small{display:block;color:#8f96a0;font-size:10px;margin-top:2px}.vmc-phase3-payment-right{text-align:right}.vmc-phase3-payment-row .verified{color:#8ee9aa}.vmc-phase3-payment-row .rejected{color:#ff9ca6}.vmc-phase3-payment-row .pending{color:#ffdb82}.vmc-phase3-empty{color:#8f96a0;font-size:12px;padding:10px 0}@media(max-width:760px){.vmc-phase3-current{grid-template-columns:1fr 1fr}}@media(max-width:480px){.vmc-phase3-current{grid-template-columns:1fr}.vmc-phase3-payment-row{flex-direction:column}.vmc-phase3-payment-right{text-align:left}}';document.head.appendChild(style);
  }catch(error){console.warn('VMC Phase 3 payments unavailable',error)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,450),{once:true});else setTimeout(mount,450);
})();
