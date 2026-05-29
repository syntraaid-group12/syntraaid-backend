import jwt from "jsonwebtoken";

const token = jwt.sign(
  {
    id: "123456",
    email: "admin@platform.com",
    role: "admin",
  },
  "syntraaid_secret",
  {expiresIn: "7d"},
);

console.log(token);
