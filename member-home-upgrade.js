(()=>{'use strict';
const installMemberHome=()=>{
  if(document.getElementById('vmcMemberHomeSnapshot'))return;
  const hero=document.querySelector('.hero');
  const layout=document.querySelector('.layout');
  if(!hero||!layout||typeof sb==='undefined')return;
  const style=document.createElement('style');
  style.id='vmcMemberHomeStyle';
  style.textContent=`
    .vmc-home-state{display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:7px 11px;border:1px solid #30343b;border-radius:999px;background:rgba(0,0,0,.20);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#aeb4bd}
    .vmc-home-state::before{content:'';width:7px;height:7px;border-radius:50%;background:#8f96a0}
    .vmc-home-state.active{border-color:#235a35;color:#9aefb1}.vmc-home-state.active::before{background:#62d984}
    .vmc-home-state.inactive,.vmc-home-state.suspended{border-color:#64232d;color:#ffadb5}.vmc-home-state.inactive::before,.vmc-home-state.suspended::before{background:#e31b2d}
    .vmc-home-payment{grid-column:1/-1;background:linear-gradient(145deg,#111419,#0d0f12);border-color:#292e36}
    .vmc-home-payment .vmc-payment-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:14px}
    .vmc-home-payment .vmc-payment-item{background:#17191e;border:1px solid #252a32;border-radius:14px;padding:12px;min-width:0}
    .vmc-home-payment small{display:block;color:#747b86;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:.05em}
    .vmc-home-payment strong{display:block;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.92rem}
    .vmc-home-payment .vmc-payment-meta{margin-top:10px;color:#858c97;font-size:11px}
    .vmc-home-payment .vmc-payment-meta b{color:#c9ced6;font-weight:800}
    @media(max-width:760px){.vmc-home-payment .vmc-payment-grid{grid-template-columns:1fr 1fr}.vmc-home-payment .vmc-payment-meta{line-height:1.7}}
  `;
  document.head.appendChild(style);
  const state=document.createElement('div');
  state.id='vmcMemberHomeSnapshot';
  state.className='vmc-home-state';
  state.textContent='Account status: Checking…';
  hero.appendChild(state);
  const card=document.createElement('section');
  card.className='card vmc-home-payment wide';
  card.innerHTML='<div class="title"><div><h2>Payment</h2><p style="margin:2px 0 0;color:#8f96a0;font-size:12px">Your current payment status and recorded payment details.</p></div><span id="vmcHomePaymentStatus" class="status">Checking…</span></div><div class="vmc-payment-grid"><div class="vmc-payment-item"><small>Amount</small><strong id="vmcHomePaymentAmount">—</strong></div><div class="vmc-payment-item"><small>Method</small><strong id="vmcHomePaymentMethod">—</strong></div><div class="vmc-payment-item"><small>Reference</small><strong id="vmcHomePaymentReference">—</strong></div><div class="vmc-payment-item"><small>Membership</small><strong id="vmcHomePaymentMembership">—</strong></div></div><div class="vmc-payment-meta">Start: <b id="vmcHomePaymentStart">—</b> &nbsp;·&nbsp; Expiry: <b id="vmcHomePaymentExpiry">—</b></div>';
  const membership=layout.querySelector('.card:not(.sub)');
  if(membership)membership.insertAdjacentElement('afterend',card);else layout.prepend(card);
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||'—'};
  const formatAmount=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?'K'+n.toLocaleString('en-MW'):'Not recorded'};
  const formatStatus=value=>{const raw=String(value||'').trim();return raw?raw.replace(/_/g,' '):'Not recorded'};
  const loadSnapshot=async()=>{
    try{
      const {data:{user},error:userError}=await sb.auth.getUser();
      if(userError||!user)return;
      const {data:p,error}=await sb.from('profiles').select('account_status,payment_status,membership_amount,payment_channel,payment_reference,receipt_reference,membership_tier,session_type,membership_start_date,membership_expiry_date').eq('id',user.id).maybeSingle();
      if(error||!p)return;
      const account=formatStatus(p.account_status);
      state.textContent='Account status: '+account;
      state.className='vmc-home-state '+String(p.account_status||'').toLowerCase();
      const paymentStatus=formatStatus(p.payment_status);
      set('vmcHomePaymentStatus',paymentStatus);
      const statusEl=document.getElementById('vmcHomePaymentStatus');
      if(statusEl){statusEl.className='status '+(String(p.payment_status||'').toLowerCase().includes('verified')?'active':'')}
      set('vmcHomePaymentAmount',formatAmount(p.membership_amount));
      set('vmcHomePaymentMethod',p.payment_channel||'Not recorded');
      set('vmcHomePaymentReference',p.payment_reference||p.receipt_reference||'Not provided');
      set('vmcHomePaymentMembership',[p.membership_tier,p.session_type].filter(Boolean).join(' · ')||'Not active');
      set('vmcHomePaymentStart',p.membership_start_date||'Not active');
      set('vmcHomePaymentExpiry',p.membership_expiry_date||'Awaiting approval');
    }catch(error){console.warn('VMC member home snapshot failed',error)}
  };
  loadSnapshot();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installMemberHome,{once:true});else installMemberHome();
})();

