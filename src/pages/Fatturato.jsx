import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { Euro, Award, TrendingUp, Package, Users, ChevronDown, ChevronUp, Lock } from 'lucide-react'

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

export default function Fatturato() {
  const [ordini, setOrdini] = useState([])
  const [anno, setAnno] = useState(new Date().getFullYear())
  const [clienteOpen, setClienteOpen] = useState(null)
  const [meseOpen, setMeseOpen] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db,'ordini'), snap => {
      setOrdini(snap.docs.map(d=>({id:d.id,...d.data()})).filter(o=>o.stato!=='Annullato' && o.stato!=='Preventivo'))
    })
    return unsub
  }, [])

  const getTs = o => o.creatoAl?.seconds ? new Date(o.creatoAl.seconds*1000) : o.creatoAl ? new Date(o.creatoAl) : null
  const getAnno = o => getTs(o)?.getFullYear() || null
  const getMese = o => getTs(o)?.getMonth() ?? null
  const fmt = ts => { if(!ts) return ''; const d=ts.seconds?new Date(ts.seconds*1000):new Date(ts); return d.toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'2-digit'}) }

  const oggi = new Date()
  const inizioOggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate())
  const inizioSettimana = new Date(inizioOggi)
  inizioSettimana.setDate(inizioOggi.getDate() - inizioOggi.getDay() + (inizioOggi.getDay() === 0 ? -6 : 1))

  const ordiniOggi = ordini.filter(o => { const d = getTs(o); return d && d >= inizioOggi })
  const ordiniSettimana = ordini.filter(o => { const d = getTs(o); return d && d >= inizioSettimana })

  const totOggi = ordiniOggi.reduce((s,o)=>s+(o.totaleNetto||o.totale||0),0)
  const totSettimana = ordiniSettimana.reduce((s,o)=>s+(o.totaleNetto||o.totale||0),0)
  const provOggi = ordiniOggi.reduce((s,o)=>s+(o.totaleProvvigione||0),0)
  const provSettimana = ordiniSettimana.reduce((s,o)=>s+(o.totaleProvvigione||0),0)

  const ordiniAnno = ordini.filter(o=>getAnno(o)===anno)
  const totNetto = ordiniAnno.reduce((s,o)=>s+(o.totaleNetto||o.totale||0),0)
  const totLordo = ordiniAnno.reduce((s,o)=>s+(o.totaleLordo||o.totale||0),0)
  const totProv  = ordiniAnno.reduce((s,o)=>s+(o.totaleProvvigione||0),0)
  const numOrd   = ordiniAnno.length

  const perMese = MESI.map((_,i) => {
    const om = ordiniAnno.filter(o=>getMese(o)===i)
    return { netto:om.reduce((s,o)=>s+(o.totaleNetto||o.totale||0),0), prov:om.reduce((s,o)=>s+(o.totaleProvvigione||0),0), num:om.length, ordini:om }
  })
  const maxMese = Math.max(...perMese.map(m=>m.netto),1)

  const perCliente = {}
  ordiniAnno.forEach(o => {
    if(!perCliente[o.clienteNome]) perCliente[o.clienteNome]={netto:0,lordo:0,prov:0,num:0,ordini:[]}
    perCliente[o.clienteNome].netto  += o.totaleNetto||o.totale||0
    perCliente[o.clienteNome].lordo  += o.totaleLordo||o.totale||0
    perCliente[o.clienteNome].prov   += o.totaleProvvigione||0
    perCliente[o.clienteNome].num++
    perCliente[o.clienteNome].ordini.push(o)
  })
  const topClienti = Object.entries(perCliente).sort((a,b)=>b[1].netto-a[1].netto)

  const perProd = {}
  ordiniAnno.forEach(o => (o.righe||[]).forEach(r => {
    if(!perProd[r.nome]) perProd[r.nome]={tot:0,qta:0}
    perProd[r.nome].tot += r.qta*r.prezzoUnitario
    perProd[r.nome].qta += r.qta
  }))
  const topProd = Object.entries(perProd).sort((a,b)=>b[1].tot-a[1].tot).slice(0,5)

  const anni = [...new Set(ordini.map(getAnno).filter(Boolean))].sort((a,b)=>b-a)
  if(!anni.includes(anno)) anni.unshift(anno)

  return (
    <div className="max-w-xl mx-auto px-4 pt-5 pb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fatturato</h1>
          <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5"><Lock size={11}/> Sezione privata</div>
        </div>
        <select className="input-field w-auto text-sm py-2" value={anno} onChange={e=>setAnno(Number(e.target.value))}>
          {anni.map(a=><option key={a}>{a}</option>)}
        </select>
      </div>

      {/* OGGI E SETTIMANA */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 text-center">
          <div className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">☀️ Oggi</div>
          <div className="text-2xl font-bold text-blue-800">€{totOggi.toFixed(0)}</div>
          <div className="text-xs text-blue-500">{ordiniOggi.length} ordini</div>
          <div className="text-xs text-amber-600 mt-0.5 flex items-center justify-center gap-1"><Lock size={10}/> €{provOggi.toFixed(0)}</div>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 text-center">
          <div className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">📅 Settimana</div>
          <div className="text-2xl font-bold text-emerald-800">€{totSettimana.toFixed(0)}</div>
          <div className="text-xs text-emerald-500">{ordiniSettimana.length} ordini</div>
          <div className="text-xs text-amber-600 mt-0.5 flex items-center justify-center gap-1"><Lock size={10}/> €{provSettimana.toFixed(0)}</div>
        </div>
      </div>

      {/* KPI ANNO */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card text-center">
          <Euro size={20} className="text-gray-400 mx-auto mb-1"/>
          <div className="text-xs text-gray-400 mb-0.5">Imponibile {anno}</div>
          <div className="text-2xl font-bold text-gray-900">€{totNetto.toFixed(0)}</div>
        </div>
        <div className="card text-center">
          <Euro size={20} className="text-blue-500 mx-auto mb-1"/>
          <div className="text-xs text-gray-400 mb-0.5">Totale + IVA</div>
          <div className="text-2xl font-bold text-blue-700">€{totLordo.toFixed(0)}</div>
        </div>
        <div className="card text-center col-span-2 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-center gap-1 mb-1"><Lock size={14} className="text-amber-500"/><Award size={20} className="text-amber-500"/></div>
          <div className="text-xs text-amber-600 mb-0.5">Mia Provvigione {anno}</div>
          <div className="text-3xl font-bold text-amber-700">€{totProv.toFixed(2)}</div>
          <div className="text-xs text-amber-500 mt-1">{numOrd} ordini</div>
        </div>
      </div>

      {/* PROVVIGIONI MESE PER MESE */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={14} className="text-amber-500"/>
          <div className="text-sm font-bold text-gray-700">Provvigioni mese per mese</div>
        </div>
        <div className="flex flex-col gap-1">
          {perMese.map((m,i) => (
            <div key={i}>
              <button className="w-full" onClick={()=>setMeseOpen(meseOpen===i?null:i)}>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 text-xs font-bold text-gray-500 shrink-0">{MESI[i]}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full transition-all" style={{width:`${(m.netto/maxMese)*100}%`}}/>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900">€{m.netto.toFixed(0)}</div>
                    <div className="text-xs text-amber-600">€{m.prov.toFixed(0)} prov.</div>
                  </div>
                  {m.num>0 && (meseOpen===i?<ChevronUp size={14} className="text-gray-400 shrink-0"/>:<ChevronDown size={14} className="text-gray-400 shrink-0"/>)}
                </div>
              </button>
              {meseOpen===i && m.ordini.length>0 && (
                <div className="ml-11 mb-2 bg-amber-50 rounded-xl p-3">
                  {m.ordini.map(o=>(
                    <div key={o.id} className="flex justify-between text-sm py-1 border-b border-amber-100 last:border-0">
                      <div><div className="font-semibold text-gray-800">{o.clienteNome}</div>
                        <div className="text-xs text-gray-400">{fmt(o.creatoAl)}</div></div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">€{Number(o.totaleNetto||o.totale||0).toFixed(2)}</div>
                        <div className="text-xs text-amber-600">€{Number(o.totaleProvvigione||0).toFixed(2)} prov.</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-sm pt-2 mt-1 border-t border-amber-200">
                    <span>Totale {MESI[i]}</span>
                    <div className="text-right"><div>€{m.netto.toFixed(2)}</div><div className="text-amber-600">€{m.prov.toFixed(2)} prov.</div></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FATTURATO PER CLIENTE */}
      {topClienti.length>0 && (
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-500"/>
            <div className="text-sm font-bold text-gray-700">Fatturato per Cliente {anno}</div>
          </div>
          {topClienti.map(([nome,d],i) => (
            <div key={nome}>
              <button className="w-full text-left" onClick={()=>setClienteOpen(clienteOpen===nome?null:nome)}>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-5">{i+1}</span>
                    <div><div className="text-sm font-semibold text-gray-800">{nome}</div>
                      <div className="text-xs text-gray-400">{d.num} ordini</div></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">€{d.netto.toFixed(0)}</div>
                      <div className="text-xs text-amber-600">€{d.prov.toFixed(0)} prov.</div>
                    </div>
                    {clienteOpen===nome?<ChevronUp size={14} className="text-gray-400"/>:<ChevronDown size={14} className="text-gray-400"/>}
                  </div>
                </div>
                <div className="ml-7 w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{width:`${(d.netto/(topClienti[0][1].netto||1))*100}%`}}/>
                </div>
              </button>
              {clienteOpen===nome && (
                <div className="ml-7 mb-2 bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Storico ordini</div>
                  {d.ordini.sort((a,b)=>(b.creatoAl?.seconds||0)-(a.creatoAl?.seconds||0)).map(o=>(
                    <div key={o.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <div><div className="text-gray-700">{fmt(o.creatoAl)}</div>
                        <div className="text-xs text-gray-400">{o.stato}</div></div>
                      <div className="text-right">
                        <div className="font-semibold">€{Number(o.totaleNetto||o.totale||0).toFixed(2)}</div>
                        <div className="text-xs text-blue-600">+IVA €{Number(o.totaleLordo||0).toFixed(2)}</div>
                        <div className="text-xs text-amber-600">€{Number(o.totaleProvvigione||0).toFixed(2)} prov.</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-sm pt-2 mt-1 border-t border-gray-200">
                    <span>Totale {anno}</span>
                    <div className="text-right"><div>€{d.lordo.toFixed(2)} (IVA incl.)</div>
                      <div className="text-amber-600">€{d.prov.toFixed(2)} prov.</div></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TOP PRODOTTI */}
      {topProd.length>0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-gray-500"/>
            <div className="text-sm font-bold text-gray-700">Top Prodotti {anno}</div>
          </div>
          {topProd.map(([nome,d],i)=>(
            <div key={nome} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4">{i+1}</span>
                <div><div className="text-sm font-semibold text-gray-800">{nome}</div>
                  <div className="text-xs text-gray-400">Qtà: {d.qta}</div></div>
              </div>
              <div className="font-bold text-gray-900 text-sm">€{d.tot.toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {ordini.length===0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <div className="text-lg font-semibold">Nessun dato</div>
          <div className="text-sm">Crea i primi ordini per vedere le statistiche</div>
        </div>
      )}
    </div>
  )
}