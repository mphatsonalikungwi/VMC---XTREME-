/* VMC Management Reports & Analytics — mobile-first, real dashboard data */
(()=>{
  const boot=()=>{
    if(typeof state==='undefined'||!state.caller||!state.data){setTimeout(boot,250);return}
    const nav=document.querySelector('.nav'),content=document.querySelector('.content');
    if(!nav||!content){setTimeout(boot,250);return}

    let navBtn=document.getElementById('vmcReportsNav');
    if(!navBtn){
      navBtn=document.createElement('button');
      navBtn.id='vmcReportsNav';
      navBtn.dataset.sec='reports';
      navBtn.textContent='Reports';
      nav.appendChild(navBtn);
    }

    let section=document.getElementById('reports');
    if(!section){
      section=document.createElement('section');
      section.className='section';
      section.id='reports';
      section.innerHTML=`
        <div class="report-hero">
          <div class="report-kicker">VMC Business Intelligence</div>
          <h2>Reports &amp; Analytics</h2>
          <p>Understand membership activity, verified income and customer movement from the records already in VMC.</p>
          <div class="report-tools">
            <label>From<input id="reportFrom" type="date"></label>
            <label>To<input id="reportTo" type="date"></label>
            <button class="btn red" id="reportApply">Run Report</button>
            <button class="btn dark" id="reportExport">Export CSV</button>
          </div>
          <div class="report-presets">
            <button class="report-preset" data-report-preset="month">This month</button>
            <button class="report-preset" data-report-preset="last">Last month</button>
            <button class="report-preset" data-report-preset="30">Last 30 days</button>
            <button class="report-preset" data-report-preset="year">This year</button>
            <button class="report-preset" data-report-preset="all">All time</button>
          </div>
        </div>
        <div class="report-cards">
          <div class="report-card gold"><small>Verified revenue</small><strong id="rRevenue">K0</strong><span>Selected period</span></div>
          <div class="report-card"><small>Paid transactions</small><strong id="rTransactions">0</strong><span>Verified memberships</span></div>
          <div class="report-card green"><small>New members</small><strong id="rNew">0</strong><span>First registrations</span></div>
          <div class="report-card red"><small>Renewals</small><strong id="rRenewals">0</strong><span>Returning members</span></div>
        </div>
        <div class="report-grid">
          <div>
            <div class="report-panel"><div class="report-head"><b>Membership plans</b><span id="rPlanTotal">0 transactions</span></div><div class="report-body" id="rPlans"></div></div>
            <div class="report-panel"><div class="report-head"><b>Payment methods</b><span>Verified only</span></div><div class="report-body" id="rChannels"></div></div>
          </div>
          <div>
            <div class="report-panel"><div class="report-head"><b>Customer health</b><span id="rHealthStatus" class="report-status ok">Healthy</span></div><div class="report-list" id="rHealth"></div></div>
            <div class="report-panel"><div class="report-head"><b>Period summary</b></div><div class="report-list" id="rSummary"></div><div class="report-foot">Only records marked <b>Payment Verified</b> are included in revenue.</div></div>
          </div>
        </div>`;
      content.appendChild(section);
    }

    if(!document.getElementById('vmc-reports-style')){
      const style=document.createElement('style');
      style.id='vmc-reports-style';
      style.textContent=`
      #vmcReportsNav{position:relative}
      #vmcReportsNav:after{content:'▥';position:absolute;right:9px;color:#d4a017;font-size:.72rem}
      .report-hero{position:relative;overflow:hidden;border:1px solid #3d3420;background:linear-gradient(135deg,#17150e,#111317 58%,#171014);border-radius:14px;padding:18px;margin-bottom:12px}
      .report-hero:after{content:'▥';position:absolute;right:16px;top:-18px;font-size:92px;color:rgba(212,160,23,.06);pointer-events:none}
      .report-kicker{font-size:.57rem;text-transform:uppercase;letter-spacing:.15em;color:#d4a017;font-weight:950}.report-hero h2{margin:6px 0 4px;font-size:1.55rem;letter-spacing:-.04em}.report-hero p{margin:0;color:#9ca1a9;font-size:.74rem;max-width:650px}
      .report-tools{display:flex;gap:7px;flex-wrap:wrap;align-items:end;margin-top:16px}.report-tools label{display:grid;gap:4px;color:#aeb2b9;font-size:.55rem;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.report-tools input{background:#0b0c0f;color:#fff;border:1px solid #343840;border-radius:7px;padding:8px;outline:0}.report-tools input:focus{border-color:#d4a017}.report-presets{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.report-preset{border:1px solid #343840;background:#17191e;color:#aeb2b9;border-radius:7px;padding:6px 9px;font-weight:800;font-size:.59rem}
      .report-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:12px}.report-card{border:1px solid #292d34;background:#111317;border-radius:11px;padding:14px;min-width:0}.report-card.gold{border-color:#5b481c;background:linear-gradient(145deg,#1a160b,#111317)}.report-card.red{border-color:#4b1a22}.report-card.green{border-color:#245036}.report-card small{display:block;color:#858b94;text-transform:uppercase;letter-spacing:.08em;font-size:.54rem;font-weight:900}.report-card strong{display:block;margin-top:8px;font-size:1.38rem;line-height:1.05}.report-card.gold strong{color:#e6bb4b}.report-card.red strong{color:#ff6977}.report-card.green strong{color:#66d990}.report-card span{display:block;margin-top:5px;color:#777d86;font-size:.58rem}
      .report-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.report-panel{border:1px solid #292d34;background:#111317;border-radius:11px;overflow:hidden;margin-bottom:12px}.report-head{padding:10px 12px;border-bottom:1px solid #292d34;display:flex;justify-content:space-between;align-items:center;gap:8px}.report-head b{font-size:.65rem;text-transform:uppercase;letter-spacing:.07em}.report-head span{color:#777d86;font-size:.58rem}.report-body{padding:12px}.report-row{display:grid;grid-template-columns:115px 1fr auto;gap:8px;align-items:center;margin-bottom:10px}.report-row:last-child{margin-bottom:0}.report-row label{font-size:.61rem;color:#aeb2b9}.report-bar{height:9px;background:#1c1f24;border-radius:99px;overflow:hidden}.report-bar i{display:block;height:100%;border-radius:99px;background:#d4a017;min-width:2px}.report-row strong{font-size:.62rem;min-width:48px;text-align:right}.report-list{display:grid;padding:0 12px}.report-list-item{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #24272d}.report-list-item:last-child{border-bottom:0}.report-list-item b{font-size:.67rem}.report-list-item small{display:block;color:#777d86;font-size:.57rem;margin-top:2px}.report-list-item strong{font-size:.68rem}.report-empty{padding:22px;text-align:center;color:#777d86;font-size:.68rem}.report-foot{padding:9px 12px;border-top:1px solid #292d34;color:#777d86;font-size:.57rem}.report-status{display:inline-flex;padding:3px 7px;border-radius:99px;font-size:.54rem;font-weight:900;border:1px solid #33373e}.report-status.ok{color:#8ce5a8;background:#11271a;border-color:#275e38}.report-status.warn{color:#ffd77d;background:#2b2110;border-color:#61491e}
      @media(max-width:800px){.report-cards{grid-template-columns:1fr 1fr}.report-grid{grid-template-columns:1fr}}
      @media(max-width:500px){.report-cards{gap:7px}.report-card{padding:11px}.report-card strong{font-size:1.1rem}.report-hero{padding:15px}.report-row{grid-template-columns:92px 1fr auto}}
      `;
      document.head.appendChild(style);
    }

    const q=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
    const today=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())};
    const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const startMonth=d=>new Date(d.getFullYear(),d.getMonth(),1);
    const endMonth=d=>new Date(d.getFullYear(),d.getMonth()+1,0);
    const dateVal=x=>x?String(x).slice(0,10):'';
    const money=n=>'K'+Number(n||0).toLocaleString('en-MW');
    const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const allMemberships=()=>state.data?.memberships||[];
    let lastReport=null;

    const latest=()=>{const map=new Map();allMemberships().forEach(m=>{if(!map.has(m.member_id)||String(m.created_at)>String(map.get(m.member_id).created_at))map.set(m.member_id,m)});return [...map.values()]};
    const bars=(el,items,total)=>{el.innerHTML=items.length?items.map(x=>`<div class="report-row"><label>${safe(x.label)}</label><div class="report-bar"><i style="width:${Math.max(2,total?x.amount/Math.max(1,total)*100:2)}%"></i></div><strong>${x.count} · ${money(x.amount)}</strong></div>`).join(''):'<div class="report-empty">No verified transactions in this period.</div>'};

    const run=(from,to)=>{
      if(!from||!to)return;
      if(to<from){alert('The end date cannot be before the start date.');return}
      const ms=allMemberships();
      const inRange=ms.filter(x=>{const d=dateVal(x.approved_at||x.created_at||x.start_date);return d>=from&&d<=to});
      const verified=inRange.filter(x=>x.payment_status==='Payment Verified');
      const revenue=verified.reduce((sum,x)=>sum+Number(x.amount||0),0);
      const renewals=verified.filter(x=>String(x.creation_method||'').toLowerCase()==='renewal').length;
      const newMembers=verified.length-renewals;
      const plans={},channels={};
      verified.forEach(x=>{const p=x.membership_tier||'Unspecified';plans[p]??={count:0,amount:0};plans[p].count++;plans[p].amount+=Number(x.amount||0);const c=x.payment_channel||'Unspecified';channels[c]??={count:0,amount:0};channels[c].count++;channels[c].amount+=Number(x.amount||0)});
      const planItems=Object.entries(plans).map(([label,v])=>({label,...v})).sort((a,b)=>b.amount-a.amount);
      const channelItems=Object.entries(channels).map(([label,v])=>({label,...v})).sort((a,b)=>b.amount-a.amount);
      const current=latest();
      const active=current.filter(x=>x.membership_status==='active').length;
      const expired=current.filter(x=>x.membership_status==='expired'||(x.expiry_date&&x.expiry_date<from)).length;
      const expiring=current.filter(x=>x.membership_status==='active'&&x.expiry_date>=from&&x.expiry_date<=to).length;
      const pending=ms.filter(x=>x.payment_status==='Pending Payment Verification'||x.registration_status==='Pending Approval').length;
      q('rRevenue').textContent=money(revenue);q('rTransactions').textContent=verified.length;q('rNew').textContent=newMembers;q('rRenewals').textContent=renewals;q('rPlanTotal').textContent=`${verified.length} transactions`;
      bars(q('rPlans'),planItems,revenue);bars(q('rChannels'),channelItems,revenue);
      q('rHealthStatus').textContent=pending?'Attention':'Healthy';q('rHealthStatus').className='report-status '+(pending?'warn':'ok');
      q('rHealth').innerHTML=`<div class="report-list-item"><div><b>Active memberships</b><small>Current active records</small></div><strong>${active}</strong></div><div class="report-list-item"><div><b>Expiring in period</b><small>Selected dates</small></div><strong>${expiring}</strong></div><div class="report-list-item"><div><b>Expired</b><small>Current membership history</small></div><strong>${expired}</strong></div><div class="report-list-item"><div><b>Pending action</b><small>Payment or approval queue</small></div><strong>${pending}</strong></div>`;
      q('rSummary').innerHTML=`<div class="report-list-item"><div><b>Period</b><small>${new Date(from+'T00:00:00').toLocaleDateString('en-GB')} → ${new Date(to+'T00:00:00').toLocaleDateString('en-GB')}</small></div><strong>${verified.length}</strong></div><div class="report-list-item"><div><b>Verified revenue</b><small>Payment Verified only</small></div><strong>${money(revenue)}</strong></div><div class="report-list-item"><div><b>New registrations</b><small>Verified non-renewals</small></div><strong>${newMembers}</strong></div><div class="report-list-item"><div><b>Renewals</b><small>Verified renewals</small></div><strong>${renewals}</strong></div>`;
      lastReport={from,to,revenue,verified,planItems,channelItems,newMembers,renewals,active,expired,expiring,pending};
    };

    const setDates=(a,b)=>{q('reportFrom').value=a;q('reportTo').value=b;run(a,b)};
    const show=()=>{if(typeof setSection==='function')setSection('reports');else{document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));section.classList.add('active')}run(q('reportFrom').value,q('reportTo').value)};
    if(!navBtn.dataset.reportsBound){navBtn.addEventListener('click',show);navBtn.dataset.reportsBound='1'}
    if(!q('reportApply').dataset.bound){q('reportApply').addEventListener('click',()=>run(q('reportFrom').value,q('reportTo').value));q('reportExport').addEventListener('click',()=>{if(!lastReport)return;const rows=[['VMC Xtreme Reports'],['Period',lastReport.from,lastReport.to],[],['Metric','Value'],['Verified revenue',lastReport.revenue],['Paid transactions',lastReport.verified.length],['New registrations',lastReport.newMembers],['Renewals',lastReport.renewals],['Active memberships',lastReport.active],['Expiring in period',lastReport.expiring],['Expired',lastReport.expired],['Pending action',lastReport.pending],[],['Plan','Transactions','Revenue'],...lastReport.planItems.map(x=>[x.label,x.count,x.amount]),[],['Payment method','Transactions','Revenue'],...lastReport.channelItems.map(x=>[x.label,x.count,x.amount])];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`vmc-report-${lastReport.from}-to-${lastReport.to}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});q('reportApply').dataset.bound='1'}
    if(!q('reportFrom').value){const d=today();setDates(iso(startMonth(d)),iso(d))}else run(q('reportFrom').value,q('reportTo').value);
    document.querySelectorAll('[data-report-preset]').forEach(b=>{if(b.dataset.bound)return;b.addEventListener('click',()=>{const d=today(),k=b.dataset.reportPreset;if(k==='month')setDates(iso(startMonth(d)),iso(d));else if(k==='last'){const x=new Date(d.getFullYear(),d.getMonth()-1,1);setDates(iso(x),iso(endMonth(x)))}else if(k==='30'){const x=new Date(d);x.setDate(x.getDate()-29);setDates(iso(x),iso(d))}else if(k==='year')setDates(`${d.getFullYear()}-01-01`,`${d.getFullYear()}-12-31`);else if(k==='all'){const dates=allMemberships().map(x=>dateVal(x.created_at)).filter(Boolean).sort();setDates(dates[0]||iso(d),iso(d))}});b.dataset.bound='1'});
  };
  boot();
})();