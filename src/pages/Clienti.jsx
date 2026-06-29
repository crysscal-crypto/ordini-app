import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Plus, Search, Phone, Mail, Trash2, Edit2, ChevronRight, CreditCard } from 'lucide-react'
import ClienteModal from '../components/ClienteModal'

export default function Clienti() {
  const [clienti, setClienti] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'nuovo' | cliente

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clienti'), snap => {
      setClienti(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.ragioneSociale?.localeCompare(b.ragioneSociale)))
    })
    return unsub
  }, [])

  const filtrati = clienti.filter(c =>
    c.ragioneSociale?.toLowerCase().includes(search.toLowerCase()) ||
    c.referente?.toLowerCase().includes(search.toLowerCase()) ||
    c.citta?.toLowerCase().includes(search.toLowerCase())
  )

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

  const statoColore = {
    'Bonifico': 'bg-blue-100 text-blue-700',
    'Contanti': 'bg-green-100 text-green-700',
    '30 gg': 'bg-amber-100 text-amber-700',
    '60 gg': 'bg-orange-100 text-orange-700',
    '90 gg': 'bg-red-100 text-red-700',
  }

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

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca cliente, città..."
        />
      </div>

      {/* LISTA */}
      {filtrati.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <div className="text-lg font-semibold">Nessun cliente</div>
          <div className="text-sm">Aggiungi il primo cliente</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrati.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base truncate">{c.ragioneSociale}</div>
                  {c.referente && <div className="text-sm text-gray-500">{c.referente}</div>}
                  {c.citta && <div className="text-sm text-gray-400">{c.citta}</div>}
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    {c.pagamento && (
                      <span className={`badge ${statoColore[c.pagamento] || 'bg-gray-100 text-gray-600'}`}>
                        <CreditCard size={11} className="inline mr-1" />{c.pagamento}
                      </span>
                    )}
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`} className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                        <Phone size={11} />{c.telefono}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button onClick={() => setModal(c)}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => elimina(c.id)}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl active:scale-95">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
