"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { sendEmail, otpEmailHtml } from "@/lib/email";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a cryptographically random 6-digit OTP string */
function generateOtp(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return digits;
}

/** Deletes all previous unused OTPs for this email+purpose before creating a new one */
async function createOtpToken(email: string, purpose: string): Promise<string> {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing tokens for this email+purpose
  await prisma.otpToken.deleteMany({ where: { email, purpose } });

  await prisma.otpToken.create({
    data: { email, codeHash, purpose, expiresAt },
  });

  return code;
}

// ─── registerUser ─────────────────────────────────────────────────────────────

export async function registerUser(formData: any) {
  try {
    const { firstName, lastName, email, phone, password, role } = formData;

    if (!firstName || !lastName || !email || !password) {
      return { error: "Missing required fields" };
    }

    // Server-side email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please enter a valid email address." };
    }

    // Password length check
    if (typeof password === "string" && password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const fullName = `${firstName} ${lastName}`;

    // Normalize phone number (e.g. +251912345678)
    let formattedPhone = null;
    if (phone) {
      const cleaned = phone.replace(/\s+/g, "");
      formattedPhone = cleaned.startsWith("+251")
        ? cleaned
        : `+251${cleaned.startsWith("0") ? cleaned.slice(1) : cleaned}`;
    }

    // Check if user already exists (email or phone)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(formattedPhone ? [{ phone: formattedPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      return { error: "An account with this email or phone number already exists." };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Map role
    const mappedRole = role === "client" ? Role.CLIENT : Role.FREELANCER;

    // Create user
    await prisma.user.create({
      data: {
        name: fullName,
        email,
        phone: formattedPhone,
        passwordHash,
        role: mappedRole,
        ...(mappedRole === Role.FREELANCER
          ? {
              profile: {
                create: {
                  title: "Freelancer",
                  bio: "Welcome to my profile!",
                  skills: [],
                },
              },
            }
          : {}),
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Registration error:", err);
    return { error: err.message || "Something went wrong during registration." };
  }
}

// ─── sendOtp ──────────────────────────────────────────────────────────────────

export async function sendOtp(
  email: string,
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
) {
  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please enter a valid email address." };
    }

    // For password reset, verify the email exists first
    if (purpose === "PASSWORD_RESET") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return success anyway to prevent email enumeration
        return { success: true };
      }
    }

    const code = await createOtpToken(email, purpose);

    await sendEmail({
      to:      email,
      subject: purpose === "EMAIL_VERIFY"
        ? "Your EthioFreelance verification code"
        : "Reset your EthioFreelance password",
      html: otpEmailHtml(code, purpose),
    });

    return { success: true };
  } catch (err: any) {
    console.error("sendOtp error:", err);
    // Return the real error in dev so it's visible in the UI
    const msg = process.env.NODE_ENV === "production"
      ? "Failed to send verification code. Please try again."
      : (err?.message || "Failed to send verification code.");
    return { error: msg };
  }
}

// ─── verifyOtp ────────────────────────────────────────────────────────────────

export async function verifyOtp(
  email: string,
  code: string,
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET"
) {
  try {
    if (!email || !code) {
      return { error: "Email and code are required." };
    }

    const token = await prisma.otpToken.findFirst({
      where: {
        email,
        purpose,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return { error: "Code expired or not found. Please request a new one." };
    }

    const isValid = await bcrypt.compare(code.trim(), token.codeHash);
    if (!isValid) {
      return { error: "Incorrect code. Please check and try again." };
    }

    // Mark as used
    await prisma.otpToken.update({
      where: { id: token.id },
      data:  { used: true },
    });

    return { success: true };
  } catch (err: any) {
    console.error("verifyOtp error:", err);
    return { error: "Verification failed. Please try again." };
  }
}

// ─── resetPassword ────────────────────────────────────────────────────────────
// Called after verifyOtp succeeds for PASSWORD_RESET purpose.

export async function resetPassword(email: string, newPassword: string) {
  try {
    if (!email || !newPassword) {
      return { error: "Email and new password are required." };
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "Account not found." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash },
    });

    // Clean up any remaining OTP tokens for this email
    await prisma.otpToken.deleteMany({
      where: { email, purpose: "PASSWORD_RESET" },
    });

    return { success: true };
  } catch (err: any) {
    console.error("resetPassword error:", err);
    return { error: "Failed to reset password. Please try again." };
  }
}
