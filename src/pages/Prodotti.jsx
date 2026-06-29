import React, { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { Plus, Search, Trash2, Edit2, Upload, Tag, Star, Check } from 'lucide-react'
import ProdottoModal from '../components/ProdottoModal'
import * as XLSX from 'xlsx'

const BRAND = ['Coco Cera', 'Callus Stop', 'Unica Wax']
const CAT_COLORS = {
  'Prodotti Cabina':'bg-blue-100 text-blue-700','Prodotti Domiciliari':'bg-green-100 text-green-700',
  'Kit Iniziali':'bg-yellow-100 text-yellow-700','Promo Riordino':'bg-orange-100 text-orange-700',
  'Merchandising':'bg-purple-100 text-purple-700','Promozioni 2025':'bg-red-100 text-red-700',
}

export default function Prodotti() {
  const [prodotti, setProdotti] = useState([])
  const [search, setSearch] = useState('')
  const [brandFiltro, setBrandFiltro] = useState('Coco Cera')
  const [catFiltro, setCatFiltro] = useState('')
  const [modal, setModal] = useState(null)
  const [importando, setImportando] = useState(false)
  const [selezionati, setSelezionati] = useState([])
  const [nuovaProvv, setNuovaProvv] = useState('')
  const [editProvv, setEditProvv] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'prodotti'), snap => {
      setProdotti(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const prodottiBrand = prodotti
    .filter(p => (p.brand || 'Coco Cera') === brandFiltro)
    .filter(p => {
      const ms = p.nome?.toLowerCase().includes(search.toLowerCase()) || (p.codice||'').toLowerCase().includes(search.toLowerCase())
      const mc = !catFiltro || p.categoria === catFiltro
      return ms && mc
    })
    .sort((a, b) => {
      if (a.preferito && !b.preferito) return -1
      if (!a.preferito && b.preferito) return 1
      return (a.posizione || 999) - (b.posizione || 999)
    })

  const categorie = [...new Set(prodotti.filter(p=>(p.brand||'Coco Cera')===brandFiltro).map(p=>p.categoria).filter(Boolean))]

  const salva = async (form) => {
    if (modal?.id) await updateDoc(doc(db,'prodotti',modal.id),{...form, aggiornatoAl:serverTimestamp()})
    else await addDoc(collection(db,'prodotti'),{...form, brand: brandFiltro, creatoAl:serverTimestamp()})
    setModal(null)
  }

  const elimina = async (id) => {
    if (!confirm('Eliminare questo prodotto?')) return
    await deleteDoc(doc(db,'prodotti',id))
  }

  const togglePreferito = async (p) => {
    await updateDoc(doc(db,'prodotti',p.id), { preferito: !p.preferito })
  }

  const salvaProvvigione = async (id, val) => {
    await updateDoc(doc(db,'prodotti',id),{ provvigione: parseFloat(val)||0, aggiornatoAl:serverTimestamp() })
    setEditProvv(null)
  }

  const toggleSelezione = (id) => {
    setSelezionati(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id])
  }

  const applicaProvvigioneMultipla = async () => {
    if (!nuovaProvv) return alert('Inserisci la percentuale')
    if (!confirm(`Applicare ${nuovaProvv}% a ${selezionati.length} prodotti?`)) return
    const batch = writeBatch(db)
    selezionati.forEach(id => batch.update(doc(db,'prodotti',id), { provvigione: parseFloat(nuovaProvv)||0 }))
    await batch.commit()
    setSelezionati([])
    setNuovaProvv('')
  }

  const importaExcel = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setImportando(true)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const righe = XLSX.utils.sheet_to_json(ws)
      if (!righe.length) { alert('File vuoto'); return }
      const batch = writeBatch(db)
      let count = 0
      righe.forEach((r, idx) => {
        const nome = r['nome']||r['Nome']||r['NOME']||r['Prodotto']||r['prodotto']
        if (!nome) return
        const ref = doc(collection(db,'prodotti'))
        const cat = r['categoria']||r['Categoria']||''
        const provvDefault = cat==='Prodotti Cabina' ? 20 : cat==='Merchandising' ? 0 : 15
        batch.set(ref, {
          codice: String(r['codice']||r['Codice']||''),
          nome: String(nome),
          categoria: String(cat),
          formato: String(r['formato']||r['Formato']||''),
          prezzo: parseFloat(r['prezzo']||r['Prezzo']||0),
          provvigione: parseFloat(r['provvigione']||r['Provvigione']||provvDefault),
          unita: String(r['unita']||r['Unita']||'pz'),
          brand: brandFiltro,
          posizione: idx,
          preferito: false,
          creatoAl: serverTimestamp()
        })
        count++
      })
      await batch.commit()
      alert(`✅ Importati ${count} prodotti in ${brandFiltro}!`)
    } catch(err) { alert('Errore: '+err.message) }
    finally { setImportando(false); e.target.value='' }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prodotti</h1>
          <p className="text-sm text-gray-400">{prodottiBrand.length} prodotti · {brandFiltro}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>fileRef.current.click()} className="btn-warning" disabled={importando}>
            <Upload size={18}/> {importando?'...':'Excel'}
          </button>
          <button onClick={()=>setModal('nuovo')} className="btn-primary"><Plus size={20}/></button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importaExcel}/>
      </div>

      {/* BRAND TABS */}
      <div className="flex gap-2 mb-3">
        {BRAND.map(b => (
          <button key={b} onClick={()=>{ setBrandFiltro(b); setCatFiltro(''); setSelezionati([]) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              brandFiltro===b ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
            {b}
          </button>
        ))}
      </div>

      {/* SELEZIONE MULTIPLA */}
      {selezionati.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-800">{selezionati.length} selezionati</span>
          <input type="number" min="0" max="100" step="0.5" value={nuovaProvv}
            onChange={e=>setNuovaProvv(e.target.value)}
            className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold text-center outline-none bg-white"
            placeholder="% provvigione"/>
          <button onClick={applicaProvvigioneMultipla} className="bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-bold active:scale-95">
            Applica
          </button>
          <button onClick={()=>setSelezionati([])} className="text-gray-400 p-1 text-lg">✕</button>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="input-field pl-10" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca prodotto o codice..."/>
      </div>

      {categorie.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={()=>setCatFiltro('')} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border ${!catFiltro?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-500 border-gray-200'}`}>Tutti</button>
          {categorie.map(c=><button key={c} onClick={()=>setCatFiltro(c===catFiltro?'':c)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border ${catFiltro===c?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-500 border-gray-200'}`}>{c}</button>)}
        </div>
      )}

      {prodottiBrand.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <div className="text-lg font-semibold">Nessun prodotto per {brandFiltro}</div>
          <div className="text-sm">Aggiungi prodotti o importa da Excel</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {prodottiBrand.map(p => (
            <div key={p.id} className={`card border-2 transition-all ${selezionati.includes(p.id) ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <button onClick={()=>toggleSelezione(p.id)}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${selezionati.includes(p.id)?'bg-amber-500 border-amber-500':'border-gray-300'}`}>
                  {selezionati.includes(p.id) && <Check size={14} className="text-white"/>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={()=>togglePreferito(p)}
                      className={`shrink-0 transition-all active:scale-95 ${p.preferito?'text-yellow-400':'text-gray-300 hover:text-yellow-300'}`}>
                      <Star size={20} fill={p.preferito?'currentColor':'none'}/>
                    </button>
                    <span className="font-bold text-gray-900 text-sm leading-tight">{p.nome}</span>
                    {p.codice && <span className="text-xs text-gray-400 font-mono shrink-0">{p.codice}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2 ml-7">
                    {p.categoria && <span className={`badge ${CAT_COLORS[p.categoria]||'bg-gray-100 text-gray-600'}`}><Tag size={10} className="inline mr-1"/>{p.categoria}</span>}
                    {p.formato && <span className="badge bg-gray-100 text-gray-500">{p.formato}</span>}
                  </div>
                  <div className="flex items-center gap-3 ml-7">
                    <span className="text-xl font-bold text-blue-700">€{Number(p.prezzo).toFixed(2)}</span>
                    {editProvv?.id===p.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="100" step="0.5" autoFocus
                          className="w-16 border border-amber-300 rounded-lg px-2 py-0.5 text-sm font-bold text-amber-700 outline-none bg-amber-50 text-center"
                          value={editProvv.val} onChange={e=>setEditProvv({id:p.id,val:e.target.value})}
                          onBlur={()=>salvaProvvigione(p.id,editProvv.val)}
                          onKeyDown={e=>{if(e.key==='Enter')salvaProvvigione(p.id,editProvv.val); if(e.key==='Escape')setEditProvv(null)}}/>
                        <span className="text-xs text-amber-600">%</span>
                      </div>
                    ) : (
                      <button onClick={()=>setEditProvv({id:p.id,val:p.provvigione||0})}
                        className="badge bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200">
                        🔒 {p.provvigione||0}%
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={()=>setModal(p)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95"><Edit2 size={18}/></button>
                  <button onClick={()=>elimina(p.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl active:scale-95"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ProdottoModal prodotto={modal==='nuovo'?null:modal} brand={brandFiltro} onSave={salva} onClose={()=>setModal(null)}/>}
    </div>
  )
}