import { useState, useRef, useEffect } from 'react';
import { useMesh } from '../context/MeshContext';
import { MessageBubble } from './MessageBubble';
import { MessageType } from '../mesh/protocol';

export function ChatBox() {
  const { messages, meshManager, nodeId } = useMesh();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !meshManager) return;
    meshManager.broadcastMessage(MessageType.CHAT_MESSAGE, { text: text.trim() });
    setText('');
  };

  const chatMessages = messages.filter(m => m.type === MessageType.CHAT_MESSAGE);

  return (
    <div className="flex flex-col h-96 bg-slate-800/30 rounded-xl border border-slate-700 mt-6 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {chatMessages.length === 0 ? (
          <div className="text-center text-slate-500 my-auto text-sm">No messages yet. Say hello to the network!</div>
        ) : (
          chatMessages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.source === nodeId} />
          ))
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input 
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button 
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
