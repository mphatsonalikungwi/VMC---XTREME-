(()=>{
  'use strict';
  const MAX=10;
  const style=document.createElement('style');
  style.textContent=`
    .vmc-gallery-launch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding:14px 16px;border:1px solid #393d45;border-radius:15px;background:#17191e;color:#fff;cursor:pointer;font-weight:850;width:100%;text-align:left}
    .vmc-gallery-launch span:last-child{color:#8ee9aa;font-size:12px}
    .vmc-gallery-content[hidden]{display:none!important}
    .vmc-gallery-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.88)}
    .vmc-gallery-modal.is-open{display:flex}
    .vmc-gallery-dialog{width:min(720px,100%);max-height:92vh;display:flex;flex-direction:column;gap:12px}
    .vmc-gallery-view{display:flex;align-items:center;justify-content:center;min-height:240px;max-height:70vh;border:1px solid #393d45;border-radius:18px;background:#0b0c0f;overflow:hidden}
    .vmc-gallery-view img{display:block;max-width:100%;max-height:70vh;object-fit:contain}
    .vmc-gallery-toolbar{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    .vmc-gallery-toolbar button{border:1px solid #444952;border-radius:999px;padding:10px 14px;background:#17191e;color:#fff;font-weight:800;cursor:pointer}
    .vmc-gallery-toolbar .primary{background:#8ee9aa;color:#08100b;border-color:#8ee9aa}
    .vmc-gallery-toolbar .danger{background:#e31b2d;border-color:#e31b2d}
    .vmc-gallery-toolbar .close{margin-right:auto}
    .vmc-gallery-message{min-height:18px;color:#aeb4bd;font-size:12px}
    @media(max-width:600px){.vmc-gallery-toolbar button{flex:1}.vmc-gallery-toolbar .close{flex:0 0 100%}}
  `;
  document.head.appendChild(style);
  const find=()=>document.querySelector('#galleryGrid')?.closest('.card');
  const init=()=>{
    const card=find(); if(!card||card.dataset.vmcViewerReady)return;
    const grid=card.querySelector('#galleryGrid'); if(!grid)return;
    card.dataset.vmcViewerReady='1';
    const note=card.querySelector('.gallery-note');
    const launch=document.createElement('button'); launch.type='button'; launch.className='vmc-gallery-launch';
    launch.innerHTML='<span>Open My VMC Photos</span><span>View gallery →</span>';
    const content=document.createElement('div'); content.className='vmc-gallery-content'; content.hidden=true;
    grid.parentNode.insertBefore(content,grid); content.appendChild(grid);
    if(note) content.insertBefore(note,grid);
    card.appendChild(launch);
    launch.onclick=()=>{content.hidden=!content.hidden;launch.querySelector('span:last-child').textContent=content.hidden?'View gallery →':'Hide gallery ↑'};

    const modal=document.createElement('div'); modal.className='vmc-gallery-modal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
    modal.innerHTML='<div class="vmc-gallery-dialog"><div class="vmc-gallery-view"><img alt="Selected VMC member photo"></div><div class="vmc-gallery-toolbar"><button type="button" class="close">Close</button><button type="button" class="primary set-profile">Set as Profile Picture</button><button type="button" class="danger delete-photo">Delete Photo</button></div><div class="vmc-gallery-message"></div></div>';
    document.body.appendChild(modal);
    let selected=null;
    const msg=v=>modal.querySelector('.vmc-gallery-message').textContent=v||'';
    const open=item=>{selected=item;modal.querySelector('img').src=item.querySelector('img').src;msg('');modal.classList.add('is-open');};
    const close=()=>{modal.classList.remove('is-open');selected=null;};
    grid.addEventListener('click',e=>{const item=e.target.closest('.gallery-item');if(!item||e.target.closest('.delete'))return;open(item)});
    modal.querySelector('.close').onclick=close;
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    modal.querySelector('.delete-photo').onclick=async()=>{
      if(!selected)return;
      const button=modal.querySelector('.delete-photo');
      if(!confirm('Delete this photo from your VMC gallery?'))return;
      const image=selected.querySelector('img'); const src=image.src.split('?')[0]; const name=src.split('/').pop();
      try{button.disabled=true;msg('Deleting photo…');const r=await window.vmcGalleryAction?.('delete',{name});if(r===false)throw Error('Could not delete photo.');close();window.dispatchEvent(new CustomEvent('vmc-gallery-refresh'));}catch(err){msg(err.message||'Could not delete photo.')}finally{button.disabled=false}
    };
    modal.querySelector('.set-profile').onclick=async()=>{
      if(!selected)return;
      const button=modal.querySelector('.set-profile'); const src=selected.querySelector('img').src.split('?')[0]; const name=src.split('/').pop();
      try{button.disabled=true;msg('Setting profile picture…');const r=await window.vmcGalleryAction?.('set-profile',{name});if(r===false)throw Error('Profile picture could not be updated.');msg('Profile picture updated ✓');setTimeout(close,700);window.dispatchEvent(new CustomEvent('vmc-profile-picture-updated',{detail:{url:src}}));}catch(err){msg(err.message||'Profile picture could not be updated.')}finally{button.disabled=false}
    };
    window.addEventListener('vmc-gallery-refresh',()=>{const fn=window.vmcGalleryReload;if(typeof fn==='function')fn()});
    const observer=new MutationObserver(()=>{if(!grid.querySelector('.gallery-item'))return;});observer.observe(grid,{childList:true});
  };
  const boot=()=>{init();if(!document.querySelector('#galleryGrid'))setTimeout(init,1000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();