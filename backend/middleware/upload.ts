import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env";

function uploader(
  folder: string,
  maxFiles: number,
  maxSize: number,
  imageOnly = false,
) {
  const destination = path.join(env.uploadDir, folder);
  fs.mkdirSync(destination, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination,
      filename: (_req, file, done) =>
        done(
          null,
          `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
        ),
    }),
    limits: { files: maxFiles, fileSize: maxSize },
    fileFilter: (_req, file, done) =>
      done(
        null,
        imageOnly
          ? file.mimetype.startsWith("image/")
          : file.mimetype.startsWith("image/") ||
              file.mimetype.startsWith("video/"),
      ),
  });
}
export const productUpload = uploader("products", 8, 50 * 1024 * 1024).array(
  "media",
  8,
);
export const avatarUpload = uploader(
  "profiles",
  1,
  5 * 1024 * 1024,
  true,
).single("avatar");
export function publicUploadUrl(folder: string, filename: string) {
  return `${env.publicApiUrl}/uploads/${folder}/${filename}`;
}
