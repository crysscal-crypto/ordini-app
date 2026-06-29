import React, { useState, useEffect } from 'react'
import { X, Save, Plus, Minus, Trash2, ChevronDown, ChevronUp, Send, Search } from 'lucide-react'

const IVA = 0.22
const EMAIL_AZIENDA = 'ordini@cococera.it'

const vuoto = {
  clienteId:'', clienteNome:'', clienteEmail:'', clienteGiornoChiusura:'',
  dataConsegna:'', indirizzoConsegna:'', note:'',
  righe:[], stato:'Inviato', invioEmail:'entrambi'
}

export default function OrdineModal({ ordine, clienti, prodotti, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)
  const [cerca, setCerca] = useState('')
  const [showProd, setShowProd] = useState(false)
  const [catFiltro, setCatFiltro] = useState('')

  useEffect(() => { setForm(ordine ? { ...vuoto, ...ordine } : { ...vuoto, righe:[] }) }, [ordine])
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const selCliente = (c) => {
    const indSpedDef = c.spedizioneUgualeResidenza
      ? [c.indirizzo, c.cap, c.citta, c.provincia].filter(Boolean).join(', ')
      : [c.indirizzoSpedizione, c.capSpedizione, c.cittaSpedizione, c.provinciaSpedizione].filter(Boolean).join(', ')
    setForm(f => ({
      ...f,
      clienteId: c.id,
      clienteNome: c.ragioneSociale,
      clienteEmail: c.email||'',
      clienteGiornoChiusura: c.giornoChiusura||'',
      indirizzoConsegna: f.indirizzoConsegna || indSpedDef
    }))
  }

  const categorie = [...new Set(prodotti.map(p=>p.categoria).filter(Boolean))]
  const prodFiltrati = prodotti.filter(p => {
    const ms = p.nome?.toLowerCase().includes(cerca.toLowerCase()) || (p.codice||'').toLowerCase().includes(cerca.toLowerCase())
    const mc = !catFiltro || p.categoria === catFiltro
    return ms && mc
  })

  const addProdotto = (p) => {
    setForm(f => {
      const idx = f.righe.findIndex(r=>r.prodottoId===p.id)
      if (idx>=0) { const r=[...f.righe]; r[idx]={...r[idx],qta:r[idx].qta+1}; return {...f,righe:r} }
      return { ...f, righe:[...f.righe,{ prodottoId:p.id, codice:p.codice||'', nome:p.nome, formato:p.formato||'', prezzoUnitario:p.prezzo, provvigione:p.provvigione||0, qta:1 }] }
    })
    setCerca(''); setShowProd(false)
  }

  const updRiga = (idx,k,v) => setForm(f => {
    const r=[...f.righe]; r[idx]={...r[idx],[k]:['qta','prezzoUnitario'].includes(k)?parseFloat(v)||0:v}; return {...f,righe:r}
  })
  const delRiga = (idx) => setForm(f=>({...f,righe:f.righe.filter((_,i)=>i!==idx)}))

  const totNetto = form.righe.reduce((s,r)=>s+(r.qta*r.prezzoUnitario),0)
  const totIVA   = totNetto*IVA
  const totLordo = totNetto+totIVA
  const totProv  = form.righe.reduce((s,r)=>s+(r.qta*r.prezzoUnitario*(r.provvigione/100)),0)

  const handleSave = () => {
    if (!form.clienteId) return alert('Seleziona un cliente')
    if (!form.righe.length) return alert('Aggiungi almeno un prodotto')
    onSave({ ...form, totaleNetto:totNetto, totaleIVA:totIVA, totaleLordo:totLordo, totaleProvvigione:totProv })
  }

  const inviaEmail = () => {
    const c = clienti.find(x=>x.id===form.clienteId)
    const emailC = c?.email||form.clienteEmail
    if (form.invioEmail!=='azienda' && !emailC) return alert('Aggiungi l\'email al cliente')
    const righeT = form.righe.map(r=>`  ${r.codice||'-'}\t${r.nome}\t${r.qta}\t€${r.prezzoUnitario.toFixed(2)}\t€${(r.qta*r.prezzoUnitario).toFixed(2)}`).join('\n')
    const body = `AGENTE: CALIUMI CRISTIAN\n\nCliente: ${form.clienteNome}\n${form.indirizzoConsegna ? 'Indirizzo consegna: '+form.indirizzoConsegna : ''}\n${form.dataConsegna ? 'Data consegna: '+form.dataConsegna : ''}\nPagamento: ${c?.pagamento||''}\n\n--- PRODOTTI ORDINATI ---\nCodice\tDescrizione\tQtà\tPrezzo\tTotale\n${righeT}\n\nImponibile: €${totNetto.toFixed(2)}\nIVA 22%:    €${totIVA.toFixed(2)}\nTOTALE:     €${totLordo.toFixed(2)}\n\n${form.note ? 'Note: '+form.note : ''}\n\nCordiali saluti\nAgente Caliumi Cristian\nordini@cococera.it`
    const dest = [form.invioEmail!=='azienda'?emailC:null, form.invioEmail!=='cliente'?EMAIL_AZIENDA:null].filter(Boolean)
    window.location.href = `mailto:${dest.join(',')}?subject=${encodeURIComponent('Ordine - '+form.clienteNome)}&body=${encodeURIComponent(body)}`
  }

  const clienteSel = clienti.find(c=>c.id===form.clienteId)

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{ordine ? 'Modifica Ordine' : 'Nuovo Ordine'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X size={22}/></button>
        </div>
        <div className="p-5 flex flex-col gap-5">

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Cliente *</label>
            <select className="input-field" value={form.clienteId} onChange={e=>{ const c=clienti.find(x=>x.id===e.target.value); c?selCliente(c):set('clienteId','') }}>
              <option value="">— Seleziona cliente —</option>
              {clienti.filter(c=>c.stato!=='Perso').sort((a,b)=>a.ragioneSociale?.localeCompare(b.ragioneSociale)).map(c=><option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
            </select>
            {clienteSel && (
              <div className="mt-2 bg-blue-50 rounded-xl p-3 text-sm">
                <div className="font-bold text-blue-900">{clienteSel.ragioneSociale}</div>
                <div className="text-blue-600 text-xs">{clienteSel.pagamento}{clienteSel.email ? ' · '+clienteSel.email : ''}</div>
                {clienteSel.giornoChiusura && clienteSel.giornoChiusura !== '—' && (
                  <div className="text-orange-600 text-xs mt-0.5">⚠️ Chiuso il: <strong>{clienteSel.giornoChiusura}</strong></div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-600 mb-1">Data Consegna</label>
              <input className="input-field" type="date" value={form.dataConsegna} onChange={e=>set('dataConsegna',e.target.value)}/></div>
            <div><label className="block text-sm font-semibold text-gray-600 mb-1">Stato</label>
              <select className="input-field" value={form.stato} onChange={e=>set('stato',e.target.value)}>
                {['Inviato','Confermato','In lavorazione','Spedito','Consegnato','Annullato'].map(s=><option key={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className="block text-sm font-semibold text-gray-600 mb-1">Indirizzo Consegna</label>
            <input className="input-field" value={form.indirizzoConsegna} onChange={e=>set('indirizzoConsegna',e.target.value)} placeholder="Via, numero, città..."/></div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Prodotti *</label>
            <button onClick={()=>setShowProd(v=>!v)} className="btn-primary w-full mb-3">
              <Plus size={20}/> Aggiungi Prodotto {showProd?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
            </button>
            {showProd && (
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden mb-3">
                <div className="p-3 bg-blue-50 flex flex-col gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input className="input-field pl-9 py-2" value={cerca} onChange={e=>setCerca(e.target.value)} placeholder="Cerca nome o codice..." autoFocus/>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button onClick={()=>setCatFiltro('')} className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${!catFiltro?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-500 border-gray-200'}`}>Tutti</button>
                    {categorie.map(c=><button key={c} onClick={()=>setCatFiltro(c===catFiltro?'':c)} className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${catFiltro===c?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-500 border-gray-200'}`}>{c}</button>)}
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                  {prodFiltrati.length===0
                    ? <div className="p-4 text-center text-gray-400 text-sm">Nessun prodotto</div>
                    : prodFiltrati.map(p=>(
                      <button key={p.id} onClick={()=>addProdotto(p)} className="w-full text-left p-3 hover:bg-blue-50 active:bg-blue-100 flex justify-between items-center gap-2">
                        <div><div className="font-semibold text-gray-800 text-sm">{p.nome}</div>
                          <div className="text-xs text-gray-400">{p.codice} · {p.categoria} · {p.formato}</div></div>
                        <div className="font-bold text-blue-700 text-sm shrink-0">€{Number(p.prezzo).toFixed(2)}</div>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
            {form.righe.length>0 && (
              <div className="flex flex-col gap-2">
                {form.righe.map((r,i)=>(
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div><div className="font-semibold text-gray-800 text-sm">{r.nome}</div>
                        <div className="text-xs text-gray-400">{r.codice} {r.formato && '· '+r.formato}</div></div>
                      <button onClick={()=>delRiga(i)} className="p-1 text-red-400"><Trash2 size={18}/></button>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                        <button onClick={()=>updRiga(i,'qta',Math.max(1,r.qta-1))} className="p-2 text-gray-500"><Minus size={16}/></button>
                        <input type="number" min="1" className="w-12 text-center font-bold text-sm border-none outline-none" value={r.qta} onChange={e=>updRiga(i,'qta',e.target.value)}/>
                        <button onClick={()=>updRiga(i,'qta',r.qta+1)} className="p-2 text-gray-500"><Plus size={16}/></button>
                      </div>
                      <div className="flex-1 flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-400">€</span>
                        <input type="number" min="0" step="0.01" className="w-full text-sm font-bold text-right outline-none" value={r.prezzoUnitario} onChange={e=>updRiga(i,'prezzoUnitario',e.target.value)}/>
                      </div>
                      <div className="text-right min-w-[64px]">
                        <div className="font-bold text-sm">€{(r.qta*r.prezzoUnitario).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-gray-800 text-white rounded-xl p-4 mt-1">
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Imponibile</span><span>€{totNetto.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-gray-300">IVA 22%</span><span>€{totIVA.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-gray-600 pt-2 font-bold text-lg"><span>Totale</span><span className="text-blue-300">€{totLordo.toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </div>

          <div><label className="block text-sm font-semibold text-gray-600 mb-1">Note Ordine</label>
            <textarea className="input-field resize-none min-h-[70px]" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Istruzioni consegna, orari, riferimenti..."/></div>

          <div className="border-t pt-4">
            <div className="section-label">Invia conferma email a:</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{v:'entrambi',l:'Entrambi'},{v:'cliente',l:'Solo Cliente'},{v:'azienda',l:'Solo Azienda'}].map(o=>(
                <button key={o.v} onClick={()=>set('invioEmail',o.v)}
                  className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all active:scale-95 ${form.invioEmail===o.v?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200 bg-white text-gray-500'}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
              Azienda: <strong>{EMAIL_AZIENDA}</strong>
              {clienteSel?.email && <><br/>Cliente: <strong>{clienteSel.email}</strong></>}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button onClick={handleSave} className="btn-success"><Save size={20}/> Salva Ordine</button>
            {form.righe.length>0 && form.clienteId && (
              <button onClick={inviaEmail} className="btn-primary"><Send size={18}/> Invia Email Conferma</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}