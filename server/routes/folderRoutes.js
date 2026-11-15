import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createFolder,
  getFolderDetails,
  getFolders,
  moveFolder,
  permanentlyDeleteFolder,
  renameFolder,
  restoreFolder,
  softDeleteFolder,
} from "../controllers/folderController.js";

const folderRouter = express.Router();

folderRouter.use(protect);

folderRouter.post("/", createFolder);
folderRouter.get("/", getFolders);
folderRouter.get("/:id", getFolderDetails);
folderRouter.patch("/:id/rename", renameFolder);
folderRouter.patch("/:id/move", moveFolder);
folderRouter.delete("/:id", softDeleteFolder);
folderRouter.post("/:id/restore", restoreFolder);
folderRouter.post("/:id/permanent", permanentlyDeleteFolder);

export default folderRouter;
