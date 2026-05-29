import jwt from "jsonwebtoken";
const auth = (req, res, next) => {
  try {
    /*
    Authorization header usually looks like:

    Authorization: Bearer eyJhbGciOi...

    req.headers.authorization gets the full string
    */

    const authHeader = req.headers.authorization;

    // If no authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    /*
    Split the string by space

    Example:
    "Bearer abc123"

    becomes:
    ["Bearer", "abc123"]

    [1] gets the actual token
    */

    const token = authHeader.split(" ")[1];

    // If token part does not exist
    if (!token) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    /*
    Verify token using secret key

    If token is invalid or expired,
    jwt.verify throws an error
    */

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
    Store decoded user info inside request object

    Example:
    req.user = {
      id: "...",
      role: "admin"
    }

    So next middleware/controller can access it
    */

    req.user = decoded;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export default auth;
