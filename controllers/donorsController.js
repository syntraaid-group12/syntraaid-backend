import DonorProjectLink from "../models/donorProjectLink.js";

import ActivityLog from "../models/activityLog.js";

/*
GET /api/donors
List all donors
Access: admin
*/
const getDonors = async (req, res) => {
  try {
    const donors = await DonorProjectLink.find();
    res.status(200).json(donors);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch donors",
    });
  }
};

/*
GET /api/donors/:id/projects
Get donor linked projects
Access: admin, donor(self)
*/
const getDonorProjects = async (req, res) => {
  try {
    const donorId = req.params.id;

    const projects = await DonorProjectLink.find({
      donorId,
      isActive: true,
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch donor projects",
    });
  }
};

/*
POST /api/donors/:id/projects
Link donor to project
Access: admin
*/
const linkDonorToProject = async (req, res) => {
  try {
    const donorId = req.params.id;

    const {projectId, visibilitySettings} = req.body;

    const donorProjectLink = await DonorProjectLink.create({
      donorId,
      projectId,

      linkedBy: req.user._id,

      visibilitySettings,
    });

    // activity log rule
    await ActivityLog.create({
      activityType: "donor_linked",
      actorId: req.user._id,
      targetType: "project",
      targetId: projectId,
      description: "Donor linked to project",
      createdAt: new Date(),
    });

    res.status(201).json(donorProjectLink);
  } catch (error) {
    res.status(500).json({
      message: "Failed to link donor to project",
    });
  }
};

/*
PUT /api/donors/:id/projects/:projectId
Update visibility settings
Access: admin
*/
const updateVisibilitySettings = async (req, res) => {
  try {
    const donorId = req.params.id;
    const projectId = req.params.projectId;

    const updatedLink = await DonorProjectLink.findOneAndUpdate(
      {
        donorId,
        projectId,
      },

      {
        visibilitySettings: req.body.visibilitySettings,
      },

      {
        new: true,
      },
    );

    res.status(200).json(updatedLink);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update visibility settings",
    });
  }
};

/*
PATCH /api/donors/:id/projects/:projectId/unlink
Deactivate donor-project link
Access: admin
*/
const unlinkDonorProject = async (req, res) => {
  try {
    const donorId = req.params.id;
    const projectId = req.params.projectId;

    const updatedLink = await DonorProjectLink.findOneAndUpdate(
      {
        donorId,
        projectId,
      },

      {
        isActive: false,
      },

      {
        new: true,
      },
    );

    res.status(200).json(updatedLink);
  } catch (error) {
    res.status(500).json({
      message: "Failed to unlink donor project",
    });
  }
};

export {
  getDonors,
  getDonorProjects,
  linkDonorToProject,
  updateVisibilitySettings,
  unlinkDonorProject,
};
