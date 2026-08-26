import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env";

const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".heic",
  ".heif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);
const videoExtensions = new Set([
  ".3gp",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp4",
  ".webm",
]);

function mediaKind(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (file.mimetype.startsWith("video/") || videoExtensions.has(extension))
    return "video" as const;
  if (file.mimetype.startsWith("image/") || imageExtensions.has(extension))
    return "image" as const;
  return null;
}

export function uploadedMediaType(file: Express.Multer.File) {
  return mediaKind(file) === "video" ? "video" : "image";
}

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
        imageOnly ? mediaKind(file) === "image" : mediaKind(file) !== null,
      ),
  });
}
export const productUpload = uploader("products", 8, 50 * 1024 * 1024).array(
  "media",
  8,
);
export const postUpload = uploader("posts", 8, 50 * 1024 * 1024).array(
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

export async function removeUploadedFiles(folder: string, urls: string[]) {
  const uploadFolder = path.resolve(env.uploadDir, folder);
  const publicOrigin = new URL(env.publicApiUrl).origin;
  const publicPathPrefix = `/uploads/${folder}/`;
  await Promise.allSettled(
    urls.map(async (url) => {
      let filename = "";
      try {
        const parsedUrl = new URL(url);
        if (
          parsedUrl.origin !== publicOrigin ||
          !parsedUrl.pathname.startsWith(publicPathPrefix)
        )
          return;
        filename = path.basename(decodeURIComponent(parsedUrl.pathname));
      } catch {
        return;
      }
      const target = path.resolve(uploadFolder, filename);
      if (path.dirname(target) !== uploadFolder) return;
      try {
        await fs.promises.unlink(target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }),
  );
}
