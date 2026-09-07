import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MeshProvider } from './context/MeshContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateNetwork } from './pages/CreateNetwork';
import { JoinNetwork } from './pages/JoinNetwork';
import { NetworkDashboard } from './pages/NetworkDashboard';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <MeshProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="create" element={<CreateNetwork />} />
            <Route path="join" element={<JoinNetwork />} />
            <Route path="network" element={<NetworkDashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MeshProvider>
  );
}
