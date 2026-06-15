export const PAGE_VIEW = "page_view"

export const ANNOUNCEMENT_FLOW_STEP = "announcement_flow_step"
export const ANNOUNCEMENT_SENT = "announcement_sent"
export const ANNOUNCEMENT_SEND_FAILED = "announcement_send_failed"
export const WHATSAPP_STATE = "whatsapp_state"

export const PAYMENTS_FLOW_STEP = "payments_flow_step"
export const PAYMENT_REMINDER_STARTED = "payment_reminder_started"
export const PAYMENT_LINK_COPIED = "payment_link_copied"

export const GROUPS_FLOW_STEP = "groups_flow_step"
export const GROUP_CREATED = "group_created"
export const GROUP_CONTACT_ADDED = "group_contact_added"

export const ATTENDANCE_FLOW_STEP = "attendance_flow_step"
export const ATTENDANCE_REFRESHED = "attendance_refreshed"

export const CHECKIN_COMPLETED = "checkin_completed"
export const CHECKIN_FAILED = "checkin_failed"
export const CHECKOUT_COMPLETED = "checkout_completed"
export const CHECKOUT_FAILED = "checkout_failed"

export const PAYMENT_STARTED = "payment_started"
export const PAYMENT_COMPLETED = "payment_completed"
export const PAYMENT_FAILED = "payment_failed"

export const PRODUCT_PAGES = {
  announcementsCompose: "announcements_compose",
  payments: "payments",
  attendance: "attendance",
  groups: "groups",
  payInvoice: "pay_invoice",
  checkin: "checkin",
} as const

export const PUBLIC_ANALYTICS_EVENTS = new Set([
  PAGE_VIEW,
  CHECKIN_COMPLETED,
  CHECKIN_FAILED,
  CHECKOUT_COMPLETED,
  CHECKOUT_FAILED,
  PAYMENT_STARTED,
  PAYMENT_COMPLETED,
  PAYMENT_FAILED,
])
