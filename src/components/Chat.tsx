import { useState } from "react";

type Message = {
  role: "user" | "claude";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");

    const res = await fetch("http://localhost:3000/auth", {
      method: "POST",
      body: JSON.stringify({ prompt: input }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "claude", content: data.reply }]);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/3 border-r p-4 overflow-y-auto bg-white">
        <h2 className="font-semibold text-lg mb-4">Inbox</h2>
        <div className="space-y-3">
          <div className="cursor-pointer hover:bg-gray-100 p-3 rounded">
            <p className="font-medium">John Doe</p>
            <p className="text-sm text-gray-500 truncate">Project update...</p>
          </div>
          {/* Add actual email threads here */}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-xl ${
                msg.role === "user" ? "ml-auto text-right" : "mr-auto"
              }`}
            >
              <div
                className={`p-3 rounded-lg ${
                  msg.role === "user" ? "bg-blue-100" : "bg-gray-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            placeholder="Ask Claude to summarize, reply, or draft..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 px-4 py-2 border rounded-lg outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
