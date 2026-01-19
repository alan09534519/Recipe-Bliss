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
      
      // Validate and clamp parameters to prevent DoS
      const MIN_SIZE = 10;
      const MAX_SIZE = 800;
      const MIN_QUALITY = 10;
      const MAX_QUALITY = 90;
      const DEFAULT_WIDTH = 400;
      const DEFAULT_HEIGHT = 300;
      const DEFAULT_QUALITY = 75;
      
      // Parse and validate width
      const rawWidth = req.query.w as string;
      let width = DEFAULT_WIDTH;
      if (rawWidth !== undefined) {
        const parsed = parseInt(rawWidth);
        if (isNaN(parsed) || parsed <= 0) {
          return res.status(400).json({ error: "Invalid width parameter" });
        }
        width = Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsed));
      }
      
      // Parse and validate height
      const rawHeight = req.query.h as string;
      let height = DEFAULT_HEIGHT;
      if (rawHeight !== undefined) {
        const parsed = parseInt(rawHeight);
        if (isNaN(parsed) || parsed <= 0) {
          return res.status(400).json({ error: "Invalid height parameter" });
        }
        height = Math.max(MIN_SIZE, Math.min(MAX_SIZE, parsed));
      }
      
      // Parse and validate quality
      const rawQuality = req.query.q as string;
      let quality = DEFAULT_QUALITY;
      if (rawQuality !== undefined) {
        const parsed = parseInt(rawQuality);
        if (isNaN(parsed) || parsed <= 0) {
          return res.status(400).json({ error: "Invalid quality parameter" });
        }
        quality = Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, parsed));
      }
      
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      // Get the file as a buffer
      const [metadata] = await objectFile.getMetadata();
      const contentType = metadata.contentType || "application/octet-stream";
      
      // Reject files larger than 15MB to prevent memory issues
      const fileSize = parseInt(metadata.size as string) || 0;
      if (fileSize > 15 * 1024 * 1024) {
        return res.status(400).json({ error: "File too large for thumbnail generation" });
      }
      
      // Only process images
      if (!contentType.startsWith("image/")) {
        await objectStorageService.downloadObject(objectFile, res);
        return;
      }
      
      // Set response headers before streaming
      res.set({
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      });
      
      // Stream through sharp for memory-efficient processing
      const readStream = objectFile.createReadStream();
      const transformer = sharp()
        .resize(width, height, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality });
      
      // Pipe: GCS -> Sharp -> Response
      readStream
        .pipe(transformer)
        .pipe(res)
        .on("error", (err: Error) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to process thumbnail" });
          }
        });
    } catch (error) {
      console.error("Error serving thumbnail:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve thumbnail" });
    }
  });
}

