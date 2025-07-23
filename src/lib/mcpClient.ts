export class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl = "http://localhost:3000/mcp") {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(method: 'GET' | 'POST' | 'DELETE', body?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const response = await fetch(this.baseUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const newSessionId = response.headers.get('mcp-session-id');
    if (newSessionId) this.sessionId = newSessionId;

    // If it’s a notification or success with no body
    if (response.status === 202 || response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        console.warn("Empty JSON body");
        return null;
      }
    } else if (contentType.includes("text/event-stream")) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Extract last valid data block
      const dataBlocks = fullText
        .split("\n\n")
        .filter(block => block.startsWith("data:"))
        .map(line => line.replace(/^data:\s*/, "").trim());

      const lastBlock = dataBlocks.pop();
      if (!lastBlock) {
        console.warn("SSE stream returned no usable data block.");
        return null;
      }

      try {
        return JSON.parse(lastBlock);
      } catch (e) {
        console.error("Failed to parse SSE data as JSON:", lastBlock);
        throw new Error("Invalid SSE response from MCP server");
      }
    } else {
      throw new Error(`Unsupported Content-Type: ${contentType}`);
    }
  }

  async initialize() {
    const initRes = await this.makeRequest('POST', {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "gemini-mcp-client", version: "1.0.0" }
      }
    });

    await this.makeRequest('POST', {
      jsonrpc: "2.0",
      method: "notifications/initialized"
    });

    return initRes;
  }

  async callTool(name: string, arguments_: Record<string, any>) {
    return this.makeRequest('POST', {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name,
        arguments: arguments_
      }
    });
  }

  async close() {
    if (!this.sessionId) return;

    try {
      await this.makeRequest('DELETE');
    } catch (err) {
      console.error("Error closing MCP session:", err);
    }

    this.sessionId = null;
  }
}
