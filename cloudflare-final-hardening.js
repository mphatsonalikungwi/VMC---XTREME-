(()=>{'use strict';
function killCreateRenewal(){const kill=()=>document.querySelectorAll('button,a').forEach(el=>{if(/create renewal|new renewal/i.test((el.textContent||'').trim()))el.remove()});kill();document.addEventListener('click',e=>{const el=e.target.closest('button,a');if(el&&/create renewal|new renewal/i.test(el.textContent||'')){e.preventDefault();e.stopImmediatePropagation()}},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',killCreateRenewal,{once:true});else killCreateRenewal();
})();
