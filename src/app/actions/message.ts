"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { sseEmitter } from "@/lib/sse";

// 1. Send Message
export async function sendMessageAction(receiverId: string, content: string) {
  try {
    const session = await auth();
    const senderId = session?.user?.id;

    if (!senderId) {
      return { error: "You must be logged in to send messages." };
    }

    if (!content || !content.trim()) {
      return { error: "Message content cannot be empty." };
    }

    // Create the message in PostgreSQL
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    // In-memory real-time push broadcast
    sseEmitter.emit("message", message);

    // Create a real-time Notification for the receiver
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: receiverId,
          title: "New Message",
          content: `${message.sender.name} sent you a message.`,
          type: "MESSAGE",
        },
      });

      // Broadcast the notification trigger
      sseEmitter.emit("notification", notification);
    } catch (notifErr) {
      console.error("Failed to trigger message notification:", notifErr);
    }

    return { success: true, message };
  } catch (err: any) {
    console.error("SendMessageAction error:", err);
    return { error: "An unexpected error occurred while sending the message." };
  }
}

// 2. Fetch Conversation History
export async function getMessagesAction(chatPartnerId: string) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { error: "Unauthorized access." };
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: chatPartnerId },
          { senderId: chatPartnerId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    return { success: true, messages };
  } catch (err: any) {
    console.error("GetMessagesAction error:", err);
    return { error: "Failed to load conversation history." };
  }
}

// 3. Fetch Active Chat Contacts
export async function getChatPartnersAction() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { error: "Unauthorized access." };
    }

    // Find all unique users who have exchanged messages with currentUserId
    const sentMessages = await prisma.message.findMany({
      where: { senderId: currentUserId },
      select: { receiverId: true },
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: currentUserId },
      select: { senderId: true },
    });

    const partnerIds = Array.from(
      new Set([
        ...sentMessages.map((m) => m.receiverId),
        ...receivedMessages.map((m) => m.senderId),
      ])
    );

    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
      },
    });

    return { success: true, partners };
  } catch (err: any) {
    console.error("GetChatPartnersAction error:", err);
    return { error: "Failed to load chat contacts." };
  }
}

// 4. Fetch User Notifications
export async function getNotificationsAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized access." };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, notifications };
  } catch (err: any) {
    console.error("GetNotificationsAction error:", err);
    return { error: "Failed to load notifications." };
  }
}

// 5. Mark Notification as Read
export async function markNotificationReadAction(notificationId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized access." };
    }

    const updated = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });

    return { success: true, count: updated.count };
  } catch (err: any) {
    console.error("MarkNotificationReadAction error:", err);
    return { error: "Failed to update notification." };
  }
}

// 5b. Mark ALL notifications as read
export async function markAllNotificationsReadAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized access." };
    }

    const updated = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { success: true, count: updated.count };
  } catch (err: any) {
    console.error("MarkAllNotificationsReadAction error:", err);
    return { error: "Failed to update notifications." };
  }
}

// 6. Fetch Potential Chat Partners (other registered users)
export async function getPotentialPartnersAction() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { error: "Unauthorized access." };
    }

    const users = await prisma.user.findMany({
      where: { id: { not: currentUserId } },
      take: 15,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
      },
    });

    return { success: true, users };
  } catch (err: any) {
    console.error("GetPotentialPartnersAction error:", err);
    return { error: "Failed to load potential contacts." };
  }
}
