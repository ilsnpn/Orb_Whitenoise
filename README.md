# L’Orbe

Un fond sonore **génératif** qui tourne dans le navigateur (Web Audio), pour se concentrer,
se détendre ou s’apaiser. Une orbe de points suit le son. Noir et blanc, sans compte,
rien d’enregistré hors de l’appareil.

Projet open source : <https://github.com/ilsnpn/Orb_Whitenoise>

## Ce que ça fait
- **Parcours guidé** : un court questionnaire, des fiches « ce que dit la recherche, et ses
  limites » (sources citées), puis l’écoute.
- **Écoute** : trois ambiances (Concentration, Détente, Apaisement), un pad pour ajuster le son,
  une session Pomodoro, un mode « Suivre la journée » qui module le son selon l’heure.
- **Version maniaque** : tout se règle à la main (tempo, registre, dynamisme, brillance, couches).
- Installable sur téléphone (PWA), 100 % client, aucun serveur nécessaire.

## Lancer
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```
Next.js 15, React 19, TypeScript. Le son est synthétisé en direct (`lib/audio/`), jamais d’échantillons.

## Pages
- `/` — L’Orbe (parcours guidé, écoute, version maniaque).
- `/test` — ancienne page de réglages complète, gardée comme page de test.
- `/hairline` — une variante d’habillage.

## Structure
- `lib/audio/` — moteur génératif (nappe, mélodie, basse, pulsation, bruit), ambiances, courbe d’énergie de la journée.
- `lib/orb/engine/` — dessin de l’orbe (voir crédits).
- `lib/prelude/` — questionnaire, fiches, planning de la journée, pad.
- `app/(orbe)/` — l’interface.

## Crédits
Le dessin de l’orbe (`lib/orb/engine/`) vient de
[thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) de Jakub Antalik (licence MIT,
copiée dans le dossier), via le projet `ilsnpn/orb`.

## Ligne légale
Inspiré d’apps de paysages sonores, mais écrit de zéro : moteur et sons **originaux**.
Aucun asset, preset ni échantillon d’un tiers n’est réutilisé.
