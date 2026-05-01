'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';

// Types
export type Theme = 'dark' | 'light' | 'midnight';
export type Language = 'en' | 'es' | 'fr';

type Dictionary = typeof en;

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Dictionary;
}

// Translations map
const dictionaries: Record<Language, Dictionary> = {
    en,
    es,
    fr,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Default state
    const [theme, setThemeState] = useState<Theme>('dark');
    const [language, setLanguageState] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    // Initialize from localStorage on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const storedTheme = localStorage.getItem('geopulse-theme') as Theme;
                const storedLang = localStorage.getItem('geopulse-lang') as Language;

                if (storedTheme && ['dark', 'light', 'midnight'].includes(storedTheme)) {
                    setThemeState(storedTheme);
                }
                if (storedLang && ['en', 'es', 'fr'].includes(storedLang)) {
                    setLanguageState(storedLang);
                }
            } catch (e) {
                console.error('Failed to load settings', e);
            }
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Sync theme to DOM
    useEffect(() => {
        if (!mounted) return;

        // Update data-theme attribute
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            if (theme === 'light') document.documentElement.classList.add('light');
            else document.documentElement.classList.remove('light');
        }

        // Persist
        localStorage.setItem('geopulse-theme', theme);
    }, [theme, mounted]);

    // Sync language persistence
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('geopulse-lang', language);
    }, [language, mounted]);

    // Public setters
    const setTheme = (newTheme: Theme) => setThemeState(newTheme);
    const setLanguage = (newLang: Language) => setLanguageState(newLang);

    const value = {
        theme,
        setTheme,
        language,
        setLanguage,
        t: dictionaries[language],
    };

    return (
        <SettingsContext.Provider value={value}>
            <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </SettingsContext.Provider>
    );
}

// Hook for easy usage
export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
