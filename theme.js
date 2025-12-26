class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadTheme();
        this.bindEvents();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.setThemeRadio(savedTheme);
        this.applyTheme(savedTheme);
    }

    setThemeRadio(theme) {
        const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (radio) {
            radio.checked = true;
        }
    }

    bindEvents() {
        // Theme radio buttons
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                localStorage.setItem('theme', e.target.value);
            });
        });
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});