import React, { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'

const CATEGORIE = ['Prodotti Cabina','Prodotti Domiciliari','Kit Iniziali','Promo Riordino','Merchandising','Promozioni','Altro']
const BRAND = ['Coco Cera', 'Callus Stop', 'Unica Wax']
const FORMATI = ['pz','kg','g','ml','l','cf','kit','box','flacone','tubetto','bustina','altro']
const BRAND_CON_COMPOSIZIONE = ['Coco Cera', 'Unica Wax']

const vuoto = { codice:'', nome:'', categoria:'Prodotti Cabina', formato:'', prezzo:'', provvigione:'', unita:'pz', brand:'Coco Cera', composizione:[] }

const Field = ({label, children}) => (
  <div><label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>{children}</div>
)

export default function ProdottoModal({ prodotto, brand, onSave, onClose }) {
  const [form, setForm] = useState(vuoto)

  useEffect(() => {
    setForm(prodotto ? { ...vuoto, composizione:[], ...prodotto } : { ...vuoto, brand: brand || 'Coco Cera' })
  }, [prodotto, brand])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleCategoria = (cat) => {
    set('categoria', cat)
    if (!prodotto) {
      const prov = cat === 'Prodotti Cabina' ? '20' : cat === 'Merchandising' ? '0' : '15'
      set('provvigione', prov)
    }
  }

  const mostraComposizione = form.categoria === 'Promozioni' && BRAND_CON_COMPOSIZIONE.includes(form.brand)

  const addRigaComposizione = () => {
    setForm(f => ({ ...f, composizione: [...(f.composizione||[]), { prodotto:'', qta:1 }] }))
  }

  const updComposizione = (i, k, v) => {
    setForm(f => {
      const c = [...(f.composizione||[])]
      c[i] = { ...c[i], [k]: k==='qta' ? parseInt(v)||1 : v }
      return { ...f, composizione: c }
    })
  }

  const delComposizione = (i) => {
    setForm(f => ({ ...f, composizione: f.composizione.filter((_,idx)=>idx!==i) }))
  }

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Inserisci il nome prodotto')
    if (form.prezzo === '' || form.prezzo === undefined) return alert('Inserisci il prezzo')
    onSave({ ...form, prezzo: parseFloat(form.prezzo)||0, provvigione: parseFloat(form.provvigione)||0 })
  }

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

          <Field label="Nome Prodotto *">
            <input className="input-field" value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Nome del prodotto"/>
          </Field>

          <Field label="Codice (facoltativo)">
            <input className="input-field" value={form.codice} onChange={e=>set('codice',e.target.value)} placeholder="es. COCO01"/>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Formato">
              <input className="input-field" value={form.formato} onChange={e=>set('formato',e.target.value)} placeholder="es. 1 Kg, 500 ml..."/>
            </Field>
            <Field label="Unità di misura">
              <select className="input-field" value={form.unita} onChange={e=>set('unita',e.target.value)}>
                {FORMATI.map(f=><option key={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Categoria">
            <select className="input-field" value={form.categoria} onChange={e=>handleCategoria(e.target.value)}>
              {CATEGORIE.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>

          {/* COMPOSIZIONE PROMO - solo Coco Cera e Unica Wax */}
          {mostraComposizione && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-blue-800 text-sm">📦 Composizione Promo</div>
                  <div className="text-xs text-blue-600 mt-0.5">Indica i prodotti inclusi (es. sacchetti di cera, accessori)</div>
                </div>
                <button onClick={addRigaComposizione}
                  className="bg-blue-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1 active:scale-95">
                  <Plus size={14}/> Aggiungi
                </button>
              </div>

              {(form.composizione||[]).length === 0 && (
                <div className="text-center text-blue-400 text-xs py-3">
                  Nessun componente — clicca Aggiungi
                </div>
              )}

              {(form.composizione||[]).map((c,i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input
                    className="input-field flex-1 text-sm py-2"
                    value={c.prodotto}
                    onChange={e=>updComposizione(i,'prodotto',e.target.value)}
                    placeholder="Nome prodotto (es. Unica wax 1kg)"
                  />
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl shrink-0">
                    <button onClick={()=>updComposizione(i,'qta',Math.max(1,c.qta-1))} className="px-2 py-2 text-gray-500 text-sm font-bold">−</button>
                    <input type="number" min="1"
                      className="w-10 text-center font-bold text-sm border-none outline-none"
                      value={c.qta}
                      onChange={e=>updComposizione(i,'qta',e.target.value)}
                    />
                    <button onClick={()=>updComposizione(i,'qta',c.qta+1)} className="px-2 py-2 text-gray-500 text-sm font-bold">+</button>
                  </div>
                  <button onClick={()=>delComposizione(i)} className="p-2 text-red-400 active:scale-95">
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}

              {(form.composizione||[]).length > 0 && (
                <div className="mt-2 bg-blue-100 rounded-lg p-2 text-xs text-blue-700">
                  Totale componenti: {form.composizione.reduce((s,c)=>s+c.qta,0)} pz
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prezzo (€) *">
              <input className="input-field" type="number" min="0" step="0.01" value={form.prezzo} onChange={e=>set('prezzo',e.target.value)} placeholder="0.00"/>
            </Field>
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