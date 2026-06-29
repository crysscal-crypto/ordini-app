import React from 'react'
import { NavLink } from 'react-router-dom'
import { Users, Package, ClipboardList, BarChart2 } from 'lucide-react'

const tabs = [
  { to: '/ordini', icon: ClipboardList, label: 'Ordini' },
  { to: '/clienti', icon: Users, label: 'Clienti' },
  { to: '/prodotti', icon: Package, label: 'Prodotti' },
  { to: '/fatturato', icon: BarChart2, label: 'Fatturato' },
]

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors duration-150 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            <Icon size={26} strokeWidth={isActive => (isActive ? 2.5 : 1.8)} />
            <span className="text-xs font-semibold">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
