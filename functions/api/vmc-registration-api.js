const SUPABASE_FUNCTION_URL='https://czdxwlioouuredaliplw.supabase.co/functions/v1/vmc-registration-api';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_-ldpCiaxCElX9c7Q6zLqqQ_gHUBunBI';

export async function onRequestPost(context){
  const request=context.request;
  const origin=request.headers.get('Origin')||'';
  if(!origin.endsWith('.vmcxtreme.pages.dev') && origin!=='https://vmcxtreme.pages.dev'){
    return new Response(JSON.stringify({error:'Origin not allowed.'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
  try{
    const body=await request.text();
    const upstream=await fetch(SUPABASE_FUNCTION_URL,{
      method:'POST',
      headers:{
        'apikey':SUPABASE_PUBLISHABLE_KEY,
        'Content-Type':'application/json',
        'Origin':'https://vmcxtreme.pages.dev'
      },
      body
    });
    const responseBody=await upstream.text();
    return new Response(responseBody,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('Content-Type')||'application/json','Cache-Control':'no-store'}});
  }catch(error){
    return new Response(JSON.stringify({error:'Unable to reach the VMC registration service.'}),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
}
