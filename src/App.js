import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing/Landing';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import AgentAI from './pages/agentAI/AgentAI';
import Notes from './pages/notes/Notes';
import Calendar from './pages/calendar/Calendar';
import Settings from './pages/settings/Settings';
import Register from './pages/register/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/agentAI" element={<AgentAI/>} />
        <Route path="/notes" element={<Notes/>} />
        <Route path="/calendar" element={<Calendar/>} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
