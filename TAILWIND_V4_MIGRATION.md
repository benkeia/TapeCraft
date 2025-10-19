# TapeCraft - Tailwind CSS v4 Configuration

## ✅ Ce qui a été nettoyé et optimisé

### Configuration Tailwind v4
- ✅ Suppression de `tailwind.config.js` (obsolète en v4)
- ✅ Suppression de `tailwindcss-animate` (intégré en v4)
- ✅ Migration vers `@theme` pour les variables de design tokens
- ✅ Configuration PostCSS mise à jour pour v4
- ✅ Utilisation du plugin Vite `@tailwindcss/vite`

### Structure des fichiers CSS
```
src/
├── App.css          # Fichier principal avec imports et layers
├── theme.css        # Variables de thème avec @theme
└── dark-theme.css   # Variables mode sombre
```

### Variables de thème disponibles

#### Couleurs Core
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-popover` / `text-popover-foreground`

#### Couleurs Brand
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`

#### Couleurs Utility
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive`

#### Couleurs Interactive
- `border-border`
- `bg-input`
- `ring-ring`

#### Couleurs Chart
- `bg-chart-1` à `bg-chart-5`

#### Animations personnalisées
- `animate-fade-in`
- `animate-slide-up`

### Utilisation

#### Mode sombre
```jsx
// Ajoutez la classe "dark" au document ou à un conteneur
<div className="dark">
  <div className="bg-background text-foreground">
    Contenu en mode sombre
  </div>
</div>
```

#### Variables CSS directes
```css
.custom-component {
  background-color: var(--color-primary);
  border-radius: var(--radius);
}
```

#### Classes utilitaires Tailwind
```jsx
<button className="bg-primary text-primary-foreground rounded-lg">
  Bouton primaire
</button>
```

### Avantages de cette migration

1. **Performance améliorée** : v4 est plus rapide au build
2. **API simplifiée** : Plus besoin de fichier de config complexe
3. **Variables CSS natives** : Meilleure intégration avec CSS moderne
4. **Tree-shaking optimisé** : Seules les classes utilisées sont générées
5. **Couleurs OKLCH** : Espace colorimétrique plus moderne et précis

### Notes importantes

- Le mode sombre utilise les variables CSS custom (pas `@media prefers-color-scheme`)
- Les animations par défaut de Tailwind sont toujours disponibles
- Les breakpoints responsive fonctionnent comme avant
- Compatibilité avec tous les plugins existants
