// Import express package
import express from "express";

// Import donors controller functions
import {
  getDonors,
  getDonorProjects,
  linkDonorToProject,
  updateVisibilitySettings,
  unlinkDonorProject,
} from "../controllers/donorsController.js";

// Import authentication middleware
import auth from "../middleware/auth.js";

// Import role authorization middleware
import roleGuard from "../middleware/roleGuard.js";

// Create express router instance
const router = express.Router();

/*
GET /api/donors
List all donors

Access:
- admin only
*/
router.get(
  "/",

  // Check if user is authenticated
  auth,

  // Check if user role is admin
  roleGuard(["admin"]),

  // Run controller function
  getDonors,
);

/*
GET /api/donors/:id/projects

Get projects linked to donor

:id is dynamic parameter

Example:
GET /api/donors/123/projects

Access:
- admin
- donor
*/
router.get(
  "/:id/projects",

  auth,

  roleGuard(["admin", "donor"]),

  getDonorProjects,
);

/*
POST /api/donors/:id/projects

Link donor to a project

Example:
POST /api/donors/123/projects

Access:
- admin only
*/
router.post(
  "/:id/projects",

  auth,

  roleGuard(["admin"]),

  linkDonorToProject,
);

/*
PUT /api/donors/:id/projects/:projectId

Update donor-project visibility settings

:id = donor id
:projectId = project id

Example:
PUT /api/donors/123/projects/456

Access:
- admin only
*/
router.put(
  "/:id/projects/:projectId",

  auth,

  roleGuard(["admin"]),

  updateVisibilitySettings,
);

/*
PATCH /api/donors/:id/projects/:projectId/unlink

Deactivate donor-project relationship

PATCH is used for partial updates

Access:
- admin only
*/
router.patch(
  "/:id/projects/:projectId/unlink",

  auth,

  roleGuard(["admin"]),

  unlinkDonorProject,
);

export default router;
