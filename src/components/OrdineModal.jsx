import React, { useState, useEffect } from 'react'
import { X, Save, Plus, Minus, Trash2, Mail, ChevronDown, ChevronUp } from 'lucide-react'

const vuoto = {
  clienteId: '', clienteNome: '',
  dataConsegna: '', indirizzoConsegna: '', note: '',
  righe: [], stato: 'Inviato',
  invioEmail: 'entrambi'
}

export default function OrdineModal({ ordine, clienti, prodotti, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)
  const [cercaProdotto, setCercaProdotto] = useState('')
  const [showProdotti, setShowProdotti] = useState(false)

  useEffect(() => {
    if (ordine) {
      setForm({ ...vuoto, ...ordine })
    } else {
      setForm({ ...vuoto, dataConsegna: '', righe: [] })
    }
  }, [ordine])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selezionaCliente = (c) => {
    setForm(f => ({
      ...f,
      clienteId: c.id,
      clienteNome: c.ragioneSociale,
      indirizzoConsegna: f.indirizzoConsegna || (c.indirizzo ? `${c.indirizzo}, ${c.citta}` : '')
    }))
  }

  const prodottiFiltrati = prodotti.filter(p =>
    p.nome.toLowerCase().includes(cercaProdotto.toLowerCase()) ||
    (p.codice || '').toLowerCase().includes(cercaProdotto.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(cercaProdotto.toLowerCase())
  )

  const aggiungiProdotto = (p) => {
    setForm(f => {
      const esistente = f.righe.findIndex(r => r.prodottoId === p.id)
      if (esistente >= 0) {
        const righe = [...f.righe]
        righe[esistente] = { ...righe[esistente], qta: righe[esistente].qta + 1 }
        return { ...f, righe }
      }
      return {
        ...f,
        righe: [...f.righe, {
          prodottoId: p.id,
          nome: p.nome,
          codice: p.codice || '',
          prezzo: p.prezzo,
          provvigione: p.provvigione || 0,
          unita: p.unita || 'pz',
          qta: 1,
          prezzoUnitario: p.prezzo
        }]
      }
    })
    setCercaProdotto('')
    setShowProdotti(false)
  }

  const aggiornaRiga = (idx, campo, val) => {
    setForm(f => {
      const righe = [...f.righe]
      righe[idx] = { ...righe[idx], [campo]: campo === 'qta' || campo === 'prezzoUnitario' ? parseFloat(val) || 0 : val }
      return { ...f, righe }
    })
  }

  const rimuoviRiga = (idx) => {
    setForm(f => ({ ...f, righe: f.righe.filter((_, i) => i !== idx) }))
  }

  const totale = form.righe.reduce((s, r) => s + (r.qta * r.prezzoUnitario), 0)
  const totaleProvvigione = form.righe.reduce((s, r) => s + (r.qta * r.prezzoUnitario * (r.provvigione / 100)), 0)

  const handleSave = () => {
    if (!form.clienteId) return alert('Seleziona un cliente')
    if (form.righe.length === 0) return alert('Aggiungi almeno un prodotto')
    onSave({ ...form, totale, totaleProvvigione })
  }

  const clienteSelezionato = clienti.find(c => c.id === form.clienteId)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {ordine ? 'Modifica Ordine' : 'Nuovo Ordine'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 active:scale-95">
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* CLIENTE */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Cliente *</label>
            <select className="input-field" value={form.clienteId}
              onChange={e => {
                const c = clienti.find(x => x.id === e.target.value)
                if (c) selezionaCliente(c)
                else set('clienteId', '')
              }}>
              <option value="">— Seleziona cliente —</option>
              {clienti.map(c => (
                <option key={c.id} value={c.id}>{c.ragioneSociale}</option>
              ))}
            </select>
            {clienteSelezionato && (
              <div className="mt-2 bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
                <div className="font-semibold">{clienteSelezionato.ragioneSociale}</div>
                <div className="text-blue-600">{clienteSelezionato.telefono} · {clienteSelezionato.pagamento}</div>
              </div>
            )}
          </div>

          {/* DATA CONSEGNA */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Data Consegna</label>
            <input className="input-field" type="date" value={form.dataConsegna}
              onChange={e => set('dataConsegna', e.target.value)} />
          </div>

          {/* INDIRIZZO CONSEGNA */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Indirizzo di Consegna</label>
            <input className="input-field" value={form.indirizzoConsegna}
              onChange={e => set('indirizzoConsegna', e.target.value)}
              placeholder="Via, numero, città..." />
          </div>

          {/* PRODOTTI */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Prodotti *</label>

            <button
              onClick={() => setShowProdotti(v => !v)}
              className="btn-primary w-full mb-3"
            >
              <Plus size={20} />
              Aggiungi Prodotto
              {showProdotti ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showProdotti && (
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden mb-3">
                <div className="p-3 bg-blue-50">
                  <input
                    className="input-field"
                    value={cercaProdotto}
                    onChange={e => setCercaProdotto(e.target.value)}
                    placeholder="Cerca per nome, codice, categoria..."
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                  {prodottiFiltrati.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Nessun prodotto trovato</div>
                  ) : prodottiFiltrati.map(p => (
                    <button key={p.id} onClick={() => aggiungiProdotto(p)}
                      className="w-full text-left p-3 hover:bg-blue-50 active:bg-blue-100 flex justify-between items-center gap-2">
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{p.nome}</div>
                        <div className="text-xs text-gray-400">{p.codice} · {p.categoria}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-blue-700 text-sm">€{Number(p.prezzo).toFixed(2)}</div>
                        <div className="text-xs text-green-600">{p.provvigione}%</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHE ORDINE */}
            {form.righe.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.righe.map((r, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{r.nome}</div>
                        <div className="text-xs text-gray-400">{r.codice}</div>
                      </div>
                      <button onClick={() => rimuoviRiga(i)} className="p-1 text-red-400 active:scale-95">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                        <button onClick={() => aggiornaRiga(i, 'qta', Math.max(1, r.qta - 1))}
                          className="p-2 text-gray-500 active:scale-95">
                          <Minus size={16} />
                        </button>
                        <input
                          type="number" min="1"
                          className="w-12 text-center font-bold text-gray-800 text-sm border-none outline-none"
                          value={r.qta}
                          onChange={e => aggiornaRiga(i, 'qta', e.target.value)}
                        />
                        <span className="text-xs text-gray-400 pr-1">{r.unita}</span>
                        <button onClick={() => aggiornaRiga(i, 'qta', r.qta + 1)}
                          className="p-2 text-gray-500 active:scale-95">
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">€</span>
                          <input
                            type="number" min="0" step="0.01"
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-gray-800 text-right outline-none focus:border-blue-400"
                            value={r.prezzoUnitario}
                            onChange={e => aggiornaRiga(i, 'prezzoUnitario', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <div className="font-bold text-gray-900 text-sm">€{(r.qta * r.prezzoUnitario).toFixed(2)}</div>
                        <div className="text-xs text-green-600">{r.provvigione}%</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* TOTALE */}
                <div className="bg-blue-700 rounded-xl p-4 text-white mt-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="opacity-80">Totale ordine</span>
                    <span className="font-bold text-lg">€{totale.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Mia provvigione</span>
                    <span className="font-bold text-green-300">€{totaleProvvigione.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STATO */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Stato Ordine</label>
            <select className="input-field" value={form.stato}
              onChange={e => set('stato', e.target.value)}>
              <option>Inviato</option>
              <option>Confermato</option>
              <option>In lavorazione</option>
              <option>Spedito</option>
              <option>Consegnato</option>
              <option>Annullato</option>
            </select>
          </div>

          {/* NOTE */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Note Ordine</label>
            <textarea className="input-field resize-none min-h-[80px]" value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Istruzioni speciali, orari consegna, riferimenti..." />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              <Mail size={16} className="inline mr-1" />
              Invia Email a:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'entrambi', label: 'Entrambi' },
                { val: 'cliente', label: 'Solo Cliente' },
                { val: 'azienda', label: 'Solo Azienda' },
              ].map(opt => (
                <button key={opt.val}
                  onClick={() => set('invioEmail', opt.val)}
                  className={`py-3 px-2 rounded-xl font-semibold text-sm border-2 transition-all active:scale-95 ${
                    form.invioEmail === opt.val
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} className="btn-success mt-2">
            <Save size={20} /> Salva Ordine
          </button>
        </div>
      </div>
    </div>
  )
}
