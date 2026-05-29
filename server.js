import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();
connectDB();
import pdfkit from "pdfkit";
import reportsRoutes from "./routes/reportsRoutes.js";
import donorsRoutes from "./routes/donorsRoutes.js";
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT;
app.use("/api/reports/", reportsRoutes);
app.use("/api/donors/", donorsRoutes);
app.get("/", (req, res) => {
  res.send("SyntraAid API is running");
});
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
