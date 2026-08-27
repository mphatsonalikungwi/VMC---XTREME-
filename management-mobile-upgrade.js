(()=>{'use strict';
const boot=()=>{
  if(!location.pathname.endsWith('/dashboard.html')&&!location.pathname.endsWith('dashboard.html'))return;
  if(window.__vmcManagementMobileUpgrade)return;window.__vmcManagementMobileUpgrade=true;
  const style=document.createElement('style');
  style.textContent=`
@media(max-width:700px){
  #customers .tablewrap,#approvals .tablewrap,#staff .tablewrap{overflow:visible}
  #customers .table,#approvals .table,#staff .table{display:block;min-width:0;width:100%;border-collapse:separate}
  #customers .table thead,#approvals .table thead,#staff .table thead{display:none}
  #customers .table tbody,#approvals .table tbody,#staff .table tbody{display:grid;gap:9px;padding:9px}
  #customers .table tr,#approvals .table tr,#staff .table tr{display:grid;grid-template-columns:1fr 1fr;background:#0d0f12;border:1px solid #292d34;border-radius:11px;overflow:hidden}
  #customers .table td,#approvals .table td,#staff .table td{display:grid;grid-template-columns:92px minmax(0,1fr);align-items:start;gap:7px;padding:9px 10px;border-bottom:1px solid #24272d;min-width:0;font-size:.66rem}
  #customers .table td:before,#approvals .table td:before,#staff .table td:before{content:attr(data-label);color:#777d86;font-size:.52rem;text-transform:uppercase;letter-spacing:.05em;font-weight:900;padding-top:2px}
  #customers .table td:last-child,#approvals .table td:last-child,#staff .table td:last-child{grid-column:1/-1;display:block;border-bottom:0;padding:10px}
  #customers .table td:last-child:before,#approvals .table td:last-child:before,#staff .table td:last-child:before{display:block;margin-bottom:6px}
  #customers .table .rowactions,#approvals .table .rowactions,#staff .table .rowactions{display:flex;gap:5px;flex-wrap:wrap}
  #customers .table .rowactions .btn,#approvals .table .rowactions .btn,#staff .table .rowactions .btn{flex:1 1 auto;min-height:34px}
  #customers .person{min-width:0}
  #customers .person b,#customers .person small{overflow-wrap:anywhere}
  #customers .badge,#approvals .badge,#staff .badge{width:max-content}
}
`;
  document.head.appendChild(style);
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
