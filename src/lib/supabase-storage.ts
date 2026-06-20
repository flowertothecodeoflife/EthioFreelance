/**
 * Thin wrapper around Supabase Storage REST API — no SDK needed.
 * Uses the service role key so uploads work from server actions.
 *
 * Required env vars (add to .env.local):
 *   SUPABASE_URL         = https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_KEY = <service_role_jwt>
 *
 * Create a bucket called "avatars" in Supabase → Storage with:
 *   - Public bucket: ON  (so image URLs work without auth headers)
 *   - File size limit: 2 MB
 *   - Allowed MIME: image/jpeg, image/png, image/webp
 */

const SUPABASE_URL        = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET               = "avatars";

/**
 * Upload a file and return the public URL.
 * Accepts a plain ArrayBuffer so the DOM BodyInit type is satisfied
 * without any Buffer/Uint8Array conversion issues.
 */
export async function uploadAvatar(
  userId: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const ext  = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const path = `${userId}.${ext}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type":  mimeType,
        "x-upsert":      "true",
      },
      body: arrayBuffer,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Delete the avatar file from storage (tries all extensions). */
export async function deleteAvatar(userId: string): Promise<void> {
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
