/* VMC XTREME FITNESS — public browser application core.
 * Only the public Supabase URL and publishable/anon key belong here.
 * NEVER place a Supabase service-role/secret key in browser code.
 */
window.supabaseUrl = 'https://czdxwlioouuredaliplw.supabase.co';
window.supabaseKey = 'sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI';

(() => {
  'use strict';

  const { createClient } = window.supabase;
  const supabase = createClient(window.supabaseUrl, window.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.vmcSupabase = supabase;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { selectedPlan: null, loginMode: 'member' };

  const prices = {
    'Per Day': { Single: 2000, Double: 3000 },
    'Per Week': { Single: 8000, Double: 10000 },
    'Per Month': { Single: 30000, Double: 35000 }
  };

  const priceFor = (tier, session) => prices[tier]?.[session] || 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 3800);
  }

  function setError(element, message) {
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('show', Boolean(message));
  }

  function friendlyError(error) {
    const message = String(error?.message || error || 'Something went wrong.');
    if (/invalid login credentials/i.test(message)) return 'The email or password is incorrect.';
    if (/email not confirmed/i.test(message)) return 'This account is waiting for email confirmation. Please contact VMC management.';
    if (/user already registered/i.test(message)) return 'An account with this email already exists. Use Member Login instead of creating another account.';
    if (/password should be at least/i.test(message)) return 'Password must be at least 8 characters.';
    return message;
  }

  function injectPasswordToggles() {
    if (!document.getElementById('vmcPasswordToggleStyles')) {
      const style = document.createElement('style');
      style.id = 'vmcPasswordToggleStyles';
      style.textContent = `
        .vmc-password-wrap{position:relative;width:100%}
        .vmc-password-wrap input{padding-right:48px!important}
        .vmc-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#a7abb2;width:36px;height:36px;border-radius:9px;font-size:1rem;z-index:2}
        .vmc-password-toggle:hover{background:#1a1c21;color:#fff}
        .vmc-nav-auth{display:flex;align-items:center;gap:8px;margin-left:4px;padding-left:12px;border-left:1px solid rgba(255,255,255,.12)}
        .vmc-nav-auth button{border:1px solid #33363d;background:#17191e;color:#fff;border-radius:999px;padding:9px 13px;font-weight:900;font-size:.72rem;white-space:nowrap}
        .vmc-nav-auth button.vmc-nav-join{background:#e31b2d;border-color:#e31b2d}
        .vmc-nav-auth button.vmc-nav-admin{background:transparent}
        @media(max-width:760px){.vmc-nav-auth{display:flex;flex-direction:column;align-items:stretch;margin:0;padding:12px 0 0;border-left:0;border-top:1px solid #202329;gap:8px}.vmc-nav-auth button{width:100%;border-radius:10px;padding:12px}.nav.mobile-open .vmc-nav-auth{display:flex}.nav-links .vmc-nav-auth{width:100%}}
        .vmc-contact-icon{font-size:1.35rem;line-height:1}
        .vmc-water-below{flex-basis:100%!important;width:100%;margin-left:0!important;padding-top:12px;border-top:1px solid #d8d9d5}
        .gallery-item{min-height:390px}
        .gallery-item.wide{height:500px}
        @media(max-width:760px){.gallery-grid{grid-auto-rows:360px}.gallery-item{min-height:360px}.gallery-item.wide{height:430px}}
      `;
      document.head.appendChild(style);
    }

    $$('input[type="password"]').forEach(input => {
      if (input.closest('.vmc-password-wrap')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'vmc-password-wrap';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'vmc-password-toggle';
      toggle.textContent = '◉';
      toggle.setAttribute('aria-label', 'Show password');
      toggle.addEventListener('click', () => {
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        toggle.textContent = visible ? '◉' : '◌';
        toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
      });
      wrapper.appendChild(toggle);
    });
  }

  function resetLoginForm() {
    const form = $('#loginForm');
    if (form) form.reset();
    const email = $('#loginEmail');
    const password = $('#loginPassword');
    if (email) { email.value = ''; email.setAttribute('autocomplete', 'off'); }
    if (password) { password.value = ''; password.setAttribute('autocomplete', 'new-password'); }
    setError($('#loginError'), '');
  }

  function openModal(mode = 'login') {
    const modal = $('#modalWrap');
    if (!modal) return;
    state.loginMode = mode === 'admin' ? 'admin' : 'member';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (state.loginMode === 'admin') showLogin('admin');
    else if (mode === 'register') showRegister();
    else showLogin('member');
  }

  function closeModal() {
    const modal = $('#modalWrap');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function showLogin(mode = 'member') {
    state.loginMode = mode === 'admin' ? 'admin' : 'member';
    const title = $('#modalTitle');
    if (title) title.textContent = state.loginMode === 'admin' ? 'Admin Login' : 'Member Login';
    if ($('#loginView')) $('#loginView').hidden = false;
    if ($('#registerView')) $('#registerView').hidden = true;
    if ($('#successView')) $('#successView').hidden = true;
    resetLoginForm();
    injectPasswordToggles();
    setTimeout(() => $('#loginEmail')?.focus(), 40);
  }

  function applyPlan(plan) {
    const parts = String(plan || '').split('|');
    const tier = parts[0];
    const session = parts[1] || 'Single';
    const price = Number(parts[2] || priceFor(tier, session));
    state.selectedPlan = { tier, session, price };
    if ($('#tier')) $('#tier').value = tier;
    if ($('#session')) $('#session').value = session;
    if ($('#selectedPlanText')) $('#selectedPlanText').textContent = `${tier} · ${session} Session · K ${price.toLocaleString('en-MW')}`;
  }

  function showRegister(plan = null) {
    state.loginMode = 'member';
    if ($('#modalTitle')) $('#modalTitle').textContent = 'Create Member Account';
    if ($('#loginView')) $('#loginView').hidden = true;
    if ($('#registerView')) $('#registerView').hidden = false;
    if ($('#successView')) $('#successView').hidden = true;
    setError($('#registerError'), '');
    if (plan) applyPlan(plan);
    injectPasswordToggles();
  }

  function validateRegistration(data) {
    if (!data.full_name || data.full_name.trim().length < 2) return 'Please enter your full name.';
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) return 'Please enter a valid email address.';
    if (!data.password || data.password.length < 8) return 'Password must be at least 8 characters.';
    if (!data.phone_number || data.phone_number.trim().length < 7) return 'Please enter a valid phone number.';
    if (!data.membership_tier) return 'Please select a membership plan.';
    if (!data.session_type) return 'Please select Single or Double Session.';
    if (!data.payment_channel) return 'Please select a payment channel.';
    if (!$('#rulesCheck')?.checked) return 'You must agree to all 15 gym rules before creating an account.';
    return '';
  }

  async function currentProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { user: null, profile: null };
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return { user, profile };
  }

  function renderSuccess(profile, email) {
    if ($('#loginView')) $('#loginView').hidden = true;
    if ($('#registerView')) $('#registerView').hidden = true;
    if ($('#successView')) $('#successView').hidden = false;
    if ($('#modalTitle')) $('#modalTitle').textContent = 'VMC Member Onboarding';
    const view = $('#successView');
    if (!view) return;
    view.innerHTML = `
      <div class="success">
        <div class="success-icon">✓</div>
        <h2>Registration received.</h2>
        <p>Your VMC member account has been created. Your membership is now waiting for VMC payment verification.</p>
        <div class="status-box"><span class="status-label">Payment status</span><span class="status-value">${esc(profile?.payment_status || 'Pending Payment Verification')}</span></div>
        <div class="account-box"><div class="account-grid">
          <div><small>Member</small><strong>${esc(profile?.full_name || 'VMC Member')}</strong></div>
          <div><small>Email</small><strong>${esc(email || '')}</strong></div>
          <div><small>Membership</small><strong>${esc(profile?.membership_tier || state.selectedPlan?.tier || '—')}</strong></div>
          <div><small>Session</small><strong>${esc(profile?.session_type || state.selectedPlan?.session || '—')}</strong></div>
          <div><small>Payment channel</small><strong>${esc(profile?.payment_channel || '—')}</strong></div>
          <div><small>Reference</small><strong>${esc(profile?.receipt_reference || 'Not provided')}</strong></div>
        </div></div>
        <div class="form-actions"><button class="btn btn-red" type="button" id="successLogin">Member Login</button><button class="btn btn-dark" type="button" id="successClose">Close</button></div>
      </div>`;
    $('#successLogin')?.addEventListener('click', () => showLogin('member'));
    $('#successClose')?.addEventListener('click', closeModal);
  }

  function renderAccount(profile, email) {
    const management = Boolean(profile?.is_admin) || ['owner', 'manager', 'staff'].includes(profile?.account_role);
    if ($('#loginView')) $('#loginView').hidden = true;
    if ($('#registerView')) $('#registerView').hidden = true;
    if ($('#successView')) $('#successView').hidden = false;
    if ($('#modalTitle')) $('#modalTitle').textContent = management ? 'VMC Management Account' : 'Member Account';
    const view = $('#successView');
    if (!view) return;
    const managementPanel = management ? `<div class="admin-panel"><div class="form-actions"><a class="btn btn-red" href="dashboard.html">Open Admin Dashboard</a></div></div>` : '';
    view.innerHTML = `
      <div class="success"><div class="success-icon">✓</div><h2>Welcome back.</h2><p>Your VMC account is connected to the member system.</p>
      <div class="status-box"><span class="status-label">Payment status</span><span class="status-value">${esc(profile?.payment_status || 'Pending Payment Verification')}</span></div>
      <div class="account-box"><div class="account-grid">
        <div><small>Member</small><strong>${esc(profile?.full_name || 'VMC Member')}</strong></div>
        <div><small>Email</small><strong>${esc(email || '')}</strong></div>
        <div><small>Membership</small><strong>${esc(profile?.membership_tier || '—')}</strong></div>
        <div><small>Session</small><strong>${esc(profile?.session_type || '—')}</strong></div>
        <div><small>Start</small><strong>${esc(profile?.membership_start_date || 'Not active')}</strong></div>
        <div><small>Expires</small><strong>${esc(profile?.membership_expiry_date || 'Awaiting approval')}</strong></div>
      </div></div>${managementPanel}
      <div class="form-actions"><button class="btn btn-dark" type="button" id="logoutBtn">Sign Out</button><button class="btn btn-red" type="button" id="accountClose">Close</button></div></div>`;
    $('#logoutBtn')?.addEventListener('click', signOut);
    $('#accountClose')?.addEventListener('click', closeModal);
  }

  async function registerMember(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const errorBox = $('#registerError');
    const submit = $('#registerSubmit');
    const data = Object.fromEntries(new FormData(form).entries());
    const validationError = validateRegistration(data);
    setError(errorBox, validationError);
    if (validationError) return;
    submit.disabled = true;
    submit.textContent = 'Creating account…';
    try {
      const amount = state.selectedPlan?.price || priceFor(data.membership_tier, data.session_type);
      if (!amount) throw new Error('The selected membership price could not be determined. Please choose a valid plan.');
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: { data: {
          account_role: 'member', full_name: data.full_name.trim(), date_of_birth: data.date_of_birth || '', gender: data.gender || '',
          phone_number: data.phone_number.trim(), emergency_contact: data.emergency_contact.trim(), membership_tier: data.membership_tier,
          session_type: data.session_type, membership_amount: String(amount), payment_channel: data.payment_channel,
          receipt_reference: data.receipt_reference.trim()
        }}
      });
      if (error) throw error;
      if (!authData.user) throw new Error('The account could not be created. Please try again.');
      let profile = null;
      if (authData.session) profile = (await currentProfile()).profile;
      if (!profile) profile = { full_name: data.full_name, membership_tier: data.membership_tier, session_type: data.session_type, payment_channel: data.payment_channel, receipt_reference: data.receipt_reference, payment_status: 'Pending Payment Verification' };
      renderSuccess(profile, authData.user.email);
      form.reset();
      if ($('#selectedPlanText')) $('#selectedPlanText').textContent = 'Choose a plan below or continue with your details.';
      state.selectedPlan = null;
    } catch (error) {
      console.error('VMC registration error:', error);
      setError(errorBox, friendlyError(error));
    } finally {
      submit.disabled = false;
      submit.textContent = 'Create Member Account';
    }
  }

  function renderReactivation(profile, email) {
    if ($('#loginView')) $('#loginView').hidden = true;
    if ($('#registerView')) $('#registerView').hidden = true;
    if ($('#successView')) $('#successView').hidden = false;
    if ($('#modalTitle')) $('#modalTitle').textContent = 'Membership Reactivation';
    const view = $('#successView');
    if (!view) return;
    view.innerHTML = `
      <div class="success">
        <div class="success-icon">!</div>
        <h2>Membership expired.</h2>
        <p>Your membership has expired because it was not renewed. To initiate reactivation, confirm that you agree to make your membership payment.</p>
        <div class="status-box"><span class="status-label">Account status</span><span class="status-value">REACTIVATION REQUIRED</span></div>
        <div class="account-box"><div class="account-grid">
          <div><small>Member</small><strong>${esc(profile?.full_name || 'VMC Member')}</strong></div>
          <div><small>Email</small><strong>${esc(email || '')}</strong></div>
          <div><small>Membership</small><strong>${esc(profile?.membership_tier || '—')}</strong></div>
          <div><small>Payment</small><strong>Pending Payment Verification</strong></div>
        </div></div>
        <label class="check" style="margin-top:16px"><input id="reactivationAgree" type="checkbox"><span>I agree to make the required membership payment and understand that VMC management must verify the payment.</span></label>
        <div class="form-error" id="reactivationError" role="alert"></div>
        <div class="form-actions"><button class="btn btn-red" id="reactivateBtn" type="button">Initiate Reactivation</button><button class="btn btn-dark" id="reactivateClose" type="button">Close</button></div>
      </div>`;
    $('#reactivateClose')?.addEventListener('click', closeModal);
    $('#reactivateBtn')?.addEventListener('click', async () => {
      const errorBox=$('#reactivationError'), button=$('#reactivateBtn');
      if (!$('#reactivationAgree')?.checked) { setError(errorBox, 'Please confirm that you agree to make the membership payment.'); return; }
      button.disabled=true; button.textContent='Initiating…';
      try {
        const {data,error}=await supabase.functions.invoke('vmc-member-api',{body:{action:'reactivate'}});
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const latest=await currentProfile();
        renderAccount(latest.profile,email);
        showToast('Reactivation initiated. Your account is active and flagged for payment verification.');
      } catch (err) { setError(errorBox, friendlyError(err)); button.disabled=false; button.textContent='Initiate Reactivation'; }
    });
  }

  async function loginMember(event) {
    event.preventDefault();
    const errorBox = $('#loginError');
    const submit = $('#loginSubmit');
    const email = ($('#loginEmail')?.value || '').trim().toLowerCase();
    const password = $('#loginPassword')?.value || '';
    setError(errorBox, '');
    if (!email || !password) { setError(errorBox, 'Enter your email and password.'); return; }
    submit.disabled = true;
    submit.textContent = 'Signing in…';
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { user, profile } = await currentProfile();
      if (!user || !profile) throw new Error('Your authentication succeeded, but your VMC profile could not be loaded.');
      if (!management) {
        const { data: lifecycle, error: lifecycleError } = await supabase.functions.invoke('vmc-member-api', { body: { action: 'status' } });
        if (lifecycleError) throw lifecycleError;
        if (lifecycle?.status === 'reactivation_required') { renderReactivation(lifecycle.profile || profile, user.email); return; }
      }
      if (profile.account_status !== 'active') throw new Error('This account is not active. Contact VMC management.');
      const management = Boolean(profile.is_admin) || ['owner', 'manager', 'staff'].includes(profile.account_role);
      if (state.loginMode === 'admin' && !management) {
        await supabase.auth.signOut();
        throw new Error('Admin access required. Use Member Login for a customer account.');
      }
      if (management) { window.location.assign('dashboard.html'); return; }
      renderAccount(profile, user.email);
    } catch (error) {
      console.error('VMC login error:', error);
      setError(errorBox, friendlyError(error));
    } finally {
      submit.disabled = false;
      submit.textContent = 'Sign In';
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { showToast(error.message); return; }
    closeModal();
    showToast('You have been signed out.');
  }

  function setupNavigation() {
    const nav = $('#nav') || $('.nav');
    const links = $('.nav-links', nav || document);
    if (!links) return;
    const existingActions = $('.nav-actions', nav || document);
    const auth = document.createElement('div');
    auth.className = 'vmc-nav-auth';
    const admin = document.createElement('button');
    admin.type = 'button'; admin.className = 'vmc-nav-admin'; admin.textContent = 'Admin Login'; admin.dataset.open = 'admin';
    const member = document.createElement('button');
    member.type = 'button'; member.textContent = 'Member Login'; member.dataset.open = 'login';
    const join = document.createElement('button');
    join.type = 'button'; join.className = 'vmc-nav-join'; join.textContent = 'Join Now'; join.dataset.open = 'register';
    auth.append(admin, member, join);
    if (existingActions) existingActions.remove();
    links.querySelector('.vmc-nav-auth')?.remove();
    links.appendChild(auth);
    admin.addEventListener('click', () => openModal('admin'));
    member.addEventListener('click', () => openModal('login'));
    join.addEventListener('click', () => openModal('register'));

    const menuButton = $('#menuToggle', nav || document) || $('.menu-toggle', nav || document);
    if (menuButton) {
      menuButton.addEventListener('click', () => {
        nav?.classList.toggle('mobile-open');
        menuButton.setAttribute('aria-expanded', String(nav?.classList.contains('mobile-open')));
      });
    }
    $$('.nav-links a', nav || document).forEach(link => link.addEventListener('click', () => nav?.classList.remove('mobile-open')));
  }

  function setupContact() {
    const phoneLinks = $$('a[href^="tel:"]');
    phoneLinks.forEach(link => {
      link.innerHTML = '<span class="vmc-contact-icon" aria-hidden="true">📞</span><span class="sr-only">Call VMC Xtreme</span>';
      link.setAttribute('aria-label', 'Call VMC Xtreme Fitness');
    });
    const contactPhone = $('#contact')?.querySelector('.contact-link:nth-child(2)');
    if (contactPhone && /991\s*203\s*382/.test(contactPhone.textContent)) {
      contactPhone.innerHTML = '<span class="vmc-contact-icon" aria-hidden="true">📞</span>';
      contactPhone.setAttribute('aria-label', 'VMC phone contact');
    }
  }

  function setupWaterAndPayments() {
    const water = $('.water');
    if (!water) return;
    water.textContent = 'Hydration: Water 500ml on site for K1000';
    water.classList.add('vmc-water-below');
  }

  function setupGallery() {
    const gallery = $('#gallery');
    if (!gallery) return;
    $$('.gallery-item', gallery).forEach(item => {
      const image = $('img', item);
      const caption = $('.gallery-item figcaption', item)?.textContent || '';
      const source = image?.getAttribute('src') || '';
      const alt = image?.getAttribute('alt') || '';
      if (/logo|vmc.*xtreme.*fitness.*gym/i.test(`${source} ${alt} ${caption}`)) item.remove();
    });
    $$('.gallery-item img', gallery).forEach(image => image.loading = 'lazy');
  }

  function setupMap() {
    const contact = $('#contact');
    if (!contact) return;
    const iframe = $('iframe', contact);
    const mapUrl = 'https://www.google.com/maps?q=Chilinde+1,+Sankhawekha,+Malawi&output=embed';
    if (iframe) {
      iframe.src = mapUrl;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
    }
  }

  function setupLoginAndRegistrationSwitches() {
    $$('[data-open="login"]').forEach(button => button.addEventListener('click', () => openModal('login')));
    $$('[data-open="admin"]').forEach(button => button.addEventListener('click', () => openModal('admin')));
    $$('[data-open="register"]').forEach(button => button.addEventListener('click', () => openModal('register')));
    $$('[data-switch="login"]').forEach(button => button.addEventListener('click', () => showLogin('member')));
    $$('[data-switch="register"]').forEach(button => button.addEventListener('click', () => showRegister()));
    $$('.choose').forEach(button => button.addEventListener('click', () => { openModal('register'); showRegister(button.dataset.plan); }));
  }

  function setupServices() {
    $$('[data-service]').forEach(card => card.addEventListener('click', () => {
      $$('[data-service]').forEach(other => {
        if (other !== card) { other.classList.remove('active'); other.setAttribute('aria-expanded', 'false'); }
      });
      card.classList.toggle('active');
      card.setAttribute('aria-expanded', String(card.classList.contains('active')));
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupLoginAndRegistrationSwitches();
    setupContact();
    setupWaterAndPayments();
    setupGallery();
    setupMap();
    setupServices();
    injectPasswordToggles();

    $('#registerForm')?.addEventListener('submit', registerMember);
    $('#loginForm')?.addEventListener('submit', loginMember);
    $('#modalClose')?.addEventListener('click', closeModal);
    $('#modalWrap')?.addEventListener('click', event => { if (event.target === $('#modalWrap')) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

    $$('#loginEmail, #loginPassword').forEach(field => field.addEventListener('focus', () => {
      if (field === $('#loginEmail')) field.value = '';
    }, { once: true }));
  });

  window.vmcOpenModal = openModal;
  window.vmcCloseModal = closeModal;
  window.vmcShowRegister = showRegister;
})();
