/* VMC MANAGEMENT - ADD CUSTOMER VISUAL POLISH ONLY */
(function () {
  function polishAddCustomerForm() {
    const form = document.getElementById('ownerAddForm');
    if (!form) return;

    const panel = form.closest('.member-detail');
    if (panel) {
      panel.style.marginTop = '18px';
      panel.style.padding = '24px';
      panel.style.border = '1px solid var(--line)';
      panel.style.borderRadius = '18px';
      panel.style.background = 'linear-gradient(180deg,#151a20,#0f1317)';
      panel.style.boxShadow = '0 12px 35px rgba(0,0,0,.18)';
    }

    const kicker = panel?.querySelector('.kicker');
    if (kicker) kicker.textContent = 'New Customer';

    const heading = panel?.querySelector('h3');
    if (heading) {
      heading.textContent = 'Add New Customer';
      heading.style.fontSize = 'clamp(24px,4vw,32px)';
      heading.style.marginBottom = '8px';
    }

    const intro = panel?.querySelector(':scope > p.muted');
    if (intro) intro.textContent = 'Enter the customer details below to create their VMC membership record.';

    const labels = {
      addFullName: 'Full Name',
      addDob: 'Date of Birth',
      addGender: 'Gender',
      addPhone: 'Phone / WhatsApp Number',
      addEmail: 'Email Address',
      addEmergency: 'Emergency Contact Person',
      addDuration: 'Membership Access Tier',
      addSession: 'Session Access Type',
      addStart: 'Start Date',
      addAmount: 'Amount Paid (MWK)',
      addMethod: 'Payment Mobile Network',
      addReference: 'Transaction Reference Code'
    };

    Object.entries(labels).forEach(([id, text]) => {
      const field = document.getElementById(id);
      const label = field?.closest('div')?.querySelector('label');
      if (label) {
        label.textContent = text;
        label.style.textTransform = 'none';
        label.style.letterSpacing = '0';
        label.style.fontSize = '.82rem';
        label.style.fontWeight = '800';
        label.style.color = '#dfe3e7';
      }
    });

    const grid = form.querySelector('.detail-grid');
    if (grid) {
      grid.className = 'form-grid';
      grid.style.gap = '14px';
    }

    form.querySelectorAll(':scope > .form-grid > div').forEach(field => {
      field.className = 'field';
      field.style.minWidth = '0';
    });

    form.querySelectorAll('input, select').forEach(control => {
      control.style.width = '100%';
      control.style.padding = '13px 14px';
      control.style.background = '#0b0e11';
      control.style.border = '1px solid #33373e';
      control.style.color = '#fff';
      control.style.borderRadius = '11px';
      control.style.outline = 'none';
    });

    const actions = form.querySelector('.form-actions');
    if (actions) {
      actions.style.marginTop = '20px';
      actions.style.paddingTop = '4px';
      actions.style.borderTop = '1px solid var(--line)';
    }
  }

  const original = window.addOwnerMember;
  if (typeof original !== 'function') return;

  window.addOwnerMember = function () {
    original.apply(this, arguments);
    requestAnimationFrame(polishAddCustomerForm);
  };
})();
