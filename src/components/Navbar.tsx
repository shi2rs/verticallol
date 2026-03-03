import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavbarProps {
  activePage?: 'home' | 'submit';
}

export function Navbar({ activePage }: NavbarProps) {
  return (
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

      {/* Right: Avatar */}
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback
            className="text-xs font-medium"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
          >
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
