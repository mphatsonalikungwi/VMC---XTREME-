(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

const phoneOk=v=>/^(?:\+265|265|0)(?:7|8|9)\d{7,8}$/
  .test(String(v||'').replace(/[\s-]/g,''));

const usernameOk=v=>/^[a-z0-9][a-z0-9._-]{2,31}$/
  .test(String(v||'').trim().toLowerCase());

const prices={
  'Per Day':{Single:2000,Double:3000},
  'Per Week':{Single:8000,Double:10000},
  'Per Month':{Single:30000,Double:35000}
};

const unitFor=tier=>{
  if(tier==='Per Day')return'day';
  if(tier==='Per Week')return'week';
  if(tier==='Per Month')return'month';
  return'';
};

const amountFor=(tier,session,count)=>
  Number(prices[tier]?.[session]||0)*Number(count||0);

function errorBox(msg){
  const e=$('#registerError');
  if(e){
    e.textContent=msg||'';
    e.classList.toggle('show',!!msg);
  }
}

function updateRegistrationPrice(){
  const tier=$('#tier')?.value||'';
  const session=$('#session')?.value||'';
  const duration=$('#durationCount');
  const count=Math.max(
    1,
    Math.min(3650,parseInt(duration?.value||'1',10)||1)
  );

  if(duration)duration.value=count;

  const unit=unitFor(tier);
  const unitSelect=$('#durationUnit');

  if(unitSelect && unit){
    unitSelect.value=unit;
  }

  const hint=$('#durationHint');

  if(hint){
    hint.textContent=tier
      ? `Duration is counted in ${unit}${count===1?'':'s'}.`
      :'Select a membership plan to set the duration unit.';
  }

  const total=$('#calculatedTotal');

  if(total){
    total.textContent=`K ${amountFor(tier,session,count).toLocaleString('en-MW')}`;
  }
}

function registrationMarkup(){

return `
<div class="vmc-reg-progress">
  <span id="vmcRegStep1" class="active">1. Account & Payment</span>
  <span id="vmcRegStep2">2. Personal Details</span>
</div>

<div id="vmcRegStepOne">

  <div class="form-grid">

    <div class="field full">
      <label for="fullName">Full Name</label>
      <input
        id="fullName"
        name="full_name"
        type="text"
        autocomplete="name"
        required>
    </div>

    <div class="field">
      <label for="registerUsername">VMC Username</label>
      <input
        id="registerUsername"
        name="username"
        type="text"
        autocomplete="username"
        minlength="3"
        maxlength="32"
        pattern="[a-z0-9][a-z0-9._-]{2,31}"
        placeholder="Choose your username"
        required>
    </div>

    <div class="field">
      <label for="phoneNumber">Phone Number</label>
      <input
        id="phoneNumber"
        name="phone_number"
        type="tel"
        autocomplete="tel"
        placeholder="e.g. 0991203382"
        required>
    </div>

    <div class="field full">
      <label for="registerEmail">
        Email
        <span style="text-transform:none;letter-spacing:0;color:#777d86">
          (Optional)
        </span>
      </label>
      <input
        id="registerEmail"
        name="email"
        type="email"
        autocomplete="email">
    </div>

    <div class="field">
      <label for="registerPassword">Password</label>
      <input
        id="registerPassword"
        name="password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required>
    </div>

    <div class="field">
      <label for="tier">Membership</label>
      <select id="tier" name="membership_tier" required>
        <option value="">Select</option>
        <option>Per Day</option>
        <option>Per Week</option>
        <option>Per Month</option>
      </select>
    </div>

    <div class="field">
      <label for="session">Session Type</label>
      <select id="session" name="session_type" required>
        <option value="">Select</option>
        <option>Single</option>
        <option>Double</option>
      </select>
    </div>

    <div class="field">
      <label for="durationCount">Duration</label>
      <input
        id="durationCount"
        name="duration_count"
        type="number"
        min="1"
        max="3650"
        step="1"
        inputmode="numeric"
        placeholder="Enter duration"
        autocomplete="off"
        required>
      <small
        id="durationHint"
        style="color:#ffaa00">
        Select a membership plan to set the duration unit.
      </small>
    </div>

    <div class="field">
      <label for="durationUnit">Duration Unit</label>
      <select
        id="durationUnit"
        name="duration_unit"
        required>
        <option value="">Select</option>
        <option value="day">Days</option>
        <option value="week">Weeks</option>
        <option value="month">Months</option>
      </select>
    </div>

    <div class="field">
      <label for="paymentChannel">Payment Method</label>
      <select
        id="paymentChannel"
        name="payment_channel"
        required>
        <option value="">Select</option>
        <option>Airtel Money</option>
        <option>TNM Mpamba</option>
        <option>National Bank</option>
        <option>Cash</option>
      </select>
    </div>

    <div class="field full">
      <div
        class="vmc-reg-price"
        style="background:#222;border-left:4px solid #ff3e3e;padding:12px;border-radius:4px">
        <span style="display:block;color:#aaa;font-size:.85rem">
          Total Amount Due
        </span>
        <strong
          id="calculatedTotal"
          style="font-size:1.4rem">
          K 0
        </strong>
      </div>
    </div>

    <div class="field full">
      <label
        class="check"
        style="display:flex;gap:8px;align-items:flex-start">
        <input
          id="rulesCheck"
          type="checkbox"
          name="rules_accepted"
          value="true"
          required>
        <span>I agree to all 15 VMC gym rules.</span>
      </label>
    </div>

  </div>

  <div
    class="form-error"
    id="registerError"
    role="alert">
  </div>

  <div class="form-actions">
    <button
      class="btn btn-red"
      id="vmcRegistrationContinue"
      type="button">
      Continue to Next Step →
    </button>
  </div>

</div>

<div id="vmcRegStepTwo" hidden>

  <p style="font-size:.88rem;color:#aaa">
    Complete these profile details now, or finish them on your first gym visit.
  </p>

  <div class="form-grid">

    <div class="field">
      <label for="dateOfBirth">
        Date of Birth
        <span style="text-transform:none;letter-spacing:0;color:#777d86">
          (Optional)
        </span>
      </label>
      <input
        id="dateOfBirth"
        name="date_of_birth"
        type="date">
    </div>

    <div class="field">
      <label for="gender">
        Gender
        <span style="text-transform:none;letter-spacing:0;color:#777d86">
          (Optional)
        </span>
      </label>

      <select id="gender" name="gender">
        <option value="">Select</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
    </div>

    <div class="field full">
      <label for="emergencyContact">
        Emergency Contact
      </label>

      <input
        id="emergencyContact"
        name="emergency_contact"
        type="text"
        placeholder="Name and phone number"
        required>
    </div>

  </div>

  <div class="form-actions">

    <button
      class="btn btn-dark"
      id="vmcRegistrationBack"
      type="button">
      ← Back
    </button>

    <button
      class="btn btn-red"
      id="registerSubmit"
      type="submit">
      Complete Registration
    </button>

  </div>

</div>

<div class="modal-switch">
  Already a member?
  <button
    class="text-button"
    type="button"
    data-switch="login">
    My VMC Account
  </button>
</div>
`;
}

function preparePublicLogin(){

  const loginEmail=$('#loginEmail');

  if(loginEmail){

    loginEmail.type='text';

    loginEmail.removeAttribute('required');

    loginEmail.placeholder=
      'Username or phone number';

    loginEmail.setAttribute(
      'autocomplete',
      'username'
    );
  }

  const loginLabel=
    $('label[for="loginEmail"]');

  if(loginLabel){
    loginLabel.textContent=
      'VMC Username / Phone Number';
  }
}

function preparePublicForm(){

  const f=$('#registerForm');

  if(!f||!$('#modalWrap'))return;

  if(f.dataset.vmcFinalRegistration==='1')return;

  f.dataset.vmcFinalRegistration='1';

  f.innerHTML=registrationMarkup();

  preparePublicLogin();

  $('#tier')?.addEventListener(
    'change',
    updateRegistrationPrice
  );

  $('#session')?.addEventListener(
    'change',
    updateRegistrationPrice
  );

  $('#durationCount')?.addEventListener(
    'input',
    updateRegistrationPrice
  );

  $('#durationUnit')?.addEventListener(
    'change',
    updateRegistrationPrice
  );

  $('#vmcRegistrationContinue')?.addEventListener(
    'click',
    ()=>{
      const required=[
        'fullName',
        'registerUsername',
        'phoneNumber',
        'registerPassword',
        'tier',
        'session',
        'durationCount',
        'durationUnit',
        'paymentChannel'
      ];

      for(const id of required){

        const field=$(`#${id}`);

        if(field&&!field.checkValidity()){

          field.reportValidity();

          return;
        }
      }

      if(!phoneOk($('#phoneNumber')?.value)){
        errorBox(
          'Please enter a valid Malawi phone number.'
        );
        return;
      }

      if(!usernameOk($('#registerUsername')?.value)){
        errorBox(
          'Choose a VMC Username using 3–32 lowercase letters, numbers, dot, underscore or hyphen.'
        );
        return;
      }

      if(!$('#rulesCheck')?.checked){

        errorBox(
          'You must agree to all 15 VMC gym rules.'
        );

        return;
      }

      errorBox('');

      $('#vmcRegStepOne').hidden=true;
      $('#vmcRegStepTwo').hidden=false;

      $('#vmcRegStep1')?.classList.remove('active');
      $('#vmcRegStep2')?.classList.add('active');

      $('#emergencyContact')?.focus();
    }
  );

  $('#vmcRegistrationBack')?.addEventListener(
    'click',
    ()=>{
      $('#vmcRegStepTwo').hidden=true;
      $('#vmcRegStepOne').hidden=false;

      $('#vmcRegStep2')?.classList.remove('active');
      $('#vmcRegStep1')?.classList.add('active');
    }
  );

  f.addEventListener(
    'submit',
    async e=>{

      e.preventDefault();
      e.stopImmediatePropagation();

      const d=
        Object.fromEntries(
          new FormData(f)
        );

      const count=
        Math.floor(
          Number(d.duration_count||0)
        );

      const unit=
        String(d.duration_unit||'');

      if(String(d.full_name||'').trim().length<2)
        return errorBox('Please enter your full name.');

      if(!usernameOk(d.username))
        return errorBox(
          'Choose a VMC Username using 3–32 lowercase letters, numbers, dot, underscore or hyphen.'
        );

      if(!phoneOk(d.phone_number))
        return errorBox(
          'Please enter a valid Malawi phone number.'
        );

      if(
        d.email &&
        !/^\S+@\S+\.\S+$/.test(
          String(d.email).trim()
        )
      )
        return errorBox(
          'Enter a valid email address or leave it blank.'
        );

      if(String(d.password||'').length<8)
        return errorBox(
          'Password must be at least 8 characters.'
        );

      if(!d.membership_tier||!d.session_type)
        return errorBox(
          'Please select a membership plan and session.'
        );

      if(
        count<1||
        count>3650||
        !['day','week','month'].includes(unit)
      )
        return errorBox(
          'Please enter a valid membership duration.'
        );

      const expectedUnit=
        unitFor(d.membership_tier);

      if(unit!==expectedUnit)
        return errorBox(
          'Please select the duration unit that matches the membership plan.'
        );

      if(!d.payment_channel)
        return errorBox(
          'Please select a payment method.'
        );

      if(
        !d.emergency_contact||
        String(d.emergency_contact).trim().length<2
      )
        return errorBox(
          'Emergency contact is required.'
        );

      if(!$('#rulesCheck')?.checked)
        return errorBox(
          'You must agree to all 15 VMC gym rules.'
        );

      const amount=
        amountFor(
          d.membership_tier,
          d.session_type,
          count
        );

      if(!amount)
        return errorBox(
          'The selected membership price could not be determined.'
        );

      const submit=$('#registerSubmit');

      if(submit){

        submit.disabled=true;
        submit.textContent='Creating account…';

      }

      try{

        const sb=
          window.vmcSupabase||
          window.supabase.createClient(
            window.supabaseUrl,
            window.supabaseKey
          );

        const payload={
          ...d,

          full_name:
            String(d.full_name).trim(),

          username:
            String(d.username).trim().toLowerCase(),

          phone_number:
            String(d.phone_number).trim(),

          email:
            String(d.email||'').trim().toLowerCase(),

          emergency_contact:
            String(d.emergency_contact).trim(),

          duration_count:
            count,

          duration_unit:
            unit,

          membership_amount:
            String(amount),

          payment_reference:
            '',

          receipt_reference:
            '',

          rules_accepted:
            true,

          rules_version:
            'VMC Rules v1.0'
        };

        const {
          data,
          error
        }=
          await sb.functions.invoke(
            'vmc-registration-api',
            {body:payload}
          );

        if(error)throw error;

        if(data?.error)
          throw new Error(data.error);

        if(
          data?.session?.access_token&&
          data?.session?.refresh_token
        ){

          const {
            error:setError
          }=
            await sb.auth.setSession({
              access_token:
                data.session.access_token,

              refresh_token:
                data.session.refresh_token
            });

          if(setError)throw setError;
        }

        const firstName=
          String(d.full_name)
            .trim()
            .split(/\s+/)[0];

        const rv=$('#registerView');
        const sv=$('#successView');

        if(rv)rv.hidden=true;

        if(sv){

          sv.hidden=false;

          sv.innerHTML=`

<div class="success vmc-welcome">

  <div class="success-icon">✓</div>

  <h2>
    Welcome to VMC, ${esc(firstName)}! 💪
  </h2>

  <p class="welcome-lead">
    Thank you for choosing
    <strong>VMC Xtreme Fitness</strong>.
    Your registration has been received.
    Our team will review your registration
    and payment before activating your membership.
  </p>

  <div class="status-box">
    <span class="status-label">
      Registration Status
    </span>

    <span class="status-value">
      Waiting for VMC approval
    </span>
  </div>

  <div class="account-box">

    <div class="account-grid">

      <div>
        <small>VMC Username</small>
        <strong>
          ${esc(data?.username||d.username)}
        </strong>
      </div>

      <div>
        <small>Phone</small>
        <strong>
          ${esc(d.phone_number)}
        </strong>
      </div>

      <div>
        <small>Membership</small>
        <strong>
          ${esc(d.membership_tier)}
          ·
          ${esc(d.session_type)}
          Session
        </strong>
      </div>

      <div>
        <small>Duration</small>
        <strong>
          ${esc(count)}
          ${esc(unit)}
          ${count===1?'':'s'}
        </strong>
      </div>

    </div>

  </div>

  <p style="color:#aaa;font-size:.85rem">
    You can close this window now.
    Once your registration is approved,
    you can sign in using your VMC Username
    or phone number.
  </p>

  <div class="form-actions">

    <button
      class="btn btn-red"
      type="button"
      id="vmcRegDone">
      Close
    </button>

  </div>

</div>
`;

          $('#vmcRegDone')?.addEventListener(
            'click',
            ()=>{
              window.vmcCloseModal?.();
            }
          );
        }

        const title=$('#modalTitle');

        if(title)
          title.textContent=
            'Welcome to VMC';

      }catch(err){

        errorBox(
          String(
            err?.message||
            err||
            'Registration could not be completed.'
          )
        );

      }finally{

        if(submit){

          submit.disabled=false;
          submit.textContent=
            'Complete Registration';

        }
      }

    },
    {capture:true}
  );

  updateRegistrationPrice();
}

/*
 * ------------------------------------------------------------
 * MANAGEMENT ADD CUSTOMER
 * ------------------------------------------------------------
 */

function patchManualCustomer(){

  if(
    typeof window.openCustomer!=='function'||
    window.openCustomer.vmcFinalAligned
  )return;

  const open=function(){

    openModal(
      'Add Customer',
      `
<form class="form" id="customerForm">

  <div class="notice">
    Customers are required to change their password on their first login attempt.
  </div>

  <div class="error" id="formErr"></div>

  <div class="grid2">

    <div class="field">
      <label>Full Name</label>
      <input name="full_name" required>
    </div>

    <div class="field">
      <label>VMC Username</label>
      <input
        name="username"
        minlength="3"
        maxlength="32"
        pattern="[a-z0-9][a-z0-9._-]{2,31}"
        placeholder="Choose username"
        required>
    </div>

    <div class="field">
      <label>Phone Number</label>
      <input
        name="phone_number"
        type="tel"
        required>
    </div>

    <div class="field">
      <label>
        Email
        <span style="text-transform:none;letter-spacing:0">
          (Optional)
        </span>
      </label>
      <input
        name="email"
        type="email">
    </div>

    <div class="field">
      <label>Initial Password</label>
      <input
        name="password"
        type="password"
        minlength="8"
        required>
    </div>

    <div class="field">
      <label>Membership</label>
      <select name="membership_tier" required>
        <option value="">Select</option>
        <option>Per Day</option>
        <option>Per Week</option>
        <option>Per Month</option>
      </select>
    </div>

    <div class="field">
      <label>Session Type</label>
      <select name="session_type" required>
        <option value="">Select</option>
        <option>Single</option>
        <option>Double</option>
      </select>
    </div>

    <div class="field">
      <label>Duration</label>
      <input
        name="duration_count"
        type="number"
        min="1"
        max="3650"
        step="1"
        placeholder="Enter duration"
        required>
    </div>

    <div class="field">
      <label>Duration Unit</label>
      <select name="duration_unit" required>
        <option value="">Select</option>
        <option value="day">Days</option>
        <option value="week">Weeks</option>
        <option value="month">Months</option>
      </select>
    </div>

    <div class="field">
      <label>Payment Method</label>
      <select name="payment_channel" required>
        <option value="">Select</option>
        <option>Airtel Money</option>
        <option>TNM Mpamba</option>
        <option>National Bank</option>
        <option>Cash</option>
      </select>
    </div>

    <div class="field">
      <label>Date of Birth</label>
      <input
        name="date_of_birth"
        type="date">
    </div>

    <div class="field">
      <label>Gender</label>
      <select name="gender">
        <option value="">Select</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
    </div>

    <div class="field">
      <label>Emergency Contact</label>
      <input
        name="emergency_contact"
        required>
    </div>

  </div>

  <label
    style="display:flex;gap:8px;align-items:flex-start;font-size:.72rem">

    <input
      name="rules_accepted"
      type="checkbox"
      value="true"
      required>

    <span>
      I agree to all 15 VMC gym rules.
    </span>

  </label>

  <input
    type="hidden"
    name="rules_version"
    value="VMC Rules v1.0">

  <button
    class="btn red"
    type="submit">
    Create Customer
  </button>

</form>
`
    );

    $('#customerForm').onsubmit=async e=>{

      e.preventDefault();

      const form=e.currentTarget;

      const d=
        Object.fromEntries(
          new FormData(form)
        );

      const err=$('#formErr');

      d.duration_count=
        Math.floor(
          Number(d.duration_count||0)
        );

      try{

        if(
          String(d.full_name||'').trim().length<2
        )
          throw Error(
            'Please enter the customer full name.'
          );

        if(!usernameOk(d.username))
          throw Error(
            'Choose a valid VMC Username.'
          );

        if(!phoneOk(d.phone_number))
          throw Error(
            'Please enter a valid Malawi phone number.'
          );

        if(
          d.email&&
          !/^\S+@\S+\.\S+$/.test(
            String(d.email).trim()
          )
        )
          throw Error(
            'Enter a valid email address or leave it blank.'
          );

        if(String(d.password||'').length<8)
          throw Error(
            'Password must be at least 8 characters.'
          );

        if(!d.membership_tier)
          throw Error(
            'Please select a membership plan.'
          );

        if(!d.session_type)
          throw Error(
            'Please select a session type.'
          );

        if(
          d.duration_count<1||
          d.duration_count>3650
        )
          throw Error(
            'Please enter a valid membership duration.'
          );

        if(
          !['day','week','month'].includes(
            d.duration_unit
          )
        )
          throw Error(
            'Please select a duration unit.'
          );

        if(
          d.duration_unit!==
          unitFor(d.membership_tier)
        )
          throw Error(
            'Please select the correct duration unit for the membership plan.'
          );

        if(!d.payment_channel)
          throw Error(
            'Please select a payment method.'
          );

        if(
          !d.emergency_contact||
          String(d.emergency_contact).trim().length<2
        )
          throw Error(
            'Emergency contact is required.'
          );

        if(
          !form.querySelector(
            '[name="rules_accepted"]'
          )?.checked
        )
          throw Error(
            'The customer must agree to all 15 VMC gym rules.'
          );

        d.rules_accepted=true;

        d.username=
          String(d.username)
            .trim()
            .toLowerCase();

        d.full_name=
          String(d.full_name).trim();

        d.phone_number=
          String(d.phone_number).trim();

        d.email=
          String(d.email||'')
            .trim()
            .toLowerCase();

        d.emergency_contact=
          String(d.emergency_contact).trim();

        d.membership_amount=
          String(
            amountFor(
              d.membership_tier,
              d.session_type,
              d.duration_count
            )
          );

        d.payment_reference='';
        d.receipt_reference='';

        await api(
          'create-member',
          d
        );

        closeModal();

        toast(
          'Customer created. Pending Owner/Admin approval and payment verification.'
        );

        await load();

      }catch(x){

        if(err){

          err.textContent=
            x.message||
            'Unable to create customer.';

          err.classList.add('show');

        }

      }
    };
  };

  open.vmcFinalAligned=true;

  window.openCustomer=open;

  $('#addCustomerBtn')?.addEventListener(
    'click',
    open
  );

  $('#addCustomerBtn2')?.addEventListener(
    'click',
    open
  );
}

/*
 * ------------------------------------------------------------
 * BOOT
 * ------------------------------------------------------------
 */

function boot(){

  preparePublicForm();

  preparePublicLogin();

  patchManualCustomer();

}

if(
  document.readyState==='loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {once:true}
  );

}else{

  boot();

}

setTimeout(
  preparePublicForm,
  100
);

setTimeout(
  patchManualCustomer,
  100
);

setTimeout(
  preparePublicForm,
  500
);

setTimeout(
  patchManualCustomer,
  500
);

})();
