(()=>{'use strict';
const installMemberHome=()=>{
  if(document.getElementById('vmcMemberHomeSnapshot'))return;
  const hero=document.querySelector('.hero');
  const layout=document.querySelector('.layout');
  if(!hero||!layout||typeof sb==='undefined')return;
  const style=document.createElement('style');
  style.id='vmcMemberHomeStyle';
  style.textContent=`
    .vmc-home-state{display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:7px 11px;border:1px solid #30343b;border-radius:999px;background:rgba(0,0,0,.20);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#aeb4bd}
    .vmc-home-state::before{content:'';width:7px;height:7px;border-radius:50%;background:#8f96a0}
    .vmc-home-state.active{border-color:#235a35;color:#9aefb1}.vmc-home-state.active::before{background:#62d984}
    .vmc-home-state.inactive,.vmc-home-state.suspended{border-color:#64232d;color:#ffadb5}.vmc-home-state.inactive::before,.vmc-home-state.suspended::before{background:#e31b2d}
    .vmc-home-payment{grid-column:1/-1;background:linear-gradient(145deg,#111419,#0d0f12);border-color:#292e36}
    .vmc-home-payment .vmc-payment-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:14px}
    .vmc-home-payment .vmc-payment-item{background:#17191e;border:1px solid #252a32;border-radius:14px;padding:12px;min-width:0}
    .vmc-home-payment small{display:block;color:#747b86;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:.05em}
    .vmc-home-payment strong{display:block;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.92rem}
    .vmc-home-payment .vmc-payment-meta{margin-top:10px;color:#858c97;font-size:11px}
    .vmc-home-payment .vmc-payment-meta b{color:#c9ced6;font-weight:800}
    @media(max-width:760px){.vmc-home-payment .vmc-payment-grid{grid-template-columns:1fr 1fr}.vmc-home-payment .vmc-payment-meta{line-height:1.7}}
  `;
  document.head.appendChild(style);
  const state=document.createElement('div');
  state.id='vmcMemberHomeSnapshot';
  state.className='vmc-home-state';
  state.textContent='Account status: Checking…';
  hero.appendChild(state);
  const card=document.createElement('section');
  card.className='card vmc-home-payment wide';
  card.innerHTML='<div class="title"><div><h2>Payment</h2><p style="margin:2px 0 0;color:#8f96a0;font-size:12px">Your current payment status and recorded payment details.</p></div><span id="vmcHomePaymentStatus" class="status">Checking…</span></div><div class="vmc-payment-grid"><div class="vmc-payment-item"><small>Amount</small><strong id="vmcHomePaymentAmount">—</strong></div><div class="vmc-payment-item"><small>Method</small><strong id="vmcHomePaymentMethod">—</strong></div><div class="vmc-payment-item"><small>Reference</small><strong id="vmcHomePaymentReference">—</strong></div><div class="vmc-payment-item"><small>Membership</small><strong id="vmcHomePaymentMembership">—</strong></div></div><div class="vmc-payment-meta">Start: <b id="vmcHomePaymentStart">—</b> &nbsp;·&nbsp; Expiry: <b id="vmcHomePaymentExpiry">—</b></div>';
  const membership=layout.querySelector('.card:not(.sub)');
  if(membership)membership.insertAdjacentElement('afterend',card);else layout.prepend(card);
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||'—'};
  const formatAmount=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?'K'+n.toLocaleString('en-MW'):'Not recorded'};
  const formatStatus=value=>{const raw=String(value||'').trim();return raw?raw.replace(/_/g,' '):'Not recorded'};
  const loadSnapshot=async()=>{
    try{
      const {data:{user},error:userError}=await sb.auth.getUser();
      if(userError||!user)return;
      const {data:p,error}=await sb.from('profiles').select('account_status,payment_status,membership_amount,payment_channel,payment_reference,receipt_reference,membership_tier,session_type,membership_start_date,membership_expiry_date').eq('id',user.id).maybeSingle();
      if(error||!p)return;
      const account=formatStatus(p.account_status);
      state.textContent='Account status: '+account;
      state.className='vmc-home-state '+String(p.account_status||'').toLowerCase();
      const paymentStatus=formatStatus(p.payment_status);
      set('vmcHomePaymentStatus',paymentStatus);
      const statusEl=document.getElementById('vmcHomePaymentStatus');
      if(statusEl){statusEl.className='status '+(String(p.payment_status||'').toLowerCase().includes('verified')?'active':'')}
      set('vmcHomePaymentAmount',formatAmount(p.membership_amount));
      set('vmcHomePaymentMethod',p.payment_channel||'Not recorded');
      set('vmcHomePaymentReference',p.payment_reference||p.receipt_reference||'Not provided');
      set('vmcHomePaymentMembership',[p.membership_tier,p.session_type].filter(Boolean).join(' · ')||'Not active');
      set('vmcHomePaymentStart',p.membership_start_date||'Not active');
      set('vmcHomePaymentExpiry',p.membership_expiry_date||'Awaiting approval');
    }catch(error){console.warn('VMC member home snapshot failed',error)}
  };
  loadSnapshot();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMemberHome,{once:true});else installMemberHome();
})();

