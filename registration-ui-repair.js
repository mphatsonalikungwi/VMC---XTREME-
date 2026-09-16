(()=>{'use strict';
const state={result:null,submittedEmail:'',submittedName:''};
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function usernameFallback(name){return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,24)||'member'}
function errorText(value){if(!value)return'';if(typeof value==='string')return value;return value.message||value.error_description||value.error||''}
const nativeFetch=window.fetch.bind(window);
window.fetch=async(...args)=>{
 const response=await nativeFetch(...args);
 try{
  const url=typeof args[0]==='string'?args[0]:args[0]?.url||'';
  if(/\/functions\/v1\/vmc-registration-api(?:[/?]|$)/i.test(url)){
   const clone=response.clone();const data=await clone.json().catch(()=>null);
   if(data)state.result=data;
   if(!response.ok&&data?.error){setTimeout(()=>showRegistrationError(data.error),0)}
  }
 }catch(_){ }
 return response;
};
function showRegistrationError(message){
 const candidates=['#registerError','.form-error.show','.error.show'];
 const el=candidates.map(s=>document.querySelector(s)).find(Boolean);
 if(el){el.textContent=errorText(message);el.classList.add('show');}
}
function addInstructions(){
 const view=document.querySelector('#successView');if(!view||view.hidden)return;
 const success=view.querySelector('.success');if(!success||success.dataset.vmcInstructions==='1')return;
 const result=state.result||{};const profile=result.profile||{};const username=result.username||profile.username||'';
 const name=profile.full_name||state.submittedName||'your name';
 const loginEmail=state.submittedEmail;
 const actualUsername=username||usernameFallback(name);
 const box=document.createElement('div');box.className='vmc-login-instructions';box.innerHTML=`<div class="vmc-login-account"><div class="vmc-login-label">YOUR VMC USERNAME</div><strong>@${esc(actualUsername)}_vmc1</strong></div><div class="vmc-login-copy"><b>How to sign in</b><p>Use your VMC username and the password you created when registering.</p>${loginEmail?`<p>You may also use your registered email address: <strong>${esc(loginEmail)}</strong></p>`:''}<p>Your membership remains pending until VMC verifies your payment.</p></div>`;
 const account=success.querySelector('.account-box');if(account)account.insertAdjacentElement('afterend',box);else success.appendChild(box);
 success.dataset.vmcInstructions='1';
}
function captureForm(){
 const form=document.querySelector('#registerForm');if(!form||form.dataset.vmcRepairBound)return;
 form.dataset.vmcRepairBound='1';form.addEventListener('submit',()=>{
  const fd=new FormData(form);state.submittedEmail=String(fd.get('email')||'').trim();state.submittedName=String(fd.get('full_name')||fd.get('fullName')||'').trim();
 },true);
}
function boot(){captureForm();addInstructions();const target=document.body;new MutationObserver(()=>{captureForm();addInstructions()}).observe(target,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();