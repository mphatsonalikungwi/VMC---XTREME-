import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const patch = read('cloudflare-ui-patch.js');
const fixesV2 = read('cloudflare-ui-fixes-v2.js');
const security = read('vmc-security.js');
const income = read('income-dashboard.js');
const language = read('unit01-language.js');
const registrationAlignment = read('cloudflare-registration-alignment.js');
const hardening = read('cloudflare-final-hardening.js');

const tags = {
  VMC_CLOUDFLARE_UI_PATCH:
    `<script id="VMC_CLOUDFLARE_UI_PATCH">\n${patch}\n</script>`,

  VMC_UI_FIXES_V2:
    `<script id="VMC_UI_FIXES_V2">\n${fixesV2}\n</script>`,

  VMC_SECURITY_CONTROLS:
    `<script id="VMC_SECURITY_CONTROLS">\n${security}\n</script>`,

  VMC_OWNER_INCOME:
    `<script id="VMC_OWNER_INCOME">\n${income}\n</script>`,

  VMC_UNIT01_LANGUAGE:
    `<script id="VMC_UNIT01_LANGUAGE">\n${language}\n</script>`,

  VMC_REGISTRATION_ALIGNMENT:
    `<script id="VMC_REGISTRATION_ALIGNMENT">\n${registrationAlignment}\n</script>`,

  VMC_FINAL_HARDENING:
    `<script id="VMC_FINAL_HARDENING">\n${hardening}\n</script>`
};

let index = read('index.html');
let app = read('app.js');
let dashboard = read('dashboard.html');

/*
 * ------------------------------------------------------------
 * PUBLIC LANGUAGE
 * ------------------------------------------------------------
 */

const publicWords = [
  ['Admin Login', 'Management Login'],
  ['Member Login', 'My VMC Account'],
  ['Create Member Account', 'Create My Account'],
  ['Create your member account', 'Create your VMC account'],
  ['VMC Member Onboarding', 'Welcome to VMC'],
  ['Member Account', 'My VMC Account'],
  ['VMC Management Account', 'Management Account'],
  ['Secure Your VMC Account', 'Keep Your Account Secure'],
  ['Payment status', 'Payment'],
  ['Payment channel', 'Payment method'],
  ['Receipt / Reference', 'Payment reference'],
  ['Pending Payment Verification', 'Payment being reviewed'],
  ['VMC management will verify payment', 'We will confirm your payment'],
  [
    'Your VMC account is connected to the member system.',
    'Your VMC account is ready to use.'
  ],
  ['Registration received.', 'Welcome to VMC!'],
  ['Change your password.', 'Create Your New Password'],
  [
    'Password changed successfully.',
    'Your password has been updated successfully.'
  ],
  ['Choose your new membership.', 'Choose Your Next Membership'],
  ['Previous service', 'Previous membership'],
  ['Membership tier', 'Membership plan']
];

for (const [from, to] of publicWords) {
  index = index.split(from).join(to);
  app = app.split(from).join(to);
}

/*
 * ------------------------------------------------------------
 * PUBLIC REGISTRATION — NORMALISE DURATION STRUCTURE
 * ------------------------------------------------------------
 */

if (!index.includes('name="duration_count"')) {
  const marker =
    '<div class="field"><label for="session">Session Type</label><select id="session" name="session_type" required><option value="">Select</option><option>Single</option><option>Double</option></select></div>';

  const extra =
    marker +
    '<div class="field"><label for="durationCount">Duration</label>' +
    '<input id="durationCount" name="duration_count" type="number" min="1" max="3650" value="1" required></div>' +
    '<div class="field"><label for="durationUnit">Duration Unit</label>' +
    '<select id="durationUnit" name="duration_unit" required>' +
    '<option value="day">Days</option>' +
    '<option value="week">Weeks</option>' +
    '<option value="month" selected>Months</option>' +
    '</select></div>';

  index = index.replace(marker, extra);
}

/*
 * ------------------------------------------------------------
 * APP VALIDATION / DURATION
 * ------------------------------------------------------------
 */

if (!app.includes('amountForDuration')) {
  app = app.replace(
    "const priceFor=(tier,session)=>prices[tier]?.[session]||0;",
    "const priceFor=(tier,session)=>prices[tier]?.[session]||0;" +
      "const durationLabel=(count,unit)=>`${count} ${unit}${Number(count)===1?'':'s'}';" +
      "const amountForDuration=(tier,session,count,unit)=>priceFor(tier,session)*Number(count||1);"
  );

  app = app.replace(
    "if(!d.membership_tier)return'Please select a membership plan.';if(!d.session_type)return'Please select Single or Double Session.';if(!d.payment_channel)return'Please select a payment channel.';",
    "if(!d.membership_tier)return'Please select a membership plan.';" +
      "if(!d.session_type)return'Please select Single or Double Session.';" +
      "if(!Number.isInteger(Number(d.duration_count))||Number(d.duration_count)<1)return'Please enter a valid duration.';" +
      "if(!['day','week','month'].includes(d.duration_unit))return'Please select a duration unit.';" +
      "if(!d.payment_channel)return'Please select a payment method.';"
  );

  app = app.replace(
    "const amount=state.selectedPlan?.price||priceFor(d.membership_tier,d.session_type);",
    "const count=Math.floor(Number(d.duration_count||1))," +
      "unit=String(d.duration_unit||'month')," +
      "amount=amountForDuration(d.membership_tier,d.session_type,count,unit);"
  );

  app = app.replace(
    "membership_amount:String(amount),payment_channel:d.payment_channel,",
    "membership_amount:String(amount)," +
      "membership_duration_count:String(count)," +
      "membership_duration_unit:unit," +
      "payment_channel:d.payment_channel,"
  );
}

