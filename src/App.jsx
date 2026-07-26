import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import NavBar from './components/NavBar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Clienti from './pages/Clienti'
import Prodotti from './pages/Prodotti'
import Ordini from './pages/Ordini'
import Fatturato from './pages/Fatturato'
import Backup from './pages/Backup'

export default function App() {
  const [utente, setUtente] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUtente(u))
    return unsub
  }, [])

  if (utente === undefined) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-lg">Caricamento...</div>
    </div>
  )

  if (!utente) return <Login />

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar onLogout={() => signOut(auth)} />
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