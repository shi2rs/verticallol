import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode]           = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

      // Update display_name if provided (trigger sets it to email prefix by default)
      if (displayName.trim() && data.user) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', data.user.id);
      }
    } else {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) { setError(signInErr.message); setLoading(false); return; }
    }

    setLoading(false);
    onClose();
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="relative flex flex-col gap-6 p-8 w-full"
        style={{
          maxWidth: '400px',
          borderRadius: 'var(--radius-m)',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}>
            {mode === 'signin'
              ? 'Welcome back to VerticalLOL'
              : 'Join the industry humor community'}
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex"
          style={{ borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--secondary)', padding: '3px' }}
        >
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className="flex-1 py-1.5 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'Geist, Inter, sans-serif',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: mode === m ? 'var(--card)' : 'transparent',
                color: mode === m ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you'll appear to others"
                className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                style={{
                  fontFamily: 'Geist, Inter, sans-serif',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              style={{
                fontFamily: 'Geist, Inter, sans-serif',
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              style={{
                fontFamily: 'Geist, Inter, sans-serif',
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--destructive)', fontFamily: 'Geist, Inter, sans-serif' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-semibold"
            style={{
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: 'Geist, Inter, sans-serif',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
