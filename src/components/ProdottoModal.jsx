import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

const vuoto = {
  codice: '', nome: '', categoria: '', descrizione: '',
  prezzo: '', provvigione: '', unita: 'pz'
}

export default function ProdottoModal({ prodotto, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)

  useEffect(() => {
    setForm(prodotto ? { ...vuoto, ...prodotto } : vuoto)
  }, [prodotto])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Inserisci il nome prodotto')
    if (!form.prezzo) return alert('Inserisci il prezzo')
    onSave({
      ...form,
      prezzo: parseFloat(form.prezzo) || 0,
      provvigione: parseFloat(form.provvigione) || 0
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {prodotto ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 active:scale-95">
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Codice</label>
              <input className="input-field" value={form.codice}
                onChange={e => set('codice', e.target.value)} placeholder="COD001" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Unità</label>
              <select className="input-field" value={form.unita}
                onChange={e => set('unita', e.target.value)}>
                <option value="pz">Pz</option>
                <option value="kg">Kg</option>
                <option value="lt">Lt</option>
                <option value="mt">Mt</option>
                <option value="conf">Conf</option>
                <option value="sc">Sc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Nome Prodotto *</label>
            <input className="input-field" value={form.nome}
              onChange={e => set('nome', e.target.value)} placeholder="Nome del prodotto" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Categoria</label>
            <input className="input-field" value={form.categoria}
              onChange={e => set('categoria', e.target.value)} placeholder="Es. Cera, Lucidante, ..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Descrizione</label>
            <textarea className="input-field resize-none min-h-[70px]" value={form.descrizione}
              onChange={e => set('descrizione', e.target.value)} placeholder="Descrizione opzionale" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Prezzo (€) *</label>
              <input className="input-field" value={form.prezzo} type="number" min="0" step="0.01"
                onChange={e => set('prezzo', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Provvigione (%)</label>
              <input className="input-field" value={form.provvigione} type="number" min="0" max="100" step="0.5"
                onChange={e => set('provvigione', e.target.value)} placeholder="10" />
            </div>
          </div>

          <button onClick={handleSave} className="btn-success mt-2">
            <Save size={20} /> Salva Prodotto
          </button>
        </div>
      </div>
    </div>
  )
}
