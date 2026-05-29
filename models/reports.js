import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ["impact_report", "attendance_export", "kpi_summary"],
      required: true,
    },
    generatedBy: {
      type: String /*  ref: users_id */,
      required: true,
    },
    projectId: {
      type: String /* ref: projects_id */,
      default:
        null /* null represents summary of all the reports so if it is not a specific report(projectId), save null */,
    },
    dateRangeStart: {
      type: Date,
    },
    dateRangeEnd: {
      type: Date,
    },
    fileUrl: {
      type: String /*  Url to generated pdf or any file */,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {versionKey: false},
);

reportSchema.index({generatedBy: 1});
reportSchema.index({projectId: 1});
reportSchema.index({generatedAt: -1});

const Report = mongoose.model("Report", reportSchema);
export default Report;