(()=>{'use strict';
const boot=()=>{
  if(document.getElementById('vmcPaymentsUpgrade'))return;
  const card=document.querySelector('.vmc-home-payment');
  if(!card)return;
  const style=document.createElement('style');style.id='vmcPaymentsUpgrade';style.textContent=`
.vmc-payment-status-panel{margin-top:14px;padding:13px 14px;border:1px solid #292e36;border-radius:15px;background:#0d0f12}.vmc-payment-status-row{display:flex;justify-content:space-between;gap:12px;align-items:center}.vmc-payment-status-label{color:#8f96a0;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.vmc-payment-status-message{margin:6px 0 0;color:#aeb4bd;font-size:11px;line-height:1.55}.vmc-payment-status-message strong{color:#f0f2f5}.vmc-payment-status-panel.verified{border-color:#214d30}.vmc-payment-status-panel.review{border-color:#4b3b1b}.vmc-payment-status-panel.failed{border-color:#5a252d}
@media(max-width:760px){.vmc-payment-status-row{align-items:flex-start;flex-direction:column;gap:6px}}
`;
  document.head.appendChild(style);
  const panel=document.createElement('div');panel.className='vmc-payment-status-panel';panel.innerHTML='<div class="vmc-payment-status-row"><span class="vmc-payment-status-label">Payment record</span><strong id="vmcPaymentRecordState">Checking…</strong></div><p class="vmc-payment-status-message" id="vmcPaymentRecordMessage">Checking your latest payment record.</p>';
  card.appendChild(panel);
  const normalize=v=>String(v||'').trim().toLowerCase().replace(/[_-]+/g,' ');
  const refresh=()=>{
    const state=normalize(document.getElementById('vmcHomePaymentStatus')?.textContent);
    const amount=document.getElementById('vmcHomePaymentAmount')?.textContent?.trim()||'Not recorded';
    const method=document.getElementById('vmcHomePaymentMethod')?.textContent?.trim()||'Not recorded';
    const reference=document.getElementById('vmcHomePaymentReference')?.textContent?.trim()||'Not provided';
    const stateEl=document.getElementById('vmcPaymentRecordState'),message=document.getElementById('vmcPaymentRecordMessage');
    if(!stateEl||!message)return;
    const verified=state.includes('verified'),review=state.includes('pending')||state.includes('review'),failed=state.includes('failed')||state.includes('rejected')||state.includes('declined');
    panel.className='vmc-payment-status-panel '+(verified?'verified':review?'review':failed?'failed':'');
    stateEl.textContent=verified?'Payment confirmed':review?'Payment under review':failed?'Payment needs attention':'Payment record';
    if(verified)message.innerHTML=`<strong>${amount}</strong> received via <strong>${method}</strong>. VMC has confirmed this payment.`;
    else if(review)message.innerHTML=`VMC is reviewing your payment. Keep your <strong>${method}</strong> transaction details${reference!=='Not provided'?` (reference <strong>${reference}</strong>)`:''} available.`;
    else if(failed)message.innerHTML='This payment is not currently confirmed. Check the payment details or contact VMC before submitting another payment.';
    else message.textContent='Your latest payment information will appear here after VMC records it.';
  };
  refresh();
  const observer=new MutationObserver(refresh);card.querySelectorAll('#vmcHomePaymentStatus,#vmcHomePaymentAmount,#vmcHomePaymentMethod,#vmcHomePaymentReference').forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));
  setTimeout(()=>observer.disconnect(),15000);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

(()=>{'use strict';
const galleryBoot=()=>{
  if(document.getElementById('vmcMemberPhotos'))return;
  const layout=document.querySelector('.layout');
  if(!layout||typeof sb==='undefined')return;

  const style=document.createElement('style');
  style.id='vmcMemberPhotosStyle';
  style.textContent=`
    .vmc-member-photos{grid-column:1/-1}
    .vmc-member-photos-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:5px}
    .vmc-member-photos-copy{margin:0;color:#8f96a0;font-size:12px;line-height:1.5}
    .vmc-member-photos-add{position:relative;overflow:hidden;flex:none}
    .vmc-member-photos-add input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
    .vmc-photo-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:15px}
    .vmc-photo-item{position:relative;aspect-ratio:1;border:1px solid #292d35;border-radius:15px;overflow:hidden;background:#17191e;padding:0;cursor:pointer}
    .vmc-photo-item img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .2s ease}
    .vmc-photo-item:hover img{transform:scale(1.03)}
    .vmc-photo-badge{position:absolute;left:7px;bottom:7px;padding:5px 7px;border-radius:8px;background:rgba(8,9,11,.82);border:1px solid rgba(255,255,255,.14);font-size:9px;font-weight:900;color:#fff}
    .vmc-photo-empty{margin-top:14px;padding:22px 15px;border:1px dashed #343842;border-radius:15px;text-align:center;color:#8f96a0;font-size:12px}
    .vmc-photo-count{color:#747b86;font-size:10px;font-weight:900;white-space:nowrap}
    .vmc-photo-viewer{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.9);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:18px}
    .vmc-photo-viewer.open{display:flex}
    .vmc-photo-panel{width:min(900px,100%);max-height:100%;display:flex;flex-direction:column;gap:12px}
    .vmc-photo-stage{position:relative;min-height:0;display:flex;align-items:center;justify-content:center;background:#060709;border:1px solid #292d35;border-radius:20px;padding:12px;overflow:hidden}
    .vmc-photo-stage img{display:block;width:auto;height:auto;max-width:100%;max-height:68vh;object-fit:contain;border-radius:12px}
    .vmc-photo-viewer-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .vmc-photo-viewer-name{margin:0;color:#fff;font-size:1rem;font-weight:900}
    .vmc-photo-viewer-state{margin:2px 0 0;color:#8f96a0;font-size:11px}
    .vmc-photo-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
    .vmc-photo-actions .btn{min-height:44px}
    .vmc-photo-actions .delete{border-color:#6d2530;background:#351117;color:#ffadb5}
    .vmc-photo-actions .delete:hover{background:#46151d}
    .vmc-photo-actions .close{background:#17191e}
    @media(max-width:760px){.vmc-member-photos{grid-column:auto}.vmc-member-photos-head{align-items:flex-start;flex-direction:column}.vmc-member-photos-add{width:100%}.vmc-photo-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.vmc-photo-actions{grid-template-columns:1fr}.vmc-photo-stage img{max-height:62vh}.vmc-photo-viewer{padding:10px}.vmc-photo-stage{padding:8px;border-radius:16px}}
  `;
  document.head.appendChild(style);

  const card=document.createElement('section');
  card.id='vmcMemberPhotos';
  card.className='card vmc-member-photos wide';
  card.innerHTML='<div class="vmc-member-photos-head"><div><h2>My Photos</h2><p class="vmc-member-photos-copy">Keep your favourite VMC moments here. Tap a photo to view it full size.</p></div><label class="btn vmc-member-photos-add">Add photo<input id="vmcGalleryInput" type="file" accept="image/jpeg,image/png,image/webp"></label></div><div class="vmc-photo-count" id="vmcPhotoCount">0 of 10 photos</div><div class="vmc-photo-grid" id="vmcPhotoGrid"></div>';
  const anchor=document.querySelector('.vmc-home-payment')||layout.querySelector('.card');
  if(anchor)anchor.insertAdjacentElement('afterend',card);else layout.appendChild(card);

  const viewer=document.createElement('div');
  viewer.className='vmc-photo-viewer';
  viewer.id='vmcPhotoViewer';
  viewer.innerHTML='<div class="vmc-photo-panel" role="dialog" aria-modal="true" aria-labelledby="vmcPhotoViewerName"><div class="vmc-photo-viewer-head"><div><h2 class="vmc-photo-viewer-name" id="vmcPhotoViewerName">Photo</h2><p class="vmc-photo-viewer-state" id="vmcPhotoViewerState">VMC photo</p></div></div><div class="vmc-photo-stage"><img id="vmcPhotoViewerImage" alt="VMC photo"></div><div class="vmc-photo-actions"><button class="btn red" type="button" id="vmcPhotoSetProfile">Make profile picture</button><button class="btn delete" type="button" id="vmcPhotoDelete">Delete photo</button><button class="btn close" type="button" id="vmcPhotoClose">Close</button></div></div>';
  document.body.appendChild(viewer);

  let photos=[];
  let profileAvatarUrl='';
  let activePhoto=null;

  const toastMessage=message=>{
    const t=document.getElementById('toast');
    if(!t)return;
    t.textContent=message;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),3500);
  };

  const readFile=file=>new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });

  const compressImage=source=>new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      const max=1600;
      const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const width=Math.max(1,Math.round(img.naturalWidth*scale));
      const height=Math.max(1,Math.round(img.naturalHeight*scale));
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d');
      if(!ctx)return reject(new Error('Your browser could not process the image.'));
      ctx.drawImage(img,0,0,width,height);
      let quality=.84;
      let output=canvas.toDataURL('image/webp',quality);
      while(output.length>5_000_000&&quality>.5){quality-=.07;output=canvas.toDataURL('image/webp',quality)}
      resolve(output);
    };
    img.onerror=()=>reject(new Error('That image could not be processed.'));
    img.src=source;
  });

  const isCurrentProfile=photo=>{
    if(!photo||!profileAvatarUrl)return false;
    const clean=value=>String(value||'').split('?')[0];
    return clean(photo.url)===clean(profileAvatarUrl);
  };

  const updateCount=()=>{
    const count=document.getElementById('vmcPhotoCount');
    if(count)count.textContent=`${photos.length} of 10 photos`;
  };

  const render=()=>{
    const grid=document.getElementById('vmcPhotoGrid');
    if(!grid)return;
    grid.innerHTML='';
    updateCount();
    if(!photos.length){
      grid.innerHTML='<div class="vmc-photo-empty" style="grid-column:1/-1">No photos yet. Add a photo to start your VMC collection.</div>';
      return;
    }
    photos.forEach(photo=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='vmc-photo-item';
      button.title='Open photo';
      const image=document.createElement('img');
      image.src=`${photo.url}${photo.url.includes('?')?'&':'?'}v=${Date.now()}`;
      image.alt='VMC photo';
      button.appendChild(image);
      if(isCurrentProfile(photo)){
        const badge=document.createElement('span');
        badge.className='vmc-photo-badge';
        badge.textContent='Profile picture';
        button.appendChild(badge);
      }
      button.addEventListener('click',()=>openPhoto(photo));
      grid.appendChild(button);
    });
  };

  const closeViewer=()=>{
    viewer.classList.remove('open');
    activePhoto=null;
    const image=document.getElementById('vmcPhotoViewerImage');
    if(image)image.src='';
  };

  const openPhoto=photo=>{
    activePhoto=photo;
    const image=document.getElementById('vmcPhotoViewerImage');
    const state=document.getElementById('vmcPhotoViewerState');
    const setButton=document.getElementById('vmcPhotoSetProfile');
    const deleteButton=document.getElementById('vmcPhotoDelete');
    if(image){image.src=`${photo.url}${photo.url.includes('?')?'&':'?'}v=${Date.now()}`;image.alt='VMC photo'}
    const current=isCurrentProfile(photo);
    if(state)state.textContent=current?'This is your profile picture.':'VMC photo';
    if(setButton){setButton.textContent=current?'Profile picture':'Make profile picture';setButton.disabled=current}
    if(deleteButton){deleteButton.disabled=current;deleteButton.textContent=current?'Set another profile picture first':'Delete photo'}
    viewer.classList.add('open');
  };

  const loadPhotos=async()=>{
    try{
      const {data:{user},error:userError}=await sb.auth.getUser();
      if(userError||!user)return;
      const {data:profile,error:profileError}=await sb.from('profiles').select('avatar_url').eq('id',user.id).maybeSingle();
      if(!profileError)profileAvatarUrl=profile?.avatar_url||'';
      const {data,error}=await sb.functions.invoke('vmc-member-gallery',{body:{action:'list'}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      photos=Array.isArray(data?.files)?data.files:[];
      render();
    }catch(error){
      console.warn('VMC photo gallery load failed',error);
      toastMessage(error?.message||'We could not load your photos.');
    }
  };

  const input=document.getElementById('vmcGalleryInput');
  input?.addEventListener('change',async()=>{
    const file=input.files?.[0];
    input.value='';
    if(!file)return;
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){toastMessage('Please choose a JPG, PNG or WebP image.');return}
    if(file.size>12*1024*1024){toastMessage('Please choose an image under 12 MB.');return}
    if(photos.length>=10){toastMessage('Your VMC gallery is full. You can keep up to 10 photos.');return}
    const addButton=document.querySelector('.vmc-member-photos-add');
    if(addButton){addButton.classList.add('uploading');addButton.setAttribute('aria-busy','true')}
    try{
      const source=await readFile(file);
      const dataUrl=await compressImage(source);
      const {data,error}=await sb.functions.invoke('vmc-member-gallery',{body:{action:'upload',data_url:dataUrl}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      await loadPhotos();
      toastMessage('Photo added to your VMC gallery ✓');
    }catch(error){
      console.error('VMC photo gallery upload failed',error);
      toastMessage(error?.message||'Photo upload failed.');
    }finally{
      if(addButton){addButton.classList.remove('uploading');addButton.removeAttribute('aria-busy')}
    }
  });

  document.getElementById('vmcPhotoSetProfile')?.addEventListener('click',async()=>{
    if(!activePhoto||isCurrentProfile(activePhoto))return;
    const button=document.getElementById('vmcPhotoSetProfile');
    button.disabled=true;button.textContent='Updating…';
    try{
      const {data,error}=await sb.functions.invoke('vmc-member-gallery',{body:{action:'set_profile_picture',name:activePhoto.name}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      profileAvatarUrl=data.avatar_url||activePhoto.url;
      const avatar=document.getElementById('avatar');
      if(avatar)avatar.innerHTML=`<img src="${profileAvatarUrl}?v=${Date.now()}" alt="Profile">`;
      render();
      openPhoto(activePhoto);
      toastMessage('Profile picture updated ✓');
    }catch(error){
      console.error('VMC gallery profile update failed',error);
      toastMessage(error?.message||'We could not update your profile picture.');
    }finally{
      button.disabled=false;
      button.textContent='Make profile picture';
    }
  });

  document.getElementById('vmcPhotoDelete')?.addEventListener('click',async()=>{
    if(!activePhoto||isCurrentProfile(activePhoto))return;
    const button=document.getElementById('vmcPhotoDelete');
    button.disabled=true;button.textContent='Deleting…';
    try{
      const {data,error}=await sb.functions.invoke('vmc-member-gallery',{body:{action:'delete',name:activePhoto.name}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      photos=photos.filter(photo=>photo.name!==activePhoto.name);
      render();
      closeViewer();
      toastMessage('Photo deleted.');
    }catch(error){
      console.error('VMC gallery photo delete failed',error);
      toastMessage(error?.message||'We could not delete that photo.');
      button.disabled=false;button.textContent='Delete photo';
    }
  });

  document.getElementById('vmcPhotoClose')?.addEventListener('click',closeViewer);
  viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&viewer.classList.contains('open'))closeViewer()});
  loadPhotos();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',galleryBoot,{once:true});else galleryBoot();
})();