/**
 * Object storage abstraction for media uploads.
 *
 * The browser uploads each image directly to the storage provider via a
 * short-lived presigned URL — server bandwidth stays free. The server only
 * sees the resulting public URLs that the client posts back when creating
 * the MediaPost.
 */
export interface PresignUploadInput {
  /** Mime type the client will send. Must start with `image/`. */
  contentType: string;
  /** Max body size the client will send. Provider enforces this. */
  sizeBytes: number;
  /** Optional preferred extension (e.g. "webp", "jpg"). */
  extension?: string;
}

export interface PresignedUpload {
  /** PUT here from the client, with the exact `contentType` and within `sizeBytes`. */
  uploadUrl: string;
  /** Stable public URL stored in MediaPost.images[].url. */
  publicUrl: string;
}

export interface MediaStorage {
  presignUpload(input: PresignUploadInput): Promise<PresignedUpload>;
  /** Best-effort delete; never throws if the object does not exist. */
  delete(publicUrl: string): Promise<void>;
}
