import fs from 'node:fs';

const file = 'dashboard.html';
let s = fs.readFileSync(file, 'utf8');

// Cloudflare-only presentation guard. Backend authorization remains authoritative.
// Inject a self-contained guard instead of relying on brittle source anchors in dashboard.html.
const marker = 'VMC_CLOUDFLARE_ROLE_GUARD_V3';
if (!s.includes(marker)) {
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
  if (!s.includes('</body>')) throw new Error('VMC build patch anchor not found: </body>');
  s=s.replace('</body>',guard+'</body>');
}

fs.writeFileSync(file,s);
console.log('VMC Cloudflare build patch applied: Immediate Attention and approval navigation are Owner/Admin-only.');
