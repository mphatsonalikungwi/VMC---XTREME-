export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  if(url.pathname!=='/app.js')return response;
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('javascript')&&!contentType.includes('text/plain'))return response;

  let js=await response.text();

  const oldInvoke="const {data,error}=await supabase.functions.invoke('vmc-registration-api',{body:payload});";
  const newInvoke="const registrationResponse=await fetch('/api/vmc-registration-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await registrationResponse.json();const error=registrationResponse.ok?null:new Error(data?.error||'Registration failed.');";
  js=js.replace(oldInvoke,newInvoke);

  const oldMember="<div><small>Member</small><strong>${esc(profile?.full_name||'VMC Member')}</strong></div>";
  const newMember="<div><small>Member</small><strong>${esc(profile?.full_name||'VMC Member')}</strong></div><div><small>VMC Username</small><strong>${esc(profile?.username||'Not available')}</strong></div>";
  js=js.replace(oldMember,newMember);

  const oldLogin="</div></div><div class=\"form-actions\"><button class=\"btn btn-red\" type=\"button\" id=\"successLogin\">My VMC Account";
  const newLogin="</div></div><div class=\"login-instructions\" style=\"margin-top:16px;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:12px\"><strong>How to log in</strong><p style=\"margin:8px 0 0\">You can log in using your VMC username, registered phone number, or the email address you provided during registration, together with your password.</p></div><div class=\"form-actions\"><button class=\"btn btn-red\" type=\"button\" id=\"successLogin\">My VMC Account";
  js=js.replace(oldLogin,newLogin);

  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(js,{status:response.status,statusText:response.statusText,headers});
}
