(()=>{'use strict';
const boot=()=>{
  /* Cloudflare serves dashboard.html through the /dashboard route, so pathname-only
     detection can silently prevent this enhancement from ever running. Detect the
     actual management DOM instead. */
  if(!document.getElementById('overview')&&!document.getElementById('customers'))return;
  if(window.__vmcManagementMobileUpgrade)return;window.__vmcManagementMobileUpgrade=true;
  const style=document.createElement('style');
  style.textContent=`
/* VMC management visual layer — intentionally scoped to the management dashboard. */
.management-upgrade-applied{}
@media(max-width:700px){
  .top{height:68px;padding:0 10px;background:linear-gradient(180deg,#0d0f12 0%,#090a0c 100%)}
  .top-left{gap:6px;width:100%}
  .top h1{font-size:.78rem;letter-spacing:.045em}
  .top small{font-size:.62rem;display:block;margin-top:2px}
  .back{padding:7px 8px;white-space:nowrap}
  .content{width:calc(100% - 14px);padding:14px 0 34px}
  .title{margin-bottom:10px}
  .title h2{font-size:1.3rem}
  .title p{font-size:.73rem;max-width:300px}
  .title .actions{margin-top:9px}
  .title .actions .btn{min-height:40px;padding:9px 12px}

  /* Overview: turn the KPI wall into deliberate mobile cards with stronger hierarchy. */
  #overview .cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
  #overview .stat{width:100%;height:104px;padding:12px;border-radius:12px;background:linear-gradient(145deg,#15171b,#101216);box-shadow:0 2px 10px rgba(0,0,0,.18)}
  #overview .stat span{font-size:.54rem;line-height:1.35}
  #overview .stat strong{font-size:1.42rem;margin-top:9px}
  #overview .stat.redbox{background:linear-gradient(145deg,#191116,#111216);border-color:#64222d}
  #overview .stat.greenbox{background:linear-gradient(145deg,#101914,#111216);border-color:#244b32}
  #overview .stat.amberbox{background:linear-gradient(145deg,#19160f,#111216);border-color:#58451d}
  #overview .panel{border-radius:12px}
  #overview .panel .head{padding:11px 12px}
  #overview .attention-item{padding:12px}
  #overview .attention-item b{font-size:.72rem}
  #overview .attention-item small{font-size:.65rem;margin-top:2px}

  /* Tables become real record cards rather than shrunken desktop tables. */
  #customers .tablewrap,#approvals .tablewrap,#staff .tablewrap{overflow:visible}
  #customers .table,#approvals .table,#staff .table{display:block;min-width:0;width:100%;border-collapse:separate}
  #customers .table thead,#approvals .table thead,#staff .table thead{display:none}
  #customers .table tbody,#approvals .table tbody,#staff .table tbody{display:grid;gap:9px;padding:8px}
  #customers .table tr,#approvals .table tr,#staff .table tr{display:grid;grid-template-columns:1fr 1fr;background:#0d0f12;border:1px solid #292d34;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.16)}
  #customers .table td,#approvals .table td,#staff .table td{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:start;gap:7px;padding:9px 10px;border-bottom:1px solid #24272d;min-width:0;font-size:.66rem}
  #customers .table td:before,#approvals .table td:before,#staff .table td:before{content:attr(data-label);color:#777d86;font-size:.51rem;text-transform:uppercase;letter-spacing:.05em;font-weight:900;padding-top:2px}
  #customers .table td:last-child,#approvals .table td:last-child,#staff .table td:last-child{grid-column:1/-1;display:block;border-bottom:0;padding:10px}
  #customers .table td:last-child:before,#approvals .table td:last-child:before,#staff .table td:last-child:before{display:block;margin-bottom:6px}
  #customers .table .rowactions,#approvals .table .rowactions,#staff .table .rowactions{display:flex;gap:5px;flex-wrap:wrap}
  #customers .table .rowactions .btn,#approvals .table .rowactions .btn,#staff .table .rowactions .btn{flex:1 1 auto;min-height:36px}
  #customers .person{min-width:0}
  #customers .person b,#customers .person small{overflow-wrap:anywhere}
  #customers .badge,#approvals .badge,#staff .badge{width:max-content}
}
@media(min-width:701px){
  #overview .stat{transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
  #overview .stat:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.18)}
}
`;
  document.head.appendChild(style);
  document.documentElement.classList.add('management-upgrade-applied');

  const labelTables=()=>{
    document.querySelectorAll('#customers .table,#approvals .table,#staff .table').forEach(table=>{
      const labels=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row=>row.querySelectorAll('td').forEach((td,i)=>td.setAttribute('data-label',labels[i]||'Details')));
    });
  };
  labelTables();
  const root=document.querySelector('.content');
  if(root)new MutationObserver(labelTables).observe(root,{childList:true,subtree:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();