import fs from 'node:fs';

const patch=fs.readFileSync('cloudflare-ui-patch.js','utf8');
const fixesV2=fs.readFileSync('cloudflare-ui-fixes-v2.js','utf8');
const security=fs.readFileSync('vmc-security.js','utf8');
const income=fs.readFileSync('income-dashboard.js','utf8');
const language=fs.readFileSync('unit01-language.js','utf8');
const registrationAlignment=fs.readFileSync('cloudflare-registration-alignment.js','utf8');
const hardening=fs.readFileSync('cloudflare-final-hardening.js','utf8');
const customerExperience=fs.readFileSync('customer-experience.js','utf8');
const registrationWizard=fs.readFileSync('vmc-registration-wizard.js','utf8');
const fixesV2Tag='<script id="VMC_UI_FIXES_V2">\n'+fixesV2+'\n</script>';
const securityTag='<script id="VMC_SECURITY_CONTROLS">\n'+security+'\n</script>';
const incomeTag='<script id="VMC_OWNER_INCOME">\n'+income+'\n</script>';
const languageTag='<script id="VMC_UNIT01_LANGUAGE">\n'+language+'\n</script>';
const registrationAlignmentTag='<script id="VMC_REGISTRATION_ALIGNMENT">\n'+registrationAlignment+'\n</script>';
const hardeningTag='<script id="VMC_FINAL_HARDENING">\n'+hardening+'\n</script>';
const customerExperienceTag='<script id="VMC_CUSTOMER_EXPERIENCE">\n'+customerExperience+'\n</script>';
const registrationWizardTag='<script id="VMC_REGISTRATION_WIZARD">\n'+registrationWizard+'\n</script>';

let index=fs.readFileSync('index.html','utf8');
let app=fs.readFileSync('app.js','utf8');
let dashboard=fs.readFileSync('dashboard.html','utf8');

const publicWords=[
 ['Admin Login','Management Login'],['Member Login','My VMC Account'],['Create Member Account','Create My Account'],
 ['Create your member account','Create your VMC account'],['VMC Member Onboarding','Welcome to VMC'],['Member Account','My VMC Account'],
 ['VMC Management Account','Management Account'],['Secure Your VMC Account','Keep Your Account Secure'],['Payment status','Payment'],
 ['Payment channel','Payment method'],['Receipt / Reference','Payment reference'],['Pending Payment Verification','Payment being reviewed'],
 ['VMC management will verify payment','We will confirm your payment'],['Your VMC account is connected to the member system.','Your VMC account is ready to use.'],
 ['Registration received.','Welcome to VMC!'],['Change your password.','Create Your New Password'],['Password changed successfully.','Your password has been updated successfully.'],
 ['Choose your new membership.','Choose Your Next Membership'],['Previous service','Previous membership'],['Membership tier','Membership plan']
];
for(const [a,b] of publicWords){index=index.split(a).join(b);app=app.split(a).join(b)}

if(!index.includes('name="duration_count"')){
 const marker='<div class="field"><label for="session">Session Type</label><select id="session" name="session_type" required><option value="">Select</option><option>Single</option><option>Double</option></select></div>';
 const extra=marker+'<div class="field"><label for="durationCount">Duration</label><input id="durationCount" name="duration_count" type="number" min="1" max="3650" value="1" required></div><div class="field"><label for="durationUnit">Duration Unit</label><select id="durationUnit" name="duration_unit" required><option value="day">Days</option><option value="week">Weeks</option><option value="month" selected>Months</option></select></div>';
 index=index.replace(marker,extra);
}

if(!app.includes('amountForDuration')){
 app=app.replace("const priceFor=(tier,session)=>prices[tier]?.[session]||0;", "const priceFor=(tier,session)=>prices[tier]?.[session]||0;const durationLabel=(count,unit)=>`${count} ${unit}${Number(count)===1?'':'s'}`;const amountForDuration=(tier,session,count,unit)=>priceFor(tier,session)*Number(count||1);");
 app=app.replace("if(!d.membership_tier)return'Please select a membership plan.';if(!d.session_type)return'Please select Single or Double Session.';if(!d.payment_channel)return'Please select a payment channel.';", "if(!d.membership_tier)return'Please select a membership plan.';if(!d.session_type)return'Please select Single or Double Session.';if(!Number.isInteger(Number(d.duration_count))||Number(d.duration_count)<1)return'Please enter a valid duration.';if(!['day','week','month'].includes(d.duration_unit))return'Please select a duration unit.';if(!d.payment_channel)return'Please select a payment method.';");
 app=app.replace("const amount=state.selectedPlan?.price||priceFor(d.membership_tier,d.session_type);", "const count=Math.floor(Number(d.duration_count||1)),unit=String(d.duration_unit||'month'),amount=amountForDuration(d.membership_tier,d.session_type,count,unit);");
 app=app.replace("membership_amount:String(amount),payment_channel:d.payment_channel,", "membership_amount:String(amount),membership_duration_count:String(count),membership_duration_unit:unit,payment_channel:d.payment_channel,");
}
app=app.replace('supabase.auth.signInWithPassword({email,password})','window.vmcSecureLogin(email,password)');

