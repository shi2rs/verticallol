import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Music, PlayCircle, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  type ContentItem,
  type Comment,
  type ReactionCount,
  type ReactionType,
  REACTION_META,
  CONTENT_TYPE_LABELS,
  getInitials,
} from '@/lib/types';

// ─── Tag Badge ────────────────────────────────────────────────────────────────

type TagVariant = 'secondary' | 'orange' | 'violet' | 'success';

function TagBadge({ label, variant }: { label: string; variant: TagVariant }) {
  const styles: Record<TagVariant, { bg: string; color: string }> = {
    secondary: { bg: 'var(--secondary)',     color: 'var(--secondary-foreground)'     },
    orange:    { bg: 'rgba(255,132,0,0.12)', color: 'var(--primary)'                 },
    violet:    { bg: 'rgba(139,92,246,0.12)',color: '#6D28D9'                        },
    success:   { bg: 'rgba(0,77,26,0.1)',    color: 'var(--color-success-foreground)' },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentDetailPage() {
  const navigate   = useNavigate();
  const { id }     = useParams<{ id: string }>();

  const [item,          setItem]          = useState<ContentItem | null>(null);
  const [reactions,     setReactions]     = useState<ReactionCount[]>([]);
  const [userReaction,  setUserReaction]  = useState<ReactionType | null>(null);
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [commentBody,   setCommentBody]   = useState('');
  const [userId,        setUserId]        = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);

  // ── Fetch current user once ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // ── Fetch reaction counts ──────────────────────────────────────────────────
  const fetchReactions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('reaction_counts')
      .select('type, count')
      .eq('content_item_id', id);
    setReactions((data ?? []) as ReactionCount[]);
  }, [id]);

  // ── Fetch user's own reaction ──────────────────────────────────────────────
  const fetchUserReaction = useCallback(async (uid: string) => {
    if (!id) return;
    const { data } = await supabase
      .from('reactions')
      .select('type')
      .eq('content_item_id', id)
      .eq('user_id', uid)
      .maybeSingle();
    setUserReaction(data?.type ?? null);
  }, [id]);

  // ── Fetch comments ─────────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id')
      .eq('content_item_id', id)
      .order('created_at', { ascending: true });

    if (!data?.length) { setComments([]); return; }

    // Fetch commenter profiles
    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    setComments(data.map((c) => ({ ...c, content_item_id: id, user: profileMap[c.user_id] ?? null })));
  }, [id]);

  // ── Main load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError(null);

      // Content item
      const { data: raw, error: itemErr } = await supabase
        .from('content_items')
        .select(`
          id, title, body_text, media_url, original_song_title, original_song_artist,
          type, status, contributor_id,
          vertical:verticals(id, slug, name),
          theme:themes(id, slug, name)
        `)
        .eq('id', id!)
        .single();

      if (itemErr || !raw) { setError(itemErr?.message ?? 'Not found'); setLoading(false); return; }

      // Contributor profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', raw.contributor_id)
        .single();

      setItem({ ...raw, contributor: profile ?? null } as ContentItem);
      setLoading(false);
    }

    load();
    fetchReactions();
    fetchComments();
  }, [id, fetchReactions, fetchComments]);

  // Fetch user's reaction when userId loads
  useEffect(() => {
    if (userId) fetchUserReaction(userId);
  }, [userId, fetchUserReaction]);

  // ── Realtime: reactions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`reactions:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `content_item_id=eq.${id}` },
        () => fetchReactions()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, fetchReactions]);

  // ── Reaction toggle ────────────────────────────────────────────────────────
  async function handleReaction(type: ReactionType) {
    if (!userId) { alert('Sign in to react'); return; }
    if (!id) return;

    if (userReaction === type) {
      // Toggle off — delete
      await supabase.from('reactions').delete()
        .eq('content_item_id', id)
        .eq('user_id', userId);
      setUserReaction(null);
    } else {
      // Upsert — replaces any existing reaction for this user+item
      await supabase.from('reactions').upsert(
        { content_item_id: id, user_id: userId, type },
        { onConflict: 'content_item_id,user_id' }
      );
      setUserReaction(type);
    }
    fetchReactions();
  }

  // ── Submit comment ────────────────────────────────────────────────────────
  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { alert('Sign in to comment'); return; }
    if (!commentBody.trim() || !id) return;
    setSubmitting(true);
    await supabase.from('comments').insert({
      content_item_id: id,
      user_id: userId,
      body: commentBody.trim(),
    });
    setCommentBody('');
    setSubmitting(false);
    fetchComments();
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const originalSong =
    item?.original_song_title && item?.original_song_artist
      ? `${item.original_song_title} — ${item.original_song_artist}`
      : null;

  if (loading) return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar />
      <p className="p-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
    </div>
  );

  if (error || !item) return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar />
      <p className="p-8 text-sm" style={{ color: 'var(--destructive)' }}>{error ?? 'Content not found.'}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar />

      <div className="flex gap-8 p-8 w-full">

        {/* ── Main Content ── */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">

          {/* Back */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 w-fit">
            <ArrowLeft size={16} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-[13px] font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}>
              Back to feed
            </span>
          </button>

          {/* Title + Meta */}
          <div className="flex flex-col gap-3 w-full">
            <h1
              className="text-[28px] font-bold leading-tight w-full"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}
            >
              {item.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              {originalSong && (
                <div className="flex items-center gap-1.5">
                  <Music size={14} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-sm" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}>
                    {originalSong}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {item.vertical && <TagBadge label={item.vertical.name} variant="secondary" />}
                {item.theme    && <TagBadge label={item.theme.name}    variant="orange"    />}
              </div>

              {item.contributor && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}>
                      {getInitials(item.contributor.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                    {item.contributor.display_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Body Text (lyrics / meme / skit) */}
          {item.body_text && (
            <div
              className="flex flex-col gap-5 p-8 w-full border"
              style={{ borderRadius: 'var(--radius-m)', backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}
              >
                {CONTENT_TYPE_LABELS[item.type].toUpperCase()}
              </span>
              <p
                className="text-base w-full"
                style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)', lineHeight: 1.8, whiteSpace: 'pre-line' }}
              >
                {item.body_text}
              </p>
            </div>
          )}

          {/* Media URL (YouTube / external) */}
          {item.media_url && (
            <a
              href={item.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-3 w-full"
              style={{ borderRadius: 'var(--radius-m)', backgroundColor: 'var(--secondary)', textDecoration: 'none' }}
            >
              <PlayCircle size={20} style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-medium flex-1" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                {item.type === 'youtube_link' ? 'Watch the performance on YouTube' : 'View media'}
              </span>
              <ExternalLink size={14} style={{ color: 'var(--muted-foreground)' }} />
            </a>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-6" style={{ width: '360px', flexShrink: 0 }}>

          {/* Reactions */}
          <div
            className="flex flex-col gap-4 p-6 border"
            style={{ borderRadius: 'var(--radius-m)', backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
              Reactions
            </h3>

            <div className="flex gap-3 w-full">
              {(Object.keys(REACTION_META) as ReactionType[]).map((type) => {
                const { emoji, label } = REACTION_META[type];
                const count = reactions.find((r) => r.type === type)?.count ?? 0;
                const isActive = userReaction === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className="flex flex-col items-center gap-1 p-4 flex-1 transition-opacity hover:opacity-80"
                    style={{
                      borderRadius: 'var(--radius-m)',
                      backgroundColor: isActive ? 'rgba(255,132,0,0.12)' : 'var(--secondary)',
                      border: isActive ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                    }}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-lg font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
                      {count}
                    </span>
                    <span className="text-[11px]" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div
            className="flex flex-col gap-4 p-6 border"
            style={{ borderRadius: 'var(--radius-m)', backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
              Comments ({comments.length})
            </h3>

            <form onSubmit={handleComment} className="flex gap-2">
              <Input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder={userId ? 'Add a comment...' : 'Sign in to comment'}
                disabled={!userId || submitting}
                style={{ fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
              {userId && (
                <button
                  type="submit"
                  disabled={!commentBody.trim() || submitting}
                  className="px-3 py-1 text-xs font-semibold rounded"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-m)', fontFamily: 'Geist, Inter, sans-serif' }}
                >
                  Post
                </button>
              )}
            </form>

            <div className="flex flex-col gap-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 w-full">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarFallback className="text-[9px] font-medium"
                      style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}>
                      {comment.user ? getInitials(comment.user.display_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-[13px] font-semibold" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                      {comment.user?.display_name ?? 'Unknown'}
                    </span>
                    <p className="text-[13px] leading-relaxed" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}>
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
