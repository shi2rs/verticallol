import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/types';

interface NavbarProps {
  activePage?: 'home' | 'submit';
}

export function Navbar({ activePage }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const displayName = user?.email?.split('@')[0] ?? '';

  return (
    <>
      <nav
        className="flex items-center justify-between w-full px-8 border-b"
        style={{ height: '64px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      >
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/">
            <span
              className="text-[22px] font-bold"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}
            >
              VerticalLOL
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'Geist, Inter, sans-serif',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: activePage === 'home' ? 'var(--secondary)' : 'transparent',
                color: activePage === 'home' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              Home
            </Link>
            <Link
              to="/submit"
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'Geist, Inter, sans-serif',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: activePage === 'submit' ? 'var(--secondary)' : 'transparent',
                color: activePage === 'submit' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              Submit
            </Link>
          </div>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Avatar className="w-8 h-8">
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                >
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={signOut}
                className="text-sm font-medium"
                style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-4 py-1.5 text-sm font-semibold"
              style={{
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontFamily: 'Geist, Inter, sans-serif',
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
