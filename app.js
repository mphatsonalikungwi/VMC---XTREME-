/* VMC XTREME FITNESS — browser application core
 * Public browser configuration only. NEVER put a Supabase secret/service-role key here.
 * If you move the app to another Supabase project, replace ONLY these two values.
 */
window.supabaseUrl = 'https://czdxwlioouuredaliplw.supabase.co';
window.supabaseKey = 'sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI';

(() => {
  'use strict';
  if (!window.supabaseUrl || !window.supabaseKey) return;
  const { createClient } = window.supabase;
  const supabase = createClient(window.supabaseUrl, window.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  window.vmcSupabase = supabase;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const state = { selectedPlan:null, lastProfile:null };
  const modalWrap=$('#modalWrap'), modalTitle=$('#modalTitle'), loginView=$('#loginView'), registerView=$('#registerView'), successView=$('#successView'), loginError=$('#loginError'), registerError=$('#registerError'), toast=$('#toast'), nav=$('#nav');

  function toastMessage(message){ if(!toast)return; toast.textContent=message; toast.classList.add('show'); clearTimeout(toastMessage.timer); toastMessage.timer=setTimeout(()=>toast.classList.remove('show'),3800); }
  function setError(el,message){ if(!el)return; el.textContent=message||''; el.classList.toggle('show',!!message); }
  function escapeHtml(v){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function injectPasswordToggles(){
    if(document.getElementById('vmcPasswordToggleStyles'))return;
    const style=document.createElement('style'); style.id='vmcPasswordToggleStyles'; style.textContent='.vmc-password-wrap{position:relative}.vmc-password-wrap input{padding-right:48px!important}.vmc-password-toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#a7abb2;width:34px;height:34px;border-radius:9px;font-size:1rem}.vmc-password-toggle:hover{background:#1a1c21;color:#fff}'; document.head.appendChild(style);
    $$('input[type="password"]').forEach(input=>{
      if(input.closest('.vmc-password-wrap'))return;
      const wrap=document.createElement('div'); wrap.className='vmc-password-wrap'; input.parentNode.insertBefore(wrap,input); wrap.appendChild(input);
      const button=document.createElement('button'); button.type='button'; button.className='vmc-password-toggle'; button.setAttribute('aria-label','Show password'); button.textContent='◉';
      button.addEventListener('click',()=>{const showing=input.type==='text'; input.type=showing?'password':'text'; button.setAttribute('aria-label',showing?'Show password':'Hide password'); button.textContent=showing?'◉':'◌';}); wrap.appendChild(button);
    });
  }

  function openModal(view='login'){ modalWrap.classList.add('open'); modalWrap.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); view==='register'?showRegister():showLogin(); setTimeout(()=> (view==='register'?$('#fullName'):$('#loginEmail'))?.focus(),40); }
  function closeModal(){ modalWrap.classList.remove('open'); modalWrap.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }
  function showLogin(){ modalTitle.textContent='Member Login'; loginView.hidden=false; registerView.hidden=true; successView.hidden=true; setError(loginError,''); injectPasswordToggles(); }
  function showRegister(plan=null){ modalTitle.textContent='Create Member Account'; loginView.hidden=true; registerView.hidden=false; successView.hidden=true; setError(registerError,''); if(plan)applyPlan(plan); injectPasswordToggles(); }
  function applyPlan(plan){ const [tier,session,price]=plan.split('|'); state.selectedPlan={tier,session,price:Number(price)}; $('#tier').value=tier; $('#session').value=session; $('#selectedPlanText').textContent=`${tier} · ${session} Session · K ${Number(price).toLocaleString('en-MW')}`; }
  function formObject(form){ return Object.fromEntries(new FormData(form).entries()); }
  function validateRegistration(d){
    if(!d.full_name||d.full_name.trim().length<2)return'Please enter your full name.';
    if(!d.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))return'Please enter a valid email address.';
    if(!d.password||d.password.length<8)return'Password must be at least 8 characters.';
    if(!d.phone_number||d.phone_number.trim().length<7)return'Please enter a valid phone number.';
    if(!d.membership_tier)return'Please select a membership plan.';
    if(!d.session_type)return'Please select Single or Double Session.';
    if(!d.payment_channel)return'Please select a payment channel.';
    if(!$('#rulesCheck').checked)return'You must agree to all 15 gym rules before creating an account.';
    return'';
  }

  function renderSuccess(profile,email,needsConfirmation){
    state.lastProfile=profile||{}; loginView.hidden=true; registerView.hidden=true; successView.hidden=false; modalTitle.textContent='VMC Member Onboarding';
    const p=profile||{}; const text=needsConfirmation?'Your member record is created. Confirm your email from Supabase, then use Member Login.':'Your registration is stored securely and is waiting for VMC payment verification.';
    successView.innerHTML=`<div class="success"><div class="success-icon">✓</div><h2>Registration received.</h2><p>${escapeHtml(text)}</p><div class="status-box"><span class="status-label">Payment status</span><span class="status-value">${escapeHtml(p.payment_status||'Pending Payment Verification')}</span></div><div class="account-box"><div class="account-grid"><div><small>Member</small><strong>${escapeHtml(p.full_name||'VMC Member')}</strong></div><div><small>Email</small><strong>${escapeHtml(email||'')}</strong></div><div><small>Membership</small><strong>${escapeHtml(p.membership_tier||state.selectedPlan?.tier||'—')}</strong></div><div><small>Session</small><strong>${escapeHtml(p.session_type||state.selectedPlan?.session||'—')}</strong></div><div><small>Payment channel</small><strong>${escapeHtml(p.payment_channel||'—')}</strong></div><div><small>Reference</small><strong>${escapeHtml(p.receipt_reference||'Not provided')}</strong></div></div></div><div class="form-actions"><button class="btn btn-red" type="button" id="successLogin">Member Login</button><button class="btn btn-dark" type="button" id="successClose">Close</button></div></div>`;
    $('#successLogin')?.addEventListener('click',showLogin); $('#successClose')?.addEventListener('click',closeModal);
  }

  function renderAccount(profile,email){
    state.lastProfile=profile; loginView.hidden=true; registerView.hidden=true; successView.hidden=false; modalTitle.textContent=profile.is_admin?'VMC Administrator':'Member Account';
    const admin=profile.is_admin?'<div class="admin-panel"><h3>Administrator</h3><p class="form-note">Your administrator dashboard contains customer approvals, payments, renewals, staff management and account controls.</p><div class="form-actions"><a class="btn btn-red" href="dashboard.html">Open Admin Dashboard</a></div></div>':'';
    successView.innerHTML=`<div class="success"><div class="success-icon">✓</div><h2>Welcome back.</h2><p>Your VMC account is connected to the secure member system.</p><div class="status-box"><span class="status-label">Payment status</span><span class="status-value">${escapeHtml(profile.payment_status||'Pending Payment Verification')}</span></div><div class="account-box"><div class="account-grid"><div><small>Member</small><strong>${escapeHtml(profile.full_name||'VMC Member')}</strong></div><div><small>Email</small><strong>${escapeHtml(email||'')}</strong></div><div><small>Membership</small><strong>${escapeHtml(profile.membership_tier||'—')}</strong></div><div><small>Session</small><strong>${escapeHtml(profile.session_type||'—')}</strong></div><div><small>Start</small><strong>${escapeHtml(profile.membership_start_date||'Not active')}</strong></div><div><small>Expires</small><strong>${escapeHtml(profile.membership_expiry_date||'Awaiting approval')}</strong></div></div></div>${admin}<div class="form-actions"><button class="btn btn-dark" type="button" id="logoutBtn">Sign Out</button><button class="btn btn-red" type="button" id="accountClose">Close</button></div></div>`;
    $('#logoutBtn')?.addEventListener('click',signOut); $('#accountClose')?.addEventListener('click',closeModal);
  }

  async function getCurrentProfile(){ const {data:{user},error:userError}=await supabase.auth.getUser(); if(userError||!user)return{user:null,profile:null}; const {data:profile,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(); if(error)throw error; return{user,profile}; }

  async function registerMember(event){
    event.preventDefault(); setError(registerError,''); const submit=$('#registerSubmit'), data=formObject(event.currentTarget), invalid=validateRegistration(data); if(invalid){setError(registerError,invalid);return;}
    submit.disabled=true; submit.textContent='Creating account…';
    try{
      const price=state.selectedPlan?.price||0;
      const {data:authData,error}=await supabase.auth.signUp({email:data.email.trim().toLowerCase(),password:data.password,options:{emailRedirectTo:window.location.origin,data:{full_name:data.full_name.trim(),date_of_birth:data.date_of_birth||'',gender:data.gender||'',phone_number:data.phone_number.trim(),emergency_contact:data.emergency_contact.trim(),membership_tier:data.membership_tier,session_type:data.session_type,membership_amount:String(price),payment_channel:data.payment_channel,receipt_reference:data.receipt_reference.trim(),account_role:'member'}}});
      if(error)throw error; if(!authData.user)throw new Error('The account could not be created. Please try again.');
      let profile=null; if(authData.session) profile=(await getCurrentProfile()).profile;
      if(!profile)profile={full_name:data.full_name,membership_tier:data.membership_tier,session_type:data.session_type,payment_channel:data.payment_channel,receipt_reference:data.receipt_reference,payment_status:'Pending Payment Verification'};
      renderSuccess(profile,authData.user.email,!authData.session); event.currentTarget.reset(); $('#selectedPlanText').textContent='Choose a plan below or continue with your details.'; state.selectedPlan=null;
    }catch(error){console.error('VMC registration error:',error);setError(registerError,friendlyAuthError(error));}
    finally{submit.disabled=false;submit.textContent='Create Member Account';}
  }

  async function loginMember(event){
    event.preventDefault(); setError(loginError,''); const submit=$('#loginSubmit'), email=$('#loginEmail').value.trim().toLowerCase(), password=$('#loginPassword').value; if(!email||!password){setError(loginError,'Enter your email and password.');return;}
    submit.disabled=true; submit.textContent='Signing in…';
    try{ const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; const {user,profile}=await getCurrentProfile(); if(!user||!profile)throw new Error('Your authentication succeeded, but your VMC profile could not be loaded.'); if(profile.account_status!=='active')throw new Error('This account is not active. Contact VMC management.'); if(profile.is_admin){window.location.assign('dashboard.html');return;} renderAccount(profile,user.email); }
    catch(error){console.error('VMC login error:',error);setError(loginError,friendlyAuthError(error));}
    finally{submit.disabled=false;submit.textContent='Sign In';}
  }
  async function signOut(){const {error}=await supabase.auth.signOut();if(error){toastMessage(error.message);return;}showLogin();$('#loginForm')?.reset();toastMessage('You have been signed out.');}
  function friendlyAuthError(error){const m=String(error?.message||error||'Something went wrong.');if(/invalid login credentials/i.test(m))return'The email or password is incorrect.';if(/email not confirmed/i.test(m))return'Please confirm your email address before signing in.';if(/user already registered/i.test(m))return'An account with this email already exists. Use Member Login.';if(/password should be at least/i.test(m))return'Password must be at least 8 characters.';return m;}

  $$('[data-open="login"]').forEach(b=>b.addEventListener('click',()=>openModal('login')));
  $$('[data-open="register"]').forEach(b=>b.addEventListener('click',()=>openModal('register')));
  $$('[data-switch="login"]').forEach(b=>b.addEventListener('click',showLogin));
  $$('[data-switch="register"]').forEach(b=>b.addEventListener('click',()=>showRegister()));
  $$('.choose').forEach(b=>b.addEventListener('click',()=>{openModal('register');showRegister(b.dataset.plan);}));
  $('#modalClose')?.addEventListener('click',closeModal); modalWrap?.addEventListener('click',e=>{if(e.target===modalWrap)closeModal();}); document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalWrap?.classList.contains('open'))closeModal();});
  $('#registerForm')?.addEventListener('submit',registerMember); $('#loginForm')?.addEventListener('submit',loginMember);
  $('#menuToggle')?.addEventListener('click',()=>{const open=nav.classList.toggle('mobile-open');$('#menuToggle').setAttribute('aria-expanded',String(open));$('#menuToggle').textContent=open?'×':'☰';});
  $$('.nav-links a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('mobile-open');$('#menuToggle').setAttribute('aria-expanded','false');$('#menuToggle').textContent='☰';}));
  $$('[data-service]').forEach(card=>card.addEventListener('click',()=>{ $$('[data-service]').forEach(x=>{if(x!==card){x.classList.remove('active');x.setAttribute('aria-expanded','false');}}); card.classList.toggle('active');card.setAttribute('aria-expanded',String(card.classList.contains('active'))); }));
  injectPasswordToggles();
  supabase.auth.getSession().then(async({data})=>{if(!data.session)return;try{const {profile}=await getCurrentProfile();if(profile?.is_admin&&location.pathname.endsWith('/index.html')){/* Admins are routed on explicit login; do not surprise a visitor with a redirect on page load. */}}catch(e){console.warn('VMC session restore skipped:',e.message);}});
  supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&modalWrap?.classList.contains('open'))showLogin();});
})();
