/* VMC REGISTRATION LAYOUT V3 — compact two-column field layout */
(()=>{
  'use strict';
  const install=()=>{
    if(document.getElementById('vmcRegistrationLayoutV3'))return;
    const style=document.createElement('style');
    style.id='vmcRegistrationLayoutV3';
    style.textContent=`
      /* Keep the registration modal comfortable while preventing long single-line fields. */
      #registerView{width:100%;}
      #registerView #registerForm{width:100%;}
      #registerView .vmc-reg-step:not([hidden]){
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:14px 16px!important;
        width:100%!important;
        align-items:start!important;
      }
      #registerView .vmc-reg-step > .field,
      #registerView .vmc-reg-step > .vmc-reg-section{
        min-width:0!important;
        width:100%!important;
        margin:0!important;
      }
      /* Section headings/copy and totals span the form, but their controls remain two-column. */
      #registerView .vmc-reg-step > .vmc-reg-section,
      #registerView .vmc-reg-step > .vmc-reg-rules,
      #registerView .vmc-reg-step > .vmc-reg-actions,
      #registerView .vmc-reg-step > .form-error,
      #registerView .vmc-reg-step > .notice,
      #registerView .vmc-reg-step > p{
        grid-column:1/-1!important;
      }
      #registerView .vmc-reg-step > .field.full{
        grid-column:auto!important;
      }
      #registerView .vmc-reg-step .vmc-reg-section{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:12px 16px!important;
      }
      #registerView .vmc-reg-step .vmc-reg-section > h4,
      #registerView .vmc-reg-step .vmc-reg-section > .vmc-reg-section-copy,
      #registerView .vmc-reg-step .vmc-reg-section > .vmc-reg-price{
        grid-column:1/-1!important;
      }
      #registerView .vmc-reg-step .vmc-reg-section > .field{
        min-width:0!important;
        width:100%!important;
        margin:0!important;
      }
      #registerView .vmc-reg-step .field input,
      #registerView .vmc-reg-step .field select{
        width:100%!important;
        min-width:0!important;
      }
      #registerView .vmc-reg-step .vmc-reg-price{
        width:100%!important;
      }
      /* Keep the introductory cards and progress indicator full-width. */
      #registerView .vmc-reg-progress,
      #registerView .selected-plan{
        width:100%!important;
      }
      @media(max-width:520px){
        #registerView .vmc-reg-step:not([hidden]){
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:12px 10px!important;
        }
        #registerView .vmc-reg-step .vmc-reg-section{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:10px!important;
        }
        #registerView .vmc-reg-step .field label{font-size:.68rem!important;}
        #registerView .vmc-reg-step .field input,
        #registerView .vmc-reg-step .field select{padding:11px 10px!important;font-size:.88rem!important;}
      }
    `;
    document.head.appendChild(style);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
