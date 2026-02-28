import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import HostView from './pages/HostView';
import PlayerView from './pages/PlayerView';

// Connect to the backend
// Connect to the backend - Use same host as frontend
const SOCKET_URL = `http://${window.location.hostname}:3001`;
const socket = io(SOCKET_URL);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 overflow-hidden font-sans">
        <Routes>
          {/* Main / Join view for mobile users */}
          <Route path="/" element={<PlayerView socket={socket} />} />
          <Route path="/join" element={<PlayerView socket={socket} />} />

          {/* Host view for the main screen */}
          <Route path="/host" element={<HostView socket={socket} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
