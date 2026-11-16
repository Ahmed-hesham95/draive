import "./config/network.js";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import folderRouter from "./routes/folderRoutes.js";
import fileRouter from "./routes/fileRoutes.js";
import trashRouter from "./routes/trashRoutes.js";
import shareRouter from "./routes/shareRoutes.js";


const app = express();

// cors config
const allowedOrigins = process.env.ORIGINS.split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

// MIDDLEWARES

app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));

// ROOT API
app.get("/", (_req, res) => res.send("Server is Running"));

// ROUTES
app.use("/api/auth", authRouter);
app.use("/api/folders", folderRouter);
app.use("/api/files", fileRouter)
app.use("/api/trash", trashRouter)
app.use("/api/shares", shareRouter)

// Error Handling Middleware
app.use((err, _req, res, _next) => {
  res
    .status(err.status || 500)
    .json({ error: err.message || "Something went wrong!" });
});

const port = process.env.PORT || 3000;

// INITIALIZE DB CONNECTION THEN START SERVER
initDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
