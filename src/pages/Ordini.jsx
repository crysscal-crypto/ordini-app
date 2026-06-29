import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Plus, Search, Trash2, Edit2, MapPin, FileText, ChevronDown, ChevronUp, Send, Package } from 'lucide-react'
import OrdineModal from '../components/OrdineModal'

const STATI = {
  'Preventivo': { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-l-gray-400',   pill: 'bg-gray-100 text-gray-700'   },
  'Inviato':    { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-l-blue-500',   pill: 'bg-blue-100 text-blue-700'   },
  'Spedito':    { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-l-purple-500', pill: 'bg-purple-100 text-purple-700' },
}

const EMAIL_AZIENDA = 'ordini@cococera.it'

export default function Ordini() {
  const [ordini, setOrdini] = useState([])
  const [clienti, setClienti] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [search, setSearch] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  const [modal, setModal] = useState(null)
  const [espanso, setEspanso] = useState(null)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'ordini'), snap => {
      setOrdini(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.creatoAl?.seconds || 0) - (a.creatoAl?.seconds || 0)))
    })
    const u2 = onSnapshot(collection(db, 'clienti'), snap => {
      setClienti(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const u3 = onSnapshot(collection(db, 'prodotti'), snap => {
      setProdotti(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2(); u3() }
  }, [])

  const filtrati = ordini.filter(o => {
    const matchSearch = o.clienteNome?.toLowerCase().includes(search.toLowerCase())
    const matchStato = !filtroStato || o.stato === filtroStato
    return matchSearch && matchStato
  })

  const salva = async (form) => {
    if (modal?.id) {
      await updateDoc(doc(db, 'ordini', modal.id), { ...form, aggiornatoAl: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'ordini'), { ...form, creatoAl: serverTimestamp() })
    }
    setModal(null)
  }

  const elimina = async (id) => {
    if (!confirm('Eliminare questo ordine?')) return
    await deleteDoc(doc(db, 'ordini', id))
  }

  const aggiornaStato = async (id, stato) => {
    await updateDoc(doc(db, 'ordini', id), { stato, aggiornatoAl: serverTimestamp() })
  }

  const formatData = (ts) => {
    if (!ts) return ''
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const inviaEmailOrdine = (o) => {
    const cliente = clienti.find(c => c.id === o.clienteId)
    const emailCliente = cliente?.email || o.clienteEmail
    const righeText = (o.righe || []).map(r =>
      `- ${r.nome} (${r.codice||''}) x${r.qta} = €${(r.qta * r.prezzoUnitario).toFixed(2)}`
    ).join('\n')
    const body = `AGENTE: CALIUMI CRISTIAN\nBrand: ${o.brand||''}\n\nCliente: ${o.clienteNome}\n${o.indirizzoConsegna?'Indirizzo: '+o.indirizzoConsegna+'\n':''}${o.dataConsegna?'Data consegna: '+o.dataConsegna+'\n':''}Pagamento: ${o.clientePagamento||''}\n\nPRODOTTI:\n${righeText}\n\nImponibile: €${Number(o.totaleNetto||0).toFixed(2)}\nIVA 22%:    €${Number(o.totaleIVA||0).toFixed(2)}\nTOTALE:     €${Number(o.totaleLordo||0).toFixed(2)}\n\n${o.note?'Note: '+o.note:''}\n\nCordiali saluti\nAgente Caliumi Cristian\nordini@cococera.it`
    const dest = []
    if (o.invioEmail === 'cliente' || o.invioEmail === 'entrambi') dest.push(emailCliente)
    if (o.invioEmail === 'azienda' || o.invioEmail === 'entrambi') dest.push(EMAIL_AZIENDA)
    window.location.href = `mailto:${dest.filter(Boolean).join(',')}?subject=${encodeURIComponent('Ordine '+(o.brand||'')+' - '+o.clienteNome)}&body=${encodeURIComponent(body)}`
  }

  const contaPerStato = (s) => ordini.filter(o => o.stato === s).length

  return (
    <div className="max-w-xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordini</h1>
          <p className="text-sm text-gray-400">{ordini.length} ordini totali</p>
        </div>
        <button onClick={() => setModal('nuovo')}
          className="bg-green-500 text-white font-bold py-3.5 px-6 rounded-2xl text-base active:scale-95 transition-all shadow-lg flex items-center gap-2">
          <Plus size={22} /> Nuovo Ordine
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { stato: 'Preventivo', emoji: '📝', color: 'bg-gray-100 border-gray-300' },
          { stato: 'Inviato',    emoji: '📤', color: 'bg-blue-50 border-blue-300'  },
          { stato: 'Spedito',    emoji: '🚚', color: 'bg-purple-50 border-purple-300' },
        ].map(({ stato, emoji, color }) => (
          <button key={stato} onClick={() => setFiltroStato(filtroStato === stato ? '' : stato)}
            className={`border-2 rounded-2xl p-3 text-center transition-all active:scale-95 ${color} ${filtroStato === stato ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}>
            <div className="text-2xl mb-0.5">{emoji}</div>
            <div className="text-2xl font-bold text-gray-900">{contaPerStato(stato)}</div>
            <div className="text-xs font-semibold text-gray-500">{stato}</div>
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente..." />
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['', 'Preventivo', 'Inviato', 'Spedito'].map(s => (
          <button key={s} onClick={() => setFiltroStato(s)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${
              filtroStato === s ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-500 border-gray-200'}`}>
            {s || '📋 Tutti'}
          </button>
        ))}
      </div>

      {filtrati.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-3">📋</div>
          <div className="text-lg font-bold">Nessun ordine</div>
          <div className="text-sm mt-1">Crea il primo ordine con il tasto verde</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrati.map(o => {
            const cfg = STATI[o.stato] || STATI['Preventivo']
            return (
              <div key={o.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${cfg.border} overflow-hidden`}>
                <div className={`px-4 pt-4 pb-3 ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-lg truncate">{o.clienteNome}</div>
                      {o.brand && (
                        <span className="inline-block text-xs font-bold bg-white/70 text-blue-700 px-2 py-0.5 rounded-full mt-0.5">
                          {o.brand}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`badge ${cfg.pill} font-bold`}>{o.stato}</span>
                      <div className="text-xl font-bold text-gray-900 mt-1">€{Number(o.totaleLordo || o.totale || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">impon. €{Number(o.totaleNetto || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                    {o.creatoAl && <span>📅 {formatData(o.creatoAl)}</span>}
                    {o.dataConsegna && <span>🚚 {o.dataConsegna}</span>}
                    {o.clientePagamento && <span>💳 {o.clientePagamento}</span>}
                  </div>
                </div>

                <div className="px-4 py-2 flex gap-2 border-b border-gray-100">
                  {['Inviato', 'Spedito'].map(s => (
                    o.stato !== s && (
                      <button key={s} onClick={() => aggiornaStato(o.id, s)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl border-2 active:scale-95 transition-all ${STATI[s].pill} border-current`}>
                        → {s}
                      </button>
                    )
                  ))}
                </div>

                <button onClick={() => setEspanso(espanso === o.id ? null : o.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  {espanso === o.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {espanso === o.id ? 'Chiudi dettagli' : 'Vedi dettagli'}
                </button>

                {espanso === o.id && (
                  <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
                    {o.righe?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                          <Package size={12}/> Prodotti ordinati
                        </div>
                        {o.righe.map((r, i) => (
                          <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                            <span className="text-gray-700 font-medium">{r.qta} × {r.nome}</span>
                            <span className="font-bold text-gray-900">€{(r.qta * r.prezzoUnitario).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="mt-2 bg-gray-800 text-white rounded-xl p-3 text-sm">
                          <div className="flex justify-between mb-1"><span className="text-gray-300">Imponibile</span><span>€{Number(o.totaleNetto||0).toFixed(2)}</span></div>
                          <div className="flex justify-between mb-1"><span className="text-gray-300">IVA 22%</span><span>€{Number(o.totaleIVA||0).toFixed(2)}</span></div>
                          <div className="flex justify-between font-bold text-base border-t border-gray-600 pt-1 mt-1"><span>Totale</span><span className="text-blue-300">€{Number(o.totaleLordo||0).toFixed(2)}</span></div>
                        </div>
                      </div>
                    )}
                    {o.indirizzoConsegna && (
                      <div className="flex gap-2 items-start text-sm bg-gray-50 rounded-xl p-3">
                        <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-600">{o.indirizzoConsegna}</span>
                      </div>
                    )}
                    {o.note && (
                      <div className="flex gap-2 items-start text-sm bg-amber-50 rounded-xl p-3">
                        <FileText size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-gray-700">{o.note}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button onClick={() => setModal(o)}
                        className="bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm active:scale-95 flex flex-col items-center gap-1">
                        <Edit2 size={18}/> Modifica
                      </button>
                      <button onClick={() => inviaEmailOrdine(o)}
                        className="bg-emerald-600 text-white font-bold py-3 rounded-2xl text-sm active:scale-95 flex flex-col items-center gap-1">
                        <Send size={18}/> Email
                      </button>
                      <button onClick={() => elimina(o.id)}
                        className="bg-red-500 text-white font-bold py-3 rounded-2xl text-sm active:scale-95 flex flex-col items-center gap-1">
                        <Trash2 size={18}/> Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <OrdineModal
          ordine={modal === 'nuovo' ? null : modal}
          clienti={clienti}
          prodotti={prodotti}
          onSave={salva}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}