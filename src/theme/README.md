# Système de Thème

Ce projet utilise un système de thème personnalisé avec support automatique du thème clair/sombre basé sur les paramètres système de l'appareil.

## Structure

```
src/theme/
├── colors.ts          # Palettes de couleurs light/dark
├── typography.ts      # Tailles, poids et espacements de texte
├── spacing.ts         # Marges et espacements
├── ThemeContext.tsx   # Context React avec Appearance API
├── useTheme.ts        # Hook personnalisé
└── index.ts           # Point d'entrée
```

## Utilisation

### Dans un composant

```typescript
import { useTheme } from '../../theme';

export default function MyComponent() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
    },
  });

  return <View style={styles.container}>...</View>;
}
```

## Valeurs disponibles

### Couleurs (theme.colors)
- `background` : Fond principal
- `text` : Texte principal
- `textSecondary` : Texte secondaire
- `primary` : Couleur primaire
- `secondary` : Couleur secondaire

### Typographie (theme.typography)
- `sizes` : xs, sm, md, lg, xl, xxl
- `weights` : regular, medium, bold
- `letterSpacing` : tight, normal, wide

### Espacement (theme.spacing)
- xs, sm, md, lg, xl, xxl

## Fonctionnement

Le thème s'adapte automatiquement aux paramètres système de l'appareil :
- Mode clair (light) par défaut
- Mode sombre (dark) quand l'appareil est en mode sombre
- Mise à jour en temps réel lors du changement des paramètres système
