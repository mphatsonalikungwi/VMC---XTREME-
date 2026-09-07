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

export async function onRequestGet(context){
  if(!allowedRequest(context.request))return json({error:'Origin not allowed.'},403);
  try{
    const upstream=await fetch(SUPABASE_FUNCTION_URL,{method:'OPTIONS',headers:{'apikey':SUPABASE_PUBLISHABLE_KEY,'Origin':'https://vmcxtreme.pages.dev','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'apikey,content-type'}});
    return json({ok:true,service:'vmc-registration-proxy',upstream_status:upstream.status,upstream_ok:upstream.ok},200);
  }catch(error){
    console.error('VMC registration proxy upstream health check error:',error);
    return json({ok:true,service:'vmc-registration-proxy',upstream_status:null,upstream_ok:false,upstream_error:'Unable to reach Supabase registration service.'},200);
  }
}

export async function onRequestOptions(context){
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':context.request.headers.get('Origin')||'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'content-type','Cache-Control':'no-store'}});
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
