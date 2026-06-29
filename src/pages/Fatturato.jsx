import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { TrendingUp, Euro, Award, Package } from 'lucide-react'

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export default function Fatturato() {
  const [ordini, setOrdini] = useState([])
  const [anno, setAnno] = useState(new Date().getFullYear())

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ordini'), snap => {
      setOrdini(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(o => o.stato !== 'Annullato'))
    })
    return unsub
  }, [])

  const getAnno = (o) => {
    if (!o.creatoAl) return null
    const d = o.creatoAl.seconds ? new Date(o.creatoAl.seconds * 1000) : new Date(o.creatoAl)
    return d.getFullYear()
  }

  const getMese = (o) => {
    if (!o.creatoAl) return null
    const d = o.creatoAl.seconds ? new Date(o.creatoAl.seconds * 1000) : new Date(o.creatoAl)
    return d.getMonth()
  }

  const ordiniAnno = ordini.filter(o => getAnno(o) === anno)

  const totaleAnno = ordiniAnno.reduce((s, o) => s + (o.totale || 0), 0)
  const totaleProvvigione = ordiniAnno.reduce((s, o) => s + (o.totaleProvvigione || 0), 0)
  const numOrdini = ordiniAnno.length

  // Per mese
  const perMese = MESI.map((_, i) => {
    const del_mese = ordiniAnno.filter(o => getMese(o) === i)
    return {
      totale: del_mese.reduce((s, o) => s + (o.totale || 0), 0),
      provvigione: del_mese.reduce((s, o) => s + (o.totaleProvvigione || 0), 0),
      num: del_mese.length
    }
  })

  const maxMese = Math.max(...perMese.map(m => m.totale), 1)

  // Per cliente
  const perCliente = {}
  ordiniAnno.forEach(o => {
    if (!perCliente[o.clienteNome]) perCliente[o.clienteNome] = { totale: 0, num: 0, provvigione: 0 }
    perCliente[o.clienteNome].totale += o.totale || 0
    perCliente[o.clienteNome].provvigione += o.totaleProvvigione || 0
    perCliente[o.clienteNome].num++
  })
  const topClienti = Object.entries(perCliente)
    .sort((a, b) => b[1].totale - a[1].totale)
    .slice(0, 5)

  // Per prodotto
  const perProdotto = {}
  ordiniAnno.forEach(o => {
    (o.righe || []).forEach(r => {
      if (!perProdotto[r.nome]) perProdotto[r.nome] = { totale: 0, qta: 0 }
      perProdotto[r.nome].totale += r.qta * r.prezzoUnitario
      perProdotto[r.nome].qta += r.qta
    })
  })
  const topProdotti = Object.entries(perProdotto)
    .sort((a, b) => b[1].totale - a[1].totale)
    .slice(0, 5)

  const anni = [...new Set(ordini.map(getAnno).filter(Boolean))].sort((a, b) => b - a)
  if (!anni.includes(anno)) anni.unshift(anno)

  return (
    <div className="max-w-xl mx-auto px-4 pt-5 pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Fatturato</h1>
        <select className="input-field w-auto text-sm py-2"
          value={anno} onChange={e => setAnno(Number(e.target.value))}>
          {anni.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center">
          <Euro size={20} className="text-blue-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">€{totaleAnno.toFixed(0)}</div>
          <div className="text-xs text-gray-400">Venduto</div>
        </div>
        <div className="card text-center">
          <Award size={20} className="text-green-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">€{totaleProvvigione.toFixed(0)}</div>
          <div className="text-xs text-gray-400">Provvigioni</div>
        </div>
        <div className="card text-center">
          <TrendingUp size={20} className="text-purple-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">{numOrdini}</div>
          <div className="text-xs text-gray-400">Ordini</div>
        </div>
      </div>

      {/* GRAFICO MENSILE */}
      <div className="card mb-5">
        <div className="text-sm font-bold text-gray-700 mb-4">Andamento mensile</div>
        <div className="flex items-end gap-1 h-32">
          {perMese.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                <div
                  className="w-full bg-blue-500 rounded-t-sm transition-all duration-500"
                  style={{ height: `${maxMese > 0 ? (m.totale / maxMese) * 96 : 0}px`, minHeight: m.totale > 0 ? 4 : 0 }}
                  title={`€${m.totale.toFixed(2)}`}
                />
              </div>
              <div className="text-xs text-gray-400">{MESI[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP CLIENTI */}
      {topClienti.length > 0 && (
        <div className="card mb-5">
          <div className="text-sm font-bold text-gray-700 mb-3">Top Clienti</div>
          <div className="flex flex-col gap-2">
            {topClienti.map(([nome, dati], i) => (
              <div key={nome}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{nome}</span>
                    <span className="text-xs text-gray-400">{dati.num} ord.</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">€{dati.totale.toFixed(0)}</div>
                    <div className="text-xs text-green-600">€{dati.provvigione.toFixed(0)}</div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${(dati.totale / (topClienti[0][1].totale || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP PRODOTTI */}
      {topProdotti.length > 0 && (
        <div className="card">
          <div className="text-sm font-bold text-gray-700 mb-3">
            <Package size={15} className="inline mr-1" />
            Top Prodotti
          </div>
          <div className="flex flex-col gap-2">
            {topProdotti.map(([nome, dati], i) => (
              <div key={nome} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{nome}</div>
                    <div className="text-xs text-gray-400">Qtà: {dati.qta}</div>
                  </div>
                </div>
                <div className="font-bold text-gray-900 text-sm">€{dati.totale.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ordini.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <div className="text-lg font-semibold">Nessun dato</div>
          <div className="text-sm">Crea i primi ordini per vedere le statistiche</div>
        </div>
      )}
    </div>
  )
}
