import React, { useState } from "react";
import { callGemini } from "./lib/gemini";

function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const reply = await callGemini(input);
      setOutput(reply);
    } catch (err) {
      console.error(err);
      setOutput("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🧪 Gemini Echo Tool</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: "300px", padding: "0.5rem", marginRight: "1rem" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send to Gemini"}
        </button>
      </form>
      <div style={{ marginTop: "2rem" }}>
        <strong>Response:</strong>
        <p>{output}</p>
      </div>
    </div>
  );
}

export default App;