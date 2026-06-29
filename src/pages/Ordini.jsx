import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Plus, Search, Trash2, Edit2, MapPin, FileText, ChevronDown, ChevronUp, Send } from 'lucide-react'
import OrdineModal from '../components/OrdineModal'

const STATO_COLORI = {
  'Preventivo': 'bg-gray-100 text-gray-600',
  'Inviato':    'bg-blue-100 text-blue-700',
  'Spedito':    'bg-purple-100 text-purple-700',
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
      `- ${r.nome} (${r.codice}) x${r.qta} = €${(r.qta * r.prezzoUnitario).toFixed(2)}`
    ).join('\n')
    const body = `AGENTE: CALIUMI CRISTIAN\nBrand: ${o.brand||''}\n\nCliente: ${o.clienteNome}\n${o.indirizzoConsegna?'Indirizzo: '+o.indirizzoConsegna+'\n':''} ${o.dataConsegna?'Data consegna: '+o.dataConsegna+'\n':''}Pagamento: ${o.clientePagamento||''}\n\nPRODOTTI:\n${righeText}\n\nImponibile: €${Number(o.totaleNetto||0).toFixed(2)}\nIVA 22%:    €${Number(o.totaleIVA||0).toFixed(2)}\nTOTALE:     €${Number(o.totaleLordo||0).toFixed(2)}\n\n${o.note?'Note: '+o.note:''}\n\nCordiali saluti\nAgente Caliumi Cristian\nordini@cococera.it`
    const dest = []
    if (o.invioEmail === 'cliente' || o.invioEmail === 'entrambi') dest.push(emailCliente)
    if (o.invioEmail === 'azienda' || o.invioEmail === 'entrambi') dest.push(EMAIL_AZIENDA)
    window.location.href = `mailto:${dest.filter(Boolean).join(',')}?subject=${encodeURIComponent('Ordine '+( o.brand||'')+' - '+o.clienteNome)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordini</h1>
          <p className="text-sm text-gray-400">{ordini.length} ordini totali</p>
        </div>
        <button onClick={() => setModal('nuovo')} className="btn-primary">
          <Plus size={20} /> Nuovo
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente..." />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', 'Preventivo', 'Inviato', 'Spedito'].map(s => (
          <button key={s} onClick={() => setFiltroStato(s)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              filtroStato === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
            {s || 'Tutti'}
          </button>
        ))}
      </div>

      {filtrati.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-lg font-semibold">Nessun ordine</div>
          <div className="text-sm">Crea il primo ordine</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrati.map(o => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base truncate">{o.clienteNome}</div>
                  {o.brand && <div className="text-xs text-blue-500 font-semibold">{o.brand}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">{formatData(o.creatoAl)}</div>
                  {o.dataConsegna && <div className="text-xs text-gray-500">📅 Consegna: {o.dataConsegna}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${STATO_COLORI[o.stato] || 'bg-gray-100 text-gray-600'}`}>{o.stato}</span>
                  <div className="font-bold text-gray-900 text-right">€{Number(o.totaleLordo || o.totale || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400 text-right">impon. €{Number(o.totaleNetto || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {['Inviato', 'Spedito'].map(s => (
                  o.stato !== s && (
                    <button key={s} onClick={() => aggiornaStato(o.id, s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 active:scale-95 transition-all ${STATO_COLORI[s] || ''}`}>
                      → {s}
                    </button>
                  )
                ))}
              </div>

              <button onClick={() => setEspanso(espanso === o.id ? null : o.id)}
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-gray-400 py-1">
                {espanso === o.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {espanso === o.id ? 'Chiudi' : 'Dettagli'}
              </button>

              {espanso === o.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                  {o.righe?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Prodotti</div>
                      {o.righe.map((r, i) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                          <span className="text-gray-700">{r.qta} × {r.nome}</span>
                          <span className="font-semibold text-gray-900">€{(r.qta * r.prezzoUnitario).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="mt-2 bg-gray-50 rounded-lg p-2 text-sm">
                        <div className="flex justify-between text-gray-500"><span>Imponibile</span><span>€{Number(o.totaleNetto||0).toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>IVA 22%</span><span>€{Number(o.totaleIVA||0).toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-gray-900 border-t mt-1 pt-1"><span>Totale</span><span>€{Number(o.totaleLordo||0).toFixed(2)}</span></div>
                      </div>
                    </div>
                  )}
                  {o.clientePagamento && (
                    <div className="text-sm text-gray-600">💳 {o.clientePagamento}</div>
                  )}
                  {o.indirizzoConsegna && (
                    <div className="flex gap-2 items-start text-sm">
                      <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{o.indirizzoConsegna}</span>
                    </div>
                  )}
                  {o.note && (
                    <div className="flex gap-2 items-start text-sm">
                      <FileText size={15} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{o.note}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setModal(o)} className="btn-primary flex-1 py-2.5 text-sm">
                      <Edit2 size={16} /> Modifica
                    </button>
                    <button onClick={() => inviaEmailOrdine(o)} className="btn-secondary flex-1 py-2.5 text-sm">
                      <Send size={16} /> Email
                    </button>
                    <button onClick={() => elimina(o.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl active:scale-95">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
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