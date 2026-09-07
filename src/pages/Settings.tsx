import { useState, useEffect } from 'react';
import { useMesh } from '../context/MeshContext';
import { getIdentity, updateDisplayName } from '../storage/identity';

export function Settings() {
  const { nodeId, meshId } = useMesh();
  const [name, setName] = useState('');

  useEffect(() => {
    getIdentity().then(id => {
      if (id) setName(id.displayName);
    });
  }, []);

  const handleSave = () => {
    updateDisplayName(name).then(() => {
      alert("Name updated!");
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
            />
            <button onClick={handleSave} className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium">Save</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Node ID</label>
          <div className="bg-slate-800 p-3 rounded-lg font-mono text-xs text-slate-300 break-all border border-slate-700">
            {nodeId || "Not initialized"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Current Mesh</label>
          <div className="bg-slate-800 p-3 rounded-lg font-mono text-xs text-slate-300 border border-slate-700">
            {meshId || "Not connected"}
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-slate-800">
        <button className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
          Disconnect & Clear Data
        </button>
      </div>
    </div>
  );
}
