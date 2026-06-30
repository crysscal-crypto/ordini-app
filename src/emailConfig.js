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
    <tr>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px;">${r.codice || '-'}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px;">${r.nome}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px; text-align:center;">${r.qta}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px; text-align:right;">€ ${r.prezzoUnitario.toFixed(2)}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; font-size:13px; text-align:right; font-weight:bold;">€ ${(r.qta * r.prezzoUnitario).toFixed(2)}</td>
    </tr>
  `).join('')
}