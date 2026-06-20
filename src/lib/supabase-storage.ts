/**
 * Thin wrapper around Supabase Storage REST API — no SDK needed.
 * Uses the service role key so uploads work from server actions.
 *
 * Required env vars (add to .env.local):
 *   SUPABASE_URL        = https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_KEY = <service_role_jwt>
 *
 * Create a bucket called "avatars" in Supabase → Storage with:
 *   - Public bucket: ON  (so image URLs work without auth headers)
 *   - File size limit: 2 MB
 *   - Allowed MIME: image/jpeg, image/png, image/webp
 */

const SUPABASE_URL       = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET              = "avatars";

/** Upload a file buffer and return the public URL. */
export async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext  = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const path = `${userId}.${ext}`;

  // Convert Buffer → Uint8Array so it satisfies the BodyInit type in all TS targets
  const body = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method:  "POST",
      headers: {
        "Authorization":  `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type":   mimeType,
        "x-upsert":       "true",  // overwrite existing
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }

  // Construct public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Delete the avatar file from storage. */
export async function deleteAvatar(userId: string): Promise<void> {
  // Try both extensions
  for (const ext of ["jpg", "png", "webp"]) {
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${userId}.${ext}`,
      {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
      }
    );
  }
}
