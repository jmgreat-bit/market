// App constants
export const APP_NAME = 'GeoPulse';
export const APP_DESCRIPTION = 'Discover local businesses and their latest offers';

// Map defaults
export const DEFAULT_MAP_CENTER = {
    lat: -1.9441,
    lng: 30.0619,
} as const;

export const DEFAULT_MAP_ZOOM = 13;

// Categories for businesses
export const BUSINESS_CATEGORIES = [
    'Restaurant',
    'Cafe',
    'Retail',
    'Services',
    'Entertainment',
    'Health & Beauty',
    'Automotive',
    'Other',
] as const;

// Navigation routes
export const ROUTES = {
    HOME: '/',
    MAP: '/map',
    EXPLORE: '/explore',
    SEARCH: '/search',
    FEED: '/feed',
    MENU: '/menu',
    PROFILE: '/profile',
    COMPOSE: '/compose',
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    ALERTS: '/alerts',
    ANALYTICS: '/analytics',
    VOUCHERS: '/vouchers',
    SAVED: '/saved',
} as const;

// Post/Shout settings
export const SHOUT_MAX_LENGTH = 280;
export const SHOUT_MIN_WORDS = 1;
export const SHOUT_DEFAULT_EXPIRY_HOURS = 24;

// Content and upload limits
export const COMMENT_MAX_LENGTH = 280;
export const USERNAME_MAX_LENGTH = 20;
export const FULLNAME_MAX_LENGTH = 50;
export const IMAGE_MIN_BYTES = 10 * 1024; // 10 KB
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

// Counter post settings
export const COUNTER_UPDATE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
export const COUNTER_LABEL_MAX_LENGTH = 40;

// Poll settings
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 5;
export const POLL_OPTION_MAX_LENGTH = 60;

// Direction photos
export const DIRECTION_MAX_PHOTOS = 3;
export const DIRECTION_CAPTION_MAX_LENGTH = 120;

