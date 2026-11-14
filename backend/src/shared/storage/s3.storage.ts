import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import {
  IStorageService,
  StorageFile,
  StoredFileResult,
} from "./storage.service";
export class S3StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;
  constructor() {
    if (!process.env.S3_BUCKET || !process.env.S3_PUBLIC_URL)
      throw new Error(
        "S3_BUCKET and S3_PUBLIC_URL are required for cloud storage",
      );
    this.bucket = process.env.S3_BUCKET;
    this.client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
  }
  async uploadFile(
    file: StorageFile,
    directory = "properties",
  ): Promise<StoredFileResult> {
    const ext: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (!ext[file.mimetype]) throw new Error("Unsupported image type");
    const storageKey = `${directory}/${crypto.randomUUID()}.${ext[file.mimetype]}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return { storageKey, url: this.getFileUrl(storageKey) };
  }
  async deleteFile(storageKey: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
  }
  getFileUrl(storageKey: string) {
    return `${process.env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
  }
  signedDownload(storageKey: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn: 300 },
    );
  }
  signedUpload(storageKey: string, contentType: string) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: contentType,
      }),
      { expiresIn: 300 },
    );
  }
}
