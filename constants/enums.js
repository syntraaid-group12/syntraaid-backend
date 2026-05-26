// constants/enums.js
// SOURCE: SyntraAid Master Technical Playbook v2.0 - Part 2 Enum Master List
// ALL teams use these exact strings. No variations permitted.

const ENUMS = {
  userRole: ['admin', 'coordinator', 'volunteer', 'donor'],

  projectStatus: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],

  taskStatus: ['not_started', 'in_progress', 'blocked', 'completed'],

  activityType: [
    'project_created',
    'project_status_changed',
    'task_created',
    'task_status_changed',
    'volunteer_assigned',
    'attendance_logged',      // ← fired every time attendance is logged
    'milestone_completed',
    'report_generated',
    'donor_linked',
  ],

  targetType: ['project', 'task', 'volunteer', 'milestone', 'report'],

  reportType: ['impact_report', 'attendance_export', 'kpi_summary'],

  notificationType: [
    'task_assigned',
    'deadline_reminder',
    'task_blocked',
    'milestone_completed',
    'project_status_changed',
    'donor_milestone_alert',
  ],

  referenceType: ['task', 'project', 'milestone'],

  deliveryChannel: ['in_app', 'email', 'both'],

  programHealthStatus: ['on_track', 'at_risk', 'needs_attention', 'completed'],

  contactRequestStatus: ['new', 'reviewed', 'actioned'],
}

module.exports = ENUMS
