/* VMC security controls: idle-session timeout + protected sign-in. */
(function(){
  'use strict';
  const IDLE_MS = 15 * 60 * 1000;
  const LOGIN_FN = 'vmc-login-api';
  const SUPABASE_URL = window.supabaseUrl || '';
  const SUPABASE_KEY = window.supabaseKey || '';
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_KEY) return;
  const sb = window.vmcSupabase || window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth:{ persistSession:true, autoRefreshToken:true } });
  let timer = null;
  let lastActivity = Date.now();
  const touch = () => { lastActivity = Date.now(); if (timer) clearTimeout(timer); timer = setTimeout(expire, IDLE_MS); };
  const expire = async () => {
    if (Date.now() - lastActivity < IDLE_MS) return touch();
    try { await sb.auth.signOut(); } catch (_) {}
    window.location.replace('/');
  };
  ['pointerdown','keydown','touchstart','scroll','mousemove'].forEach(ev => window.addEventListener(ev, touch, {passive:true}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (Date.now()-lastActivity >= IDLE_MS) expire(); else touch(); } });
  touch();

  window.vmcSecureLogin = async function(email, password){
    const { data, error } = await sb.functions.invoke(LOGIN_FN, { body:{ email, password } });
    if (error) {
      let msg = '';
      try { if (error.context && typeof error.context.json === 'function') { const body = await error.context.json(); msg = body?.error || ''; } } catch (_) {}
      msg = msg || error?.message || 'We could not sign you in.';
      return { data:null, error:new Error(msg) };
    }
    if (data?.error) return { data:null, error:new Error(data.error) };
    if (!data?.session?.access_token || !data?.session?.refresh_token) return { data:null, error:new Error('We could not create a secure session.') };
    const { error:setError } = await sb.auth.setSession({ access_token:data.session.access_token, refresh_token:data.session.refresh_token });
    if (setError) return { data:null, error:setError };
    touch();
    return { data, error:null };
  };
})();
