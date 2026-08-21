# VMC Xtreme V4 Architecture

PUBLIC
  |
  +--> Website / Marketing
  |
  +--> Customer Registration
  |
  +--> Customer Login
  |
  v
SECURE API
  |
  +--> Authentication
  +--> Membership business rules
  +--> Payment verification
  +--> Owner authorization
  +--> Audit logging
  |
  v
DATABASE
  +--> customers
  +--> membership_plans
  +--> memberships
  +--> payments
  +--> rules_acceptance
  +--> notification_log
  +--> audit_log

FUTURE SERVICES
  +--> Email
  +--> SMS
  +--> WhatsApp
  +--> Payment-provider integrations
  +--> Automated expiry scheduler
