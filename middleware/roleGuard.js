/*
Role-based authorization middleware

Purpose:
- Restricts access based on user role
- Used AFTER authentication middleware
- Checks if logged-in user has permission

Example usage:

router.get(
  '/reports',
  auth,
  roleGuard(['admin']),
  controllerFunction
)

Only users with role "admin" can access route
*/

const roleGuard = (allowedRoles = []) => {
  /*
  allowedRoles receives array like:

  ['admin']
  ['admin', 'coordinator']

  This outer function returns the real middleware
  */

  return (req, res, next) => {
    /*
    req.user usually comes from auth middleware

    Example:
    req.user = {
      id: '123',
      role: 'admin'
    }

    If auth middleware did not run,
    req.user may not exist
    */

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    /*
    Check if user's role exists
    inside allowedRoles array

    Example:
    allowedRoles = ['admin']

    req.user.role = 'coordinator'

    includes() returns false
    */

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    // User has correct role
    // Continue to next middleware/controller
    next();
  };
};

// Export middleware using ES6 syntax
export default roleGuard;
