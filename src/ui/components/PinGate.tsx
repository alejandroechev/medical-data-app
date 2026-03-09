import { useState } from 'react';

const STORAGE_KEY = 'medical_app_auth';
const APP_PIN = import.meta.env.VITE_APP_PIN ?? '';

function isAuthenticated(): boolean {
  if (!APP_PIN) return true; // No PIN configured = no gate
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === APP_PIN) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs space-y-4 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="text-lg font-semibold text-gray-800">Registro Médico Familiar</h1>
        <p className="text-sm text-gray-500">Ingresa el PIN para continuar</p>

        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          placeholder="PIN"
          autoFocus
          aria-label="PIN"
          className={`w-full text-center text-2xl tracking-widest border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />

        {error && (
          <p className="text-sm text-red-600">PIN incorrecto</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
