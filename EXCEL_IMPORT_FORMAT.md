# Format Excel pour l'import d'élèves

## Structure du fichier

Votre fichier Excel (.xlsx ou .xls) doit avoir la structure suivante :

| Nom | Prénom | ID (optionnel) |
|-----|--------|----------------|
| DUPONT | Jean | STU-001 |
| MARTIN | Marie | STU-002 |
| BERNARD | Sophie | STU-003 |

## Instructions

1. **Première ligne** : En-têtes (Nom, Prénom, ID) - sera ignorée lors de l'import
2. **Colonnes** :
   - **Colonne A** : Nom de famille de l'élève
   - **Colonne B** : Prénom de l'élève
   - **Colonne C** : Identifiant de l'élève (optionnel, sera généré automatiquement si vide)

3. **Format** : 
   - Fichiers acceptés : `.xlsx`, `.xls`
   - Encodage : UTF-8 recommandé
   - Première feuille du classeur sera utilisée

## Exemple de données

```
DUPONT      Jean        STU-001
MARTIN      Marie       STU-002
BERNARD     Sophie      STU-003
LEFEBVRE    Pierre      STU-004
DUBOIS      Claire      STU-005
```

## Notes importantes

- Les lignes vides seront ignorées
- Si l'ID n'est pas fourni, un identifiant unique sera généré automatiquement
- Seules les lignes avec au moins un nom ET un prénom seront importées
- La première ligne (en-têtes) est automatiquement ignorée

## Téléchargement du modèle

Un fichier Excel modèle est disponible dans le dossier `public/templates/` de l'application.
