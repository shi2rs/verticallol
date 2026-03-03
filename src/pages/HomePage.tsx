import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, TrendingUp, BookOpen, HeartPulse, Scale, Music, type LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  type Vertical,
  type Theme,
  type ContentItem,
  type ReactionType,
  REACTION_META,
  countReactions,
  getInitials,
} from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

// Local icon map keyed by vertical slug (UI concern, not stored in DB)
const VERTICAL_ICONS: Record<string, LucideIcon> = {
  software:   Code,
  finance:    TrendingUp,
  education:  BookOpen,
  healthcare: HeartPulse,
  legal:      Scale,
};

// Badge color per vertical slug
type TagVariant = 'secondary' | 'orange' | 'violet' | 'success';
const VERTICAL_VARIANT: Record<string, TagVariant> = {
  software:   'secondary',
  finance:    'violet',
  education:  'success',
  healthcare: 'orange',
  legal:      'secondary',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagBadge({ label, variant }: { label: string; variant: TagVariant }) {
  const styles: Record<TagVariant, { bg: string; color: string }> = {
    secondary: { bg: 'var(--secondary)',          color: 'var(--secondary-foreground)' },
    orange:    { bg: 'rgba(255,132,0,0.12)',       color: 'var(--primary)'             },
    violet:    { bg: 'rgba(139,92,246,0.12)',      color: '#6D28D9'                    },
    success:   { bg: 'rgba(0,77,26,0.1)',          color: 'var(--color-success-foreground)' },
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium"
      style={{
        fontFamily: 'Geist, Inter, sans-serif',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: styles[variant].bg,
        color: styles[variant].color,
      }}
    >
      {label}
    </span>
  );
}

function ContentCardItem({ card }: { card: ContentItem }) {
  const navigate = useNavigate();
  const rxCounts = countReactions(card.reactions ?? []);
  const vertSlug = card.vertical?.slug ?? '';

  const originalSong =
    card.original_song_title && card.original_song_artist
      ? `${card.original_song_title} — ${card.original_song_artist}`
      : null;

  return (
    <div
      className="flex flex-col w-full cursor-pointer overflow-hidden border"
      style={{
        borderRadius: 'var(--radius-m)',
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
      onClick={() => navigate(`/content/${card.id}`)}
    >
      <div className="flex flex-col gap-3 p-5">
        {/* Title */}
        <h3
          className="text-base font-semibold leading-snug"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}
        >
          {card.title}
        </h3>

        {/* Original Song */}
        {originalSong && (
          <div className="flex items-center gap-1.5">
            <Music size={12} style={{ color: 'var(--muted-foreground)' }} />
            <span
              className="text-xs"
              style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
            >
              {originalSong}
            </span>
          </div>
        )}

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {card.vertical && (
            <TagBadge
              label={card.vertical.name}
              variant={VERTICAL_VARIANT[vertSlug] ?? 'secondary'}
            />
          )}
          {card.theme && (
            <TagBadge label={card.theme.name} variant="orange" />
          )}
        </div>

        {/* Reactions + Contributor */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            {(Object.entries(rxCounts) as [ReactionType, number][])
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-1">
                  <span className="text-sm">{REACTION_META[type].emoji}</span>
                  <span
                    className="text-xs font-medium"
                    style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
                  >
                    {count}
                  </span>
                </div>
              ))}
          </div>

          {card.contributor && (
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarFallback
                  className="text-[8px] font-medium"
                  style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                >
                  {getInitials(card.contributor.display_name)}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-xs"
                style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
              >
                {card.contributor.display_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [verticals,      setVerticals]     = useState<Vertical[]>([]);
  const [activeVertical, setActiveVertical] = useState<string>('all');
  const [activeTheme,    setActiveTheme]    = useState<string | null>(null);
  const [items,          setItems]          = useState<ContentItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // ── Fetch verticals + their themes once on mount ───────────────────────────
  useEffect(() => {
    async function fetchVerticals() {
      const { data, error } = await supabase
        .from('verticals')
        .select('id, slug, name, icon, themes(id, slug, name)')
        .order('name');

      if (error) { setError(error.message); return; }
      setVerticals(data ?? []);
    }
    fetchVerticals();
  }, []);

  // ── Fetch content items whenever filters change ────────────────────────────
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('content_items')
        .select(`
          id, title, original_song_title, original_song_artist,
          contributor_id, vertical_id, theme_id,
          vertical:verticals(id, slug, name),
          theme:themes(id, slug, name),
          reactions(type)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(18);

      if (activeVertical !== 'all') {
        const vert = verticals.find((v) => v.slug === activeVertical);
        if (vert) query = query.eq('vertical_id', vert.id);
      }

      if (activeTheme) {
        // find theme id across all verticals
        const theme = verticals
          .flatMap((v) => v.themes ?? [])
          .find((t) => t.slug === activeTheme);
        if (theme) query = query.eq('theme_id', theme.id);
      }

      const { data: rawItems, error: itemsErr } = await query;
      if (itemsErr) { setError(itemsErr.message); setLoading(false); return; }
      if (!rawItems?.length) { setItems([]); setLoading(false); return; }

      // Fetch contributor profiles (separate query — FK is to auth.users, not profiles)
      const contributorIds = [...new Set(rawItems.map((i) => i.contributor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', contributorIds);

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

      const enriched: ContentItem[] = rawItems.map((item) => ({
        ...item,
        contributor: profileMap[item.contributor_id] ?? null,
      }));

      setItems(enriched);
      setLoading(false);
    }

    // Only run after verticals have loaded (need IDs for filtering)
    if (verticals.length > 0 || activeVertical === 'all') {
      fetchItems();
    }
  }, [activeVertical, activeTheme, verticals]);

  // ── Derived: themes for the active vertical ────────────────────────────────
  const visibleThemes: Theme[] =
    activeVertical === 'all'
      ? verticals.flatMap((v) => v.themes ?? [])
      : (verticals.find((v) => v.slug === activeVertical)?.themes ?? []);

  // ── 3-column grid ──────────────────────────────────────────────────────────
  const columns: ContentItem[][] = [[], [], []];
  items.forEach((item, i) => columns[i % 3].push(item));

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar activePage="home" />

      {/* Filter Area */}
      <div className="flex flex-col gap-4 px-8 py-6 w-full">

        {/* Vertical Pills */}
        <div className="flex flex-col gap-3">
          <span
            className="text-xs font-medium"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}
          >
            Browse by Vertical
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {/* All pill */}
            <button
              onClick={() => { setActiveVertical('all'); setActiveTheme(null); }}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold transition-colors"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: activeVertical === 'all' ? 'var(--primary)' : 'var(--secondary)',
                color: activeVertical === 'all' ? 'var(--primary-foreground)' : 'var(--foreground)',
              }}
            >
              All
            </button>

            {verticals.map((v) => {
              const Icon = VERTICAL_ICONS[v.slug];
              const isActive = activeVertical === v.slug;
              return (
                <button
                  key={v.slug}
                  onClick={() => { setActiveVertical(v.slug); setActiveTheme(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold transition-colors"
                  style={{
                    fontFamily: 'Geist, Inter, sans-serif',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--secondary)',
                    color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                  }}
                >
                  {Icon && <Icon size={14} />}
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Filter Pills */}
        {visibleThemes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[13px] font-medium"
              style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
            >
              Themes:
            </span>
            {visibleThemes.map((theme) => {
              const isActive = activeTheme === theme.slug;
              return (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(isActive ? null : theme.slug)}
                  className="flex items-center px-2.5 py-1 text-xs font-medium border transition-colors"
                  style={{
                    fontFamily: 'Geist, Inter, sans-serif',
                    borderRadius: 'var(--radius-pill)',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  {theme.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Grid */}
      {error ? (
        <p className="px-8 text-sm" style={{ color: 'var(--destructive)' }}>Error: {error}</p>
      ) : loading ? (
        <p
          className="px-8 text-sm"
          style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
        >
          Loading...
        </p>
      ) : items.length === 0 ? (
        <p
          className="px-8 text-sm"
          style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}
        >
          No content yet for this filter.
        </p>
      ) : (
        <div className="flex gap-5 px-8 pb-8 w-full">
          {columns.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-5 flex-1">
              {column.map((card) => (
                <ContentCardItem key={card.id} card={card} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
