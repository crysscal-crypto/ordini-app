import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

const CATEGORIE = ['Prodotti Cabina','Prodotti Domiciliari','Kit Iniziali','Promo Riordino','Merchandising','Promozioni 2025','Altro']
const BRAND = ['Coco Cera', 'Callus Stop', 'Unica Wax']
const vuoto = { codice:'', nome:'', categoria:'Prodotti Cabina', formato:'', prezzo:'', provvigione:'', unita:'pz', brand:'Coco Cera' }

export default function ProdottoModal({ prodotto, brand, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)

  useEffect(() => {
    setForm(prodotto ? { ...vuoto, ...prodotto } : { ...vuoto, brand: brand || 'Coco Cera' })
  }, [prodotto, brand])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleCategoria = (cat) => {
    set('categoria', cat)
    if (!prodotto) {
      const prov = cat === 'Prodotti Cabina' ? '20' : cat === 'Merchandising' ? '0' : '15'
      set('provvigione', prov)
    }
  }

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Inserisci il nome prodotto')
    if (form.prezzo === '' || form.prezzo === undefined) return alert('Inserisci il prezzo')
    onSave({ ...form, prezzo: parseFloat(form.prezzo)||0, provvigione: parseFloat(form.provvigione)||0 })
  }

  const Field = ({label, children}) => <div><label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>{children}</div>

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{prodotto ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X size={22}/></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field label="Brand">
            <select className="input-field" value={form.brand} onChange={e=>set('brand',e.target.value)}>
              {BRAND.map(b=><option key={b}>{b}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Codice"><input className="input-field" value={form.codice} onChange={e=>set('codice',e.target.value)} placeholder="COCO01"/></Field>
            <Field label="Formato"><input className="input-field" value={form.formato} onChange={e=>set('formato',e.target.value)} placeholder="1 Kg"/></Field>
          </div>
          <Field label="Nome Prodotto *"><input className="input-field" value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Nome del prodotto"/></Field>
          <Field label="Categoria">
            <select className="input-field" value={form.categoria} onChange={e=>handleCategoria(e.target.value)}>
              {CATEGORIE.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prezzo (€) *"><input className="input-field" type="number" min="0" step="0.01" value={form.prezzo} onChange={e=>set('prezzo',e.target.value)} placeholder="0.00"/></Field>
            <Field label="🔒 Provvigione (%)">
              <input className="input-field bg-amber-50 border-amber-200" type="number" min="0" max="100" step="0.5" value={form.provvigione} onChange={e=>set('provvigione',e.target.value)} placeholder="15"/>
            </Field>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            🔒 La provvigione è privata — non compare nei documenti inviati al cliente
          </div>
          <button onClick={handleSave} className="btn-success mt-2"><Save size={20}/> Salva Prodotto</button>
        </div>
      </div>
    </div>
  )
}