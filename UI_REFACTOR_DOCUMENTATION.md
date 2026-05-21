# 🎙️ TapeCraft UI Redesign - Architecture Documentation

## Vue d'ensemble

La refonte UI de TapeCraft a été entièrement convertie en React avec une architecture modulaire et composable. Le design suit le style dummy fourni avec une palette de couleurs moderne et un layout responsif.

## 📦 Structure des Composants

### Layout Components (`/src/components/layout/`)

#### Sidebar.tsx
Barre de navigation gauche avec onglets de catégories:
- Shell (Carapace)
- Label (Étiquette)
- Tape (Ruban)
- Packaging

**Props:**
- `activeTab`: Tab active actuellement
- `onTabChange`: Callback lors du changement d'onglet

#### Header.tsx
En-tête principal avec titre et bouton paramètres.

**Props:**
- `title`: Titre personnalisable

#### BottomBar.tsx
Barre inférieure avec affichage du prix et boutons d'action.

**Props:**
- `price`: Prix total
- `onSave`: Callback pour sauvegarder le design
- `onAddToCart`: Callback pour ajouter au panier

### Customization Components (`/src/components/customization/`)

#### ColorSwatch.tsx
Nuances de couleurs personnalisables avec états actifs.

**Features:**
- Palettes de couleurs prédéfinies
- Support des couleurs transparentes
- Support des couleurs personnalisées

#### TextureSelector.tsx
Sélecteur de texture (Matte, Transparent, Frosted).

**Features:**
- Boutons de texture toggleable
- Feedback visuel sur la sélection

#### LabelDesignSection.tsx
Section dédiée à la conception des étiquettes.

**Features:**
- Upload d'artwork
- Entrée de texte personnalisé
- Sélection de police
- Boutons de formatage (Gras, Italique, Alignement)

#### AdvancedControls.tsx
Contrôles avancés pour la rotation, zoom et luminosité.

**Features:**
- Sliders interactifs
- Affichage des valeurs en temps réel
- Plages prédéfinies

#### PresetsGrid.tsx
Grille de presets de design prédéfinis.

**Features:**
- 6 presets par défaut
- Affichage au survol
- Indicateur de sélection

#### ExportPanel.tsx
Panneau d'export et de partage.

**Features:**
- Téléchargement du design
- Lien de partage copiable
- Feedback de copie

#### RightPanel.tsx
Panneau principal de droite réunissant tous les contrôles.

**Sections:**
1. Customize Shell (Palette de couleurs)
2. Design Presets
3. Texture Selector
4. Label Design
5. Advanced Controls
6. Export & Share

### Preview Components (`/src/components/preview/`)

#### CassettePreview.tsx
Zone d'affichage principal de la cassette avec contrôles flottants.

**Features:**
- Affichage de haute résolution de l'image
- Boutons flottants (Rotate, Flip Side, Zoom)
- Ombre parallèle réaliste

### Main Component

#### CassetteCustomizerStudio.tsx
Composant principal assemblant tous les éléments.

**State Management:**
- `activeTab`: Onglet actif
- `price`: Prix du design
- `shareLink`: Lien de partage généré

## 🎨 Palette de Couleurs

Définie dans `tailwind.config.js`:

```typescript
app: {
  darkest: '#141419',
  dark: '#1C1C24',
  panel: '#252530',
  primary: '#8B5CF6',
  primaryHover: '#7C3AED',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  border: '#334155'
}
```

## 🔧 Utilisation

### Import direct

```typescript
import { CassetteCustomizerStudio } from '@/components/CassetteCustomizerStudio';

function App() {
  return <CassetteCustomizerStudio initialPrice={12.90} />;
}
```

### Composants individuels

```typescript
import { Sidebar, RightPanel, BottomBar } from '@/components';

// Utiliser chaque composant indépendamment
```

## 📱 Styles Personnalisés

### Classes CSS Utilitaires

```css
/* Scrollbar caché */
.scrollbar-hide::-webkit-scrollbar { display: none; }

/* Gradient de fond */
.main-bg-gradient {
  background: radial-gradient(circle at center, #2e2844 0%, #1a1b26 100%);
}

/* État actif des nuances de couleur */
.color-swatch.active {
  box-shadow: 0 0 0 2px #1C1C24, 0 0 0 4px #E2E8F0;
}
```

## 🔗 Dépendances

- **React 18.3.1**: Framework UI
- **Lucide React 0.523**: Icônes
- **Tailwind CSS 4.1.10**: Styling
- **clsx/tailwind-merge**: Utilitaires CSS

## 📝 Pages

### StudioPage.tsx

Page dédiée au studio de customisation avec tous les contrôles intégrés.

```typescript
import StudioPage from '@/pages/StudioPage';

// Utilisation dans le routeur
<Route path="/studio" element={<StudioPage />} />
```

## 🚀 Fonctionnalités Implémentées

- ✅ Navigation par onglets
- ✅ Sélection de couleurs
- ✅ Sélection de texture
- ✅ Conception d'étiquettes
- ✅ Contrôles avancés (rotation, zoom, luminosité)
- ✅ Presets de design
- ✅ Export et partage
- ✅ Barre de prix et commande

## 🎯 Prochaines Étapes

1. **Intégration 3D**: Connecter les données au modèle Three.js existant
2. **Persistance**: Ajouter la sauvegarde des designs en base de données
3. **Partage**: Implémenter le système de lien de partage
4. **Animations**: Ajouter des transitions fluides
5. **Responsive**: Adapter pour mobile/tablette

## 📄 Architecture du Fichier

```
src/components/
├── CassetteCustomizerStudio.tsx (composant principal)
├── index.ts (exports)
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── BottomBar.tsx
├── customization/
│   ├── ColorSwatch.tsx
│   ├── TextureSelector.tsx
│   ├── LabelDesignSection.tsx
│   ├── AdvancedControls.tsx
│   ├── PresetsGrid.tsx
│   ├── ExportPanel.tsx
│   └── RightPanel.tsx
└── preview/
    └── CassettePreview.tsx
```

## 🔄 État et Props

Tous les composants utilisent une approche **controlled components** avec callbacks pour synchroniser l'état parent.

**Exemple:**
```typescript
const [selectedColor, setSelectedColor] = useState("#FEF3C7");

<ColorSwatch
  color="#FEF3C7"
  isActive={selectedColor === "#FEF3C7"}
  onClick={() => setSelectedColor("#FEF3C7")}
/>
```

---

**Version:** 1.0.0  
**Créé:** Mai 2026  
**Framework:** React + TypeScript + Tailwind CSS
