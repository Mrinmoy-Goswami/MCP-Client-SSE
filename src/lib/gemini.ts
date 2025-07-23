import { GoogleGenerativeAI } from "@google/generative-ai";
import { MCPClient } from "./mcpClient";

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

export async function callGemini(prompt: string) {
  const client = new MCPClient("http://localhost:3000/mcp");
 console.log("PROMPT",prompt)
  try {
    await client.initialize();
    const toolResult = await client.callTool("echo", { message: prompt });

    console.log("Raw toolResult from MCP:", toolResult);

    if (!toolResult?.result?.content) {
      console.error("❌ No result returned by echo tool");
      return "No result";
    }

    return toolResult.result.content.map((c: any) => c.text).join(" ");
  } catch (err) {
    console.error("MCP Error:", err);
    return "Error";
  } finally {
    await client.close();
  }
}