/*
 * ------------------------------------------------------------
 * LOGIN
 * ------------------------------------------------------------
 */

app = app.replace(
  'supabase.auth.signInWithPassword({email,password})',
  'window.vmcSecureLogin(email,password)'
);

/*
 * ------------------------------------------------------------
 * MANAGEMENT API
 * ------------------------------------------------------------
 */

dashboard = dashboard.replace(
  'vmc-admin-api-v2',
  'vmc-admin-api-v5'
);

/*
 * ------------------------------------------------------------
 * MANAGEMENT LANGUAGE
 * ------------------------------------------------------------
 */

const dashboardWords = [
  ['Command Center', 'VMC Overview'],
  ['Immediate Attention', 'Needs Attention'],
  ['Renewals & Expiry', 'Memberships'],
  ['Staff Management', 'Team Management'],
  ['Payment Channel', 'Payment Method'],
  ['Receipt / Reference', 'Payment Reference'],
  ['Owner/Admin action', 'Owner/Admin only'],
  ['Owner/Admin actions', 'Owner/Admin only'],
  ['VMC operations at a glance.', 'A quick look at what needs attention.'],
  [
    'Visibility follows the VMC management hierarchy.',
    'Team visibility follows your management role.'
  ],
  ['Add Management', 'Add Team Member'],
  ['Create Management Account', 'Create Team Account']
];

for (const [from, to] of dashboardWords) {
  dashboard = dashboard.split(from).join(to);
}

/*
 * ------------------------------------------------------------
 * MANAGEMENT CUSTOMER DURATION
 * ------------------------------------------------------------
 */

if (!dashboard.includes('name="duration_count"')) {
  const marker =
    '<div class="field"><label>Membership</label><select name="membership_tier"><option>Per Day</option><option>Per Week</option><option>Per Month</option></select></div><div class="field"><label>Session</label>';

  const extra =
    '<div class="field"><label>Membership</label>' +
    '<select name="membership_tier">' +
    '<option>Per Day</option>' +
    '<option>Per Week</option>' +
    '<option>Per Month</option>' +
    '</select></div>' +
    '<div class="field"><label>Duration</label>' +
    '<input name="duration_count" type="number" min="1" max="3650" value="1" required></div>' +
    '<div class="field"><label>Duration unit</label>' +
    '<select name="duration_unit">' +
    '<option value="day">Days</option>' +
    '<option value="week">Weeks</option>' +
    '<option value="month" selected>Months</option>' +
    '</select></div>' +
    '<div class="field"><label>Session</label>';

  dashboard = dashboard.replace(marker, extra);
}

/*
 * ------------------------------------------------------------
 * MANAGEMENT ROLE SAFETY
 * ------------------------------------------------------------
 */

dashboard = dashboard.replace(
  "const owner=state.caller?.is_admin?'<option value=\"owner\">Owner</option>':'';",
  "const owner='';"
);

/*
 * ------------------------------------------------------------
 * REMOVE MANAGEMENT-SIDE RENEWAL CREATION
 *
 * Customers create renewals.
 * Management reviews/approves them.
 * ------------------------------------------------------------
 */

/* Remove visible Create Renewal buttons/links. */
dashboard = dashboard.replace(
  /<button[^>]*(?:create|renew)[^>]*>[^<]*(?:Create Renewal|Renew)[^<]*<\/button>/gi,
  ''
);

dashboard = dashboard.replace(
  /<a[^>]*(?:create|renew)[^>]*>[^<]*(?:Create Renewal|Renew)[^<]*<\/a>/gi,
  ''
);

/* Remove obvious renewal creation cards/sections. */
dashboard = dashboard.replace(
  /<section[^>]*>[\s\S]*?(?:Create Renewal|createRenewal)[\s\S]*?<\/section>/gi,
  ''
);

dashboard = dashboard.replace(
  /<div[^>]*>[\s\S]*?(?:Create Renewal|createRenewal)[\s\S]*?<\/div>/gi,
  ''
);

/*
 * Disable the old management renewal function without
 * destroying renewal records or approval functionality.
 */
dashboard = dashboard.replace(
  /function\s+openRenewal\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g,
  "function openRenewal(){return false;}"
);

dashboard = dashboard.replace(
  /function\s+createRenewal\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g,
  "function createRenewal(){return false;}"
);

/*
 * ------------------------------------------------------------
 * DETERMINISTIC SCRIPT UPSERT
 *
 * IMPORTANT:
 * Existing generated patches are REPLACED every build.
 * They are never left stale merely because their ID exists.
 * ------------------------------------------------------------
 */

function upsert(html, id, tag) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const re = new RegExp(
    `<script\\s+id=["']${escaped}["'][\\s\\S]*?<\\/script>`,
    'gi'
  );

  if (re.test(html)) {
    return html.replace(re, tag);
  }

  return html.replace(/<\/body>/i, `${tag}</body>`);
}

for (const [id, tag] of Object.entries(tags)) {
  index = upsert(index, id, tag);
  dashboard = upsert(dashboard, id, tag);
}

/*
 * ------------------------------------------------------------
 * WRITE OUTPUT
 * ------------------------------------------------------------
 */

fs.writeFileSync('index.html', index);
fs.writeFileSync('app.js', app);
fs.writeFileSync('dashboard.html', dashboard);

console.log(
  'VMC Cloudflare build completed with deterministic patch replacement and management renewal removal.'
);
