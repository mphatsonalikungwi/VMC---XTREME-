(()=>{'use strict';
/* Step 3: Payments — additive presentation upgrade only. Existing payment logic remains authoritative. */
const boot=()=>{
  if(document.getElementById('vmcPaymentsUpgrade'))return;
  const card=document.querySelector('.vmc-home-payment');
  if(!card)return;
  const style=document.createElement('style');style.id='vmcPaymentsUpgrade';style.textContent=`
.vmc-payment-status-panel{margin-top:14px;padding:13px 14px;border:1px solid #292e36;border-radius:15px;background:#0d0f12}.vmc-payment-status-row{display:flex;justify-content:space-between;gap:12px;align-items:center}.vmc-payment-status-label{color:#8f96a0;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.vmc-payment-status-message{margin:6px 0 0;color:#aeb4bd;font-size:11px;line-height:1.55}.vmc-payment-status-message strong{color:#f0f2f5}.vmc-payment-reference-missing{border-color:#4b3b1b}.vmc-payment-status-panel.verified{border-color:#214d30}.vmc-payment-status-panel.review{border-color:#4b3b1b}.vmc-payment-status-panel.failed{border-color:#5a252d}
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
    if(reference==='Not provided'&&!verified)panel.classList.add('vmc-payment-reference-missing');
  };
  refresh();
  const observer=new MutationObserver(refresh);card.querySelectorAll('#vmcHomePaymentStatus,#vmcHomePaymentAmount,#vmcHomePaymentMethod,#vmcHomePaymentReference').forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));
  setTimeout(()=>observer.disconnect(),15000);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
