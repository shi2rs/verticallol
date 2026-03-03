import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { type Vertical, type Theme, type ContentType, CONTENT_TYPE_LABELS } from '@/lib/types';

// Which fields are relevant per content type
const TYPE_NEEDS: Record<ContentType, { body: boolean; media: boolean; song: boolean }> = {
  parody_lyrics: { body: true,  media: false, song: true  },
  meme_text:     { body: true,  media: false, song: false },
  skit_script:   { body: true,  media: false, song: false },
  youtube_link:  { body: false, media: true,  song: false },
  image_meme:    { body: false, media: true,  song: false },
  gif:           { body: false, media: true,  song: false },
};

const ALL_TYPES = Object.keys(TYPE_NEEDS) as ContentType[];

export default function SubmitContentPage() {
  const navigate = useNavigate();

  const [verticals,  setVerticals]  = useState<Vertical[]>([]);
  const [themes,     setThemes]     = useState<Theme[]>([]);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [form, setForm] = useState({
    vertical_id:         '',
    theme_id:            '',
    type:                '' as ContentType | '',
    title:               '',
    body_text:           '',
    media_url:           '',
    original_song_title: '',
    original_song_artist:'',
  });

  // ── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // ── Fetch verticals + themes ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchVerticals() {
      const { data } = await supabase
        .from('verticals')
        .select('id, slug, name, icon, themes(id, slug, name)')
        .order('name');
      setVerticals(data ?? []);
    }
    fetchVerticals();
  }, []);

  // ── Cascade themes when vertical changes ─────────────────────────────────
  useEffect(() => {
    if (!form.vertical_id) { setThemes([]); return; }
    const vert = verticals.find((v) => v.id === form.vertical_id);
    setThemes(vert?.themes ?? []);
    setForm((f) => ({ ...f, theme_id: '' }));
  }, [form.vertical_id, verticals]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) { setError('You must be signed in to submit content.'); return; }
    if (!form.vertical_id || !form.theme_id || !form.type || !form.title.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const needs = TYPE_NEEDS[form.type as ContentType];

    if (needs.body && !form.body_text.trim()) {
      setError('Please add your content text.');
      return;
    }
    if (needs.media && !form.media_url.trim()) {
      setError('Please add a media URL.');
      return;
    }
    if (needs.song && (!form.original_song_title.trim() || !form.original_song_artist.trim())) {
      setError('Please fill in the original song title and artist.');
      return;
    }

    setSubmitting(true);

    const { error: insertErr } = await supabase.from('content_items').insert({
      vertical_id:          form.vertical_id,
      theme_id:             form.theme_id,
      contributor_id:       userId,
      type:                 form.type,
      title:                form.title.trim(),
      body_text:            form.body_text.trim()            || null,
      media_url:            form.media_url.trim()            || null,
      original_song_title:  form.original_song_title.trim()  || null,
      original_song_artist: form.original_song_artist.trim() || null,
      status:               'draft',
    });

    setSubmitting(false);

    if (insertErr) { setError(insertErr.message); return; }
    setSubmitted(true);
  }

  const selectedType = form.type as ContentType | '';
  const needs = selectedType ? TYPE_NEEDS[selectedType] : null;

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) return (
    <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar activePage="submit" />
      <div className="flex justify-center w-full px-8 py-10">
        <div
          className="flex flex-col items-center gap-4 p-8 border w-full text-center"
          style={{ maxWidth: '640px', borderRadius: 'var(--radius-m)', backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <span className="text-4xl">🎉</span>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
            Submitted for Review
          </h2>
          <p className="text-sm" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)' }}>
            Your content will be reviewed and published within 24 hours.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold"
            style={{ borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'Geist, Inter, sans-serif' }}
          >
            Back to feed
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar activePage="submit" />

      <div className="flex justify-center w-full px-8 py-10">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 p-8 border w-full"
          style={{ maxWidth: '640px', borderRadius: 'var(--radius-m)', backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
              Submit New Content
            </h1>
            <p className="text-sm" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
              Share your industry humor with the community. Your submission will be reviewed before publishing.
            </p>
          </div>

          {/* Vertical + Theme */}
          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                Vertical *
              </label>
              <Select value={form.vertical_id} onValueChange={(v) => set('vertical_id', v)}>
                <SelectTrigger style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'Geist, Inter, sans-serif' }}>
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                Theme *
              </label>
              <Select value={form.theme_id} onValueChange={(v) => set('theme_id', v)} disabled={!form.vertical_id}>
                <SelectTrigger style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'Geist, Inter, sans-serif' }}>
                  <SelectValue placeholder={form.vertical_id ? 'Select theme...' : 'Select vertical first'} />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
              Content Type *
            </label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'Geist, Inter, sans-serif' }}>
                <SelectValue placeholder="What are you submitting?" />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Give your content a catchy title..."
              style={{ fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Original Song — parody_lyrics only */}
          {needs?.song && (
            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                  Original Song Title *
                </label>
                <Input
                  value={form.original_song_title}
                  onChange={(e) => set('original_song_title', e.target.value)}
                  placeholder="e.g. Bohemian Rhapsody"
                  style={{ fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                  Original Artist *
                </label>
                <Input
                  value={form.original_song_artist}
                  onChange={(e) => set('original_song_artist', e.target.value)}
                  placeholder="e.g. Queen"
                  style={{ fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            </div>
          )}

          {/* Body text — lyrics / meme / skit */}
          {needs?.body && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                {selectedType === 'parody_lyrics' ? 'Parody Lyrics *' :
                 selectedType === 'skit_script'   ? 'Skit Script *'  : 'Meme Text *'}
              </label>
              <Textarea
                value={form.body_text}
                onChange={(e) => set('body_text', e.target.value)}
                placeholder="Paste your content here..."
                style={{ height: '200px', fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', resize: 'vertical' }}
              />
            </div>
          )}

          {/* Media URL — youtube / gif / image_meme */}
          {needs?.media && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--foreground)' }}>
                {selectedType === 'youtube_link' ? 'YouTube URL *' :
                 selectedType === 'gif'           ? 'GIF URL *'    : 'Image URL *'}
              </label>
              <Input
                value={form.media_url}
                onChange={(e) => set('media_url', e.target.value)}
                placeholder={
                  selectedType === 'youtube_link' ? 'https://youtube.com/...' :
                  selectedType === 'gif'           ? 'https://giphy.com/...' :
                                                    'https://...'
                }
                style={{ fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm" style={{ color: 'var(--destructive)', fontFamily: 'Geist, Inter, sans-serif' }}>
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              style={{ fontFamily: 'Geist, Inter, sans-serif', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !userId}
              style={{ fontFamily: 'Geist, Inter, sans-serif', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>

          {/* Info note */}
          <div
            className="flex items-start gap-2 px-4 py-3"
            style={{ borderRadius: 'var(--radius-m)', backgroundColor: 'var(--color-info)' }}
          >
            <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-info-foreground)' }} />
            <p className="text-[13px]" style={{ fontFamily: 'Geist, Inter, sans-serif', color: 'var(--color-info-foreground)', lineHeight: 1.4 }}>
              {userId
                ? 'Submissions are reviewed within 24 hours. We\'ll notify you when your content is approved.'
                : 'You need to sign in before you can submit content.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
