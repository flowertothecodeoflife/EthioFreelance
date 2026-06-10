import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { sseEmitter } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return new Response(JSON.stringify({ error: "Unauthorized access." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial heartbeat to establish stream
      controller.enqueue(encoder.encode("data: {\"heartbeat\":true}\n\n"));

      // In-memory listener for new notifications
      const onNotification = (notification: any) => {
        if (notification.userId === currentUserId) {
          try {
            const dataStr = `data: ${JSON.stringify(notification)}\n\n`;
            controller.enqueue(encoder.encode(dataStr));
          } catch (streamErr) {
            console.error("Error enqueuing notification event:", streamErr);
          }
        }
      };

      // Register listener
      sseEmitter.on("notification", onNotification);

      // Heartbeat interval to keep connection alive on proxies/Cloudflare
      const intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("data: {\"ping\":true}\n\n"));
        } catch (intervalErr) {
          // Stream might have closed
          clearInterval(intervalId);
        }
      }, 15000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        sseEmitter.off("notification", onNotification);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
