import fs from 'node:fs';

// Cloudflare-only presentation guard. Backend authorization remains authoritative.
const dashboardFile = 'dashboard.html';
let dashboard = fs.readFileSync(dashboardFile, 'utf8');

const marker = 'VMC_CLOUDFLARE_ROLE_GUARD_V3';
if (!dashboard.includes(marker)) {
  const guard = `<style id="${marker}">.vmc-role-hidden{display:none!important}</style><script>
(function(){
  const getState=()=>{try{return (typeof state!=='undefined')?state:null;}catch(e){return null;}};
  const allowed=()=>{const st=getState();return !!(st&&st.caller&&(st.caller.is_admin===true||String(st.caller.account_role||'').toLowerCase()==='owner'));};
  const apply=()=>{
    const ok=allowed();
    const panel=[...document.querySelectorAll('.panel')].find(p=>p.querySelector('.head b')?.textContent?.trim().toLowerCase()==='immediate attention');
    if(panel) panel.classList.toggle('vmc-role-hidden',!ok);
    document.querySelectorAll('.nav button[data-sec="approvals"]').forEach(el=>el.classList.toggle('vmc-role-hidden',!ok));
    document.querySelectorAll('[data-sec-link="approvals"]').forEach(el=>el.classList.toggle('vmc-role-hidden',!ok));
    const st=getState();
    if(!ok && st && st.current==='approvals'){
      try{if(typeof setSection==='function')setSection('overview',false);}catch(e){}
    }
  };
  let tries=0;
  const timer=setInterval(()=>{apply();if(allowed()||tries++>80)clearInterval(timer);},250);
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-sec-link="approvals"],.nav button[data-sec="approvals"]');
    if(t&&!allowed()){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  apply();
})();
</script>`;
  if (!dashboard.includes('</body>')) throw new Error('VMC build patch anchor not found: </body>');
  dashboard=dashboard.replace('</body>',guard+'</body>');
}
fs.writeFileSync(dashboardFile,dashboard);

// Customer-facing language pass. These are presentation-only replacements;
// database fields, API actions, permissions and internal identifiers are untouched.
const languageFiles = ['index.html','app.js','dashboard.html'];
const language = [
  ['Admin Login','Management Login'],
  ['Member Login','My VMC Account'],
  ['Create Member Account','Join VMC'],
  ['VMC Member Onboarding','Welcome to VMC'],
  ['Member Account','My VMC Account'],
  ['VMC Management Account','Management Account'],
  ['Secure Your VMC Account','Keep Your Account Secure'],
  ['Payment status','Payment'],
  ['Payment channel','Payment method'],
  ['Receipt / Reference','Payment reference'],
  ['Pending Payment Verification','Payment being reviewed'],
  ['VMC management will verify payment','We will confirm your payment'],
  ['Your VMC account is connected to the member system.','Your VMC account is ready to use.'],
  ['Registration received.','Welcome to VMC!'],
  ['Your VMC member account has been created. Your membership is now waiting for VMC payment verification.','Welcome to VMC — your account has been created and your payment is being reviewed.'],
  ['Change your password.','Create Your New Password'],
  ['Password changed successfully.','Your password has been updated successfully.'],
  ['This account was created by VMC management with an initial password. Please replace it now.','For your security, please create your own password before continuing.'],
  ['For your protection, VMC requires you to create a new password before continuing.','For your security, please create a new password before continuing.'],
  ['Choose your new membership.','Choose Your Next Membership'],
  ['Your previous membership has expired. You can choose a different service for this renewal.','Welcome back! Choose the membership that suits you best.'],
  ['Previous service','Previous membership'],
  ['New membership','Membership'],
  ['Session','Service type'],
  ['Membership tier','Membership plan'],
  ['Pending Payments','Payments to Review'],
  ['Pending Approvals','Approvals'],
  ['Renewals & Expiry','Memberships'],
  ['Staff Management','Team Management'],
  ['Command Center','VMC Overview'],
  ['VMC operations at a glance.','A quick look at what needs attention.'],
  ['Immediate Attention','Needs Attention'],
  ['Registered Customers','Customers'],
  ['Account','Account'],
  ['Actions','Options'],
  ['Status','Current status'],
  ['Payment verification','Payment review'],
  ['Owner/Admin actions','Owner/Admin only']
];

for (const file of languageFiles) {
  let text=fs.readFileSync(file,'utf8');
  for (const [from,to] of language) text=text.split(from).join(to);
  fs.writeFileSync(file,text);
}

console.log('VMC Cloudflare build completed: role visibility and customer-friendly language applied.');
