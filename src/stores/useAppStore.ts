import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

export type FloatingWidgetType = 'settings' | 'role' | null;

interface AppState {
  theme: 'light' | 'dark';
  language: 'id' | 'en';
  zoom: number; // For accessibility
  activeFloatingWidget: FloatingWidgetType;
  toggleTheme: () => void;
  setLanguage: (lang: 'id' | 'en') => void;
  setZoom: (zoom: number) => void;
  setActiveFloatingWidget: (widget: FloatingWidgetType) => void;
  toggleFloatingWidget: (widget: 'settings' | 'role') => void;
  closeFloatingWidgets: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'id',
      zoom: 1,
      activeFloatingWidget: null,
      toggleTheme: () => set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
      }),
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
      setZoom: (zoom) => {
        (document.documentElement.style as any).zoom = zoom;
        // Fallback for browsers that do not support zoom (e.g. older Firefox)
        if ((document.documentElement.style as any).zoom !== String(zoom) && (document.documentElement.style as any).zoom !== zoom) {
          document.body.style.transform = `scale(${zoom})`;
          document.body.style.transformOrigin = 'top center';
        }
        set({ zoom });
      },
      setActiveFloatingWidget: (widget) => set({ activeFloatingWidget: widget }),
      toggleFloatingWidget: (widget) => set((state) => ({
        activeFloatingWidget: state.activeFloatingWidget === widget ? null : widget,
      })),
      closeFloatingWidgets: () => set({ activeFloatingWidget: null }),
    }),
    {
      name: 'temuspace-app-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        zoom: state.zoom,
      }),
    }
  )
);
