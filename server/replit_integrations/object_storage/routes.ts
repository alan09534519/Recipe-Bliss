import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import sharp from "sharp";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  /**
   * Serve thumbnail version of uploaded images.
   *
   * GET /thumbnails/:objectPath(*)
   * Query params:
   *   - w: width (default 400)
   *   - h: height (default 300)
   *   - q: quality (default 80)
   *
   * This creates optimized thumbnails for faster loading on list pages.
   */
  app.get("/thumbnails/:objectPath(*)", async (req, res) => {
    try {
      const objectPath = `/objects/${req.params.objectPath}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      const width = parseInt(req.query.w as string) || 400;
      const height = parseInt(req.query.h as string) || 300;
      const quality = parseInt(req.query.q as string) || 80;
      
      // Get the file as a buffer
      const [metadata] = await objectFile.getMetadata();
      const contentType = metadata.contentType || "application/octet-stream";
      
      // Only process images
      if (!contentType.startsWith("image/")) {
        await objectStorageService.downloadObject(objectFile, res);
        return;
      }
      
      // Stream the original file
      const chunks: Buffer[] = [];
      const stream = objectFile.createReadStream();
      
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      
      const originalBuffer = Buffer.concat(chunks);
      
      // Create thumbnail using sharp
      const thumbnail = await sharp(originalBuffer)
        .resize(width, height, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality })
        .toBuffer();
      
      res.set({
        "Content-Type": "image/jpeg",
        "Content-Length": thumbnail.length,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      });
      
      res.send(thumbnail);
    } catch (error) {
      console.error("Error serving thumbnail:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve thumbnail" });
    }
  });
}

