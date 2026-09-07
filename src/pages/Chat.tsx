import React, { useState, useRef, useEffect } from 'react';
import { useMesh } from '../context/MeshContext';
import { MessageBubble } from '../components/MessageBubble';
import { MessageType } from '../mesh/protocol';

export function Chat() {
  const { messages, nodeId, meshManager, isConnected } = useMesh();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !meshManager) return;
    
    meshManager.broadcastMessage(MessageType.CHAT_MESSAGE, { text: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {messages.filter(m => m.type === MessageType.CHAT_MESSAGE).map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.source === nodeId} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-slate-800/80 backdrop-blur border-t border-slate-700 pb-safe">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            placeholder={isConnected ? "Message network..." : "Not connected"}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-indigo-500 transition-colors"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
