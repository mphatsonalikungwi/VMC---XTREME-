import fs from 'node:fs';

const file = 'dashboard.html';
let s = fs.readFileSync(file, 'utf8');

const replacements = [
  [
    '.vmc-role-hidden{display:none!important}',
    '.vmc-role-hidden{display:none!important}.vmc-attention-hidden{display:none!important}'
  ],
  [
    '<div class="panel"><div class="head"><b>Immediate Attention</b><button class="btn dark" data-sec-link="approvals">Open</button>',
    '<div class="panel" id="immediateAttentionPanel"><div class="head"><b>Immediate Attention</b><button class="btn dark" data-sec-link="approvals">Open</button>'
  ],
  [
    "const addAllowed=state.caller?.is_admin||state.caller?.account_role==='owner';$('#addCustomerBtn').style.display=addAllowed?'':'none';$('#addCustomerBtn2').style.display=addAllowed?'':'none';const canApprove=state.caller?.is_admin||state.caller?.account_role==='owner';$('#topAttention').textContent=canApprove?'':''",
    "const addAllowed=state.caller?.is_admin||state.caller?.account_role==='owner';$('#addCustomerBtn').style.display=addAllowed?'':'none';$('#addCustomerBtn2').style.display=addAllowed?'':'none';const canApprove=state.caller?.is_admin||state.caller?.account_role==='owner';$('#topAttention').textContent=canApprove?'':'';$('#immediateAttentionPanel').classList.toggle('vmc-attention-hidden',!canApprove);const approvalNav=document.querySelector('.nav button[data-sec=\"approvals\"]');if(approvalNav)approvalNav.classList.toggle('vmc-role-hidden',!canApprove);if(!canApprove&&state.current==='approvals')setSection('overview',false)"
  ],
  [
    "$$('.nav button').forEach(b=>b.addEventListener('click',()=>setSection(b.dataset.sec)));document.addEventListener('click',e=>{const link=e.target.closest('[data-sec-link]');if(link){setSection(link.dataset.secLink);return}",
    "$$('.nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.sec==='approvals'&&!((state.caller?.is_admin)||(state.caller?.account_role==='owner')))return;if(b.dataset.sec==='staff'&&!((state.caller?.is_admin)||(state.caller?.account_role==='owner')))return;setSection(b.dataset.sec)}));document.addEventListener('click',e=>{const link=e.target.closest('[data-sec-link]');if(link){if(link.dataset.secLink==='approvals'&&!((state.caller?.is_admin)||(state.caller?.account_role==='owner')))return;setSection(link.dataset.secLink);return}"
  ]
];

for (const [from, to] of replacements) {
  if (!s.includes(from)) throw new Error(`VMC build patch anchor not found: ${from.slice(0,80)}`);
  s = s.replace(from, to);
}

fs.writeFileSync(file, s);
console.log('VMC Cloudflare build patch applied: Immediate Attention and approval navigation are Owner/Admin-only.');
