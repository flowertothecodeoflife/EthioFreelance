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

      // In-memory listener for new messages
      const onMessage = (message: any) => {
        // Stream the message if the current user is either the sender or receiver
        if (message.receiverId === currentUserId || message.senderId === currentUserId) {
          try {
            const dataStr = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(dataStr));
          } catch (streamErr) {
            console.error("Error enqueuing message event:", streamErr);
          }
        }
      };

      // Register listener
      sseEmitter.on("message", onMessage);

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
        sseEmitter.off("message", onMessage);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
