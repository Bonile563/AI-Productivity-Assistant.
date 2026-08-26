import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
} from "@/lib/ai-gateway.server";
import { getWorkflow } from "@/lib/workflows";

type ChatRequestBody = { messages?: unknown; workflow?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("AI is not configured for this app.", { status: 500 });
        }

        const workflow = getWorkflow(
          typeof body.workflow === "string" ? body.workflow : "assistant",
        );

        const gateway = createLovableAiGatewayProvider(
          key,
          getLovableAiGatewayRunId(request),
        );

        try {
          const result = streamText({
            model: gateway("google/gemini-3.7-flash"),
            system: workflow.system,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
            onError: (error) => {
              console.error("chat stream error", error);
              return "The assistant hit an error mid-response. Please try again.";
            },
          });
        } catch (error) {
          console.error("chat route error", error);
          const status = (error as { statusCode?: number })?.statusCode;
          if (status === 429) {
            return new Response("Rate limit reached. Wait a moment and retry.", {
              status: 429,
            });
          }
          if (status === 402) {
            return new Response(
              "AI credits are exhausted. Add credits in Lovable to continue.",
              { status: 402 },
            );
          }
          return new Response("The assistant could not be reached.", { status: 500 });
        }
      },
    },
  },
});
