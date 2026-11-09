// Fiches pédagogiques sourcées de la v2 « Prélude ».
// Chaque source pointe vers l'étude originale (DOI ou PMC), vérifiée à la rédaction.
// Aucune de ces études n'a testé cette app : les fiches décrivent la recherche, pas l'app.
import type { Card, CardId } from './types';

export const CARDS: Record<CardId, Card> = {
  'open-space-noise': {
    id: 'open-space-noise',
    kicker: 'CE QUE DIT LA RECHERCHE',
    title: 'Pourquoi les conversations gênent autant',
    body: [
      'Les psychologues parlent d’« effet de la parole non pertinente » : des voix qu’on n’écoute pas peuvent quand même perturber une tâche qui demande de retenir ou de lire. Votre cerveau a du mal à ignorer la parole.',
      'Une étude a observé que le bruit de bureau avec des voix gênait la mémoire d’un texte et le calcul mental, même quand les paroles n’avaient pas de sens. Le bruit de bureau sans voix gênait surtout le calcul.',
      'Une autre, en open space simulé, a associé un niveau sonore plus élevé à plus de fatigue et moins de motivation. D’où l’idée, à tester pour vous : un fond stable rend peut-être les variations autour de vous moins saillantes.',
    ],
    limits:
      'Ces études ont été menées en laboratoire, souvent avec des étudiants, sur des tâches précises. Elles n’ont pas testé cette app, ni dit qu’un fond sonore suffit à effacer la gêne.',
    sources: [
      {
        label: 'Banbury et Berry, 1998 — British Journal of Psychology',
        url: 'https://doi.org/10.1111/j.2044-8295.1998.tb02699.x',
      },
      {
        label: 'Jahncke et al., 2011 — Journal of Environmental Psychology',
        url: 'https://doi.org/10.1016/j.jenvp.2011.07.002',
      },
    ],
  },

  'steady-rhythm': {
    id: 'steady-rhythm',
    kicker: 'CE QUE DIT LA RECHERCHE',
    title: 'Un fond sonore et l’attention',
    body: [
      'Garder son attention sur une tâche répétitive, c’est dur : l’esprit vagabonde. Des recherches explorent si un fond sonore aide à rester sur la tâche.',
      'Une étude a fait faire à 40 étudiants une tâche de vigilance, en silence puis avec leur musique préférée. Avec la musique, ils se disaient plus souvent concentrés et moins souvent « ailleurs ».',
      'Mais leurs temps de réaction n’étaient pas nettement meilleurs. Le ressenti de concentration et la performance mesurée ne vont donc pas toujours ensemble.',
    ],
    limits:
      'L’étude portait sur la musique choisie par chacun, sur une tâche simple, pas sur un son génératif comme celui-ci. Elle n’a pas testé cette app. Ce qui marche pour l’un peut distraire l’autre.',
    sources: [
      {
        label: 'Kiss et Linnell, 2021 — Psychological Research',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8357712/',
      },
    ],
  },

  pomodoro: {
    id: 'pomodoro',
    kicker: 'UNE MÉTHODE',
    title: 'La méthode Pomodoro',
    body: [
      'Imaginée par Francesco Cirillo à la fin des années 1980, c’est une méthode d’organisation : vous travaillez par blocs d’environ 25 minutes, puis vous faites une courte pause, et vous recommencez.',
      'Une étude a comparé des étudiants qui faisaient des pauses fixes (24 min de travail, 6 min de pause) à d’autres qui choisissaient leurs pauses. Les pauses fixes allaient avec moins de fatigue, pour un travail accompli similaire.',
      'Vous pouvez l’essayer avec le son en fond : lancez une séance, travaillez un bloc, puis soufflez. Voyez si ce rythme vous convient.',
    ],
    limits:
      'Pomodoro est une méthode, pas un résultat scientifique. L’étude citée portait sur des étudiants, pendant une seule journée, sans son de fond. Rien ne dit que la combinaison avec cette app aide.',
    sources: [
      {
        label: 'Biwer et al., 2023 — British Journal of Educational Psychology',
        url: 'https://doi.org/10.1111/bjep.12593',
      },
    ],
  },

  adhd: {
    id: 'adhd',
    kicker: 'À SAVOIR',
    title: 'Le TDA/H, en quelques mots',
    body: [
      'Le TDA/H est un trouble du neurodéveloppement. Il touche l’attention, l’impulsivité et parfois l’agitation, à des degrés très variables selon les personnes. Ce n’est ni un manque de volonté, ni un défaut de caractère.',
      'Des chercheurs se demandent si un bruit de fond peut aider. Une étude chez 104 enfants d’âge préscolaire a observé qu’avec un bruit blanc, ceux ayant un TDA/H réussissaient mieux un test d’attention et bougeaient moins.',
      'Chez les enfants sans TDA/H, le même bruit blanc n’aidait pas et semblait même les gêner. Un même son peut donc avoir des effets opposés selon la personne.',
    ],
    limits:
      'Une seule étude, chez de jeunes enfants, en laboratoire : on ne peut pas en tirer de conclusion pour les adultes au travail. Cette app n’est pas un traitement et n’a pas été testée dans cette étude.',
    sources: [
      {
        label: 'Lin, 2022 — International Journal of Environmental Research and Public Health',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9692615/',
      },
    ],
    care:
      'Seul un professionnel de santé peut poser un diagnostic de TDA/H. Si vous vous reconnaissez dans ces lignes, parlez-en à votre médecin.',
  },

  'music-stress': {
    id: 'music-stress',
    kicker: 'CE QUE DIT LA RECHERCHE',
    title: 'La musique et la réponse au stress',
    body: [
      'Une étude a demandé à 87 étudiants de préparer un exposé oral, en silence ou avec une musique calme. Avec la musique, l’anxiété, le rythme cardiaque et la tension n’ont pas augmenté comme chez ceux en silence.',
      'Une autre étude, chez 60 femmes, donne une image plus nuancée. Avant un stress, la musique douce a aidé certains marqueurs à revenir plus vite à la normale. Mais c’est le son d’eau qui allait avec le cortisol le plus bas.',
      'Bref : des recherches suggèrent que le son peut moduler la réponse au stress, mais les effets varient selon le son, la personne et ce qu’on mesure.',
    ],
    limits:
      'Petits groupes d’étudiants ou de jeunes femmes, en laboratoire, avec des morceaux précis. Ces études n’ont pas testé cette app, et la musique n’y remplace pas une prise en charge du stress.',
    sources: [
      {
        label: 'Knight et Rickard, 2001 — Journal of Music Therapy',
        url: 'https://doi.org/10.1093/jmt/38.4.254',
      },
      {
        label: 'Thoma et al., 2013 — PLOS ONE',
        url: 'https://doi.org/10.1371/journal.pone.0070156',
      },
    ],
  },

  'restorative-sound': {
    id: 'restorative-sound',
    kicker: 'CE QUE DIT LA RECHERCHE',
    title: 'Des sons qui aident à souffler',
    body: [
      'Les chercheurs parlent d’environnements « restaurateurs » : des lieux qui aident à récupérer quand l’attention est fatiguée. Certains sons pourraient jouer ce rôle.',
      'Une étude au Japon a fait écouter 60 secondes de sons de forêt ou de ville à 29 étudiantes. Avec la forêt, le cœur battait un peu moins vite et elles se sentaient plus détendues.',
      'Une autre a observé que les réactions du corps dépendaient aussi du ressenti : un son jugé agréable n’agit pas comme un son jugé désagréable. Ce qui vous détend, vous, compte.',
    ],
    limits:
      'Écoutes courtes, petits groupes de jeunes adultes, en laboratoire. Ces études n’ont pas testé cette app ni un usage au bureau sur la durée.',
    sources: [
      {
        label: 'Jo et al., 2019 — International Journal of Environmental Research and Public Health',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6695879/',
      },
      {
        label: 'Medvedev et al., 2015 — Applied Acoustics',
        url: 'https://doi.org/10.1016/j.apacoust.2015.03.004',
      },
    ],
  },

  'nature-recovery': {
    id: 'nature-recovery',
    kicker: 'CE QUE DIT LA RECHERCHE',
    title: 'Les sons de nature après un stress',
    body: [
      'Une étude suédoise a stressé 40 étudiants avec du calcul mental chronométré. Ensuite, ils écoutaient soit des sons de nature (fontaine, oiseaux), soit du bruit de circulation, soit un fond calme.',
      'Un indicateur de l’activation du corps, la conductance de la peau, tendait à redescendre plus vite avec les sons de nature. La différence n’était nette que face au bruit de circulation fort.',
      'Un autre indicateur, lié au repos du cœur, n’a pas montré d’effet. Les auteurs restent prudents : la nature pourrait faciliter la récupération, sans plus.',
    ],
    limits:
      'Une petite étude, avec quelques sons et des écoutes de 4 minutes. Elle n’a pas testé cette app. Les sons de nature ne remplacent pas une vraie pause.',
    sources: [
      {
        label: 'Alvarsson et al., 2010 — International Journal of Environmental Research and Public Health',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2872309/',
      },
    ],
  },

  masking: {
    id: 'masking',
    kicker: 'À SAVOIR',
    title: 'Masquer plutôt que couvrir',
    body: [
      'Ce qui gêne dans une conversation voisine, c’est surtout qu’on la comprend. Des travaux sur les bureaux montrent que la gêne dépend plus de l’intelligibilité de la parole que de son volume.',
      'Un bruit de fond continu et doux (type bruit rose ou large bande) rend les mots voisins moins intelligibles. Une revue d’études de laboratoire relie cette baisse à de meilleurs résultats, surtout pour retenir des mots.',
      'Une étude a comparé cinq sons de masquage : un son d’eau a été le mieux accueilli, la musique chantée gênait autant que la parole. Gardez un volume modéré : le but est d’estomper, pas de couvrir.',
    ],
    limits:
      'Le masquage réduit la gêne, il ne la supprime pas. Ces études ont été faites en laboratoire avec des sons de masquage précis, pas avec cette app. Un volume trop fort fatigue à son tour.',
    sources: [
      {
        label: 'Haapakangas et al., 2020 — Indoor Air',
        url: 'https://doi.org/10.1111/ina.12726',
      },
      {
        label: 'Haapakangas et al., 2011 — Acta Acustica united with Acustica',
        url: 'https://doi.org/10.3813/AAA.918444',
      },
      {
        label: 'Hongisto, 2005 — Indoor Air',
        url: 'https://doi.org/10.1111/j.1600-0668.2005.00391.x',
      },
    ],
  },
};
