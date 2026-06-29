import React, { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { Plus, Search, Trash2, Edit2, Upload, Package, Tag } from 'lucide-react'
import ProdottoModal from '../components/ProdottoModal'
import * as XLSX from 'xlsx'

export default function Prodotti() {
  const [prodotti, setProdotti] = useState([])
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [modal, setModal] = useState(null)
  const [importando, setImportando] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'prodotti'), snap => {
      setProdotti(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.nome.localeCompare(b.nome)))
    })
    return unsub
  }, [])

  const categorie = [...new Set(prodotti.map(p => p.categoria).filter(Boolean))]

  const filtrati = prodotti.filter(p => {
    const matchSearch = p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      (p.codice || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoriaFiltro || p.categoria === categoriaFiltro
    return matchSearch && matchCat
  })

  const salva = async (form) => {
    if (modal?.id) {
      await updateDoc(doc(db, 'prodotti', modal.id), { ...form, aggiornatoAl: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'prodotti'), { ...form, creatoAl: serverTimestamp() })
    }
    setModal(null)
  }

  const elimina = async (id) => {
    if (!confirm('Eliminare questo prodotto?')) return
    await deleteDoc(doc(db, 'prodotti', id))
  }

  const importaExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportando(true)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const righe = XLSX.utils.sheet_to_json(ws)

      if (righe.length === 0) {
        alert('File Excel vuoto o formato non riconosciuto')
        return
      }

      const batch = writeBatch(db)
      let count = 0
      righe.forEach(r => {
        const nome = r['nome'] || r['Nome'] || r['NOME'] || r['Prodotto'] || r['prodotto']
        if (!nome) return
        const ref = doc(collection(db, 'prodotti'))
        batch.set(ref, {
          codice: String(r['codice'] || r['Codice'] || r['CODICE'] || ''),
          nome: String(nome),
          categoria: String(r['categoria'] || r['Categoria'] || r['CATEGORIA'] || ''),
          descrizione: String(r['descrizione'] || r['Descrizione'] || ''),
          prezzo: parseFloat(r['prezzo'] || r['Prezzo'] || r['PREZZO'] || 0),
          provvigione: parseFloat(r['provvigione'] || r['Provvigione'] || r['%'] || 0),
          unita: String(r['unita'] || r['Unita'] || r['unità'] || 'pz'),
          creatoAl: serverTimestamp()
        })
        count++
      })
      await batch.commit()
      alert(`✅ Importati ${count} prodotti con successo!`)
    } catch (err) {
      alert('Errore importazione: ' + err.message)
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prodotti</h1>
          <p className="text-sm text-gray-400">{prodotti.length} prodotti totali</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current.click()}
            className="btn-warning" disabled={importando}>
            <Upload size={18} />
            {importando ? 'Import...' : 'Excel'}
          </button>
          <button onClick={() => setModal('nuovo')} className="btn-primary">
            <Plus size={20} />
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importaExcel} />
      </div>

      {/* ISTRUZIONI EXCEL */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
        <strong>Import Excel:</strong> Le colonne devono chiamarsi:
        <span className="font-mono ml-1">nome, codice, categoria, prezzo, provvigione, unita</span>
      </div>

      {/* SEARCH */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Cerca prodotto, codice..." />
      </div>

      {/* FILTRO CATEGORIA */}
      {categorie.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setCategoriaFiltro('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              !categoriaFiltro ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            Tutti
          </button>
          {categorie.map(cat => (
            <button key={cat} onClick={() => setCategoriaFiltro(cat === categoriaFiltro ? '' : cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                categoriaFiltro === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* LISTA */}
      {filtrati.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <div className="text-lg font-semibold">Nessun prodotto</div>
          <div className="text-sm">Aggiungi prodotti o importa da Excel</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrati.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{p.nome}</span>
                    {p.codice && <span className="text-xs text-gray-400 font-mono">{p.codice}</span>}
                  </div>
                  {p.categoria && (
                    <span className="badge bg-purple-100 text-purple-700 mt-1 inline-block">
                      <Tag size={10} className="inline mr-1" />{p.categoria}
                    </span>
                  )}
                  <div className="flex gap-3 mt-2 items-center">
                    <span className="text-xl font-bold text-blue-700">€{Number(p.prezzo).toFixed(2)}</span>
                    <span className="text-sm text-gray-400">/ {p.unita}</span>
                    <span className="badge bg-green-100 text-green-700">
                      {p.provvigione}% prov.
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setModal(p)}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => elimina(p.id)}
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
        <ProdottoModal
          prodotto={modal === 'nuovo' ? null : modal}
          onSave={salva}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
