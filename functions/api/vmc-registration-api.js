const SUPABASE_FUNCTION_URL='https://czdxwlioouuredaliplw.supabase.co/functions/v1/vmc-registration-api';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI';

function allowedRequest(request){
  const origin=request.headers.get('Origin')||'';
  if(origin)return origin==='https://vmcxtreme.pages.dev'||/^https:\/\/[a-z0-9-]+\.vmcxtreme\.pages\.dev$/.test(origin);
  const host=new URL(request.url).hostname;
  return host==='vmcxtreme.pages.dev'||/^[a-z0-9-]+\.vmcxtreme\.pages\.dev$/.test(host);
}

function json(body,status){
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}

export async function onRequestOptions(context){
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':context.request.headers.get('Origin')||'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'content-type','Cache-Control':'no-store'}});
}

export async function onRequestPost(context){
  const request=context.request;
  if(!allowedRequest(request))return json({error:'Origin not allowed.'},403);
  try{
    const body=await request.text();
    const upstream=await fetch(SUPABASE_FUNCTION_URL,{method:'POST',headers:{'apikey':SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json','Origin':'https://vmcxtreme.pages.dev'},body});
    const responseBody=await upstream.text();
    return new Response(responseBody,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('Content-Type')||'application/json','Cache-Control':'no-store'}});
  }catch(error){
    console.error('VMC registration proxy error:',error);
    return json({error:'Unable to reach the VMC registration service.'},502);
  }
}
