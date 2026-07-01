import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import TopBar from './components/TopBar'
import Clienti from './pages/Clienti'
import Prodotti from './pages/Prodotti'
import Ordini from './pages/Ordini'
import Fatturato from './pages/Fatturato'
import Backup from './pages/Backup'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar />
      <Routes>
        <Route path="/" element={<Navigate to="/ordini" replace />} />
        <Route path="/clienti"   element={<Clienti />} />
        <Route path="/prodotti"  element={<Prodotti />} />
        <Route path="/ordini"    element={<Ordini />} />
        <Route path="/fatturato" element={<Fatturato />} />
        <Route path="/backup"    element={<Backup />} />
      </Routes>
      <NavBar />
    </div>
  )
}