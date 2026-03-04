// ─── Enums (mirroring DB) ────────────────────────────────────────────────────

export type ContentStatus = 'draft' | 'published' | 'flagged';

export type ContentType =
  | 'parody_lyrics'
  | 'meme_text'
  | 'skit_script'
  | 'youtube_link'
  | 'image_meme'
  | 'gif';

export type ReactionType = 'laugh' | 'fire' | 'too_real' | 'clap';

// ─── Table shapes ─────────────────────────────────────────────────────────────

export interface Vertical {
  id:          string;
  slug:        string;
  name:        string;
  icon:        string | null;
  themes?:     Theme[];
}

export interface Theme {
  id:          string;
  vertical_id?: string;
  slug:        string;
  name:        string;
}

export interface Profile {
  id:           string;
  display_name: string;
  bio?:         string | null;
  is_admin?:    boolean;
}

export interface ContentItem {
  id:                   string;
  vertical_id:          string;
  theme_id:             string;
  contributor_id:       string;
  type:                 ContentType;
  status:               ContentStatus;
  title:                string;
  body_text:            string | null;
  media_url:            string | null;
  storage_path:         string | null;
  original_song_title:  string | null;
  original_song_artist: string | null;
  slug:                 string | null;
  created_at:           string;
  updated_at:           string;
  published_at:         string | null;
  // joined relations
  vertical?:            Pick<Vertical, 'id' | 'slug' | 'name'> | null;
  theme?:               Pick<Theme,    'id' | 'slug' | 'name'> | null;
  contributor?:         Pick<Profile,  'id' | 'display_name'>  | null;
  reactions?:           { type: ReactionType }[];
}

export interface Comment {
  id:              string;
  content_item_id: string;
  user_id:         string;
  body:            string;
  created_at:      string | null;
  user?:           Pick<Profile, 'id' | 'display_name'> | null;
}

export interface ReactionCount {
  type:  ReactionType;
  count: number;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  laugh:    { emoji: '😂', label: 'Laugh'     },
  fire:     { emoji: '🔥', label: 'Fire'      },
  too_real: { emoji: '🙏', label: 'Relatable' },
  clap:     { emoji: '👏', label: 'Clap'      },
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  parody_lyrics: 'Parody Lyrics',
  meme_text:     'Meme Text',
  skit_script:   'Skit Script',
  youtube_link:  'YouTube Link',
  image_meme:    'Image Meme',
  gif:           'GIF',
};

/** Derive initials from a display name e.g. "Sarah M." → "SM" */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Count reactions by type from a raw reactions array */
export function countReactions(
  reactions: { type: ReactionType }[]
): Record<ReactionType, number> {
  const counts: Record<ReactionType, number> = { laugh: 0, fire: 0, too_real: 0, clap: 0 };
  for (const r of reactions) counts[r.type]++;
  return counts;
}
