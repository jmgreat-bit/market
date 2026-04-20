// TypeScript types for GeoPulse

export type UserRole = 'client' | 'trader';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
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
  is_premium: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export interface Post {
  id: string;
  business_id: string;
  content: string;
  // Legacy single image
  image_url: string | null;
  // Rich media support
  images?: PostImage[];
  video?: PostVideo;
  link?: PostLink;
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
