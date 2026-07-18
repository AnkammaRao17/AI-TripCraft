import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'ai-tripcraft-theme';
  isDarkMode = signal<boolean>(false);

  constructor() {
    // Load initial theme on service initialization
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
      this.isDarkMode.set(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }

    // Effect to apply class on HTML body automatically when signal changes
    effect(() => {
      const dark = this.isDarkMode();
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (dark) {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
          localStorage.setItem(this.THEME_KEY, 'dark');
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
          localStorage.setItem(this.THEME_KEY, 'light');
        }
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update((dark) => !dark);
  }
}
