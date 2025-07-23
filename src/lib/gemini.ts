import { GoogleGenerativeAI } from "@google/generative-ai";
import { MCPClient } from "./mcpClient";

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

export async function callGemini(prompt: string) {
  const client = new MCPClient("http://localhost:3000/mcp");
  console.log("PROMPT:", prompt);

  try {
    console.log('Starting MCP client initialization...');
    await client.initialize();
    
    console.log('Calling echo tool...');
    const toolResult = await client.callTool("echo", { message: prompt });

    console.log("Final toolResult:", toolResult);

    if (!toolResult?.result?.content) {
      console.error("❌ No result returned by echo tool");
      return "No result from tool";
    }

    const content = toolResult.result.content;
    console.log("Tool content:", content);
    
    return content.map((c: any) => c.text).join(" ");
    
  } catch (err) {
    console.error("MCP Error:", err);
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    await client.close();
  }
}