import React, { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'

const PAGAMENTI_PRESET = [
  'Riba 30','Riba 30/60','Riba 30/60/90/120',
  'RID 30','RID 30/60','RID 30/60/90','RID 30/60/90/120',
  'Bonifico Anticipato','Contrassegno','Personalizzato...'
]
const STATI = [
  { val:'Attivo',   col:'bg-green-100 text-green-700 border-green-400' },
  { val:'Prospect', col:'bg-blue-100 text-blue-700 border-blue-400'   },
  { val:'Inattivo', col:'bg-gray-100 text-gray-600 border-gray-400'   },
  { val:'Perso',    col:'bg-red-100 text-red-600 border-red-400'      },
]
const GIORNI = ['—','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']

const vuoto = {
  ragioneSociale:'', referente:'', telefono:'', email:'',
  indirizzo:'', cap:'', citta:'', provincia:'',
  indirizzoSpedizione:'', capSpedizione:'', cittaSpedizione:'', provinciaSpedizione:'',
  spedizioneUgualeResidenza: true,
  piva:'', codiceFiscale:'', codiceSDI:'', pec:'',
  pagamento:'Riba 30', pagamentoPersonalizzato:'',
  iban:'', giornoChiusura:'—', note:'', stato:'Attivo'
}

// ⚠️ Field FUORI dalla funzione principale — fix bug focus
const Field = ({ label, children }) => (
  <div><label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>{children}</div>
)

export default function ClienteModal({ cliente, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)
  const [pagCustom, setPagCustom] = useState(false)

  useEffect(() => {
    if (cliente) {
      const isCustom = !PAGAMENTI_PRESET.slice(0,-1).includes(cliente.pagamento)
      setPagCustom(isCustom)
      setForm({ ...vuoto, ...cliente, pagamento: isCustom ? 'Personalizzato...' : cliente.pagamento })
    } else { setForm(vuoto); setPagCustom(false) }
  }, [cliente])

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const handlePag = (v) => {
    if (v === 'Personalizzato...') { setPagCustom(true); set('pagamento','Personalizzato...') }
    else { setPagCustom(false); set('pagamento',v); set('pagamentoPersonalizzato','') }
  }

  const handleSave = () => {
    if (!form.ragioneSociale.trim()) return alert('Inserisci la ragione sociale')
    const pag = pagCustom ? (form.pagamentoPersonalizzato || 'Personalizzato') : form.pagamento
    onSave({ ...form, pagamento: pag })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X size={22}/></button>
        </div>
        <div className="p-5 flex flex-col gap-5">

          <div>
            <div className="section-label">Stato Cliente</div>
            <div className="grid grid-cols-4 gap-2">
              {STATI.map(s => (
                <button key={s.val} onClick={() => set('stato', s.val)}
                  className={`py-2.5 rounded-xl font-semibold text-sm border-2 transition-all active:scale-95 ${
                    form.stato === s.val ? s.col : 'border-gray-200 text-gray-400 bg-white'}`}>
                  {s.val}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="section-label">Anagrafica</div>
            <div className="flex flex-col gap-3">
              <Field label="Ragione Sociale *">
                <input className="input-field" value={form.ragioneSociale} onChange={e=>set('ragioneSociale',e.target.value)} placeholder="Nome azienda / cliente"/>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Referente"><input className="input-field" value={form.referente} onChange={e=>set('referente',e.target.value)} placeholder="Mario Rossi"/></Field>
                <Field label="Telefono"><input className="input-field" type="tel" value={form.telefono} onChange={e=>set('telefono',e.target.value)} placeholder="333 1234567"/></Field>
              </div>
              <Field label="Email"><input className="input-field" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="cliente@email.com"/></Field>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="section-label">Sede Legale</div>
            <div className="flex flex-col gap-3">
              <Field label="Indirizzo"><input className="input-field" value={form.indirizzo} onChange={e=>set('indirizzo',e.target.value)} placeholder="Via Roma 1"/></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="CAP"><input className="input-field" value={form.cap} onChange={e=>set('cap',e.target.value)} placeholder="20100"/></Field>
                <div className="col-span-2"><Field label="Città"><input className="input-field" value={form.citta} onChange={e=>set('citta',e.target.value)} placeholder="Milano"/></Field></div>
              </div>
              <Field label="Provincia"><input className="input-field" value={form.provincia} onChange={e=>set('provincia',e.target.value)} placeholder="MI" maxLength={2}/></Field>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="section-label mb-0">Indirizzo Spedizione</div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.spedizioneUgualeResidenza} onChange={e=>set('spedizioneUgualeResidenza',e.target.checked)} className="w-4 h-4"/>
                Uguale a sede legale
              </label>
            </div>
            {!form.spedizioneUgualeResidenza && (
              <div className="flex flex-col gap-3">
                <Field label="Indirizzo"><input className="input-field" value={form.indirizzoSpedizione} onChange={e=>set('indirizzoSpedizione',e.target.value)} placeholder="Via Roma 1"/></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="CAP"><input className="input-field" value={form.capSpedizione} onChange={e=>set('capSpedizione',e.target.value)} placeholder="20100"/></Field>
                  <div className="col-span-2"><Field label="Città"><input className="input-field" value={form.cittaSpedizione} onChange={e=>set('cittaSpedizione',e.target.value)} placeholder="Milano"/></Field></div>
                </div>
                <Field label="Provincia"><input className="input-field" value={form.provinciaSpedizione} onChange={e=>set('provinciaSpedizione',e.target.value)} placeholder="MI" maxLength={2}/></Field>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="section-label">Dati Fiscali</div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="P.IVA"><input className="input-field" value={form.piva} onChange={e=>set('piva',e.target.value)} placeholder="01234567890"/></Field>
                <Field label="Codice Fiscale"><input className="input-field" value={form.codiceFiscale} onChange={e=>set('codiceFiscale',e.target.value)} placeholder="RSSMRA..."/></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Codice SDI"><input className="input-field" value={form.codiceSDI} onChange={e=>set('codiceSDI',e.target.value)} placeholder="XXXXXXX" maxLength={7}/></Field>
                <Field label="PEC"><input className="input-field" type="email" value={form.pec} onChange={e=>set('pec',e.target.value)} placeholder="pec@pec.it"/></Field>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="section-label">Pagamento & Consegna</div>
            <div className="flex flex-col gap-3">
              <Field label="Modalità Pagamento">
                <select className="input-field" value={pagCustom ? 'Personalizzato...' : form.pagamento} onChange={e=>handlePag(e.target.value)}>
                  {PAGAMENTI_PRESET.map(p=><option key={p}>{p}</option>)}
                </select>
              </Field>
              {pagCustom && (
                <Field label="Pagamento personalizzato">
                  <input className="input-field" value={form.pagamentoPersonalizzato} onChange={e=>set('pagamentoPersonalizzato',e.target.value)} placeholder="Descrivi le condizioni..."/>
                </Field>
              )}
              <Field label="IBAN">
                <input className="input-field" value={form.iban} onChange={e=>set('iban',e.target.value)} placeholder="IT60 X054 2811 1010 0000 0123 456"/>
              </Field>
              <Field label="Giorno di Chiusura">
                <select className="input-field" value={form.giornoChiusura} onChange={e=>set('giornoChiusura',e.target.value)}>
                  {GIORNI.map(g=><option key={g}>{g}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="border-t pt-4">
            <Field label="Note">
              <textarea className="input-field min-h-[80px] resize-none" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Note libere..."/>
            </Field>
          </div>

          <button onClick={handleSave} className="btn-success mt-2"><Save size={20}/> Salva Cliente</button>
        </div>
      </div>
    </div>
  )
}