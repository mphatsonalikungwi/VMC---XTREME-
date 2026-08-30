(()=>{'use strict';
const plainLanguage=()=>{
 const replacements=[
  ['VMC Control Centre','VMC Settings'],
  ['Review your business, security and management configuration without exposing technical controls to everyday staff.','Manage your business and account settings in one place.'],
  ['Core VMC information currently configured in the system.','Your business information.'],
  ['Management platform','Business details'],
  ['Current management interface','VMC dashboard'],
  ['Account Security','Account Access'],
  ['Your personal management controls remain separate from customer controls.','Your account access is separate from customer accounts.'],
  ['AUTHENTICATED','SIGNED IN'],
  ['Management role','Your role'],
  ['Access & Permissions','Access'],
  ['Visibility follows the existing VMC role model.','What you can access depends on your role.'],
  ['ROLE BASED','YOUR ROLE'],
  ['PROTECTED','AVAILABLE'],
  ['System Preferences','Preferences'],
  ['Safe operational information — no destructive controls exposed here.','Business settings and account information.'],
  ['Data source','Business records'],
  ['Management records','Business records'],
  ['VMC Database','VMC Records'],
  ['Authentication','Sign-in'],
  ['Secure management session','Active sign-in'],
  ['Signed-in management account','Management Account'],
  ['Your authenticated management identity','Your management account'],
  ['Security','Account Access'],
  ['Keep your account protected','Keep your account safe'],
  ['Password & sign-in','Sign-in details'],
  ['Account protected','Account active'],
  ['ADMINISTRATION','MANAGEMENT'],
  ['Owner/Admin actions','Management actions']
 ];
 const apply=()=>{
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);
  nodes.forEach(node=>{if(node.parentElement?.closest('script,style,noscript'))return;let text=node.nodeValue||'';for(const [from,to] of replacements)text=text.split(from).join(to);if(text!==node.nodeValue)node.nodeValue=text});
 };
 const start=()=>{apply();const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true,characterData:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
};
plainLanguage();
})();