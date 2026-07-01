import React from 'react'
import { NavLink } from 'react-router-dom'
import { ClipboardList, Users, Package, BarChart2, HardDrive } from 'lucide-react'

const tabs = [
  { to: '/ordini',    icon: ClipboardList, label: 'Ordini',    bg: 'bg-blue-600',    activeBg: 'bg-blue-700'    },
  { to: '/clienti',   icon: Users,         label: 'Clienti',   bg: 'bg-emerald-600', activeBg: 'bg-emerald-700' },
  { to: '/prodotti',  icon: Package,       label: 'Prodotti',  bg: 'bg-violet-600',  activeBg: 'bg-violet-700'  },
  { to: '/fatturato', icon: BarChart2,     label: 'Fatturato', bg: 'bg-amber-500',   activeBg: 'bg-amber-600'   },
  { to: '/backup',    icon: HardDrive,     label: 'Backup',    bg: 'bg-gray-600',    activeBg: 'bg-gray-700'    },
]

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="flex max-w-xl mx-auto gap-1.5 p-2">
        {tabs.map(({ to, icon: Icon, label, bg, activeBg }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center py-2.5 gap-0.5 rounded-2xl transition-all duration-150 active:scale-95 ${isActive ? activeBg : bg}`}>
                <Icon size={22} strokeWidth={2} className="text-white" />
                <span className="text-xs font-bold text-white tracking-wide">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}