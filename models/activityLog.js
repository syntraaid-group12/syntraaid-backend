import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      required: true,
      enum: [
        "project_created",
        "project_status_changed",
        "task_created",
        "task_status_changed",
        "volunteer_assigned",
        "attendance_logged",
        "milestone_completed",
        "report_generated",
        "donor_linked",
      ],
    },

    actorId: {
      type: String, // ref: users._id
      required: true,
    },

    targetType: {
      type: String,
      required: true,
      enum: ["project", "task", "volunteer", "milestone", "report"],
    },

    targetId: {
      type: String, // _id of affected document
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    metadata: {
      type: Object,
      default: {},
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

/*
Indexes from playbook
*/

activityLogSchema.index({actorId: 1});

activityLogSchema.index({targetId: 1});

activityLogSchema.index({activityType: 1});

activityLogSchema.index({createdAt: -1});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
