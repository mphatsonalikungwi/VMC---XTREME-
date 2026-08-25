/* VMC security controls: idle-session timeout + protected sign-in + customer routing. */
(function(){
'use strict';
const IDLE_MS=15*60*1000,LOGIN_FN='vmc-login-api',SUPABASE_URL=window.supabaseUrl||'',SUPABASE_KEY=window.supabaseKey||'';
if(!window.supabase||!SUPABASE_URL||!SUPABASE_KEY)return;
const sb=window.vmcSupabase||window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
let timer=null,lastActivity=Date.now();
const touch=()=>{lastActivity=Date.now();if(timer)clearTimeout(timer);timer=setTimeout(expire,IDLE_MS)};
const expire=async()=>{if(Date.now()-lastActivity<IDLE_MS)return touch();try{await sb.auth.signOut()}catch(_){}window.location.replace('/')};
['pointerdown','keydown','touchstart','scroll','mousemove'].forEach(ev=>window.addEventListener(ev,touch,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(Date.now()-lastActivity>=IDLE_MS)expire();else touch()}});touch();
window.vmcSecureLogin=async function(email,password){const {data,error}=await sb.functions.invoke(LOGIN_FN,{body:{email,password}});if(error){let msg='';try{if(error.context&&typeof error.context.json==='function'){const body=await error.context.json();msg=body?.error||''}}catch(_){}return{data:null,error:new Error(msg||error?.message||'We could not sign you in.')}}if(data?.error)return{data:null,error:new Error(data.error)};if(!data?.session?.access_token||!data?.session?.refresh_token)return{data:null,error:new Error('We could not create a secure session.')};const {error:setError}=await sb.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});if(setError)return{data:null,error:setError};touch();return{data,error:null}};
const originalInvoke=sb.functions.invoke.bind(sb.functions);
sb.functions.invoke=async function(name,options){const result=await originalInvoke(name,options);try{const action=options?.body?.action;if(name==='vmc-member-api-v2'&&action==='reactivate'&&!result.error&&!result.data?.error){localStorage.setItem('vmcWelcomeMode','reactivated');setTimeout(()=>location.assign('customer-dashboard.html'),200)}}catch(_){}return result};
const routeCustomer=async()=>{if(location.pathname.endsWith('/customer-dashboard.html')||location.pathname.endsWith('/dashboard.html'))return;try{const {data:{user}}=await sb.auth.getUser();if(!user)return;const {data:p}=await sb.from('profiles').select('account_role,is_admin,account_status').eq('id',user.id).maybeSingle();if(!p||p.account_status!=='active')return;const management=Boolean(p.is_admin)||['owner','manager','staff'].includes(p.account_role);if(!management)location.assign('customer-dashboard.html')}catch(_) {}};
sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(routeCustomer,150)});
setTimeout(routeCustomer,250);
})();
