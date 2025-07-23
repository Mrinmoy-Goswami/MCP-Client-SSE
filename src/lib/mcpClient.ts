export class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl = "http://localhost:3000/mcp") {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(method: 'GET' | 'POST' | 'DELETE', body?: any) {
    const headers: Record<string, string> = {
      // MCP requires client to accept both content types
      'Accept': 'application/json, text/event-stream'
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    // Only add Content-Type for POST with body
    if (method === 'POST' && body) {
      headers['Content-Type'] = 'application/json';
    }

    console.log('Making request:', {
      method,
      url: this.baseUrl,
      headers,
      body: body ? JSON.stringify(body, null, 2) : undefined
    });

    try {
      const response = await fetch(this.baseUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Capture session ID
      const newSessionId = response.headers.get('mcp-session-id');
      if (newSessionId && newSessionId !== this.sessionId) {
        this.sessionId = newSessionId;
        console.log('Session ID updated:', newSessionId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\nBody: ${errorText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      console.log('Response content-type:', contentType);

      if (response.status === 204 || response.status === 202) {
        return null;
      }

      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (contentType.includes('application/json') && responseText.trim()) {
        try {
          const parsed = JSON.parse(responseText);
          console.log('Parsed response:', parsed);
          return parsed;
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new Error(`Invalid JSON: ${responseText}`);
        }
      }

      // Handle SSE response format
      if (contentType.includes('text/event-stream') && responseText.trim()) {
        try {
          // Extract JSON from SSE format: "event: message\ndata: {json}"
          const lines = responseText.split('\n');
          const dataLine = lines.find(line => line.startsWith('data: '));
          
          if (dataLine) {
            const jsonData = dataLine.replace('data: ', '');
            const parsed = JSON.parse(jsonData);
            console.log('Parsed SSE response:', parsed);
            return parsed;
          }
        } catch (e) {
          console.error('SSE parse error:', e);
          throw new Error(`Invalid SSE format: ${responseText}`);
        }
      }

      return responseText;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async testHealth() {
    try {
      const response = await fetch('http://localhost:3000/health');
      const data = await response.json();
      console.log('Health check:', data);
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async initialize() {
    console.log('=== INITIALIZING MCP CLIENT ===');
    
    // First test health
    await this.testHealth();

    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "debug-client", version: "1.0.0" }
      }
    };

    const initRes = await this.makeRequest('POST', initRequest);

    // Send initialized notification
    const notificationRequest = {
      jsonrpc: "2.0",
      method: "notifications/initialized"
    };

    await this.makeRequest('POST', notificationRequest);

    return initRes;
  }

  async callTool(name: string, arguments_: Record<string, any>) {
    console.log('=== CALLING TOOL ===');
    
    const toolRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name,
        arguments: arguments_
      }
    };

    return await this.makeRequest('POST', toolRequest);
  }

  async close() {
    if (!this.sessionId) return;
    
    console.log('=== CLOSING SESSION ===');
    try {
      await this.makeRequest('DELETE');
    } catch (err) {
      console.error("Error closing session:", err);
    }
    this.sessionId = null;
  }
}