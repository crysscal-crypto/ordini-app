import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return setErrore('Inserisci email e password')
    setLoading(true)
    setErrore('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setErrore(err.code + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900">Ordini App</h1>
          <p className="text-gray-400 text-sm mt-1">Accedi per continuare</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="crysscal@gmail.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input
                className="input-field pr-12"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          </div>

          {errore && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {errore}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="btn-success mt-2 py-4 text-base">
            <LogIn size={20}/>
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  )
}