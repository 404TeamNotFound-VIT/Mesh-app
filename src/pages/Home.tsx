
import { Link, useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useMesh } from '../context/MeshContext';

export function Home() {
  const { isConnected } = useMesh();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center relative">
      <AnimatedBackground />
      
      <div className="mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
          <span className="text-4xl">🌐</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">OfflineMesh</h1>
        <p className="text-slate-400">Communicate without the Internet over a shared local network.</p>
      </div>

      {isConnected ? (
        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => navigate('/network')}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg transition-all"
          >
            Return to Network
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <Link to="/create" className="block w-full">
            <div className="p-5 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl hover:border-indigo-500 transition-colors flex items-center justify-between group">
              <div className="text-left">
                <h3 className="font-semibold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors">Create Network</h3>
                <p className="text-sm text-slate-500">Host a new mesh network</p>
              </div>
              <span className="text-2xl">📡</span>
            </div>
          </Link>
          
          <Link to="/join" className="block w-full">
            <div className="p-5 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl hover:border-cyan-500 transition-colors flex items-center justify-between group">
              <div className="text-left">
                <h3 className="font-semibold text-lg text-slate-200 group-hover:text-cyan-400 transition-colors">Join Network</h3>
                <p className="text-sm text-slate-500">Connect to an existing mesh</p>
              </div>
              <span className="text-2xl">🔗</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
