export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  if (url.pathname !== '/app.js' || context.request.method !== 'GET') return response;

  const source = await response.text();
  if (source.includes('VMC Username')) return new Response(source, response);

  const marker = '${esc(profile?.receipt_reference||\'Not provided\')}</strong></div></div></div>';
  const addition = '${esc(profile?.receipt_reference||\'Not provided\')}</strong></div><div><small>VMC Username</small><strong>${esc(profile?.username||\'Not available\')}</strong></div></div></div>';
  const loginText = '<div class="form-actions"><button class="btn btn-red" type="button" id="successLogin">My VMC Account</button>';
  const loginReplacement = '<p class="vmc-login-guidance">You can sign in using your VMC username, registered phone number, or email address, together with your password.</p><div class="form-actions"><button class="btn btn-red" type="button" id="successLogin">My VMC Account</button>';

  const patched = source.replace(marker, addition).replace(loginText, loginReplacement);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(patched, { status: response.status, statusText: response.statusText, headers });
}
