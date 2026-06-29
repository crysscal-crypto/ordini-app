import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Plus, Search, Trash2, Edit2, Mail, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import OrdineModal from '../components/OrdineModal'

const STATO_COLORI = {
  'Inviato': 'bg-blue-100 text-blue-700',
  'Confermato': 'bg-cyan-100 text-cyan-700',
  'In lavorazione': 'bg-amber-100 text-amber-700',
  'Spedito': 'bg-purple-100 text-purple-700',
  'Consegnato': 'bg-green-100 text-green-700',
  'Annullato': 'bg-red-100 text-red-700',
}

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
    const data = {
      ...form,
      aggiornatoAl: serverTimestamp()
    }
    if (modal?.id) {
      await updateDoc(doc(db, 'ordini', modal.id), data)
    } else {
      await addDoc(collection(db, 'ordini'), { ...data, creatoAl: serverTimestamp() })
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

      {/* SEARCH */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente..." />
      </div>

      {/* FILTRO STATO */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['', 'Inviato', 'Confermato', 'In lavorazione', 'Spedito', 'Consegnato', 'Annullato'].map(s => (
          <button key={s} onClick={() => setFiltroStato(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              filtroStato === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            {s || 'Tutti'}
          </button>
        ))}
      </div>

      {/* LISTA */}
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
              {/* HEADER */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base truncate">{o.clienteNome}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatData(o.creatoAl)}</div>
                  {o.dataConsegna && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      📅 Consegna: {o.dataConsegna}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${STATO_COLORI[o.stato] || 'bg-gray-100 text-gray-600'}`}>
                    {o.stato}
                  </span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">€{Number(o.totale || 0).toFixed(2)}</div>
                    <div className="text-xs text-green-600">prov. €{Number(o.totaleProvvigione || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* AZIONI RAPIDE STATO */}
              <div className="mt-3 flex gap-1 flex-wrap">
                {['Confermato', 'Spedito', 'Consegnato'].map(s => (
                  o.stato !== s && (
                    <button key={s} onClick={() => aggiornaStato(o.id, s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 active:scale-95 transition-all ${STATO_COLORI[s]?.replace('bg-', 'border-').replace('100', '300') || ''} ${STATO_COLORI[s] || ''}`}>
                      → {s}
                    </button>
                  )
                ))}
              </div>

              {/* ESPANDI */}
              <button
                onClick={() => setEspanso(espanso === o.id ? null : o.id)}
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-gray-400 py-1">
                {espanso === o.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {espanso === o.id ? 'Meno dettagli' : 'Dettagli ordine'}
              </button>

              {espanso === o.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                  {/* PRODOTTI */}
                  {o.righe?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Prodotti</div>
                      {o.righe.map((r, i) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50">
                          <span className="text-gray-700">{r.qta} {r.unita} × {r.nome}</span>
                          <span className="font-semibold text-gray-900">€{(r.qta * r.prezzoUnitario).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* INDIRIZZO */}
                  {o.indirizzoConsegna && (
                    <div className="flex gap-2 items-start text-sm">
                      <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{o.indirizzoConsegna}</span>
                    </div>
                  )}

                  {/* NOTE */}
                  {o.note && (
                    <div className="flex gap-2 items-start text-sm">
                      <FileText size={15} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{o.note}</span>
                    </div>
                  )}

                  {/* EMAIL INFO */}
                  {o.invioEmail && (
                    <div className="flex gap-2 items-center text-xs text-gray-400">
                      <Mail size={13} />
                      <span>Email inviata a: {o.invioEmail}</span>
                    </div>
                  )}

                  {/* AZIONI */}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setModal(o)} className="btn-primary flex-1 py-2.5 text-sm">
                      <Edit2 size={16} /> Modifica
                    </button>
                    <button onClick={() => elimina(o.id)}
                      className="p-2.5 bg-red-50 text-red-500 rounded-xl active:scale-95">
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
