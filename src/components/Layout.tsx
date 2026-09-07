import { Outlet, Link, useLocation } from 'react-router-dom';
import { useMesh } from '../context/MeshContext';

export function Layout() {
  const { pathname } = useLocation();
  const { isConnected } = useMesh();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/network', label: 'Network', icon: '🌐' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-slate-800/80 backdrop-blur-md p-4 border-b border-slate-700 shadow-sm flex items-center justify-between z-10 shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          OfflineMesh
        </h1>
        <div className="flex items-center space-x-2">
           <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
           <span className="text-xs text-slate-400">{isConnected ? 'Connected' : 'Offline'}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-0">
        <Outlet />
      </main>

      <nav className="bg-slate-800/90 backdrop-blur-lg border-t border-slate-700 p-2 pb-safe shrink-0 z-10">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 px-4 rounded-xl transition-colors ${
                pathname === item.path ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
