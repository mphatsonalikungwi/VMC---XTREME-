(()=>{'use strict';
const boot=()=>{
  if(document.getElementById('VMC_MEMBER_GALLERY_REPAIR'))return;
  const style=document.createElement('style');
  style.id='VMC_MEMBER_GALLERY_REPAIR_STYLE';
  style.textContent=`
    #vmcNotice.notice,#vmcViewer.notice{position:fixed!important;inset:0!important;z-index:300!important;display:none!important;align-items:center!important;justify-content:center!important;padding:16px!important;background:rgba(0,0,0,.78)!important;backdrop-filter:blur(10px)!important}
    #vmcNotice.notice.open,#vmcViewer.notice.open{display:flex!important}
    #vmcNotice .notice-card,#vmcViewer .notice-card{width:min(520px,100%)!important;max-height:calc(100vh - 32px)!important;overflow:auto!important;margin:0!important;padding:22px!important;border:1px solid #30343c!important;border-radius:20px!important;background:#111317!important;box-shadow:0 24px 80px rgba(0,0,0,.55)!important}
    #vmcNotice .notice-card h2{margin:0 0 10px!important;color:#fff!important;font-size:1.15rem!important}
    #vmcNotice .notice-card p{margin:0 0 16px!important;color:#aeb4bd!important;line-height:1.55!important}
    #vmcViewer .notice-card{display:flex!important;flex-direction:column!important;gap:10px!important;align-items:stretch!important}
    #vmcViewerImage{display:block!important;width:100%!important;max-height:62vh!important;object-fit:contain!important;border-radius:14px!important;background:#070809!important}
    #vmcGalleryGrid .vmc-gallery-tile-wrap{display:flex;flex-direction:column;gap:7px;min-width:0}
    #vmcGalleryGrid .vmc-gallery-tile-wrap>.gallery-tile{width:100%}
    #vmcGalleryGrid .vmc-gallery-profile-btn{width:100%;padding:9px 7px;font-size:.65rem;border:1px solid #3b414b;border-radius:7px;background:#17191e;color:#fff;font-weight:800}
    #vmcGalleryGrid .vmc-gallery-profile-btn:disabled{opacity:.55;cursor:default}
    #vmcGalleryGrid .empty{grid-column:1/-1}
    #vmcGalleryUploadMessage{margin-top:12px;padding:11px 13px;border:1px solid #244d35;border-radius:10px;background:#102318;color:#9be7b2;font-size:.75rem;display:none}
    #vmcGalleryUploadMessage.show{display:block}
  `;
  document.head.appendChild(style);

  const showSafeNotice=(title,message)=>{
    const titleEl=document.getElementById('vmcNoticeTitle'),messageEl=document.getElementById('vmcNoticeMessage'),notice=document.getElementById('vmcNotice');
    if(titleEl)titleEl.textContent=title;
    if(messageEl)messageEl.textContent=message;
    if(notice)notice.classList.add('open');
  };

  const enhanceGallery=()=>{
    const grid=document.getElementById('vmcGalleryGrid');
    if(!grid)return;
    grid.querySelectorAll(':scope>.gallery-tile').forEach(tile=>{
      if(tile.parentElement?.classList.contains('vmc-gallery-tile-wrap'))return;
      const wrap=document.createElement('div');wrap.className='vmc-gallery-tile-wrap';
      tile.parentNode.insertBefore(wrap,tile);wrap.appendChild(tile);
      const action=document.createElement('button');action.type='button';action.className='vmc-gallery-profile-btn';action.textContent='Make profile picture';
      const isProfile=tile.querySelector('.badge');
      if(isProfile){action.textContent='Current profile picture';action.disabled=true;}
      action.addEventListener('click',()=>{
        tile.click();
        window.setTimeout(()=>{
          const viewer=document.getElementById('vmcViewer'),profileBtn=document.getElementById('vmcViewerProfile');
          if(viewer?.classList.contains('open')&&profileBtn&&!profileBtn.disabled)profileBtn.click();
          else if(!viewer?.classList.contains('open'))showSafeNotice('Photo unavailable','Please open the photo again and try once more.');
        },80);
      });
      wrap.appendChild(action);
    });
  };

  const grid=document.getElementById('vmcGalleryGrid');
  if(grid)new MutationObserver(enhanceGallery).observe(grid,{childList:true,subtree:true});
  enhanceGallery();

  const viewerProfile=document.getElementById('vmcViewerProfile');
  if(viewerProfile){
    viewerProfile.addEventListener('click',()=>{
      const image=document.getElementById('vmcViewerImage');
      if(!image?.src){
        showSafeNotice('Select a photo','Open a gallery photo before choosing a profile picture.');
      }
    },true);
  }

  const originalNoticeClose=document.getElementById('vmcNoticeClose');
  if(originalNoticeClose)originalNoticeClose.addEventListener('click',()=>document.getElementById('vmcNotice')?.classList.remove('open'),true);

  const galleryInput=document.getElementById('vmcGalleryInput');
  if(galleryInput){
    galleryInput.addEventListener('change',()=>{
      const gridNow=document.getElementById('vmcGalleryGrid');
      if(gridNow)gridNow.scrollIntoView({behavior:'smooth',block:'center'});
    },true);
  }

  const cleanupMessages=()=>{
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length===0&&/Could not update picture|Cannot read properties of undefined \(reading ['"]id['"]\)/i.test(el.textContent||'')){
        el.textContent='';
      }
    });
  };
  cleanupMessages();
  new MutationObserver(cleanupMessages).observe(document.body,{childList:true,subtree:true,characterData:true});
  document.documentElement.style.visibility='visible';
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();