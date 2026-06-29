import React, { useState, useEffect } from 'react'

const GIORNI = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']

export default function TopBar() {
  const [ora, setOra] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const giorno = GIORNI[ora.getDay()]
  const data = `${ora.getDate()} ${MESI[ora.getMonth()]} ${ora.getFullYear()}`
  const orario = ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 pt-10 pb-4 shadow-md">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold opacity-75 uppercase tracking-widest">Benvenuto</div>
          <div className="text-2xl font-bold leading-tight">Ciao, Cristian 👋</div>
          <div className="text-sm opacity-80 mt-0.5">{giorno}, {data}</div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums tracking-tight">{orario}</div>
          <div className="text-xs opacity-70 mt-0.5">ora locale</div>
        </div>
      </div>
    </div>
  )
}