dashboard=dashboard.replace('vmc-admin-api-v2','vmc-admin-api-v5');
for(const [a,b] of [
 ['Command Center','VMC Overview'],['Immediate Attention','Needs Attention'],['Renewals & Expiry','Memberships'],['Staff Management','Team Management'],
 ['Payment Channel','Payment Method'],['Receipt / Reference','Payment Reference'],['Owner/Admin action','Owner/Admin only'],['Owner/Admin actions','Owner/Admin only'],
 ['VMC operations at a glance.','A quick look at what needs attention.'],['Visibility follows the VMC management hierarchy.','Team visibility follows your management role.'],
 ['Add Management','Add Team Member'],['Create Management Account','Create Team Account']
]) dashboard=dashboard.split(a).join(b);

if(!dashboard.includes('name="duration_count"')){
 const marker='<div class="field"><label>Membership</label><select name="membership_tier"><option>Per Day</option><option>Per Week</option><option>Per Month</option></select></div><div class="field"><label>Session</label>';
 const extra='<div class="field"><label>Membership</label><select name="membership_tier"><option>Per Day</option><option>Per Week</option><option>Per Month</option></select></div><div class="field"><label>Duration</label><input name="duration_count" type="number" min="1" max="3650" value="1" required></div><div class="field"><label>Duration unit</label><select name="duration_unit"><option value="day">Days</option><option value="week">Weeks</option><option value="month" selected>Months</option></select></div><div class="field"><label>Session</label>';
 dashboard=dashboard.replace(marker,extra);
}
dashboard=dashboard.replace("const owner=state.caller?.is_admin?'<option value=\"owner\">Owner</option>':'';", "const owner='';");
function upsert(html,id,tag){const re=new RegExp('<script\\s+id=["\\\']'+id+'["\\\'][\\s\\S]*?<\\/script>','i');if(re.test(html))return html.replace(re,tag);return html.replace(/<\/body>/i,tag+'</body>')}
index=upsert(index,'VMC_CLOUDFLARE_UI_PATCH','<script id="VMC_CLOUDFLARE_UI_PATCH">'+patch+'\n</script>');
dashboard=upsert(dashboard,'VMC_CLOUDFLARE_UI_PATCH','<script id="VMC_CLOUDFLARE_UI_PATCH">'+patch+'\n</script>');
index=upsert(index,'VMC_UI_FIXES_V2',fixesV2Tag);dashboard=upsert(dashboard,'VMC_UI_FIXES_V2',fixesV2Tag);
index=upsert(index,'VMC_SECURITY_CONTROLS',securityTag);dashboard=upsert(dashboard,'VMC_SECURITY_CONTROLS',securityTag);
index=upsert(index,'VMC_OWNER_INCOME',incomeTag);dashboard=upsert(dashboard,'VMC_OWNER_INCOME',incomeTag);
index=upsert(index,'VMC_UNIT01_LANGUAGE',languageTag);dashboard=upsert(dashboard,'VMC_UNIT01_LANGUAGE',languageTag);
index=upsert(index,'VMC_REGISTRATION_ALIGNMENT',registrationAlignmentTag);dashboard=upsert(dashboard,'VMC_REGISTRATION_ALIGNMENT',registrationAlignmentTag);
index=upsert(index,'VMC_FINAL_HARDENING',hardeningTag);dashboard=upsert(dashboard,'VMC_FINAL_HARDENING',hardeningTag);
index=upsert(index,'VMC_CUSTOMER_EXPERIENCE',customerExperienceTag);
index=upsert(index,'VMC_REGISTRATION_WIZARD',registrationWizardTag);
fs.writeFileSync('index.html',index);fs.writeFileSync('app.js',app);fs.writeFileSync('dashboard.html',dashboard);
console.log('VMC Cloudflare build completed with deterministic patch replacement.');
