(function(){
  'use strict';
  const hydration='HYDRATION: 500ml water botter available within the site at K1000';
  const replacements=[
    [/\bJWT\b/gi,'secure sign-in'],
    [/\bAPI\b/gi,'VMC service'],
    [/\bbackend\b/gi,'VMC service'],
    [/\bdatabase\b/gi,'VMC records'],
    [/\bendpoint\b/gi,'VMC service']
  ];
  function clean(root=document.body){
    if(!root)return;
    root.querySelectorAll('.water').forEach(el=>{el.textContent=hydration});
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(n.parentElement && !['SCRIPT','STYLE','NOSCRIPT'].includes(n.parentElement.tagName))nodes.push(n);
    }
    nodes.forEach(n=>{
      let v=n.nodeValue;
      replacements.forEach(([rx,to])=>{v=v.replace(rx,to)});
      if(v!==n.nodeValue)n.nodeValue=v;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>clean(),{once:true});else clean();
  new MutationObserver(()=>clean()).observe(document.body,{childList:true,subtree:true});
})();
