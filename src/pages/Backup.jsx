import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import * as XLSX from 'xlsx'
import { Download, RefreshCw, CheckCircle, Clock, Database } from 'lucide-react'

export default function Backup() {
  const [clienti, setClienti] = useState([])
  const [ordini, setOrdini] = useState([])
  const [prodotti, setProdotti] = useState([])
  const [loading, setLoading] = useState(false)
  const [ultimoBackup, setUltimoBackup] = useState(null)
  const [backupOggi, setBackupOggi] = useState(false)

  useEffect(() => {
    const u1 = onSnapshot(collection(db,'clienti'), snap => setClienti(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const u2 = onSnapshot(collection(db,'ordini'), snap => setOrdini(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const u3 = onSnapshot(collection(db,'prodotti'), snap => setProdotti(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const savedBackup = localStorage.getItem('ultimoBackup')
    if (savedBackup) {
      const data = new Date(savedBackup)
      setUltimoBackup(data)
      const oggi = new Date()
      if (data.toDateString() === oggi.toDateString()) setBackupOggi(true)
    }
    return () => { u1(); u2(); u3() }
  }, [])

  const formatData = (ts) => {
    if (!ts) return '-'
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const esportaExcel = () => {
    setLoading(true)
    try {
      const wb = XLSX.utils.book_new()

      const clientiData = clienti.map(c => ({
        'Ragione Sociale': c.ragioneSociale||'', 'Referente': c.referente||'', 'Telefono': c.telefono||'',
        'Email': c.email||'', 'Stato': c.stato||'', 'Indirizzo': c.indirizzo||'', 'CAP': c.cap||'',
        'Città': c.citta||'', 'Provincia': c.provincia||'', 'P.IVA': c.piva||'',
        'Codice SDI': c.codiceSDI||'', 'PEC': c.pec||'', 'Pagamento': c.pagamento||'',
        'IBAN': c.iban||'', 'Giorno Chiusura': c.giornoChiusura||'', 'Note': c.note||'',
      }))
      const wsClienti = XLSX.utils.json_to_sheet(clientiData)
      XLSX.utils.book_append_sheet(wb, wsClienti, 'Clienti')

      const ordiniData = ordini.map(o => ({
        'Data': formatData(o.creatoAl), 'Cliente': o.clienteNome||'', 'Brand': o.brand||'',
        'Stato': o.stato||'', 'Pagamento': o.clientePagamento||'',
        'Indirizzo Consegna': o.indirizzoConsegna||'', 'Data Consegna': o.dataConsegna||'',
        'Prodotti': (o.righe||[]).map(r=>`${r.nome} x${r.qta}`).join(' | '),
        'Imponibile €': Number(o.totaleNetto||0).toFixed(2),
        'IVA 22% €': Number(o.totaleIVA||0).toFixed(2),
        'Totale € IVA incl.': Number(o.totaleLordo||0).toFixed(2),
        'Provvigione €': Number(o.totaleProvvigione||0).toFixed(2),
        'Note': o.note||'',
      }))
      const wsOrdini = XLSX.utils.json_to_sheet(ordiniData)
      XLSX.utils.book_append_sheet(wb, wsOrdini, 'Ordini')

      const prodottiData = prodotti.map(p => ({
        'Codice': p.codice||'', 'Nome': p.nome||'', 'Brand': p.brand||'',
        'Categoria': p.categoria||'', 'Formato': p.formato||'',
        'Prezzo €': Number(p.prezzo||0).toFixed(2), 'Provvigione %': p.provvigione||0,
        'Preferito': p.preferito ? 'Sì' : 'No',
      }))
      const wsProdotti = XLSX.utils.json_to_sheet(prodottiData)
      XLSX.utils.book_append_sheet(wb, wsProdotti, 'Prodotti')

      const oggi = new Date()
      const totFatturato = ordini.filter(o=>o.stato!=='Annullato'&&o.stato!=='Preventivo').reduce((s,o)=>s+(o.totaleNetto||0),0)
      const totProvvigione = ordini.filter(o=>o.stato!=='Annullato'&&o.stato!=='Preventivo').reduce((s,o)=>s+(o.totaleProvvigione||0),0)
      const riepilogoData = [
        { 'Statistica': 'Data backup', 'Valore': oggi.toLocaleString('it-IT') },
        { 'Statistica': 'Totale clienti', 'Valore': clienti.length },
        { 'Statistica': 'Totale prodotti', 'Valore': prodotti.length },
        { 'Statistica': 'Totale ordini', 'Valore': ordini.length },
        { 'Statistica': 'Fatturato totale (imponibile)', 'Valore': `€ ${totFatturato.toFixed(2)}` },
        { 'Statistica': 'Provvigioni totali', 'Valore': `€ ${totProvvigione.toFixed(2)}` },
        { 'Statistica': '', 'Valore': '' },
        ...['Coco Cera','Callus Stop','Unica Wax'].map(b => ({
          'Statistica': `Ordini ${b}`,
          'Valore': ordini.filter(o=>o.brand===b&&o.stato!=='Annullato').length + ' ordini'
        }))
      ]
      const wsRiepilogo = XLSX.utils.json_to_sheet(riepilogoData)
      XLSX.utils.book_append_sheet(wb, wsRiepilogo, 'Riepilogo')

      const nomeFile = `Backup_${oggi.getFullYear()}-${String(oggi.getMonth()+1).padStart(2,'0')}-${String(oggi.getDate()).padStart(2,'0')}.xlsx`
      XLSX.writeFile(wb, nomeFile)

      localStorage.setItem('ultimoBackup', oggi.toISOString())
      setUltimoBackup(oggi)
      setBackupOggi(true)
    } catch(err) {
      alert('Errore durante il backup: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-5 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Backup Dati</h1>
        <p className="text-sm text-gray-400 mt-1">Esporta tutti i dati in un file Excel</p>
      </div>

      <div className={`rounded-2xl p-4 mb-6 border-2 ${backupOggi ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          {backupOggi ? <CheckCircle size={28} className="text-green-500 shrink-0"/> : <Clock size={28} className="text-amber-500 shrink-0"/>}
          <div>
            <div className={`font-bold text-base ${backupOggi ? 'text-green-800' : 'text-amber-800'}`}>
              {backupOggi ? '✅ Backup effettuato oggi' : '⚠️ Nessun backup oggi'}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {ultimoBackup ? `Ultimo: ${ultimoBackup.toLocaleString('it-IT')}` : 'Nessun backup ancora effettuato'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-700">{clienti.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Clienti</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-700">{ordini.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Ordini</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-700">{prodotti.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Prodotti</div>
        </div>
      </div>

      <button onClick={esportaExcel} disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-lg active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 mb-4">
        {loading
          ? <><RefreshCw size={24} className="animate-spin"/> Esportando...</>
          : <><Download size={24}/> 📥 Scarica Backup Excel</>
        }
      </button>

      <div className="text-xs text-gray-400 text-center mb-8">
        Il file contiene 4 fogli: Clienti · Ordini · Prodotti · Riepilogo Statistiche
      </div>

      <div className="card mb-4">
        <div className="flex items-start gap-3">
          <Database size={20} className="text-blue-500 shrink-0 mt-0.5"/>
          <div>
            <div className="font-semibold text-gray-800 mb-1">Backup automatico su Firebase</div>
            <div className="text-sm text-gray-500">I tuoi dati sono già al sicuro su Firebase (Google Cloud) in tempo reale. Non vengono mai persi automaticamente.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-start gap-3">
          <Download size={20} className="text-green-500 shrink-0 mt-0.5"/>
          <div>
            <div className="font-semibold text-gray-800 mb-1">Backup Excel locale</div>
            <div className="text-sm text-gray-500">Scarica il backup e salvalo su Google Drive, Dropbox o USB. Consigliato almeno una volta a settimana.</div>
          </div>
        </div>
      </div>
    </div>
  )
}