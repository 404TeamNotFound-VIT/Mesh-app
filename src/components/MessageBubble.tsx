
export function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  return (
    <div className={`flex flex-col mb-4 max-w-[80%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
      <span className="text-xs text-slate-400 mb-1 px-1">{isOwn ? 'You' : message.source}</span>
      <div 
        className={`px-4 py-2 rounded-2xl ${
          isOwn 
            ? 'bg-indigo-600 text-white rounded-tr-sm' 
            : 'bg-slate-700 text-slate-100 rounded-tl-sm shadow-md'
        }`}
      >
        {message.payload?.text || JSON.stringify(message.payload)}
      </div>
      <span className="text-[10px] text-slate-500 mt-1 px-1">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
