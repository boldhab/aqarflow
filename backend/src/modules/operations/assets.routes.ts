import { ApiError } from "@/shared/errors";
import { authMiddleware } from "@/shared/middleware";
import { storageService } from "@/shared/storage/storage.service";
import { verifyImageMagicBytes } from "@/shared/utils/image-validator";
import { Router } from "express";
import multer from "multer";
export const assetsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
assetsRouter.post(
  "/assets",
  authMiddleware,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file)
        throw ApiError.badRequest("Choose a JPEG, PNG, or WebP image");
      const mimetype = verifyImageMagicBytes(req.file.buffer);
      if (!mimetype)
        throw ApiError.badRequest(
          "Invalid image data. Use JPEG, PNG, or WebP.",
        );
      const file = await storageService.uploadFile(
        { ...req.file, mimetype },
        `agencies/${req.user!.agencyId}/assets`,
      );
      const url = file.url.startsWith("/")
        ? `${req.protocol}://${req.get("host")}${file.url}`
        : file.url;
      res
        .status(201)
        .json({ success: true, data: { url, storageKey: file.storageKey } });
    } catch (error) {
      next(error);
    }
  },
);
