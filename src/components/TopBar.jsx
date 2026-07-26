import React, { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'

export default function TopBar({ onLogout }) {
  const [ora, setOra] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const giorni = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']
  const mesi = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']

  return (
    <div className="bg-blue-600 text-white px-5 pt-5 pb-4 mb-2">
      <div className="flex items-start justify-between max-w-xl mx-auto">
        <div>
          <div className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-0.5">BENVENUTO</div>
          <div className="text-2xl font-bold leading-tight">Ciao, Cristian 👋</div>
          <div className="text-sm text-blue-200 mt-0.5">
            {giorni[ora.getDay()]}, {ora.getDate()} {mesi[ora.getMonth()]} {ora.getFullYear()}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-3xl font-bold tabular-nums">
            {String(ora.getHours()).padStart(2,'0')}:{String(ora.getMinutes()).padStart(2,'0')}
          </div>
          <div className="text-xs text-blue-200">ora locale</div>
          {onLogout && (
            <button onClick={onLogout}
              className="flex items-center gap-1 text-xs text-blue-200 hover:text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-xl transition-all active:scale-95">
              <LogOut size={13}/> Esci
            </button>
          )}
        </div>
      </div>
    </div>
  )
}