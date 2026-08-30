import { createFileRoute } from "@tanstack/react-router";
import { arewagateRequest } from "@/lib/arewagate.functions";

/**
 * Example API route demonstrating how to use the Arewagate API
 *
 * This shows how to create an API endpoint that proxies requests to Arewagate
 * with automatic authentication handling.
 */

// Example GET request to fetch data from Arewagate
export const GET = createFileRoute("/api/arewagate/example")({
  // This would be handled by a server function in TanStack Start
  // For demonstration, we'll show how to use arewagateRequest
});

// Example server function that could be used in this route
export const getExampleData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      // Make a request to Arewagate API (example endpoint)
      const data = await arewagateRequest({
        endpoint: "example/data", // Replace with actual endpoint
        method: "GET"
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

// Example POST request to send data to Arewagate
export const postExampleData = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      // Define your expected input structure here
      name: z.string(),
      value: z.number().optional()
    })
  )
  .handler(async ({ data }) => {
    try {
      // Send data to Arewagate API (example endpoint)
      const result = await arewagateRequest({
        endpoint: "example/data", // Replace with actual endpoint
        method: "POST",
        body: data
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

// Test comment to verify edits work
