export async function onRequest(context){
  const response=await context.next();
  const url=new URL(context.request.url);
  if(url.pathname.startsWith('/api/'))return response;
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('text/html'))return response;

  const html=await response.text();
  const patch=`<script id="VMC_STAGING_REGISTRATION_FLOW_FIX">
(()=>{
  'use strict';
  const originalFetch=window.fetch.bind(window);
  const registrationPath='/functions/v1/vmc-registration-api';
  const proxyPath='/api/vmc-registration-api';
  window.__vmcGeneratedUsername='';

  window.fetch=async function(input,init){
    try{
      const requestUrl=new URL(typeof input==='string'?input:input?.url||'',location.href);
      if(requestUrl.pathname===registrationPath){
        const proxyUrl=new URL(proxyPath,location.origin);
        const response=await originalFetch(proxyUrl.toString(),init);
        response.clone().json().then(data=>{
          if(data?.username)window.__vmcGeneratedUsername=String(data.username);
          window.dispatchEvent(new CustomEvent('vmc-registration-response',{detail:data}));
        }).catch(()=>{});
        return response;
      }
    }catch(e){}
    return originalFetch(input,init);
  };

  const showUsername=()=>{
    const username=String(window.__vmcGeneratedUsername||'').trim();
    const view=document.getElementById('successView');
    if(!username||!view||view.hidden||view.dataset.vmcUsernameShown==='1')return;
    const grid=view.querySelector('.account-grid');
    if(!grid)return;
    const item=document.createElement('div');
    item.innerHTML='<small>VMC Username</small><strong></strong>';
    item.querySelector('strong').textContent=username;
    grid.insertBefore(item,grid.firstElementChild);
    view.dataset.vmcUsernameShown='1';
  };

  window.addEventListener('vmc-registration-response',showUsername);
  new MutationObserver(showUsername).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',showUsername,{once:true});
})();
</script>`;

  return new Response(html.replace('</head>',patch+'</head>'),{
    status:response.status,
    statusText:response.statusText,
    headers:response.headers
  });
}
