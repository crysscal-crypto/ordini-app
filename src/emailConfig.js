export const EMAILJS_SERVICE_ID = 'service_bmpzvds'
export const EMAILJS_TEMPLATE_ID = 'template_2svbn57'
export const EMAILJS_PUBLIC_KEY = '9XeEtS6GWSFd7izYG'

export const LOGHI_BRAND = {
  'Coco Cera': '/loghi/coco-cera.png',
  'Callus Stop': '/loghi/callus-stop.png',
  'Unica Wax': '/loghi/unica-wax.png',
}

export function getLogoUrl(brand) {
  const path = LOGHI_BRAND[brand] || LOGHI_BRAND['Coco Cera']
  return `${window.location.origin}${path}`
}

export function buildRigheHtml(righe) {
  return righe.map(r => `
    <tr style="background:${r.omaggio ? '#f0fdf4' : 'white'}">
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px;">${r.codice || '-'}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px;">${r.nome}${r.omaggio ? ' <span style="background:#22c55e;color:white;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;">OMAGGIO</span>' : ''}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px; text-align:center;">${r.qta}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px; text-align:right;">${r.omaggio ? '-' : '€ ' + r.prezzoUnitario.toFixed(2)}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px; text-align:right; font-weight:bold;">${r.omaggio ? 'OMAGGIO' : '€ ' + (r.qta * r.prezzoUnitario).toFixed(2)}</td>
    </tr>
  `).join('')
}

export function buildDatiClienteHtml(cliente) {
  if (!cliente) return ''
  const rows = [
    cliente.piva && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;width:140px;">P.IVA</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${cliente.piva}</td></tr>`,
    cliente.codiceSDI && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;">Codice SDI</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${cliente.codiceSDI}</td></tr>`,
    cliente.pec && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;">PEC</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${cliente.pec}</td></tr>`,
    cliente.telefono && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;">Telefono</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${cliente.telefono}</td></tr>`,
    cliente.email && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;">Email</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${cliente.email}</td></tr>`,
    (cliente.indirizzo || cliente.citta) && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;">Sede Legale</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${[cliente.indirizzo, cliente.cap, cliente.citta, cliente.provincia].filter(Boolean).join(', ')}</td></tr>`,
    cliente.iban && `<tr><td style="padding:6px 8px;font-size:13px;color:#666;">IBAN</td><td style="padding:6px 8px;font-size:13px;font-weight:bold;">${cliente.iban}</td></tr>`,
  ].filter(Boolean).join('')

  if (!rows) return ''
  return `
    <div style="margin:20px 0;">
      <div style="background:#1a3a5c;color:white;padding:8px 12px;font-size:13px;font-weight:bold;border-radius:6px 6px 0 0;">
        🆕 DATI NUOVO CLIENTE
      </div>
      <table style="width:100%;border-collapse:collapse;background:#f0f9ff;border:1px solid #bae6fd;border-radius:0 0 6px 6px;">
        ${rows}
      </table>
    </div>
  `
}