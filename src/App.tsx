import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ClaimPage from './pages/ClaimPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tugas/:id" element={<ClaimPage />} />
      </Routes>
    </BrowserRouter>
  );
}
