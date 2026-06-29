import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

const PAGAMENTI_PRESET = [
  'Riba 30',
  'Riba 30/60',
  'Riba 30/60/90/120',
  'RID 30',
  'RID 30/60',
  'RID 30/60/90',
  'RID 30/60/90/120',
  'Bonifico Anticipato',
  'Contrassegno',
  'Personalizzato...'
]

const vuoto = {
  ragioneSociale: '', referente: '', telefono: '', email: '',
  indirizzo: '', citta: '', piva: '', codiceFiscale: '',
  pagamento: 'Bonifico', emailAzienda: '', note: ''
}

export default function ClienteModal({ cliente, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)

  useEffect(() => {
    setForm(cliente ? { ...vuoto, ...cliente } : vuoto)
  }, [cliente])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.ragioneSociale.trim()) return alert('Inserisci la ragione sociale')
    onSave(form)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 active:scale-95">
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Ragione Sociale *</label>
            <input className="input-field" value={form.ragioneSociale}
              onChange={e => set('ragioneSociale', e.target.value)} placeholder="Nome azienda o cliente" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Referente</label>
              <input className="input-field" value={form.referente}
                onChange={e => set('referente', e.target.value)} placeholder="Mario Rossi" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Telefono</label>
              <input className="input-field" value={form.telefono} type="tel"
                onChange={e => set('telefono', e.target.value)} placeholder="333 1234567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email Cliente</label>
            <input className="input-field" value={form.email} type="email"
              onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Indirizzo</label>
            <input className="input-field" value={form.indirizzo}
              onChange={e => set('indirizzo', e.target.value)} placeholder="Via Roma 1" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Città</label>
            <input className="input-field" value={form.citta}
              onChange={e => set('citta', e.target.value)} placeholder="Milano" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">P.IVA</label>
              <input className="input-field" value={form.piva}
                onChange={e => set('piva', e.target.value)} placeholder="01234567890" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Codice Fiscale</label>
              <input className="input-field" value={form.codiceFiscale}
                onChange={e => set('codiceFiscale', e.target.value)} placeholder="RSSMRA..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Modalità Pagamento</label>
            <select className="input-field" value={form.pagamento}
              onChange={e => set('pagamento', e.target.value)}>
              {PAGAMENTI.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email Azienda (per ordini)</label>
            <input className="input-field" value={form.emailAzienda} type="email"
              onChange={e => set('emailAzienda', e.target.value)} placeholder="ordini@tuaazienda.com" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Note</label>
            <textarea className="input-field min-h-[80px] resize-none" value={form.note}
              onChange={e => set('note', e.target.value)} placeholder="Note libere sul cliente..." />
          </div>

          <button onClick={handleSave} className="btn-success mt-2">
            <Save size={20} /> Salva Cliente
          </button>
        </div>
      </div>
    </div>
  )
}
