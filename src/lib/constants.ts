// App constants
export const APP_NAME = 'GeoPulse';
export const APP_DESCRIPTION = 'Discover local businesses and their latest offers';

// Map defaults
export const DEFAULT_MAP_CENTER = {
    lat: 40.7128,
    lng: -74.006,
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
    FEED: '/feed',
    PROFILE: '/profile',
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
} as const;

// Post/Shout settings
export const SHOUT_MAX_LENGTH = 280;
export const SHOUT_DEFAULT_EXPIRY_HOURS = 24;
