import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "dev-secret-change-in-prod";

export function sign(value: string): string {
  return createHmac("sha256", ADMIN_SECRET).update(value).digest("hex");
}

export function verifyAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  try {
    const expected = sign(payload);
    return timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
