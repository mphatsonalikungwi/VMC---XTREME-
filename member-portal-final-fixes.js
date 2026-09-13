(()=>{'use strict';
const boot=()=>{
 const root=document.querySelector('.portal'); if(!root||typeof sb==='undefined')return;
 const $=s=>document.querySelector(s), side=$('.side'), top=$('.top'), bar=$('.bar'), content=$('.content');
 if(!side||!bar||!content)return;
 const views={home:$('#vmcPortalHome'),profile:$('#vmcProfileView'),gallery:$('#vmcGalleryView'),settings:$('#vmcSettingsView')};
 const oldNav=[...side.querySelectorAll('[data-vmc-view]')];
 const existingHome=views.home;
 const css=document.createElement('style'); css.id='vmc-final-fixes-style'; css.textContent=`
 .vmc-final-brand{display:flex!important;align-items:center!important;gap:0!important;text-decoration:none!important;white-space:nowrap!important}
 .vmc-final-brand .vmc-brand-vmc{color:#17212b!important;font-weight:950!important;letter-spacing:-.07em!important}
 .vmc-final-brand .vmc-brand-x{color:#e31b3b!important;font-weight:950!important;letter-spacing:-.07em!important}
 .vmc-final-brand small{display:block!important;color:#718096!important;font-size:8px!important;letter-spacing:.34em!important;text-align:center!important;margin-top:2px!important}
 .vmc-final-menu-home{order:-10!important}
 .vmc-final-drawer-head{display:block!important;padding:0 10px 18px!important;margin-bottom:10px!important;border-bottom:1px solid #dce5e2!important}
 .vmc-final-drawer-head strong{display:block!important;font-size:18px!important;color:#17212b!important}
 .vmc-final-drawer-head span{display:block!important;color:#687582!important;font-size:12px!important;margin-top:3px!important}
 .vmc-final-gallery-note{margin-top:12px!important;color:#687582!important;font-size:12px!important}
 @media(max-width:520px){.top .wrap{width:calc(100% - 20px)!important}.brand{font-size:24px!important}.top-user{gap:6px!important}}
 `; document.getElementById(css.id)?.remove(); document.head.appendChild(css);
 const brand=$('.brand'); if(brand){brand.classList.add('vmc-final-brand');brand.innerHTML='<span><span class="vmc-brand-vmc">VMC</span> <span class="vmc-brand-x">XTREME</span><small>FITNESS</small></span>'}
 let toggle=$('.vmc-menu-toggle'); if(!toggle){toggle=document.createElement('button');toggle.className='vmc-menu-toggle';toggle.type='button';toggle.textContent='☰';toggle.setAttribute('aria-label','Open navigation menu');const user=$('.top-user');(user||bar).prepend(toggle)}
 let backdrop=$('.vmc-menu-backdrop');if(!backdrop){backdrop=document.createElement('div');backdrop.className='vmc-menu-backdrop';document.body.appendChild(backdrop)}
 const close=()=>{side.classList.remove('vmc-open');backdrop.classList.remove('open');toggle.textContent='☰';toggle.setAttribute('aria-label','Open navigation menu')};
 toggle.onclick=()=>{const open=!side.classList.contains('vmc-open');side.classList.toggle('vmc-open',open);backdrop.classList.toggle('open',open);toggle.textContent=open?'×':'☰';toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')}; backdrop.onclick=close;
 if(!side.querySelector('.vmc-final-menu-home')){const b=document.createElement('button');b.type='button';b.className='nav-btn vmc-final-menu-home';b.dataset.vmcView='home';b.textContent='⌂  Home';side.insertBefore(b,side.firstChild)}
 if(!side.querySelector('.vmc-final-drawer-head')){const h=document.createElement('div');h.className='vmc-final-drawer-head';h.innerHTML='<strong>My VMC</strong><span>Manage your membership space</span>';side.insertBefore(h,side.firstChild)}
 const nav=[...side.querySelectorAll('[data-vmc-view]')];
 const show=v=>{Object.entries(views).forEach(([k,e])=>{if(e)e.classList.toggle('active',k===v);});if(existingHome)existingHome.style.display=v==='home'?'block':'none';nav.forEach(b=>b.classList.toggle('active',b.dataset.vmcView===v));close();window.scrollTo({top:0,behavior:'smooth'});if(v==='gallery')window.setTimeout(()=>window.vmcReloadGallery?.(),0)};
 nav.forEach(b=>{b.onclick=e=>{e.preventDefault();show(b.dataset.vmcView)}});
 document.querySelectorAll('[data-home-view]').forEach(b=>b.onclick=()=>show(b.dataset.homeView));
 const galleryInput=$('#vmcGalleryInput'), grid=$('#vmcGalleryGrid'); if(grid&&galleryInput){
   const key=()=>{const u=window.__vmcUserId||'member';return 'vmc_gallery_fallback_'+u};
   const readLocal=()=>{try{return JSON.parse(localStorage.getItem(key())||'[]')}catch{return[]}};
   const writeLocal=p=>{try{localStorage.setItem(key(),JSON.stringify(p.slice(-10)))}catch(e){console.warn('Local gallery cache unavailable',e)}};
   let galleryPhotos=[];
   const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const render=()=>{const count=$('#vmcGalleryCount');if(count)count.textContent=`${galleryPhotos.length} of 10 photos`;if(!galleryPhotos.length){grid.innerHTML='<div class="empty">Your VMC gallery is empty. Upload your first photo to get started.</div>';return}grid.innerHTML=galleryPhotos.map((p,i)=>`<button class="gallery-tile" type="button" data-final-gallery-index="${i}"><img src="${esc(p.url)}" alt="VMC photo ${i+1}">${p.is_profile?'<span class="badge">Profile picture</span>':''}</button>`).join('')};
   const load=async()=>{try{const r=await sb.functions.invoke('vmc-member-gallery',{body:{action:'list'}});if(r.error)throw r.error;if(r.data?.error)throw Error(r.data.error);const server=Array.isArray(r.data?.photos)?r.data.photos:[];const local=readLocal();const seen=new Set(server.map(p=>p.url));galleryPhotos=server.concat(local.filter(p=>!seen.has(p.url))).slice(0,10);render()}catch(e){galleryPhotos=readLocal();render();if(!galleryPhotos.length)grid.innerHTML=`<div class="empty">${esc(e.message||'Gallery could not be loaded.')}</div>`}};
   window.vmcReloadGallery=load;
   const replacement=galleryInput.cloneNode(true);galleryInput.replaceWith(replacement);
   replacement.addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>8*1024*1024){const t=$('#vmcNoticeTitle'),m=$('#vmcNoticeMessage'),n=$('#vmcNotice');if(t&&m&&n){t.textContent='Image not accepted';m.textContent='Choose a JPG, PNG, or WebP image smaller than 8 MB.';n.classList.add('open')}return}const reader=new FileReader();reader.onload=async()=>{try{const dataUrl=String(reader.result);const r=await sb.functions.invoke('vmc-member-gallery',{body:{action:'upload',data_url:dataUrl}});if(r.error)throw r.error;if(r.data?.error)throw Error(r.data.error);await load();const serverHas=dataUrl=>galleryPhotos.some(p=>p.url===dataUrl||p.data_url===dataUrl);if(!serverHas(dataUrl)){const local=readLocal();local.push({id:'local_'+Date.now(),url:dataUrl,data_url:dataUrl,is_profile:false,local_only:true});writeLocal(local);await load()}const t=$('#vmcNoticeTitle'),m=$('#vmcNoticeMessage'),n=$('#vmcNotice');if(t&&m&&n){t.textContent='Photo uploaded';m.textContent='Your photo has been saved to My VMC Gallery.';n.classList.add('open')}}catch(err){const t=$('#vmcNoticeTitle'),m=$('#vmcNoticeMessage'),n=$('#vmcNotice');if(t&&m&&n){t.textContent='Upload failed';m.textContent=err.message||'Please try again.';n.classList.add('open')}}};reader.readAsDataURL(file)});
   load();
 }
 // Home is the default landing view; profile is opened from Home or menu.
 show('home');
}; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();