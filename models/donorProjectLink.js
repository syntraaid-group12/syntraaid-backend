import mongoose from "mongoose";
const donorProjectLinkSchema = new mongoose.Schema(
  {
    donorId: {
      type: String /* ref: users_id comes from the users collecion */,
      required: true,
    },

    projectId: {
      type: String /*  ref: project_id */,
      required: true,
    },

    linkedBy: {
      type: String /* ref: users_id user/admin who connected the doonor to the project */,
      required: true,
    },

    linkedAt: {
      type: Date /* The date and time the link was created */,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    visibilitySettings: {
      /* contains visibility permissions of what the donor is allowed to see */
      showMilestoneProgress: {
        type: Boolean,
        default: true,
      },

      showVolunteerCount: {
        type: Boolean,
        default: true,
      },

      showAttendanceHours: {
        type: Boolean,
        default: true,
      },

      showActivityFeed: {
        type: Boolean,
        default: true,
      },

      showProgramHealth: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    versionKey: false,
  },
);

donorProjectLinkSchema.index({donorId: 1}); /* find donor's linked projects */
donorProjectLinkSchema.index({
  projectId: 1,
}); /* find donors connected to a project */
donorProjectLinkSchema.index({donorId: 1, projectId: 1}, {unique: true});

const DonorProjectLink = mongoose.model(
  "DonorProjectLink",
  donorProjectLinkSchema,
);
export default DonorProjectLink;
