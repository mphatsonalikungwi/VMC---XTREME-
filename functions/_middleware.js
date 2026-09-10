export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);

  if(url.pathname==='/app.js'){
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.includes('javascript')&&!contentType.includes('text/plain'))return response;
    let js=await response.text();
    const oldInvoke="const {data,error}=await supabase.functions.invoke('vmc-registration-api',{body:payload});";
    const newInvoke="const registrationResponse=await fetch('/api/vmc-registration-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await registrationResponse.json();const error=registrationResponse.ok?null:new Error(data?.error||'Registration failed.');";
    js=js.replace(oldInvoke,newInvoke);
    const oldMember="<div><small>Member</small><strong>${esc(profile?.full_name||'VMC Member')}</strong></div>";
    const newMember="<div><small>Member</small><strong>${esc(profile?.full_name||'VMC Member')}</strong></div><div><small>VMC Username</small><strong style=\"display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap\">${esc(profile?.username||'Not available')}<button class=\"btn btn-dark\" type=\"button\" id=\"successCopyUsername\" style=\"padding:6px 10px;font-size:12px\" ${profile?.username?'':'disabled'}>Copy username</button></strong></div>";
    js=js.replace(oldMember,newMember);
    const copyUsername="const copyUsernameButton=$('#successCopyUsername');copyUsernameButton?.addEventListener('click',async()=>{const username=String(profile?.username||'').trim();if(!username)return;try{await navigator.clipboard.writeText(username);copyUsernameButton.textContent='Copied';setTimeout(()=>{copyUsernameButton.textContent='Copy username'},1600)}catch(error){copyUsernameButton.textContent='Copy failed';setTimeout(()=>{copyUsernameButton.textContent='Copy username'},1600)}});";
    if(!js.includes('successCopyUsername')){
      const marker="$('#successLogin')?.addEventListener('click',()=>showLogin('member'));";
      js=js.replace(marker,marker+copyUsername);
    }
    const loginInstructions="<div class=\"login-instructions\" style=\"margin-top:16px;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:12px\"><strong>How to log in</strong><p style=\"margin:8px 0 0\">You can log in using your VMC username, registered phone number, or the email address you provided during registration, together with your password.</p></div>";
    if(!js.includes('login-instructions')){
      const marker='</div></div><div class=\"form-actions\">';
      js=js.replace(marker,'</div></div>'+loginInstructions+'<div class=\"form-actions\">');
    }
    const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
    return new Response(js,{status:response.status,statusText:response.statusText,headers});
  }

  if(url.pathname==='/customer-dashboard.html'){
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.includes('html'))return response;
    let html=await response.text();
    const phase1=`<script id="VMC_PHASE1_MEMBER_HOME">(function(){'use strict';const addPhase1=async()=>{if(document.getElementById('vmcPhase1Summary'))return;try{const client=window.supabase.createClient('https://czdxwlioouuredaliplw.supabase.co','sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI',{auth:{persistSession:true,autoRefreshToken:true}});const {data:{user}}=await client.auth.getUser();if(!user)return;const {data:p}=await client.from('profiles').select('membership_tier,session_type,membership_start_date,membership_expiry_date,payment_status,account_status').eq('id',user.id).maybeSingle();if(!p)return;const card=document.querySelector('.layout > .card:first-child');const details=document.querySelector('.layout > .card:first-child .details');if(!card||!details)return;const payment=String(p.payment_status||'').trim().toLowerCase(),account=String(p.account_status||'').trim().toLowerCase(),expiry=p.membership_expiry_date?new Date(p.membership_expiry_date+'T23:59:59'):null,expired=Boolean(expiry&&expiry<new Date());let paymentLabel='Not yet verified',paymentClass='pending';if(/reject|declin|fail/.test(payment)){paymentLabel='Payment needs attention';paymentClass='attention'}else if(/verif|approv|paid|complete|success|confirm/.test(payment)){paymentLabel='Payment verified';paymentClass='verified'}else if(payment){paymentLabel='Payment being reviewed'}let next='You are all set. Keep training consistently.';if(account&&account!=='active')next='Your account needs attention. Use Reactivate Account below.';else if(/reject|declin|fail/.test(payment))next='Please check your payment details or contact VMC for assistance.';else if(expired)next='Your membership has expired. Renew your membership below.';else if(/pending|review/.test(payment))next='Your payment is being reviewed. VMC will confirm your membership shortly.';else if(!p.membership_start_date||!p.membership_expiry_date)next='Your membership is awaiting activation. Complete payment and wait for VMC verification.';const box=document.createElement('div');box.id='vmcPhase1Summary';box.innerHTML='<div class="vmc-phase1-grid"><div class="vmc-phase1-stat"><small>Membership status</small><strong>'+(expired?'Expired':account&&account!=='active'?'Account needs attention':p.membership_expiry_date?'Active':'Awaiting activation')+'</strong></div><div class="vmc-phase1-stat"><small>Payment status</small><strong class="'+paymentClass+'">'+paymentLabel+'</strong></div><div class="vmc-phase1-stat"><small>Next action</small><strong>'+next+'</strong></div></div>';card.appendChild(box);const style=document.createElement('style');style.textContent='#vmcPhase1Summary{margin-top:12px}.vmc-phase1-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.vmc-phase1-stat{background:#17191e;border:1px solid #292d35;border-radius:14px;padding:12px}.vmc-phase1-stat small{display:block;color:#747b86;text-transform:uppercase;font-size:9px;font-weight:900}.vmc-phase1-stat strong{display:block;margin-top:4px;font-size:12px}.vmc-phase1-stat strong.verified{color:#8ee9aa}.vmc-phase1-stat strong.pending{color:#ffdb82}.vmc-phase1-stat strong.attention{color:#ff9ca6}@media(max-width:760px){.vmc-phase1-grid{grid-template-columns:1fr}}';document.head.appendChild(style)}catch(e){console.warn('VMC Phase 1 member home summary unavailable',e)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(addPhase1,700),{once:true});else setTimeout(addPhase1,700)})();</script>`;
    if(!html.includes('VMC_PHASE1_MEMBER_HOME'))html=html.replace('</body>',phase1+'</body>');
    const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }
  return response;
}