(()=>{'use strict';
const boot=()=>{
  if(document.getElementById('vmcPaymentsUpgrade'))return;
  const card=document.querySelector('.vmc-home-payment');
  if(!card)return;
  const style=document.createElement('style');style.id='vmcPaymentsUpgrade';style.textContent=`
.vmc-payment-status-panel{margin-top:14px;padding:13px 14px;border:1px solid #292e36;border-radius:15px;background:#0d0f12}.vmc-payment-status-row{display:flex;justify-content:space-between;gap:12px;align-items:center}.vmc-payment-status-label{color:#8f96a0;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.vmc-payment-status-message{margin:6px 0 0;color:#aeb4bd;font-size:11px;line-height:1.55}.vmc-payment-status-message strong{color:#f0f2f5}.vmc-payment-status-panel.verified{border-color:#214d30}.vmc-payment-status-panel.review{border-color:#4b3b1b}.vmc-payment-status-panel.failed{border-color:#5a252d}
@media(max-width:760px){.vmc-payment-status-row{align-items:flex-start;flex-direction:column;gap:6px}}
`;
  document.head.appendChild(style);
  const panel=document.createElement('div');panel.className='vmc-payment-status-panel';panel.innerHTML='<div class="vmc-payment-status-row"><span class="vmc-payment-status-label">Payment record</span><strong id="vmcPaymentRecordState">Checking…</strong></div><p class="vmc-payment-status-message" id="vmcPaymentRecordMessage">Checking your latest payment record.</p>';
  card.appendChild(panel);
  const normalize=v=>String(v||'').trim().toLowerCase().replace(/[_-]+/g,' ');
  const refresh=()=>{
    const state=normalize(document.getElementById('vmcHomePaymentStatus')?.textContent);
    const amount=document.getElementById('vmcHomePaymentAmount')?.textContent?.trim()||'Not recorded';
    const method=document.getElementById('vmcHomePaymentMethod')?.textContent?.trim()||'Not recorded';
    const reference=document.getElementById('vmcHomePaymentReference')?.textContent?.trim()||'Not provided';
    const stateEl=document.getElementById('vmcPaymentRecordState'),message=document.getElementById('vmcPaymentRecordMessage');
    if(!stateEl||!message)return;
    const verified=state.includes('verified'),review=state.includes('pending')||state.includes('review'),failed=state.includes('failed')||state.includes('rejected')||state.includes('declined');
    panel.className='vmc-payment-status-panel '+(verified?'verified':review?'review':failed?'failed':'');
    stateEl.textContent=verified?'Payment confirmed':review?'Payment under review':failed?'Payment needs attention':'Payment record';
    if(verified)message.innerHTML=`<strong>${amount}</strong> received via <strong>${method}</strong>. VMC has confirmed this payment.`;
    else if(review)message.innerHTML=`VMC is reviewing your payment. Keep your <strong>${method}</strong> transaction details${reference!=='Not provided'?` (reference <strong>${reference}</strong>)`:''} available.`;
    else if(failed)message.innerHTML='This payment is not currently confirmed. Check the payment details or contact VMC before submitting another payment.';
    else message.textContent='Your latest payment information will appear here after VMC records it.';
  };
  refresh();
  const observer=new MutationObserver(refresh);card.querySelectorAll('#vmcHomePaymentStatus,#vmcHomePaymentAmount,#vmcHomePaymentMethod,#vmcHomePaymentReference').forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));
  setTimeout(()=>observer.disconnect(),15000);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();