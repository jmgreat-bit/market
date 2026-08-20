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

export interface DiscoveryTopic {
    id: string;
    label: string;
    kinyarwandaLabel?: string;
    icon: string;
    keywords: string[];
    categoryFilter?: string;
}

export const DISCOVERY_TOPICS: DiscoveryTopic[] = [
    { id: 'all', label: 'All', icon: '✨', keywords: [] },
    { id: 'inzu', label: 'Inzu / Housing', kinyarwandaLabel: 'Inzu', icon: '🏠', keywords: ['inzu', 'house', 'apartment', 'rent', 'housing', 'lodging', 'real estate', 'chambre', 'ikode'], categoryFilter: 'Housing' },
    { id: 'imodoka', label: 'Imodoka / Cars', kinyarwandaLabel: 'Imodoka', icon: '🚗', keywords: ['imodoka', 'car', 'auto', 'taxi', 'garage', 'moto', 'transport', 'vehicle', 'ibinyabiziga'], categoryFilter: 'Automotive' },
    { id: 'isoko', label: 'Isoko / Market', kinyarwandaLabel: 'Isoko', icon: '🛒', keywords: ['isoko', 'market', 'amasaka', 'groceries', 'supermarket', 'food', 'ibiryo', 'fruits', 'vegetables', 'bazaar'], categoryFilter: 'Retail' },
    { id: 'mtn', label: 'MTN MoMo', kinyarwandaLabel: 'MTN', icon: '🟡', keywords: ['mtn', 'momo', 'airtime', 'sim', 'internet', 'yolo', 'mobile money'], categoryFilter: 'Services' },
    { id: 'airtel', label: 'Airtel Money', kinyarwandaLabel: 'Airtel', icon: '🔴', keywords: ['airtel', 'airtel money', 'airtime', 'internet'], categoryFilter: 'Services' },
    { id: 'food', label: 'Ibiryo / Food', kinyarwandaLabel: 'Ibiryo', icon: '🍔', keywords: ['food', 'restaurant', 'cafe', 'fast food', 'ibiryo', 'nyama', 'brochettes', 'pizza', 'coffee', 'resitora'], categoryFilter: 'Restaurant' },
    { id: 'fashion', label: 'Imyenda & Shoes', kinyarwandaLabel: 'Imyenda', icon: '👗', keywords: ['imyenda', 'clothes', 'inkweto', 'shoes', 'boutique', 'fashion', 'wear', 'dress'], categoryFilter: 'Retail' },
    { id: 'tech', label: 'Telefone & Tech', kinyarwandaLabel: 'Telefone', icon: '📱', keywords: ['telefone', 'phone', 'laptop', 'iphone', 'samsung', 'gadgets', 'electronics', 'charger'], categoryFilter: 'Retail' },
    { id: 'health', label: 'Farumasi / Health', kinyarwandaLabel: 'Farumasi', icon: '💊', keywords: ['farumasi', 'pharmacy', 'clinic', 'hospital', 'health', 'medicine', 'doctor', 'ubuvuzi'], categoryFilter: 'Health & Beauty' },
    { id: 'services', label: 'Akazi & Services', kinyarwandaLabel: 'Serivisi', icon: '🔧', keywords: ['akazi', 'services', 'repair', 'plumbing', 'electrician', 'cleaning', 'mechanic', 'salon', 'barber'], categoryFilter: 'Services' },
    { id: 'events', label: 'Ibikorwa / Events', kinyarwandaLabel: 'Ibikorwa', icon: '🎉', keywords: ['events', 'party', 'concert', 'nightlife', 'club', 'lounge', 'music', 'weekend'], categoryFilter: 'Entertainment' },
];

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
    PREMIUM: '/premium',
    ADS_CREATE: '/ads/create',
    AI: '/ai',
    INBOX: '/inbox',
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

