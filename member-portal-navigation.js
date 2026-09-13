(()=>{'use strict';
const boot=()=>{
  if(document.getElementById('vmcMemberNavigation'))return;
  const layout=document.querySelector('.layout');
  const hero=document.querySelector('.hero');
  if(!layout||!hero||typeof sb==='undefined')return;

  const style=document.createElement('style');
  style.id='vmcMemberNavigationStyle';
  style.textContent=`
    #vmcMemberNavigation{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 16px;padding:8px;background:#111318;border:1px solid #292d35;border-radius:18px;position:relative;z-index:5}
    .vmc-nav-link{appearance:none;border:0;background:transparent;color:#9ca3ad;border-radius:12px;padding:11px 14px;font:inherit;font-size:13px;font-weight:850;cursor:pointer}
    .vmc-nav-link:hover,.vmc-nav-link.active{background:#2a1117;color:#fff}
    .vmc-nav-link.active{box-shadow:inset 0 -2px #e31b2d}
    .vmc-nav-spacer{flex:1}
    .vmc-member-view{display:none}
    .vmc-member-view.active{display:contents}
    #vmcProfileView.active,#vmcGalleryView.active,#vmcSettingsView.active{display:block}
    #vmcGalleryView,#vmcSettingsView{grid-column:1/-1}
    .vmc-section-card{background:#111318;border:1px solid #292d35;border-radius:22px;padding:21px}
    .vmc-section-card h2{margin:0 0 6px;font-size:1.1rem}
    .vmc-section-card p{color:#9ca3ad;font-size:13px}
    .vmc-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
    .vmc-setting-box{padding:16px;border:1px solid #292d35;border-radius:16px;background:#17191e}
    .vmc-setting-box h3{margin:0 0 5px;font-size:14px}
    .vmc-setting-box p{margin:0 0 12px;font-size:12px}
    .vmc-setting-box input{width:100%;padding:11px;border:1px solid #363a42;border-radius:10px;background:#0d0f12;color:#fff;font:inherit;margin-bottom:8px}
    .vmc-setting-box button{width:100%}
    .vmc-setting-message{min-height:18px;margin-top:8px;font-size:12px}
    .vmc-modal{position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(8px)}
    .vmc-modal.open{display:flex}.vmc-modal-card{width:min(420px,100%);background:#111318;border:1px solid #54232c;border-radius:20px;padding:22px;box-shadow:0 20px 80px #000}
    .vmc-modal-card h2{margin:0 0 8px}.vmc-modal-card p{color:#b7bdc7;font-size:13px}.vmc-modal-card button{width:100%;margin-top:10px}
    @media(max-width:760px){#vmcMemberNavigation{display:grid;grid-template-columns:1fr 1fr}.vmc-nav-spacer{display:none}.vmc-nav-link{width:100%}.vmc-settings-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const nav=document.createElement('nav');
  nav.id='vmcMemberNavigation';
  nav.setAttribute('aria-label','Member navigation');
  nav.innerHTML='<button class="vmc-nav-link active" data-view="profile">My Profile</button><button class="vmc-nav-link" data-view="gallery">My VMC Gallery</button><span class="vmc-nav-spacer"></span><button class="vmc-nav-link" data-view="settings">Settings</button><button class="vmc-nav-link" id="vmcNavLogout">Logout</button>';
  hero.insertAdjacentElement('afterend',nav);

  const gallery=document.getElementById('vmcMemberPhotos');
  if(gallery){
    gallery.classList.add('vmc-gallery-original');
    gallery.style.display='none';
  }

  const profileView=document.createElement('div');profileView.id='vmcProfileView';profileView.className='vmc-member-view active';
  while(layout.firstChild){
    const node=layout.firstChild;
    if(node===gallery){layout.removeChild(node);continue}
    profileView.appendChild(node);
  }
  layout.appendChild(profileView);

  const galleryView=document.createElement('div');galleryView.id='vmcGalleryView';galleryView.className='vmc-member-view';
  galleryView.innerHTML='<section class="vmc-section-card"><h2>My VMC Gallery</h2><p>Your personal collection of VMC moments. Select a photo to open it full size, make it your profile picture, or delete it.</p><div id="vmcGalleryMount"></div></section>';
  layout.appendChild(galleryView);
  if(gallery)document.getElementById('vmcGalleryMount').appendChild(gallery);

  const settingsView=document.createElement('div');settingsView.id='vmcSettingsView';settingsView.className='vmc-member-view';
  settingsView.innerHTML='<section class="vmc-section-card"><h2>Settings</h2><p>Manage your VMC account details and security.</p><div class="vmc-settings-grid"><div class="vmc-setting-box"><h3>Change VMC username</h3><p>You may choose a new username if it is available.</p><input id="vmcNewUsername" type="text" autocomplete="username" placeholder="New VMC username"><button class="btn red" id="vmcSaveUsername" type="button">Save username</button><div class="vmc-setting-message" id="vmcUsernameMessage"></div></div><div class="vmc-setting-box"><h3>Change password</h3><p>Use a strong password you do not use elsewhere.</p><input id="vmcNewPassword" type="password" autocomplete="new-password" placeholder="New password"><input id="vmcConfirmPassword" type="password" autocomplete="new-password" placeholder="Confirm new password"><button class="btn red" id="vmcSavePassword" type="button">Update password</button><div class="vmc-setting-message" id="vmcPasswordMessage"></div></div></div></section>';
  layout.appendChild(settingsView);

  const modal=document.createElement('div');modal.className='vmc-modal';modal.id='vmcSettingsModal';modal.innerHTML='<div class="vmc-modal-card" role="dialog" aria-modal="true"><h2 id="vmcModalTitle">Notice</h2><p id="vmcModalMessage"></p><button class="btn red" id="vmcModalClose" type="button">Continue</button></div>';document.body.appendChild(modal);
  const showModal=(title,message)=>{document.getElementById('vmcModalTitle').textContent=title;document.getElementById('vmcModalMessage').textContent=message;modal.classList.add('open')};
  document.getElementById('vmcModalClose').onclick=()=>modal.classList.remove('open');

  const setView=view=>{
    document.querySelectorAll('.vmc-nav-link[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
    profileView.classList.toggle('active',view==='profile');galleryView.classList.toggle('active',view==='gallery');settingsView.classList.toggle('active',view==='settings');
    if(view==='gallery'&&gallery)gallery.style.display='block';
    if(view!=='gallery'&&gallery)gallery.style.display='block';
    window.scrollTo({top:0,behavior:'smooth'});
  };
  nav.querySelectorAll('.vmc-nav-link[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  document.getElementById('vmcNavLogout').onclick=async()=>{await sb.auth.signOut();location.href='index.html'};

  document.getElementById('vmcSaveUsername').onclick=async()=>{
    const input=document.getElementById('vmcNewUsername'),message=document.getElementById('vmcUsernameMessage'),button=document.getElementById('vmcSaveUsername');
    const username=input.value.trim().replace(/^@/,'');
    if(!/^[a-zA-Z0-9_]{3,30}$/.test(username)){message.style.color='#ff9ca6';message.textContent='Use 3–30 letters, numbers or underscores.';return}
    button.disabled=true;button.textContent='Saving…';message.textContent='';
    try{
      const {data:{user},error:userError}=await sb.auth.getUser();if(userError||!user)throw new Error('Your session has expired.');
      const {data:existing,error:checkError}=await sb.from('profiles').select('id').eq('username',username).neq('id',user.id).maybeSingle();
      if(checkError)throw checkError;if(existing)throw new Error('That username is already in use.');
      const {error}=await sb.from('profiles').update({username}).eq('id',user.id);if(error)throw error;
      document.getElementById('username').textContent='@'+username;input.value='';message.style.color='#8ee9aa';message.textContent='Username updated successfully.';
    }catch(error){message.style.color='#ff9ca6';message.textContent=error?.message||'Username could not be updated.'}finally{button.disabled=false;button.textContent='Save username'}
  };

  document.getElementById('vmcSavePassword').onclick=async()=>{
    const password=document.getElementById('vmcNewPassword').value,confirm=document.getElementById('vmcConfirmPassword').value,message=document.getElementById('vmcPasswordMessage'),button=document.getElementById('vmcSavePassword');
    if(!password||!confirm){showModal('Password required','Enter and confirm your new password.');return}
    if(password!==confirm){showModal('Passwords do not match','The two passwords are different. Please enter the same password in both fields.');return}
    if(password.length<8){showModal('Password too short','Your password must be at least 8 characters long.');return}
    button.disabled=true;button.textContent='Updating…';message.textContent='';
    try{const {error}=await sb.auth.updateUser({password});if(error)throw error;document.getElementById('vmcNewPassword').value='';document.getElementById('vmcConfirmPassword').value='';message.style.color='#8ee9aa';message.textContent='Password updated successfully.';showModal('Password updated','Your password has been changed successfully.')}catch(error){message.style.color='#ff9ca6';message.textContent=error?.message||'Password could not be updated.'}finally{button.disabled=false;button.textContent='Update password'}
  };
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
