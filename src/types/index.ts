// TypeScript types for GeoPulse

export type UserRole = 'client' | 'trader';

export type TraderTier = 'free' | 'pro' | 'national';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_premium: boolean;
  trader_tier: TraderTier;
  tier_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessDetails {
  id: string;
  profile_id: string;
  business_name: string;
  bio: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  is_premium: boolean;
  hub_id: string | null;
  hub_floor: string | null;
  hub_stall: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialHub {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  image_url: string | null;
  created_at: string;
  business_count?: number;
}

export interface LocationVerification {
  id: string;
  business_id: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  is_verified: boolean;
  created_at: string;
}

// Media types for posts
export interface PostImage {
  id: string;
  url: string;
  alt?: string;
}

export interface PostVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  autoplay?: boolean;
}

export interface PostLink {
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  domain?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  image_url?: string | null;
  created_at: string;
}

export type PostType = 'standard' | 'counter' | 'poll';

export interface Post {
  id: string;
  business_id: string;
  content: string;
  // Post type system
  post_type: PostType;
  is_pinned: boolean;
  // Counter post fields
  counter_value: number | null;
  counter_label: string | null;
  // Legacy single image
  image_url: string | null;
  // Rich media support
  images?: PostImage[];
  video?: PostVideo;
  link?: PostLink;
  // Poll data (joined)
  poll_options?: PollOption[];
  // Engagement
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  comments?: Comment[];
  // Location
  latitude: number | null;
  longitude: number | null;
  expires_at: string | null;
  created_at: string;
}

// Extended types with relations
export interface BusinessWithDetails extends BusinessDetails {
  profile?: Profile;
  posts?: Post[];
}

export interface PostWithBusiness extends Post {
  business?: BusinessDetails;
}

// Map related types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Auth related types
export interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Poll types
export interface PollOption {
  id: string;
  post_id: string;
  label: string;
  votes_count: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// Direction/address photos for traders
export interface DirectionPhoto {
  id: string;
  business_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

// Post subscriptions (follow pinned posts)
export interface PostSubscription {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}


// Support ticket types
export type TicketCategory = 'help' | 'software' | 'report';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type ReferenceType = 'post' | 'comment' | 'user';

export interface SupportTicket {
  id: string;
  user_id: string | null;
  category: TicketCategory;
  subject: string;
  message: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  status: TicketStatus;
  created_at: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    email: string;
  } | null;
}

// Ad system
export interface Ad {
  id: string;
  business_id: string;
  post_id: string;
  placements: string[];
  radius_km: number;
  center_lat: number;
  center_lng: number;
  is_nationwide: boolean;
  starts_at: string;
  ends_at: string;
  daily_rate: number;
  total_cost: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  impressions: number;
  clicks: number;
  created_at: string;
}

// AI credits
export type AiPackage = 'starter' | 'standard' | 'power';

export interface AiCredit {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  purchased_at: string;
  package: AiPackage;
}

// Trader subscription
export interface TraderSubscription {
  id: string;
  profile_id: string;
  tier: 'pro' | 'national';
  amount_rwf: number;
  starts_at: string;
  expires_at: string;
  payment_method: 'pending' | 'momo' | 'airtel' | 'card' | 'manual';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}
