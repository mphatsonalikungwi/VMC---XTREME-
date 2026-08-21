/* VMC XTREME FITNESS — browser application core
 * Supabase client-side keys are intentionally limited to the public project URL
 * and publishable/anon key. NEVER place a service_role/secret key in this file.
 *
 * SUPABASE KEY LOCATION:
 * If you move this site to another Supabase project, replace the two values
 * below. The publishable/anon key is designed for browser use when RLS is enabled.
 */
window.supabaseUrl = 'https://czdxwlioouuredaliplw.supabase.co';
window.supabaseKey = 'sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI';

(() => {
  'use strict';

  if (!window.supabaseUrl || !window.supabaseKey || !window.supabaseUrl.startsWith('http')) {
    console.error('VMC: Supabase configuration is missing. Replace window.supabaseUrl and window.supabaseKey at the top of app.js.');
    return;
  }

  const { createClient } = window.supabase;
  const supabase = createClient(window.supabaseUrl, window.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.vmcSupabase = supabase;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { selectedPlan: null, lastProfile: null };

  const modalWrap = $('#modalWrap');
  const modalTitle = $('#modalTitle');
  const loginView = $('#loginView');
  const registerView = $('#registerView');
  const successView = $('#successView');
  const loginError = $('#loginError');
  const registerError = $('#registerError');
  const toast = $('#toast');
  const nav = $('#nav');

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 3800);
  }

  function setError(el, message) {
    el.textContent = message || '';
    el.classList.toggle('show', Boolean(message));
  }

  function openModal(view = 'login') {
    modalWrap.classList.add('open');
    modalWrap.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (view === 'register') showRegister(); else showLogin();
    setTimeout(() => {
      const target = view === 'register' ? $('#fullName') : $('#loginEmail');
      target?.focus();
    }, 40);
  }

  function closeModal() {
    modalWrap.classList.remove('open');
    modalWrap.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function showLogin() {
    modalTitle.textContent = 'Member Login';
    loginView.hidden = false;
    registerView.hidden = true;
    successView.hidden = true;
    setError(loginError, '');
  }

  function showRegister(plan = null) {
    modalTitle.textContent = 'Create Member Account';
    loginView.hidden = true;
    registerView.hidden = false;
    successView.hidden = true;
    setError(registerError, '');
    if (plan) applyPlan(plan);
  }

  function applyPlan(planString) {
    const [tier, session, price] = planString.split('|');
    state.selectedPlan = { tier, session, price: Number(price) };
    $('#tier').value = tier;
    $('#session').value = session;
    $('#selectedPlanText').textContent = `${tier} · ${session} Session · K ${Number(price).toLocaleString('en-MW')}`;
  }

  function formObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function validateRegistration(data) {
    if (!data.full_name || data.full_name.trim().length < 2) return 'Please enter your full name.';
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) return 'Please enter a valid email address.';
    if (!data.password || data.password.length < 8) return 'Password must be at least 8 characters.';
    if (!data.phone_number || data.phone_number.trim().length < 7) return 'Please enter a valid phone number.';
    if (!data.membership_tier) return 'Please select a membership plan.';
    if (!data.session_type) return 'Please select Single or Double Session.';
    if (!data.payment_channel) return 'Please select a payment channel.';
    if (!$('#rulesCheck').checked) return 'You must agree to the 15 gym rules before creating an account.';
    return '';
  }

  function renderSuccess(profile, email, emailConfirmationRequired = false) {
    state.lastProfile = profile || {};
    loginView.hidden = true;
    registerView.hidden = true;
    successView.hidden = false;
    modalTitle.textContent = 'VMC Member Onboarding';

    const p = profile || {};
    const confirmationText = emailConfirmationRequired
      ? 'Your member record is created. Please confirm your email from the message sent by Supabase, then use Member Login.'
      : 'Your member record is active in the system. Your selected payment is now waiting for VMC verification.';

    successView.innerHTML = `
      <div class="success">
        <div class="success-icon">✓</div>
        <h2>Registration received.</h2>
        <p>${escapeHtml(confirmationText)}</p>
        <div class="status-box">
          <span class="status-label">Payment status</span>
          <span class="status-value">${escapeHtml(p.payment_status || 'Pending Payment Verification')}</span>
        </div>
        <div class="account-box">
          <div class="account-grid">
            <div><small>Member</small><strong>${escapeHtml(p.full_name || 'VMC Member')}</strong></div>
            <div><small>Email</small><strong>${escapeHtml(email || '')}</strong></div>
            <div><small>Membership</small><strong>${escapeHtml(p.membership_tier || state.selectedPlan?.tier || '—')}</strong></div>
            <div><small>Session</small><strong>${escapeHtml(p.session_type || state.selectedPlan?.session || '—')}</strong></div>
            <div><small>Payment channel</small><strong>${escapeHtml(p.payment_channel || '—')}</strong></div>
            <div><small>Reference</small><strong>${escapeHtml(p.receipt_reference || 'Not provided')}</strong></div>
          </div>
        </div>
        <div class="form-actions"><button class="btn btn-red" type="button" id="successLogin">Member Login</button><button class="btn btn-dark" type="button" id="successClose">Close</button></div>
      </div>`;

    $('#successLogin')?.addEventListener('click', showLogin);
    $('#successClose')?.addEventListener('click', closeModal);
  }

  function renderAccount(profile, email) {
    state.lastProfile = profile;
    loginView.hidden = true;
    registerView.hidden = true;
    successView.hidden = false;
    modalTitle.textContent = profile.is_admin ? 'VMC Admin & Member Account' : 'Member Account';

    successView.innerHTML = `
      <div class="success">
        <div class="success-icon">✓</div>
        <h2>Welcome back.</h2>
        <p>Your VMC Xtreme member account is connected to the secure member database.</p>
        <div class="status-box">
          <span class="status-label">Payment status</span>
          <span class="status-value">${escapeHtml(profile.payment_status || 'Pending Payment Verification')}</span>
        </div>
        <div class="account-box">
          <div class="account-grid">
            <div><small>Member</small><strong>${escapeHtml(profile.full_name || 'VMC Member')}</strong></div>
            <div><small>Email</small><strong>${escapeHtml(email || '')}</strong></div>
            <div><small>Membership</small><strong>${escapeHtml(profile.membership_tier || '—')}</strong></div>
            <div><small>Session</small><strong>${escapeHtml(profile.session_type || '—')}</strong></div>
            <div><small>Payment channel</small><strong>${escapeHtml(profile.payment_channel || '—')}</strong></div>
            <div><small>Reference</small><strong>${escapeHtml(profile.receipt_reference || '—')}</strong></div>
          </div>
        </div>
        ${profile.is_admin ? '<div class="admin-panel" id="adminPanel"><h3>Payment verification</h3><div id="adminTableWrap">Loading member records…</div></div>' : ''}
        <div class="form-actions"><button class="btn btn-dark" type="button" id="logoutBtn">Sign Out</button><button class="btn btn-red" type="button" id="accountClose">Close</button></div>
      </div>`;

    $('#logoutBtn')?.addEventListener('click', signOut);
    $('#accountClose')?.addEventListener('click', closeModal);
    if (profile.is_admin) loadAdminTable();
  }

  async function getCurrentProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { user: null, profile: null };
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return { user, profile };
  }

  async function registerMember(event) {
    event.preventDefault();
    setError(registerError, '');
    const submit = $('#registerSubmit');
    const data = formObject(event.currentTarget);
    const validationError = validateRegistration(data);
    if (validationError) { setError(registerError, validationError); return; }

    submit.disabled = true;
    submit.textContent = 'Creating account…';

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: data.full_name.trim(),
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            phone_number: data.phone_number.trim(),
            emergency_contact: data.emergency_contact.trim(),
            membership_tier: data.membership_tier,
            session_type: data.session_type,
            payment_channel: data.payment_channel,
            receipt_reference: data.receipt_reference.trim()
          }
        }
      });

      if (error) throw error;
      if (!authData.user) throw new Error('The account could not be created. Please try again.');

      let profile = null;
      if (authData.session) {
        const result = await getCurrentProfile();
        profile = result.profile;
      }

      if (!profile) {
        profile = {
          full_name: data.full_name,
          membership_tier: data.membership_tier,
          session_type: data.session_type,
          payment_channel: data.payment_channel,
          receipt_reference: data.receipt_reference,
          payment_status: 'Pending Payment Verification'
        };
      }

      renderSuccess(profile, authData.user.email, !authData.session);
      event.currentTarget.reset();
      $('#selectedPlanText').textContent = 'Choose a plan below or continue with your details.';
      state.selectedPlan = null;
    } catch (error) {
      console.error('VMC registration error:', error);
      setError(registerError, friendlyAuthError(error));
    } finally {
      submit.disabled = false;
      submit.textContent = 'Create Member Account';
    }
  }

  async function loginMember(event) {
    event.preventDefault();
    setError(loginError, '');
    const submit = $('#loginSubmit');
    const email = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    if (!email || !password) { setError(loginError, 'Enter your email and password.'); return; }

    submit.disabled = true;
    submit.textContent = 'Signing in…';
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { user, profile } = await getCurrentProfile();
      if (!user || !profile) throw new Error('Your authentication succeeded, but your VMC member profile could not be loaded. Contact the gym.');
      renderAccount(profile, user.email);
    } catch (error) {
      console.error('VMC login error:', error);
      setError(loginError, friendlyAuthError(error));
    } finally {
      submit.disabled = false;
      submit.textContent = 'Sign In';
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { showToast(error.message); return; }
    showLogin();
    $('#loginForm').reset();
    showToast('You have been signed out.');
  }

  async function loadAdminTable() {
    const wrap = $('#adminTableWrap');
    if (!wrap) return;
    try {
      const { data, error } = await supabase.from('profiles').select('id,full_name,phone_number,membership_tier,session_type,payment_channel,receipt_reference,payment_status,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) { wrap.innerHTML = '<p class="form-note">No member records yet.</p>'; return; }
      wrap.innerHTML = `<div style="overflow:auto"><table class="admin-table"><thead><tr><th>Member</th><th>Plan</th><th>Payment</th><th>Status</th></tr></thead><tbody>${data.map(member => `
        <tr><td><strong>${escapeHtml(member.full_name)}</strong><br><span style="color:#777">${escapeHtml(member.phone_number || '')}</span></td>
        <td>${escapeHtml(member.membership_tier || '—')}<br>${escapeHtml(member.session_type || '')}</td>
        <td>${escapeHtml(member.payment_channel || '—')}<br><span style="color:#777">${escapeHtml(member.receipt_reference || 'No reference')}</span></td>
        <td><select data-status-id="${escapeHtml(member.id)}" aria-label="Payment status for ${escapeHtml(member.full_name)}"><option ${member.payment_status === 'Pending Payment Verification' ? 'selected' : ''}>Pending Payment Verification</option><option ${member.payment_status === 'Payment Verified' ? 'selected' : ''}>Payment Verified</option><option ${member.payment_status === 'Payment Rejected' ? 'selected' : ''}>Payment Rejected</option></select></td></tr>`).join('')}</tbody></table></div>`;
      $$('[data-status-id]', wrap).forEach(select => select.addEventListener('change', updatePaymentStatus));
    } catch (error) {
      console.error('VMC admin table error:', error);
      wrap.innerHTML = '<p class="form-note">Unable to load member records. Check your admin permissions.</p>';
    }
  }

  async function updatePaymentStatus(event) {
    const select = event.currentTarget;
    const id = select.dataset.statusId;
    const paymentStatus = select.value;
    select.disabled = true;
    try {
      const { error } = await supabase.from('profiles').update({ payment_status: paymentStatus }).eq('id', id);
      if (error) throw error;
      showToast('Payment status updated.');
      if (state.lastProfile?.id === id) state.lastProfile.payment_status = paymentStatus;
    } catch (error) {
      console.error('VMC payment status error:', error);
      showToast('Payment status could not be updated.');
      await loadAdminTable();
    } finally {
      select.disabled = false;
    }
  }

  function friendlyAuthError(error) {
    const message = String(error?.message || error || 'Something went wrong.');
    if (/invalid login credentials/i.test(message)) return 'The email or password is incorrect.';
    if (/email not confirmed/i.test(message)) return 'Please confirm your email address before signing in.';
    if (/user already registered/i.test(message)) return 'An account with this email already exists. Use Member Login.';
    if (/password should be at least/i.test(message)) return 'Password must be at least 8 characters.';
    return message;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  // Modal triggers and plan buttons.
  $$('[data-open="login"]').forEach(button => button.addEventListener('click', () => openModal('login')));
  $$('[data-open="register"]').forEach(button => button.addEventListener('click', () => openModal('register')));
  $$('[data-switch="login"]').forEach(button => button.addEventListener('click', () => showLogin()));
  $$('[data-switch="register"]').forEach(button => button.addEventListener('click', () => showRegister()));
  $$('.choose').forEach(button => button.addEventListener('click', () => { openModal('register'); showRegister(button.dataset.plan); }));

  $('#modalClose').addEventListener('click', closeModal);
  modalWrap.addEventListener('click', event => { if (event.target === modalWrap) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modalWrap.classList.contains('open')) closeModal(); });
  $('#registerForm').addEventListener('submit', registerMember);
  $('#loginForm').addEventListener('submit', loginMember);

  // Mobile navigation.
  $('#menuToggle').addEventListener('click', () => {
    const open = nav.classList.toggle('mobile-open');
    $('#menuToggle').setAttribute('aria-expanded', String(open));
    $('#menuToggle').textContent = open ? '×' : '☰';
  });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('mobile-open');
    $('#menuToggle').setAttribute('aria-expanded', 'false');
    $('#menuToggle').textContent = '☰';
  }));

  // Service cards are interactive without adding a dependency.
  $$('[data-service]').forEach(card => card.addEventListener('click', () => {
    $$('[data-service]').forEach(other => { if (other !== card) { other.classList.remove('active'); other.setAttribute('aria-expanded', 'false'); } });
    card.classList.toggle('active');
    card.setAttribute('aria-expanded', String(card.classList.contains('active')));
  }));

  // Restore a session if the browser already has one.
  supabase.auth.getSession().then(async ({ data }) => {
    if (!data.session) return;
    try {
      const { user, profile } = await getCurrentProfile();
      if (user && profile) state.lastProfile = profile;
    } catch (error) {
      console.warn('VMC session restore skipped:', error.message);
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session && modalWrap.classList.contains('open') && !registerView.hidden) showLogin();
  });
})();
