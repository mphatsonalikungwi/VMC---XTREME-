(()=>{'use strict';
const boot=()=>{
  if(!document.getElementById('approvals'))return;
  if(window.__vmcPaymentsUpgrade)return;window.__vmcPaymentsUpgrade=true;
  const style=document.createElement('style');
  style.textContent=`
    #approvals .payments-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 15px;margin-bottom:10px;border:1px solid #3b2026;border-radius:12px;background:linear-gradient(135deg,#171014,#111317)}
    #approvals .payments-kicker{font-size:.55rem;text-transform:uppercase;letter-spacing:.1em;color:#ff8792;font-weight:900}
    #approvals .payments-hero h3{margin:3px 0 2px;font-size:1rem}
    #approvals .payments-hero p{margin:0;color:#8e949c;font-size:.7rem}
    #approvals .payments-count{min-width:68px;height:56px;padding:8px 10px;border:1px solid #5c2730;border-radius:10px;background:#211116;text-align:center;display:flex;flex-direction:column;justify-content:center}
    #approvals .payments-count strong{font-size:1.35rem;line-height:1;color:#ff6977}
    #approvals .payments-count span{font-size:.5rem;text-transform:uppercase;letter-spacing:.05em;color:#aeb2b9;margin-top:4px}
    #approvals .payments-toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
    #approvals .payments-filter{border:1px solid #343840;background:#17191e;color:#aeb2b9;border-radius:8px;padding:7px 10px;font-size:.62rem;font-weight:900}
    #approvals .payments-filter.active{background:#e31b2d;color:#fff;border-color:#e31b2d}
    #approvals .approval-meta{display:block;margin-top:3px;color:#777d86;font-size:.58rem}
    #approvals .approval-ref{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
    #approvals .payments-clear{display:flex;align-items:center;gap:10px;padding:18px 14px;border:1px dashed #2e333a;border-radius:10px;background:#0d0f12;color:#aeb2b9;font-size:.7rem}
    #approvals .payments-clear strong{display:block;color:#f7f7f5;font-size:.8rem;margin-bottom:2px}
    @media(max-width:700px){
      #approvals .payments-hero{grid-template-columns:1fr auto;padding:12px;border-radius:12px}
      #approvals .payments-hero h3{font-size:.92rem}
      #approvals .payments-toolbar{display:grid;grid-template-columns:repeat(3,1fr)}
      #approvals .payments-filter{min-height:38px;padding:8px 5px}
    }
  `;
  document.head.appendChild(style);

  const section=document.getElementById('approvals');
  const title=section.querySelector('.title');
  if(!section.querySelector('.payments-hero')){
    const hero=document.createElement('div');hero.className='payments-hero';
    hero.innerHTML='<div><div class="payments-kicker">Payment control centre</div><h3>Review payments before they become active</h3><p>Verify registrations and renewals from one focused queue. Existing approval actions remain unchanged.</p></div><div class="payments-count"><strong id="paymentsPendingCount">0</strong><span>waiting</span></div>';
    title.insertAdjacentElement('afterend',hero);
  }
  if(!section.querySelector('.payments-toolbar')){
    const toolbar=document.createElement('div');toolbar.className='payments-toolbar';
    toolbar.innerHTML='<button class="payments-filter active" data-payment-filter="all">All</button><button class="payments-filter" data-payment-filter="registration">Registrations</button><button class="payments-filter" data-payment-filter="renewal">Renewals</button>';
    section.querySelector('.payments-hero').insertAdjacentElement('afterend',toolbar);
    toolbar.addEventListener('click',e=>{const b=e.target.closest('.payments-filter');if(!b)return;toolbar.querySelectorAll('.payments-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');applyFilter(b.dataset.paymentFilter)});
  }
  const rows=()=>[...document.querySelectorAll('#approvalRows tr')];
  const isPendingRow=row=>{
    const text=row.textContent.trim().toLowerCase();
    if(!text||/no pending approvals|no pending payments|approval queue is clear/.test(text))return false;
    return !!(row.querySelector('.rowactions')||row.querySelector('button'));
  };
  const pendingRows=()=>rows().filter(isPendingRow);
  const applyFilter=(filter)=>{
    rows().forEach(row=>{
      if(!isPendingRow(row))return;
      const text=row.textContent.toLowerCase();
      const match=filter==='all'||(filter==='registration'&&text.includes('registration'))||(filter==='renewal'&&text.includes('renewal'));
      row.style.display=match?'':'none';
    });
  };
  const refresh=()=>{
    const rs=pendingRows();
    const activeFilter=section.querySelector('.payments-filter.active')?.dataset.paymentFilter||'all';
    const visible=rs.filter(r=>{
      if(activeFilter==='all')return true;
      const text=r.textContent.toLowerCase();
      return activeFilter==='registration'?text.includes('registration'):text.includes('renewal');
    });
    const count=document.getElementById('paymentsPendingCount');if(count)count.textContent=visible.length;
    const wrap=document.querySelector('#approvals .tablewrap');
    if(!wrap)return;
    let clear=wrap.querySelector('.payments-clear');
    const empty=visible.length===0;
    if(empty){
      if(!clear){clear=document.createElement('div');clear.className='payments-clear';wrap.appendChild(clear)}
      clear.innerHTML='<div><strong>No payments waiting for review</strong>The approval queue is clear right now.</div>';
    }else if(clear)clear.remove();
    applyFilter(activeFilter);
  };
  const root=document.getElementById('approvalRows');
  if(root)new MutationObserver(()=>setTimeout(refresh,0)).observe(root,{childList:true,subtree:true});
  setTimeout(refresh,0);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();