import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Plus, Search, Phone, Mail, Trash2, Edit2, CreditCard, MapPin } from 'lucide-react'
import ClienteModal from '../components/ClienteModal'

const STATO_CONFIG = {
  'Attivo':   { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  'Prospect': { bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-500'  },
  'Inattivo': { bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400'  },
  'Perso':    { bg: 'bg-red-100',   text: 'text-red-600',   dot: 'bg-red-500'   },
}

export default function Clienti() {
  const [clienti, setClienti] = useState([])
  const [search, setSearch] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clienti'), snap => {
      setClienti(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.ragioneSociale?.localeCompare(b.ragioneSociale)))
    })
    return unsub
  }, [])

  const filtrati = clienti.filter(c => {
    const matchSearch = c.ragioneSociale?.toLowerCase().includes(search.toLowerCase()) ||
      c.referente?.toLowerCase().includes(search.toLowerCase()) ||
      c.citta?.toLowerCase().includes(search.toLowerCase())
    const matchStato = !filtroStato || c.stato === filtroStato
    return matchSearch && matchStato
  })

  const salva = async (form) => {
    if (modal?.id) {
      await updateDoc(doc(db, 'clienti', modal.id), { ...form, aggiornatoAl: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'clienti'), { ...form, creatoAl: serverTimestamp() })
    }
    setModal(null)
  }

  const elimina = async (id) => {
    if (!confirm('Eliminare questo cliente?')) return
    await deleteDoc(doc(db, 'clienti', id))
  }

  const contaPerStato = (stato) => clienti.filter(c => c.stato === stato).length

  return (
    <div className="max-w-xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <p className="text-sm text-gray-400">{clienti.length} clienti totali</p>
        </div>
        <button onClick={() => setModal('nuovo')} className="btn-primary">
          <Plus size={20} /> Nuovo
        </button>
      </div>

      {/* STATO PILLS */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button onClick={() => setFiltroStato('')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
            !filtroStato ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>
          Tutti ({clienti.length})
        </button>
        {Object.entries(STATO_CONFIG).map(([stato, cfg]) => (
          <button key={stato} onClick={() => setFiltroStato(stato === filtroStato ? '' : stato)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              filtroStato === stato ? `${cfg.bg} ${cfg.text} border-current` : 'bg-white text-gray-500 border-gray-200'}`}>
            {stato} ({contaPerStato(stato)})
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente, città..." />
      </div>

      {filtrati.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <div className="text-lg font-semibold">Nessun cliente</div>
          <div className="text-sm">Aggiungi il primo cliente</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrati.map(c => {
            const cfg = STATO_CONFIG[c.stato] || STATO_CONFIG['Attivo']
            return (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="font-bold text-gray-900 text-base truncate">{c.ragioneSociale}</span>
                    </div>
                    {c.referente && <div className="text-sm text-gray-500 ml-4">{c.referente}</div>}
                    {(c.citta || c.indirizzo) && (
                      <div className="text-xs text-gray-400 ml-4 flex items-center gap-1 mt-0.5">
                        <MapPin size={11}/>{[c.indirizzo, c.citta, c.provincia].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="mt-2 ml-4 flex flex-wrap gap-2 items-center">
                      <span className={`badge ${cfg.bg} ${cfg.text}`}>{c.stato || 'Attivo'}</span>
                      {c.pagamento && (
                        <span className="badge bg-amber-100 text-amber-700">
                          <CreditCard size={10} className="inline mr-1"/>{c.pagamento}
                        </span>
                      )}
                      {c.giornoChiusura && c.giornoChiusura !== '—' && (
                        <span className="badge bg-orange-100 text-orange-700">⚠️ Chiuso {c.giornoChiusura}</span>
                      )}
                      {c.piva && <span className="badge bg-gray-100 text-gray-500 font-mono text-xs">P.IVA {c.piva}</span>}
                    </div>
                    <div className="mt-2 ml-4 flex gap-3">
                      {c.telefono && (
                        <a href={`tel:${c.telefono}`} className="text-sm text-blue-600 flex items-center gap-1">
                          <Phone size={13}/>{c.telefono}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-sm text-blue-600 flex items-center gap-1 truncate max-w-[150px]">
                          <Mail size={13}/>{c.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <button onClick={() => setModal(c)}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95">
                      <Edit2 size={18}/>
                    </button>
                    <button onClick={() => elimina(c.id)}
                      className="p-2.5 bg-red-50 text-red-500 rounded-xl active:scale-95">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ClienteModal
          cliente={modal === 'nuovo' ? null : modal}
          onSave={salva}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}