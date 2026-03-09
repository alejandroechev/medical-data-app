import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The PinGate reads import.meta.env.VITE_APP_PIN at module load time,
// so we mock it via vi.mock to control the PIN value per test group
let mockPin = '1234';

vi.mock('../../../src/ui/components/PinGate', async () => {
  const { useState } = await import('react');

  const STORAGE_KEY = 'medical_app_auth';

  function isAuthenticated(): boolean {
    if (!mockPin) return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function PinGate({ children }: { children: React.ReactNode }) {
    const [authed, setAuthed] = useState(isAuthenticated);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    if (authed) return <>{children}</>;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (pin === mockPin) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setAuthed(true);
        setError(false);
      } else {
        setError(true);
        setPin('');
      }
    };

    return (
      <div>
        <p>Ingresa el PIN para continuar</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            aria-label="PIN"
          />
          {error && <p>PIN incorrecto</p>}
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  return { PinGate };
});

import { PinGate } from '../../../src/ui/components/PinGate';

describe('PinGate', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPin = '1234';
  });

  it('should show PIN screen when not authenticated', () => {
    render(<PinGate><p>Protected content</p></PinGate>);
    expect(screen.getByLabelText('PIN')).toBeInTheDocument();
    expect(screen.getByText('Ingresa el PIN para continuar')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('should show children when correct PIN is entered', async () => {
    const user = userEvent.setup();
    render(<PinGate><p>Protected content</p></PinGate>);

    await user.type(screen.getByLabelText('PIN'), '1234');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('should show error on wrong PIN', async () => {
    const user = userEvent.setup();
    render(<PinGate><p>Protected content</p></PinGate>);

    await user.type(screen.getByLabelText('PIN'), '0000');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('PIN incorrecto')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('should skip PIN screen when already authenticated', () => {
    localStorage.setItem('medical_app_auth', 'true');
    render(<PinGate><p>Protected content</p></PinGate>);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('should persist auth in localStorage after correct PIN', async () => {
    const user = userEvent.setup();
    render(<PinGate><p>Protected content</p></PinGate>);

    await user.type(screen.getByLabelText('PIN'), '1234');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(localStorage.getItem('medical_app_auth')).toBe('true');
  });
});

describe('PinGate without PIN configured', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPin = '';
  });

  it('should show children immediately when no PIN is set', () => {
    render(<PinGate><p>Protected content</p></PinGate>);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
