import { sql } from "../config/db.js";
import { permanentlyDeleteFolderHierarchy, restoreFolderHierarchy, softDeleteFolderHierarchy } from "../services/storageService.js";

// Create new folder


// POST /api/folders
export const createFolder = async (req, res) => {
    try {
        const { name, parent, parent_id } = req.body;
        const targetParent = parent_id ?? parent;

        if (!name?.trim()) {
            return res.status(400).json({ error: "Folder name is required." });
        }

        let folderpath = [];
        if (targetParent) {
            const [parentFolder] = await sql`SELECT id, 
            path FROM folders WHERE id = ${targetParent}
            AND owner_id = ${req.user.id} AND is_trashed = false`;
            if (!parentFolder) {
            return res.status(404).json({ error: "Parent folder not found." });
            }
            folderpath = [...(parentFolder.path || []), parentFolder.id];
        }
        // Check if a folder with the same name already exists in the target parent
        const [existing] = await sql`SELECT id FROM folders
        WHERE name = ${name.trim()} AND parent_id = ${targetParent || null} 
        AND owner_id = ${req.user.id} AND is_trashed = false`;
        if (existing) {
            return res.status(409).json({ error: "Folder with the same name already exists." });
        }
        const [folder] = await sql`INSERT INTO folders (name, parent_id, path, owner_id)
            VALUES (${name.trim()}, ${targetParent || null}, ${folderpath}::uuid[], ${req.user.id})
            RETURNING *`;

        return res.status(201).json({ folder });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// Get subfolders in a folder 
// GET /api/folders
export const getFolders = async (req, res) => {
    try {
        const parent = req.query.parent_id ?? req.query.parent;
        const parentId = !parent || parent === "null" ? null : parent; 

        const folders = await sql`SELECT * FROM folders 
        WHERE owner_id = ${req.user.id} AND parent_id IS NOT DISTINCT FROM ${parentId} 
        AND is_trashed = false ORDER BY name ASC`;
        return res.status(200).json({ folders });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// Get folder details & breadcrumb trail
// GET /api/folders/:id
export const getFolderDetails = async (req, res) => {
    try {
        const [folder] = await sql`
        SELECT * FROM folders WHERE id = ${req.params.id}
        AND owner_id = ${req.user.id} AND is_trashed = false`;
        if (!folder) {
            return res.status(404).json({ error: "Folder not found." });
        }
        // Fetch ancestor names in one query (path is UUID[])
        const ancestorsIds = folder.path || []
        const ancestors = ancestorsIds.length > 0 ? await sql`
        SELECT id, name FROM folders WHERE id = ANY(${ancestorsIds}::uuid[])` : [];
        // Preserve path order 
        const ancestorMap = new Map(ancestors.map((a) => [a.id, a.name]));
        const breadcrumb = [
            { id: null, name: "My Drive" },
            ...ancestorsIds.map((aid) => ({ id: aid, name: ancestorMap.get(aid) ?? "" })),
            { id: folder.id, name: folder.name },
        ];
        return res.status(200).json({ folder, breadcrumb });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// Rename folder
// PATCH /api/folders/:id/rename
export const renameFolder = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: "Folder name is required." });
        }
        const [folder] = await sql`UPDATE folders SET name = ${name.trim()}, updated_at = NOW()
        WHERE id = ${req.params.id} AND owner_id = ${req.user.id} 
        AND is_trashed = false RETURNING *`;
        if (!folder) {
            return res.status(404).json({ error: "Folder not found." });
        }
        return res.status(200).json({ folder });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// Move folder to another directory
// PATCH /api/folders/:id/move
export const moveFolder = async (req, res) => {
    try {
        const targetParent = req.body.target_parent ?? req.body.targetParent;
        const folderId = req.params.id;
        if (targetParent === folderId) {
            return res.status(400).json({ error: "Cannot move a folder into itself." });
        }
        const [folder] = await sql`SELECT * FROM folders
        WHERE id = ${folderId} 
        AND owner_id = ${req.user.id} AND is_trashed = false`;
        if (!folder) {
            return res.status(404).json({ error: "Folder not found." });
        }
        let newPath = [];
        if (targetParent) {
            const [targetFolder] = await sql`SELECT * FROM folders 
            WHERE id = ${targetParent} 
            AND owner_id = ${req.user.id} AND is_trashed = false`;
            if (!targetFolder) {
                return res.status(404).json({ error: "Target folder not found." });
            }
            const targetPath = targetFolder.path || [];
            if (targetPath.includes(folderId)) {
                return res.status(400).json({ error: "Cannot move a folder into its own subfolder." });
            }
            newPath = [...targetPath, targetFolder.id];

 }
            // Update Moved folder
            await sql `
            UPDATE folders SET parent_id = ${targetParent || null}, 
            path = ${newPath}::uuid[], 
            updated_at = NOW()
            WHERE id = ${folderId}`;
            // Update all descendants' paths
            const descendants = await sql`SELECT id, path FROM folders 
            WHERE ${folderId}::uuid = ANY(path) AND owner_id = ${req.user.id}`;
            if (descendants.length > 0) {
                await Promise.all(descendants.map((desc) => {
                    const folderIndex = desc.path.findIndex((p) => p === folderId);
                    const subpath = folderIndex !== -1 ? desc.path.slice(folderIndex + 1) : [];
                    const updatedPath = [...newPath, folderId, ...subpath];
                    return sql`
                    UPDATE folders SET path = ${updatedPath}::uuid[], updated_at = NOW()
                    WHERE id = ${desc.id}`;
                })
            ); 
        }
        const [updated] = await sql`
        SELECT * FROM folders WHERE id = ${folderId}`;
        return res.status(200).json({ folder: updated });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// soft delete folder (move to trash)
// DELETE /api/folders/:id
export const softDeleteFolder = async (req, res) => {
    try {
        const [folder] = await sql`
        SELECT id FROM folders WHERE id = ${req.params.id}
        AND owner_id = ${req.user.id} AND is_trashed = false`;
        if (!folder) {
            return res.status(404).json({ error: "Folder not found." });
        }
        await softDeleteFolderHierarchy(folder.id, req.user.id);
        return res.status(200).json({ message: "Folder moved to Trash." });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// Restore folder from Trash 
// POST /api/folders/:id/restore
export const restoreFolder = async (req, res) => {
    try {
        const [folder] = await sql`
        SELECT id FROM folders WHERE id = ${req.params.id}
        AND owner_id = ${req.user.id} AND is_trashed = true`;
        if (!folder) {
            return res.status(404).json({ error: "Folder not found in Trash." });
        }
        await restoreFolderHierarchy(folder.id, req.user.id);
        return res.status(200).json({ message: "Folder restored from Trash." });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}

// Permanently delete folder and all nested contents 
// DELETE /api/folders/:id/permanent
export const permanentlyDeleteFolder = async (req, res) => {
    try {
        const [folder] = await sql`
        SELECT id FROM folders WHERE id = ${req.params.id}
        AND owner_id = ${req.user.id} AND is_trashed = true`;
        if (!folder) {
            return res.status(404).json({ error: "Folder not found." });
        }
        await permanentlyDeleteFolderHierarchy(folder.id, req.user.id);
        return res.status(200).json({ message: "Folder permanently deleted." });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Server error" });
    }
}