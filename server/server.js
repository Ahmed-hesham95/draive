import "./config/network.js";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";


const app = express();

// cors config
const allowedOrigins = process.env.ORIGINS.split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

// MIDDLEWARES

app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));

// ROOT API
app.get("/", (_req, res) => res.send("Server is Running"));

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
