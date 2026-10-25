import React, { useState, useMemo, useEffect, useRef } from "react";
import { Zap, Brain, Flame, HeartPulse, Gamepad2, Crosshair, Swords, Skull, Trophy, ChevronRight, Sparkles, BookOpen, Shield, Landmark, Lock, ChevronLeft, Globe, Star, Layers, Repeat2, Award, Users, Volume2, VolumeX, TrendingUp, TrendingDown } from "lucide-react";
import * as Tone from "tone";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


/* ---------------------------------------------------------
   CLIP-PATH "HUD" — coins coupés façon overlay de diffusion e-sport
--------------------------------------------------------- */
const CLIP =
  "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

// Deuxième forme, réservée aux éléments ACTIONNABLES (boutons, CTA) — un parallélogramme
// incliné façon graphisme de diffusion (VCT/LEC), pour créer une vraie hiérarchie de formes
// au lieu d'utiliser le même panneau à coins coupés pour absolument tout.
const CLIP_SLANT = "polygon(5% 0, 100% 0, 95% 100%, 0% 100%)";

// Petit tick coloré utilisé devant les labels façon "bandeau de diffusion", plutôt que du
// texte en majuscules tout nu.
function TickLabel({ children, color = "#C8A24B", className = "", style = {} }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} style={style}>
      <span className="inline-block w-[3px] h-[11px] shrink-0" style={{ background: color }} />
      <span>{children}</span>
    </div>
  );
}

// Fondu léger à chaque changement d'écran majeur (accueil, sélection, fin, profil...), pour
// éviter le changement sec. Garde une clé stable pendant les changements internes à un même
// écran (ex: les tours de jeu dans GameScreen) puisqu'on ne rejoue la transition que lorsque
// `screenKey` change réellement.
function ScreenFade({ screenKey, children }) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    // Le bouton qui vient de déclencher ce changement d'écran disparaît avec l'ancien écran,
    // et le navigateur renvoie sinon le focus tout en haut de la page. On le récupère ici pour
    // que la touche Tab suivante enchaîne directement sur le contenu du nouvel écran.
    containerRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, [screenKey]);
  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="flex-1 min-h-0 flex flex-col outline-none"
      style={{
        opacity: ready ? 1 : 0,
        transform: ready ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      {children}
    </div>
  );
}

function HudPanel({ children, accent = "#363A44", className = "", style = {} }) {
  return (
    <div style={{ clipPath: CLIP, background: accent, padding: 1, ...style }} className={className}>
      <div style={{ clipPath: CLIP }} className="h-full w-full bg-[#23262D]">
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   LOGO — 5 silhouettes, le prodige au centre se détache du rang
--------------------------------------------------------- */
function TeamMark({ size = 40, mono = false, accent = "#C8A24B", className = "" }) {
  const SLATE = "#4A4E59";
  const ACCENT = accent;
  const colors = mono ? [SLATE, SLATE, SLATE, SLATE, SLATE] : [SLATE, SLATE, ACCENT, SLATE, SLATE];
  const offsets = [-60, -30, 0, 30, 60];
  const bg = "#1B1D22";
  return (
    <svg
      viewBox="-85 -6 170 82"
      width={size}
      height={size * (82 / 170)}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {offsets.map((x, i) => (
        <g key={i} transform={`translate(${x},0)`}>
          <path
            d="M -15 24 C -15 16.5, -9 11, 0 11 C 9 11, 15 16.5, 15 24 L 17.5 70 L -17.5 70 Z"
            fill={colors[i]}
            stroke={bg}
            strokeWidth="1.6"
          />
          <circle cx="0" cy="7" r="9" fill={colors[i]} stroke={bg} strokeWidth="1.6" />
        </g>
      ))}
    </svg>
  );
}

// Illustration custom pour l'écran d'accueil — un blason façon médaille de championnat,
// avec rayons tournants et halo pulsant, au lieu du logo seul et statique.
function HeroCrest({ size = 180, accent = "#C8A24B" }) {
  const rays = Array.from({ length: 16 });
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute crest-ring" viewBox="0 0 200 200" width={size} height={size}>
        {rays.map((_, i) => {
          const angle = (i * Math.PI * 2) / rays.length;
          return (
            <line
              key={i}
              x1="100"
              y1="100"
              x2={100 + 95 * Math.cos(angle)}
              y2={100 + 95 * Math.sin(angle)}
              stroke={accent}
              strokeWidth={i % 2 === 0 ? 1.5 : 0.75}
              opacity={i % 2 === 0 ? 0.18 : 0.08}
            />
          );
        })}
      </svg>
      <div
        className="absolute crest-glow rounded-full pointer-events-none"
        style={{ width: size * 0.75, height: size * 0.75, background: `radial-gradient(circle, ${accent}59, transparent 70%)` }}
      />
      <svg className="absolute" viewBox="0 0 200 200" width={size} height={size}>
        <circle cx="100" cy="100" r="88" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#4A4E59" strokeWidth="1" opacity="0.5" />
      </svg>
      <TeamMark size={size * 0.5} accent={accent} />
    </div>
  );
}

/* ---------------------------------------------------------
   NAVIGATION PERSISTANTE — écrans "site" (hors partie en cours)
--------------------------------------------------------- */
function TopNav({ current, onHome, onProfile, soundOn, onToggleSound }) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#363A44] bg-[#202329] shrink-0">
      <button onClick={onHome} className="flex items-center gap-2.5 group">
        <TeamMark size={30} />
        <span
          className="text-lg tracking-wide group-hover:opacity-80 transition-opacity"
          style={{ fontFamily: "'Oswald', sans-serif", color: "#DCDEE3" }}
        >
          PRODIGE<span style={{ color: "#C8A24B" }}>.GG</span>
        </span>
      </button>
      <div
        className="flex items-center gap-5 text-[11px] uppercase tracking-widest"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <button
          onClick={onHome}
          className="transition-colors"
          style={{ color: current === "home" ? "#C8A24B" : "#9A9DA8" }}
        >
          Nouvelle carrière
        </button>
        <button
          onClick={onProfile}
          className="transition-colors"
          style={{ color: current === "profile" ? "#C8A24B" : "#9A9DA8" }}
        >
          Profil
        </button>
        <button onClick={onToggleSound} className="transition-colors" style={{ color: "#9A9DA8" }} title={soundOn ? "Couper le son" : "Activer le son"}>
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   DONNÉES DE JEU
--------------------------------------------------------- */
const DISCIPLINES = [
  {
    id: "moba",
    label: "MOBA",
    sub: "League of Legends, Dota 2 — macro, drafts, objectifs",
    icon: Swords,
    color: "#C8A24B",
    active: true,
  },
  {
    id: "fps",
    label: "FPS Tactique",
    sub: "CS2, Valorant, Call of Duty — précision, sang-froid",
    icon: Crosshair,
    color: "#D9757F",
    active: true,
  },
  {
    id: "br",
    label: "Battle Royale",
    sub: "Fortnite, Apex Legends — survie, clutchs",
    icon: Gamepad2,
    color: "#D9924A",
    active: true,
  },
  {
    id: "fight",
    label: "Versus Fighting",
    sub: "Street Fighter 6, Tekken 8 — exécution, mental de fer",
    icon: Skull,
    color: "#A99BD9",
    active: true,
  },
];

// Vrais jeux esport rattachés à chaque discipline — chacun avec ses événements et tournois propres
const GAMES = {
  moba: [
    {
      id: "lol",
      label: "League of Legends",
      sub: "Le MOBA historique — draft, macro, objectifs de map",
      color: "#C8A24B",
    },
    {
      id: "dota2",
      label: "Dota 2",
      sub: "MOBA exigeant — le plus gros prize pool de l'esport",
      color: "#6FC4D9",
    },
  ],
  fps: [
    {
      id: "cs2",
      label: "Counter-Strike 2",
      sub: "Le FPS tactique fondateur — éco, exécutions, sang-froid",
      color: "#E3966B",
    },
    {
      id: "valorant",
      label: "Valorant",
      sub: "FPS héros — ultimates, utilitaires, rotations",
      color: "#D9757F",
    },
    {
      id: "cod",
      label: "Call of Duty",
      sub: "FPS rapide — respawns, objectifs, rythme effréné",
      color: "#E0C27A",
    },
    {
      id: "r6",
      label: "Rainbow Six Siege",
      sub: "FPS tactique à un vie — stratégie, destruction, lecture d'adversaire",
      color: "#4A4E59",
    },
  ],
  br: [
    {
      id: "fortnite",
      label: "Fortnite",
      sub: "Battle royale à building — créativité et réflexes",
      color: "#D9924A",
    },
    {
      id: "apex",
      label: "Apex Legends",
      sub: "Battle royale en équipe — légendes et mouvement",
      color: "#D9A06B",
    },
  ],
  fight: [
    {
      id: "sf6",
      label: "Street Fighter 6",
      sub: "1v1 — exécution frame-parfaite",
      color: "#A99BD9",
    },
    {
      id: "tekken8",
      label: "Tekken 8",
      sub: "1v1 — juggles et lecture d'adversaire",
      color: "#9884C4",
    },
  ],
};

// Rôles en jeu — pilote sur CS2 et LoL. Un jeu absent de cet objet n'affiche
// simplement pas d'étape de sélection de rôle (rétrocompatible avec les autres jeux).
const ROLES = {
  cs2: [
    {
      id: "igl",
      label: "In-Game Leader",
      desc: "Le cerveau tactique — calls, lecture du jeu, gestion de l'économie.",
      color: "#D9924A",
    },
    {
      id: "awper",
      label: "AWPer",
      desc: "Le sniper de l'équipe — impact individuel énorme, sous pression constante.",
      color: "#D9757F",
    },
    {
      id: "rifler",
      label: "Rifler / Entry",
      desc: "Le premier au contact — ouvre les duels, prend les risques calculés.",
      color: "#C8A24B",
    },
  ],
  dota2: [
    {
      id: "carry",
      label: "Carry (Pos 1)",
      desc: "Le finisher — farme tôt, écrase tard en late game.",
      color: "#C8A24B",
    },
    {
      id: "mid",
      label: "Mid (Pos 2)",
      desc: "Le laner solo — impose le tempo de toute la partie.",
      color: "#D9757F",
    },
    {
      id: "offlane",
      label: "Offlane (Pos 3)",
      desc: "Le pilier défensif — initie les fights, absorbe les dégâts.",
      color: "#D9924A",
    },
    {
      id: "support4",
      label: "Soft Support (Pos 4)",
      desc: "Le roameur — présence agressive dès les premières minutes.",
      color: "#A99BD9",
    },
    {
      id: "support5",
      label: "Hard Support (Pos 5)",
      desc: "Le sacrifié — wards, sauvetages, zéro farm pour lui-même.",
      color: "#9A9DA8",
    },
  ],
  lol: [
    {
      id: "top",
      label: "Top Laner",
      desc: "Le duelliste isolé — autonomie totale, loin du reste de la carte.",
      color: "#E3966B",
    },
    {
      id: "jungle",
      label: "Jungler",
      desc: "Le chef d'orchestre invisible — objectifs, ganks, rythme de la partie.",
      color: "#C8A24B",
    },
    {
      id: "mid",
      label: "Mid Laner",
      desc: "Le carry central — impact sur toute la carte, sous les projecteurs.",
      color: "#A99BD9",
    },
    {
      id: "adc",
      label: "ADC",
      desc: "Le dégât principal en fin de partie — fragile tôt, décisif tard.",
      color: "#D9924A",
    },
    {
      id: "support",
      label: "Support",
      desc: "Le protecteur — vision et sacrifice, des décisions qui ne se voient pas au score.",
      color: "#6FC4D9",
    },
  ],
  valorant: [
    {
      id: "duelist",
      label: "Duelist",
      desc: "Le premier au contact — crée l'espace et prend les duels pour l'équipe.",
      color: "#D9757F",
    },
    {
      id: "controller",
      label: "Controller",
      desc: "Le maître du tempo — fumigènes et contrôle de zone, jamais dans la lumière.",
      color: "#9A9DA8",
    },
    {
      id: "initiator",
      label: "Initiator",
      desc: "L'ouvreur de brèches — flashs et informations avant chaque assaut.",
      color: "#D9924A",
    },
    {
      id: "sentinel",
      label: "Sentinel",
      desc: "Le verrou défensif — sécurise les flancs, dernier rempart de l'équipe.",
      color: "#6FC4D9",
    },
  ],
  cod: [
    {
      id: "ar",
      label: "AR (Assault Rifle)",
      desc: "Le pilier polyvalent — impact à toutes les distances, présent sur chaque round.",
      color: "#E0C27A",
    },
    {
      id: "slayer",
      label: "Slayer (SMG)",
      desc: "Le tueur au corps-à-corps — vitesse et agressivité en espace confiné.",
      color: "#D9757F",
    },
    {
      id: "support",
      label: "Support",
      desc: "Le fournisseur d'utilitaire — ouvre l'espace pour que les autres puissent frapper.",
      color: "#6FC4D9",
    },
    {
      id: "flex",
      label: "Flex",
      desc: "Le couteau suisse — s'adapte à toutes les situations, souvent sacrifié tactiquement.",
      color: "#A99BD9",
    },
  ],
};

// Certains jeux ont une vraie séparation vérifiée entre le palier amateur et le palier pro
// (LoL : LFL -> LEC/LCK/LPL/LCS ; COD : Challengers -> CDL). Pour les autres, faute d'un
// palier amateur suffisamment fiable à confirmer, "early" reprend une partie de "top" :
// on préfère rester honnête plutôt que d'inventer des noms de clubs amateurs.
const TEAMS = {
  lol: {
    early: ["Solary", "GameWard", "BK ROG Esports", "Karmine Corp Blue", "Vitality.Bee", "Team BDS Academy", "Galions"],
    top: ["G2 Esports", "Fnatic", "Karmine Corp", "Movistar KOI", "Team Vitality", "T1", "Gen.G", "JD Gaming", "Cloud9", "100 Thieves"],
  },
  dota2: {
    early: ["Team Spirit", "OG", "Team Liquid", "PSG.LGD"],
    top: ["Team Spirit", "OG", "Team Liquid", "PSG.LGD", "Team Secret", "Evil Geniuses", "Tundra Esports", "Gaimin Gladiators"],
  },
  cs2: {
    early: ["FaZe Clan", "Natus Vincere", "Team Vitality", "G2 Esports", "Karmine Corp"],
    top: ["FaZe Clan", "Natus Vincere", "Team Vitality", "G2 Esports", "Karmine Corp", "MOUZ", "Astralis", "Complexity", "Gentle Mates"],
  },
  valorant: {
    early: ["Sentinels", "Karmine Corp", "DRX", "Fnatic", "Team Liquid"],
    top: ["Sentinels", "Karmine Corp", "DRX", "Fnatic", "Team Liquid", "Gentle Mates", "Team Heretics", "LOUD", "Paper Rex", "NRG"],
  },
  cod: {
    early: ["OMiT Esports", "Clutch Rayn Esports", "Project 7 Esports", "Team WaR", "Team Orchid", "Exposure Gaming"],
    top: ["OpTic Texas", "FaZe Clan", "100 Thieves", "Cloud9", "G2 Esports", "Team Heretics", "Paris Gentle Mates", "Team Falcons", "Movistar KOI", "Vancouver Surge", "Boston Breach", "Carolina Royal Ravens"],
  },
  fortnite: {
    early: ["FaZe Clan", "TSM", "NRG"],
    top: ["FaZe Clan", "TSM", "NRG", "Team Liquid", "Sentinels", "100 Thieves", "Complexity"],
  },
  apex: {
    early: ["TSM", "NRG", "Alliance"],
    top: ["TSM", "NRG", "Alliance", "Team Liquid", "FaZe Clan", "Complexity", "DarkZero Esports"],
  },
  sf6: {
    early: ["Evil Geniuses", "FaZe Clan", "Team Liquid", "BMS Esports"],
    top: ["Evil Geniuses", "FaZe Clan", "Team Liquid", "Crazy Raccoon", "REJECT", "Fnatic", "BMS Esports"],
  },
  tekken8: {
    early: ["Evil Geniuses", "Fnatic", "Team Liquid", "BMS Esports"],
    top: ["Evil Geniuses", "Fnatic", "Team Liquid", "Crazy Raccoon", "REJECT", "BMS Esports"],
  },
  r6: {
    early: ["Wildcard", "Weibo Gaming", "CAG Osaka", "ENTERPRISE Esports"],
    top: ["FaZe Clan", "Team Secret", "G2 Esports", "Ninjas in Pyjamas", "DarkZero Esports", "Elevate", "Team Falcons", "Fluxo W7M", "Team Liquid", "Fnatic"],
  },
};

// Rival fictif (le joueur incarné restant fictif, son rival l'est aussi) tiré au sort à chaque carrière
// Pseudos de rival — volontairement inventés (voir décision produit : jamais de vrai joueur
// identifiable), mais stylisés comme de vrais pseudos esport : courts, punchy, parfois avec une
// touche de leetspeak, pour avoir le même impact qu'un vrai nom de pro sans en être un.
const RIVAL_NAMES = [
  "Kaze", "Nyxeon", "ShadowVolt", "Lumen", "Vex", "Ashèn", "Ryzen", "Ocelune", "Frostbyte", "Halcyon",
  "Zeyphr", "Vantyx", "Draxe", "Skarnn", "Wraithe", "Fyren", "R0gueX", "m0dus", "Kroon", "Nytro",
  "rusvi", "Mackzie", "Craki",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Sons légers, synthétisés à la volée (aucun fichier audio à charger) ---------------------
// Coupé par défaut tant que l'utilisateur n'a pas explicitement choisi d'activer le son (aucun
// navigateur n'autorise l'audio avant un premier geste, et beaucoup de joueurs préfèrent le
// silence) ; le choix est mémorisé. Les synthés sont créés une seule fois, à la demande.
let soundMuted = true;
let soundReady = false;
let reverb, clickSynth, fanfareSynth;

function initSynths() {
  if (soundReady) return;
  soundReady = true;

  // Réverbération partagée — donne une texture ample et feutrée plutôt que des notes de jeu
  // vidéo sèches. Tout passe par elle.
  reverb = new Tone.Reverb({ decay: 3.2, wet: 0.35 }).toDestination();

  // Clic : un souffle filtré très bref, sans hauteur de note perceptible — une texture, pas
  // une mélodie. Aucune association possible avec un bruitage de jeu.
  clickSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.035, sustain: 0 },
  });
  const clickFilter = new Tone.Filter({ frequency: 1200, type: "lowpass", rolloff: -24 }).connect(reverb);
  clickSynth.connect(clickFilter);
  clickSynth.volume.value = -28;

  // Fin légendaire : un accord chaud qui monte lentement, façon nappe orchestrale, plutôt
  // qu'une fanfare rythmée de victoire.
  fanfareSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 1.2, decay: 0.8, sustain: 0.4, release: 3 },
  }).connect(reverb);
  fanfareSynth.volume.value = -14;
}

async function unlockAudio() {
  try {
    await Tone.start();
    initSynths();
  } catch {
    // le navigateur a refusé (pas encore de geste utilisateur, contexte non supporté...) —
    // on échoue silencieusement, ce n'est que du confort sonore.
  }
}

function setSoundMuted(v) {
  soundMuted = v;
}

async function playClick() {
  if (soundMuted) return;
  await unlockAudio();
  try {
    clickSynth?.triggerAttackRelease("16n");
  } catch {}
}

async function playFanfare() {
  if (soundMuted) return;
  await unlockAudio();
  try {
    fanfareSynth?.triggerAttackRelease(["C3", "G3", "C4", "E4"], "2n");
  } catch {}
}

function formatText(str, vars) {
  if (!str) return str;
  let out = str;
  Object.entries(vars).forEach(([key, val]) => {
    out = out.split(`{${key}}`).join(val);
  });
  return out;
}

// --- Système de rejouabilité ---------------------------------------------
// Chaque carrière tire une "graine" ; à graine égale, le mélange est toujours identique
// (pas de reshuffle surprise en cours de partie), mais deux carrières différentes
// n'auront presque jamais le même déroulé.

// RNG déterministe à graine (mulberry32)
function makeRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fusionne une liste à ordre FIXE (la progression sportive d'un jeu) avec une liste
// mélangée (les événements "vie de joueur"), en préservant l'ordre interne de la liste fixe.
function randomMerge(fixedList, shuffledList, rng) {
  let i = 0,
    j = 0;
  const result = [];
  while (i < fixedList.length || j < shuffledList.length) {
    if (i >= fixedList.length) {
      result.push(shuffledList[j++]);
      continue;
    }
    if (j >= shuffledList.length) {
      result.push(fixedList[i++]);
      continue;
    }
    const remA = fixedList.length - i;
    const remB = shuffledList.length - j;
    if (rng() < remA / (remA + remB)) result.push(fixedList[i++]);
    else result.push(shuffledList[j++]);
  }
  return result;
}

function bucketThirds(list) {
  const n = list.length;
  const t1 = Math.ceil(n / 3);
  const t2 = Math.ceil((2 * n) / 3);
  return [list.slice(0, t1), list.slice(t1, t2), list.slice(t2)];
}

// Certains événements "vie de joueur" doivent rester dans le bon acte quoi qu'il arrive :
// une conséquence (canal carpien, rechute, enquête) ne peut jamais être tirée avant
// l'événement qui la déclenche (poignet, psy, accusation, école).
function forcedTier(e) {
  if (e.requiresFlag) return 2; // conséquence -> toujours dans le dernier acte
  if (e.choices && e.choices.some((c) => c.flag && c.flag.name === "schoolPath")) return 0;
  if (e.choices && e.choices.some((c) => c.flag)) return 1; // déclencheur -> jamais dans le dernier acte
  // Les mercatos (early/top) n'ont pas toujours de flag mais doivent quand même arriver après
  // les événements de repérage de chaque jeu (FACEIT, Ranked, Solo Queue...) — sans ça, le
  // mélange pouvait placer "on te propose un contrat" avant même d'avoir été repéré.
  if (e.dynamic === "team_early" || e.dynamic === "team_top") return 1;
  return null;
}

// Construit, pour une discipline/jeu/background donnés, l'ordre complet des événements
// pour CETTE carrière (déterministe pour une graine donnée).
// Probabilité qu'un événement marqué "optional" apparaisse dans une carrière donnée.
// Avec ~6 événements optionnels, la plupart des carrières en sautent 1 ou 2 — assez pour
// qu'elles ne se ressemblent jamais tout à fait, sans jamais casser un enchaînement obligatoire.
const OPTIONAL_INCLUDE_CHANCE = 0.8;

function buildEventSequence(discipline, game, role, background, seed) {
  const rng = makeRng(seed);
  const base = EVENTS.filter(
    (e) =>
      (e.discipline === "all" || (e.discipline === discipline && (!e.game || e.game === game))) &&
      (!e.role || e.role === role) &&
      (!e.background || e.background === background) &&
      (!e.optional || rng() < OPTIONAL_INCLUDE_CHANCE)
  );

  const pinnedFirstCandidates = base.filter((e) => e.pin === "first");
  const pinnedFirst = pinnedFirstCandidates.length
    ? [pinnedFirstCandidates[Math.floor(rng() * pinnedFirstCandidates.length)]]
    : [];
  const pinnedLast = base.filter((e) => e.pin === "last");
  const rest = base.filter((e) => !e.pin);

  // La progression sportive (spine) garde un ordre fixe ; les événements liés à un rôle
  // sont des moments de "vie de joueur" comme les autres -> ils rejoignent le pool mélangé.
  const gameList = rest.filter((e) => e.game && !e.role); // progression sportive, ordre jamais mélangé
  const allList = rest.filter((e) => !e.game || e.role); // événements "vie de joueur" (dont ceux liés au rôle), à répartir/mélanger

  const forcedPools = [[], [], []];
  const natural = [];
  allList.forEach((e) => {
    const t = forcedTier(e);
    if (t !== null) forcedPools[t].push(e);
    else natural.push(e);
  });
  const naturalBuckets = bucketThirds(natural);
  const allBuckets = [0, 1, 2].map((t) => [...forcedPools[t], ...naturalBuckets[t]]);
  const gameBuckets = bucketThirds(gameList);

  const acts = [0, 1, 2].map((t) => randomMerge(gameBuckets[t], seededShuffle(allBuckets[t], rng), rng));

  return [...pinnedFirst, ...acts[0], ...acts[1], ...acts[2], ...pinnedLast];
}


// Ligues et circuits régionaux réels, par jeu — utilisés pour les événements de montée en division
const LEAGUES = {
  lol: ["LCK", "LEC", "LCS", "LPL"],
  dota2: ["DPC Europe de l'Est", "DPC Amérique du Sud", "DPC Chine", "DPC Asie du Sud-Est"],
  cs2: ["ESL Pro League", "BLAST Premier"],
  valorant: ["VCT Americas", "VCT EMEA", "VCT Pacific", "VCT China"],
  fortnite: ["NAC", "EU", "OCE"],
  apex: ["North America", "EMEA", "APAC Sud"],
  sf6: ["Frosty Faustings", "CEO"],
  tekken8: ["Rev Major", "CEO"],
  r6: ["North America League", "EMEA League", "APAC League", "South America League"],
};

// Villes hôtes possibles pour les grands rendez-vous (Majors, Finales mondiales...) — pour que
// deux carrières, même sur le même jeu, ne se jouent jamais dans la même salle devant le même public.
const CITIES = [
  "Paris", "Cologne", "Rio de Janeiro", "Los Angeles", "Katowice", "Séoul",
  "Stockholm", "Arlington", "Sydney", "Singapour", "Shanghai", "Copenhague",
];

// Second arc narratif : un binôme de tes débuts qui finit par rejoindre le camp adverse
const ALLY_NAMES = ["Solene", "Marek", "Ilan", "Yuki", "Tobias", "Nadia", "Coen", "Amara", "rusvi", "Mackzie", "Craki"];

// Profil de croissance — tiré au sort à chaque carrière (façon "type" de Destiny Eleven).
// À choix identiques, deux carrières ne donnent jamais exactement le même résultat.
const GROWTH_PROFILES = [
  {
    id: "mecanique",
    label: "Machine à mécaniques",
    desc: "Progresse plus vite en Mécaniques, mais reste plus fragile mentalement.",
    multipliers: { skill: 1.3, mental: 0.8, reputation: 1, health: 1 },
  },
  {
    id: "mental",
    label: "Bête de mental",
    desc: "Gère la pression hors norme, mais stagne un peu plus en Mécaniques.",
    multipliers: { skill: 0.8, mental: 1.3, reputation: 1, health: 1 },
  },
  {
    id: "reputation",
    label: "Bête médiatique",
    desc: "Construit sa Réputation à vitesse folle, au prix de sa Santé.",
    multipliers: { skill: 1, mental: 1, reputation: 1.3, health: 0.8 },
  },
  {
    id: "sante",
    label: "Corps de fer",
    desc: "Une Santé de fer, mais une image publique plus difficile à construire.",
    multipliers: { skill: 1, mental: 1, reputation: 0.8, health: 1.3 },
  },
];

// Badges d'équipe — un simple monogramme coloré (pas de vrais logos) pour représenter chaque organisation
const TEAM_META = {
  "G2 Esports": { short: "G2", color: "#000000" },
  "Fnatic": { short: "FNC", color: "#FF5900" },
  "Karmine Corp": { short: "KC", color: "#0033A0" },
  "T1": { short: "T1", color: "#E2012D" },
  "Team Vitality": { short: "VIT", color: "#FFE600" },
  "Team Spirit": { short: "TSP", color: "#F5A623" },
  "OG": { short: "OG", color: "#111111" },
  "Team Liquid": { short: "TL", color: "#0A1E3C" },
  "PSG.LGD": { short: "LGD", color: "#DA291C" },
  "Team Secret": { short: "TS", color: "#1A1A1A" },
  "Tundra Esports": { short: "TUN", color: "#00A99D" },
  "Gaimin Gladiators": { short: "GG", color: "#D4AF37" },
  "FaZe Clan": { short: "FAZE", color: "#EE1C25" },
  "Natus Vincere": { short: "NAVI", color: "#FFDD00" },
  "Sentinels": { short: "SEN", color: "#DA292A" },
  "DRX": { short: "DRX", color: "#4169E1" },
  "OpTic Texas": { short: "OPT", color: "#78BE20" },
  "Atlanta FaZe": { short: "ATL", color: "#EE1C25" },
  "Los Angeles Thieves": { short: "LAT", color: "#7B2CBF" },
  "TSM": { short: "TSM", color: "#3B3B3B" },
  "NRG": { short: "NRG", color: "#5A2D82" },
  "Alliance": { short: "ALL", color: "#F4C300" },
  "Evil Geniuses": { short: "EG", color: "#0032FF" },
  "Movistar KOI": { short: "KOI", color: "#FF6600" },
  "Gen.G": { short: "GEN", color: "#AA8B56" },
  "JD Gaming": { short: "JDG", color: "#D4A017" },
  "Cloud9": { short: "C9", color: "#0089CE" },
  "100 Thieves": { short: "100T", color: "#CC0000" },
  "Solary": { short: "SLY", color: "#FF4655" },
  "GameWard": { short: "GW", color: "#6EC9E0" },
  "BK ROG Esports": { short: "BKR", color: "#D40000" },
  "Karmine Corp Blue": { short: "KCB", color: "#0033A0" },
  "Vitality.Bee": { short: "VITB", color: "#FFE600" },
  "Team BDS Academy": { short: "BDS", color: "#F5D400" },
  "Galions": { short: "GAL", color: "#1B1F3B" },
  "MOUZ": { short: "MOUZ", color: "#FF0000" },
  "Astralis": { short: "AST", color: "#C4122E" },
  "Complexity": { short: "COL", color: "#1E90DE" },
  "Gentle Mates": { short: "GM", color: "#000000" },
  "Team Heretics": { short: "TH", color: "#000000" },
  "LOUD": { short: "LOUD", color: "#00E28A" },
  "Paper Rex": { short: "PRX", color: "#EC1C24" },
  "Team Falcons": { short: "FLC", color: "#E4B343" },
  "Paris Gentle Mates": { short: "GM", color: "#000000" },
  "Vancouver Surge": { short: "SUR", color: "#5B2A86" },
  "Boston Breach": { short: "BR", color: "#0A2342" },
  "Carolina Royal Ravens": { short: "CAR", color: "#4B2E83" },
  "OMiT Esports": { short: "OMiT", color: "#00C2CB" },
  "Clutch Rayn Esports": { short: "CR", color: "#8A2BE2" },
  "Project 7 Esports": { short: "P7", color: "#2E2E2E" },
  "Team WaR": { short: "WaR", color: "#7A0000" },
  "Team Orchid": { short: "ORC", color: "#C77DFF" },
  "Exposure Gaming": { short: "EXG", color: "#00A896" },
  "DarkZero Esports": { short: "DZ", color: "#1C1C1C" },
  "Wildcard": { short: "WC", color: "#7B2CBF" },
  "Weibo Gaming": { short: "WBG", color: "#E60012" },
  "CAG Osaka": { short: "CAG", color: "#0091C2" },
  "ENTERPRISE Esports": { short: "ENT", color: "#5A5F6D" },
  "Fluxo W7M": { short: "W7M", color: "#D0102A" },
  "Elevate": { short: "ELE", color: "#2E5EAA" },
  "Ninjas in Pyjamas": { short: "NiP", color: "#C9A227" },
  "Crazy Raccoon": { short: "CR", color: "#F26D21" },
  "REJECT": { short: "RJ", color: "#000000" },
  "BMS Esports": { short: "BMS", color: "#1E1E1E" },
};

// Calcule si le texte doit être clair ou sombre selon la luminosité de la couleur de fond
// (corrige les badges noirs comme G2 Esports/Gentle Mates/REJECT qui rendaient le texte illisible)
function getContrastText(hexColor) {
  const hex = (hexColor || "#3D4254").replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1B1D22" : "#F5F6FA";
}

function getTeamMeta(name) {
  if (!name) return null;
  const base = TEAM_META[name] || {
    short: name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    color: "#3D4254",
  };
  return { ...base, textColor: getContrastText(base.color) };
}

const BACKGROUNDS = [
  { id: "prodige", label: "Prodige précoce", desc: "Repéré à 13 ans dans un cybercafé." },
  { id: "autodidacte", label: "Autodidacte", desc: "Tout appris seul, la nuit, casque vissé sur les oreilles." },
  { id: "academie", label: "Passé par une académie", desc: "Formation structurée, coachs, mais peu de vécu terrain." },
];

const STAT_DEFS = [
  { key: "skill", label: "Mécaniques", icon: Zap, color: "#C8A24B" },
  { key: "mental", label: "Mental", icon: Brain, color: "#A99BD9" },
  { key: "reputation", label: "Réputation", icon: Flame, color: "#D9924A" },
  { key: "health", label: "Santé", icon: HeartPulse, color: "#D9757F" },
];

// events:
// - discipline "all"           -> commun à toutes les disciplines
// - discipline défini, game null -> commun à tous les jeux de cette discipline
// - discipline + game définis   -> propre à un jeu précis
const EVENTS = [
  {
    discipline: "all",
    pin: "first",
    eyebrow: "23h47 — Ta chambre",
    title: "Scrim jusqu'à l'aube",
    text: "Ton équipe propose une session de scrims supplémentaire contre une team coréenne, en pleine nuit. Demain tu as cours. Tu sens déjà la fatigue dans tes yeux.",
    choices: [
      {
        label: "Enchaîner la session jusqu'au bout",
        effects: { skill: 12, health: -15, mental: -5 },
        result: "Tu progresses vite, mais ton corps commence déjà à payer l'addition.",
      },
      {
        label: "Aller dormir, demain est un autre jour",
        effects: { skill: 3, health: 8, mental: 5 },
        result: "Tu te réveilles frais. Tes coéquipiers grognent un peu, mais tu tiens la distance.",
      },
    ],
  },
  {
    discipline: "all",
    pin: "first",
    eyebrow: "Salle des fêtes — Premier LAN",
    title: "Ton premier tournoi en vrai",
    text: "Un petit tournoi local, dans une salle des fêtes prêtée pour l'occasion, câbles qui traînent partout. C'est la première fois que tu joues face à un adversaire assis à côté de toi plutôt que derrière un pseudo.",
    choices: [
      {
        label: "Jouer ton style le plus risqué pour marquer les esprits",
        effects: { skill: 10, reputation: 6, mental: -4 },
        result: "Le pari surprend les organisateurs. On commence déjà à parler de toi dans le petit milieu local.",
      },
      {
        label: "Jouer sobre pour ne pas se prendre les pieds dans le tapis",
        effects: { mental: 8, skill: 3 },
        result: "Rien de spectaculaire, mais tu repars avec une vraie confiance en tes bases.",
      },
    ],
  },
  {
    discipline: "all",
    pin: "first",
    eyebrow: "Chambre d'ami — Découverte",
    title: "La partie qui a tout déclenché",
    text: "Un ami t'a mis une manette dans les mains \"juste pour essayer\". Trois heures plus tard, tu es toujours devant l'écran, complètement absorbé, à recommencer encore et encore.",
    choices: [
      {
        label: "Rentrer chez toi et t'entraîner seul toute la nuit",
        effects: { skill: 10, mental: -6 },
        result: "Tu rentres avec une idée fixe en tête. Le sommeil attendra.",
      },
      {
        label: "Rester discuter avec ton ami de ce que tu viens de découvrir",
        effects: { mental: 8, skill: 2 },
        result: "Vous refaites le match pendant une heure. Cette soirée-là restera un souvenir marquant.",
      },
    ],
  },
  {
    discipline: "all",
    pin: "first",
    eyebrow: "Chaîne Twitch — 3h du matin",
    title: "En regardant un stream, tu te dis : je peux faire pareil",
    text: "Tu regardes un joueur pro en direct depuis des heures, fasciné par son niveau. Une petite voix te dit que toi aussi, tu pourrais y arriver — à condition d'y mettre le temps qu'il faut.",
    choices: [
      {
        label: "Te lancer immédiatement en solo queue pour tester ton niveau",
        effects: { skill: 8, health: -8, mental: -3 },
        result: "Les premières parties sont rudes, mais tu sens déjà que quelque chose s'enclenche.",
      },
      {
        label: "Prendre des notes sur ses habitudes de jeu avant de te lancer",
        effects: { skill: 5, mental: 6 },
        result: "Une approche plus méthodique, qui pose de bonnes bases pour la suite.",
      },
    ],
  },
  {
    discipline: "moba",
    pin: "first",
    eyebrow: "Cybercafé — Ta première ranked",
    title: "La partie qui a changé ta vie",
    text: "Dans un cybercafé bondé, tu enchaînes ta première vraie partie classée. Un joueur du café, plus expérimenté, te regarde par-dessus ton épaule.",
    choices: [
      {
        label: "Tenter un pick ambitieux pour l'impressionner",
        effects: { skill: 10, mental: -5 },
        result: "Le pari partiellement réussi capte son attention. Il te glisse un conseil avant de partir.",
      },
      {
        label: "Jouer prudent et demander ses conseils après la partie",
        effects: { mental: 8, skill: 4 },
        result: "Tu repars avec plus de questions que de réponses, mais une vraie envie d'apprendre.",
      },
    ],
  },
  {
    discipline: "fps",
    pin: "first",
    eyebrow: "LAN party — Salle enfumée",
    title: "Ton premier headshot qui compte",
    text: "Une LAN party organisée dans un gymnase reconverti pour le week-end. Ton dernier round contre un joueur bien plus côté que toi tourne à ton avantage, et la salle entière s'en aperçoit.",
    choices: [
      {
        label: "Enchaîner les parties toute la nuit pour confirmer",
        effects: { skill: 10, health: -10, mental: -3 },
        result: "Tu termines la nuit vidé, mais avec la certitude d'avoir quelque chose à prouver.",
      },
      {
        label: "T'arrêter sur cette bonne note et rentrer te reposer",
        effects: { mental: 8, health: 5 },
        result: "Tu rentres serein, avec un déclic net dans un coin de la tête.",
      },
    ],
  },
  {
    discipline: "br",
    pin: "first",
    eyebrow: "Chambre — Stream personnel",
    title: "Ta première victoire filmée",
    text: "Tu diffuses tes parties depuis quelques semaines devant une poignée de viewers. Ce soir, tu décroches ta toute première victoire filmée, en solo contre plusieurs équipes.",
    choices: [
      {
        label: "Rejouer immédiatement le clip pour analyser chaque décision",
        effects: { skill: 9, mental: -3 },
        result: "Tu décortiques la partie minute par minute, déjà en quête du prochain exploit.",
      },
      {
        label: "Savourer le moment avec ta communauté naissante",
        effects: { mental: 8, reputation: 5 },
        result: "Le clip circule un peu. Tes premiers vrais fans commencent à te suivre.",
      },
    ],
  },
  {
    discipline: "fight",
    pin: "first",
    eyebrow: "Salle d'arcade — Borne du fond",
    title: "Ta première session qui ne finit jamais",
    text: "Sur la borne du fond d'une salle d'arcade, tu enchaînes les sets contre le même adversaire depuis une heure, à égalité parfaite. Un petit attroupement commence à se former autour de vous.",
    choices: [
      {
        label: "Changer de personnage pour le déstabiliser",
        effects: { skill: 9, mental: -4 },
        result: "Le pari fonctionne à moitié — le public, lui, adore le spectacle.",
      },
      {
        label: "Rester sur ton personnage et gagner la guerre d'usure",
        effects: { mental: 8, skill: 3 },
        result: "Tu finis par prendre l'ascendant, à la force de la régularité.",
      },
    ],
  },
  {
    discipline: "all",
    background: "prodige",
    eyebrow: "Sous les projecteurs, déjà",
    title: "Le poids des attentes",
    text: "Repéré si jeune, tout le monde attend déjà de grandes choses de toi. La moindre contre-performance est décortiquée sur les réseaux.",
    choices: [
      {
        label: "Assumer la pression et viser haut tout de suite",
        effects: { reputation: 8, mental: -8 },
        result: "Tu joues avec l'étiquette de prodige collée à la peau, pour le meilleur et pour le pire.",
      },
      {
        label: "Prendre le temps d'apprendre loin des projecteurs",
        effects: { mental: 8, reputation: -4 },
        result: "Tu grandis plus doucement, à l'abri d'une partie de la pression médiatique.",
      },
    ],
  },
  {
    discipline: "all",
    background: "autodidacte",
    eyebrow: "Un trou dans la formation",
    title: "Les bases qui manquent",
    text: "Un coach remarque que tu n'as jamais appris les codes de communication d'équipe structurée, contrairement aux joueurs formés en académie.",
    choices: [
      {
        label: "Travailler dur pour combler ce retard",
        effects: { skill: 6, mental: -6 },
        result: "Le rattrapage est éprouvant, mais tu combles peu à peu ce qui te manquait.",
      },
      {
        label: "Compenser par ton style instinctif et unique",
        effects: { skill: 8, reputation: 3, mental: -3 },
        result: "Ton style atypique, forgé en solo, finit par devenir ta signature.",
      },
    ],
  },
  {
    discipline: "all",
    background: "academie",
    eyebrow: "Premier vrai enjeu",
    title: "Le choc du réel",
    text: "Toute ta formation s'est faite en académie protégée. Jouer pour de l'argent réel, devant un vrai public, est un choc auquel rien ne t'avait vraiment préparé.",
    choices: [
      {
        label: "Foncer et affronter le stress de plein fouet",
        effects: { mental: -8, skill: 8 },
        result: "L'expérience est rude, mais elle t'endurcit plus vite que n'importe quel entraînement académique.",
      },
      {
        label: "Demander plus de temps d'adaptation à ton coach",
        effects: { mental: 8, skill: -3 },
        result: "Tu progresses à ton rythme, en toute sécurité, sans brûler les étapes.",
      },
    ],
  },
  {
    discipline: "all",
    dynamic: "team_early",
    optional: true,
    eyebrow: "Mercato — Premier contrat",
    title: "Une touche de {TEAM}",
    text: "Ta progression commence à se remarquer. {TEAM} te propose de rejoindre ses rangs pour disputer les prochaines échéances qui comptent vraiment.",
    choices: [
      {
        label: "Signer chez {TEAM} pour structurer ta progression",
        effects: { skill: 6, reputation: 5 },
        result: "L'encadrement est plus sérieux, le calendrier plus dense — mais tu progresses enfin dans un vrai cadre.",
        setTeam: true,
      },
      {
        label: "Rester indépendant encore un peu",
        effects: { mental: 6, skill: -2 },
        result: "Tu gardes ta liberté totale, au prix d'un encadrement plus artisanal.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Premières compétitions",
    title: "Un nom revient sans cesse : {RIVAL}",
    text: "Partout où tu joues, un adversaire du nom de {RIVAL} semble toujours se trouver sur ton chemin, avec un style qui contraste totalement avec le tien.",
    choices: [
      {
        label: "Étudier ses replays pour anticiper son style",
        effects: { skill: 7, mental: -2 },
        result: "Tu commences à cerner ses habitudes, mais l'obsession naissante te coûte un peu de sommeil.",
      },
      {
        label: "Ignorer et rester focus sur ton propre jeu",
        effects: { mental: 6, skill: 1 },
        result: "Tu gardes l'esprit libre, sans te laisser happer par une rivalité encore lointaine.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Vestiaire — Débuts en équipe",
    title: "Ton binôme, {ALLY}",
    text: "Dès tes débuts, {ALLY} devient ton binôme de scrims, presque un frère ou une sœur d'armes. Vous progressez ensemble, partageant les mêmes nuits blanches et les mêmes espoirs.",
    choices: [
      {
        label: "Tout partager avec {ALLY}, stratégies comprises",
        effects: { mental: 8, skill: 4 },
        result: "Votre duo devient redoutable en scrims, porté par une confiance totale.",
      },
      {
        label: "Garder certaines de tes trouvailles pour toi",
        effects: { skill: 6, mental: -3 },
        result: "Tu progresses un peu plus vite individuellement, au prix d'une complicité légèrement entamée.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Vie scolaire",
    title: "Le bulletin qui inquiète",
    text: "Ton conseiller pédagogique convoque tes parents : tes notes s'effondrent depuis que les entraînements ont pris toute la place dans tes journées. Il te propose un programme aménagé, mais moins intensif niveau jeu.",
    choices: [
      {
        label: "Arrêter complètement l'école pour te consacrer au jeu",
        effects: { skill: 10, mental: -6 },
        result: "Tu gagnes un temps précieux à l'entraînement, mais tu coupes un filet de sécurité que beaucoup regrettent plus tard.",
        flag: { name: "schoolPath", value: "dropped" },
      },
      {
        label: "Accepter le programme aménagé, plus lent mais plus sûr",
        effects: { mental: 8, skill: -3 },
        result: "Tu avances moins vite en jeu, mais tu gardes une porte de sortie si la carrière ne prend pas.",
        flag: { name: "schoolPath", value: "balanced" },
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Boîte mail",
    title: "Ta première offre de sponsoring",
    text: "Une marque de boissons énergisantes te propose un contrat : de l'argent, de la visibilité, mais une clause t'oblige à poster du contenu tous les jours, même en période de tournoi.",
    choices: [
      {
        label: "Signer — l'argent et la visibilité comptent",
        effects: { reputation: 15, mental: -8, health: -5 },
        result: "Ton nom circule enfin. Mais entre les scrims et le contenu, tes journées n'ont plus une minute de libre.",
      },
      {
        label: "Refuser — rester focus sur le jeu",
        effects: { skill: 8, reputation: -5 },
        result: "Personne ne parle encore de toi, mais ton niveau de jeu grimpe en silence.",
      },
    ],
  },
  {
    discipline: "moba",
    eyebrow: "Playoffs — Conférence de presse",
    title: "{RIVAL} te provoque publiquement",
    text: "Le capitaine de l'équipe rivale, {RIVAL}, te chambre en interview avant les playoffs, remettant en question ton niveau individuel devant toute la scène.",
    choices: [
      {
        label: "Répondre avec un trash-talk enflammé",
        effects: { reputation: 12, mental: -8 },
        result: "Le clip est repris partout. La pression monte d'un cran avant le match retour.",
      },
      {
        label: "Rester silencieux et laisser parler le jeu",
        effects: { mental: 8, reputation: -3 },
        result: "Tu gardes ton énergie pour la scrim, loin du bruit médiatique.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    eyebrow: "League of Legends — Solo Queue",
    title: "Premier de la file Challenger",
    text: "Ton compte grimpe jusqu'au sommet du ladder Challenger de ton serveur. Les coachs et recruteurs qui traquent les talents en solo queue commencent à noter ton pseudo dans leurs tableurs.",
    choices: [
      {
        label: "Streamer tes sessions de solo queue pour te faire un nom",
        effects: { reputation: 7, mental: -4 },
        result: "Ton audience grimpe vite, mais chaque partie ratée se retrouve désormais commentée en direct.",
      },
      {
        label: "Rester concentré sur ta progression, loin des projecteurs",
        effects: { skill: 6, mental: 2 },
        result: "Ton niveau grimpe sereinement, même si ton pseudo reste encore confidentiel.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    eyebrow: "League of Legends — Ligue Challengers",
    title: "Une place dans l'élite",
    text: "Ton équipe amateur dispute la finale des Challengers pour une place en ligue professionnelle. C'est ta première vraie exposition médiatique, devant un public encore restreint mais passionné.",
    choices: [
      {
        label: "Prendre des risques pour impressionner les recruteurs",
        effects: { skill: 8, reputation: 8, mental: -5 },
        result: "Ta performance attire l'œil de plusieurs organisations professionnelles.",
      },
      {
        label: "Jouer collectif et sécuriser la montée",
        effects: { mental: 6, skill: 2 },
        result: "Rien d'exceptionnel individuellement, mais l'équipe monte en ligue professionnelle.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    dynamic: "league",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "League of Legends — {LEAGUE}",
    title: "Ta première saison en ligue majeure",
    text: "Te voilà titulaire en {LEAGUE}, l'une des grandes ligues professionnelles du jeu. Le niveau est incomparable avec les Challengers, et les attentes des fans grimpent d'un coup.",
    choices: [
      {
        label: "Bousculer les vétérans dès les premières semaines",
        effects: { skill: 8, reputation: 6, mental: -5 },
        result: "Ton audace surprend une ligue habituée aux hiérarchies bien établies.",
      },
      {
        label: "Observer et apprendre en silence",
        effects: { mental: 6, skill: 3 },
        result: "Une adaptation prudente qui te permet d'ingurgiter énormément de connaissances stratégiques.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    eyebrow: "League of Legends — Solo queue",
    title: "Un flame en ranked",
    text: "Un coéquipier de ranked t'accuse d'inting après une seule mort en early game. La partie promet d'être longue, et le chat commence à s'enflammer.",
    choices: [
      {
        label: "Répondre et entrer dans le duel verbal",
        effects: { mental: -10, skill: -3 },
        result: "Tu perds ta concentration pour le reste de la partie, focalisé sur le chat plus que sur la map.",
      },
      {
        label: "Couper le chat et jouer ta game",
        effects: { mental: 6, skill: 5, reputation: -3 },
        result: "Sans distraction, ton gameplay individuel prend une autre dimension — mais personne ne voit ce moment, aucun clip n'en sortira.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "top",
    eyebrow: "League of Legends — Top lane",
    title: "Duel en solo, loin de tout",
    text: "Ta lane est isolée du reste de la carte pendant de longues minutes. Ton adversaire direct commence à prendre l'ascendant en creep score, sans que personne ne puisse t'aider.",
    choices: [
      {
        label: "Forcer un all-in pour inverser la tendance",
        effects: { skill: 9, mental: -5 },
        result: "Le pari solo paie, sans aide de personne. Ta réputation de duelliste grandit.",
      },
      {
        label: "Jouer passif et attendre que la partie se décide ailleurs",
        effects: { mental: 7, skill: -2 },
        result: "Tu limites la casse, en pariant que ton impact viendra plus tard dans la partie.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "top",
    eyebrow: "League of Legends — Top lane",
    title: "Split push ou teamfight ?",
    text: "En milieu de partie, ton équipe se regroupe pour un combat à 5. Toi, tu es en position de split push avec un avantage de plaques énorme si tu restes seul en top.",
    choices: [
      {
        label: "Continuer ton split push et forcer l'équipe adverse à réagir",
        effects: { skill: 10, reputation: 5, mental: -4 },
        result: "Le pari solo fonctionne à merveille — mais si l'équipe perd le combat sans toi, tout le monde se souviendra de ton absence.",
      },
      {
        label: "Rejoindre le groupe pour le combat à 5",
        effects: { mental: 7, skill: 2 },
        result: "Une décision plus sûre, qui rassure une équipe qui n'aime pas jouer à 4.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "jungle",
    eyebrow: "League of Legends — Jungle",
    title: "Le gank qui peut tout changer",
    text: "Ta mid lane est en position parfaite pour un gank à la minute 4, mais ça veut dire sacrifier du temps de farm dans ta propre jungle.",
    choices: [
      {
        label: "Ganker immédiatement, quitte à prendre du retard en jungle",
        effects: { skill: 9, reputation: 4, mental: -3 },
        result: "Le gank passe. Ta mid lane t'en sera reconnaissante pour le reste de la partie.",
      },
      {
        label: "Continuer ton farm et scaler tranquillement",
        effects: { mental: 6, skill: 3 },
        result: "Tu arrives plus fort en late game, au prix d'une early game plus discrète.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "jungle",
    eyebrow: "League of Legends — Jungle",
    title: "Priorité aux objectifs ou au farm ?",
    text: "Un dragon important apparaît alors que ta jungle adverse dispute le même objectif. Prendre le combat est risqué, mais l'ignorer donne un avantage clair à l'adversaire.",
    choices: [
      {
        label: "Contester l'objectif coûte que coûte",
        effects: { skill: 10, mental: -6 },
        result: "Le combat est âpre, mais l'objectif tombe de ton côté. Le rythme de la partie t'appartient.",
      },
      {
        label: "Laisser filer et sécuriser un objectif ailleurs sur la carte",
        effects: { mental: 7, skill: -1 },
        result: "Un compromis pragmatique qui évite un combat à sens unique.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "mid",
    eyebrow: "League of Legends — Mid lane",
    title: "Roaming ou scaling ?",
    text: "Ta lane est gagnée, largement. Tu peux rester scaler tranquillement ou partir aider les autres lanes en délaissant ton propre farm.",
    choices: [
      {
        label: "Partir en roam sur les lanes latérales",
        effects: { skill: 9, reputation: 5, mental: -3 },
        result: "Ton impact se répand sur toute la carte — au prix d'un peu de retard en farm personnel.",
      },
      {
        label: "Rester en lane et maximiser ton avantage en creep score",
        effects: { skill: 8, mental: 2 },
        result: "Tu deviens une menace individuelle presque incontrôlable en late game.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "mid",
    eyebrow: "League of Legends — Mid lane",
    title: "Le duel qui définit la partie",
    text: "Ton adversaire direct en mid lane a la réputation d'être injouable en 1v1. Un combat isolé se présente, sans intervention possible du reste de l'équipe.",
    choices: [
      {
        label: "Accepter le duel et prouver que tu es meilleur",
        effects: { skill: 11, reputation: 6, mental: -5 },
        result: "Le combat tourne en ta faveur. Ton nom commence à circuler parmi les analystes.",
      },
      {
        label: "Éviter le combat et jouer la carte de la patience",
        effects: { mental: 8, skill: -1 },
        result: "Tu refuses l'affrontement direct, quitte à laisser planer le doute sur ton niveau réel.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "adc",
    eyebrow: "League of Legends — ADC",
    title: "Survivre à l'early game",
    text: "Ta bot lane subit une pression constante dès les premières minutes. Un seul mauvais positionnement peut te coûter ta place en tant que carry principal de l'équipe.",
    choices: [
      {
        label: "Jouer extrêmement prudent, quitte à perdre du farm",
        effects: { mental: 8, skill: -2 },
        result: "Tu restes en vie, ce qui compte plus que tout à ce stade de la partie.",
      },
      {
        label: "Prendre des risques pour rester dans le match au score",
        effects: { skill: 9, mental: -6 },
        result: "Le pari est stressant, mais tu restes une menace offensive plutôt qu'un poids mort.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "adc",
    eyebrow: "League of Legends — ADC",
    title: "Le carry en fin de partie",
    text: "En late game, toute la stratégie de ton équipe repose sur ta capacité à survivre et infliger des dégâts en combat. Un seul faux pas et la partie bascule.",
    choices: [
      {
        label: "Jouer en première ligne pour maximiser tes dégâts",
        effects: { skill: 12, reputation: 6, mental: -7 },
        result: "Le pari agressif paie gros — la moindre erreur aurait pourtant tout fait basculer.",
      },
      {
        label: "Rester en retrait et sécuriser ta survie avant tout",
        effects: { mental: 8, skill: 1 },
        result: "Une approche prudente qui garantit ta présence jusqu'à la fin du combat.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "support",
    eyebrow: "League of Legends — Support",
    title: "Le sacrifice qui passe inaperçu",
    text: "Un combat tourne mal pour ton ADC. Tu peux utiliser ton sort défensif pour le sauver, au prix de ta propre survie.",
    choices: [
      {
        label: "Te sacrifier pour sauver ton carry",
        effects: { mental: 7, reputation: -3 },
        result: "Personne ne retiendra ton nom dans les highlights, mais ton ADC survit — et c'est tout ce qui compte.",
      },
      {
        label: "Te mettre en sécurité et accepter la perte de ton ADC",
        effects: { mental: -4, skill: 4 },
        result: "Un choix froidement rationnel, qui laisse un goût amer dans le vestiaire.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    role: "support",
    eyebrow: "League of Legends — Support",
    title: "Protéger l'ADC ou roam ?",
    text: "Ta bot lane est stabilisée. Tu peux rester poser de la vision pour sécuriser ton ADC, ou partir aider la mid lane en délaissant temporairement ta lane.",
    choices: [
      {
        label: "Partir en roam pour créer un avantage ailleurs",
        effects: { skill: 8, reputation: 5, mental: -3 },
        result: "L'initiative surprend l'adversaire — mais ta bot lane reste sans protection pendant ce temps.",
      },
      {
        label: "Rester poser de la vision et sécuriser ta lane",
        effects: { mental: 7, skill: 2 },
        result: "Un travail de l'ombre qui ne se voit jamais au score, mais qui évite bien des catastrophes.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "League of Legends — MSI",
    title: "Choc des champions de printemps",
    text: "Au MSI à {LOCATION}, ta ligue affronte {OPPONENT}, réputés injouables en early game. Le coach hésite entre un draft défensif ou un pari offensif dès la phase de sélection.",
    choices: [
      {
        label: "Draft offensif pour prendre l'avantage tôt",
        effects: { skill: 9, reputation: 6, mental: -6 },
        result: "Le pari fonctionne à moitié : spectaculaire, mais épuisant nerveusement.",
      },
      {
        label: "Draft défensif et scaling",
        effects: { mental: 7, skill: -2 },
        result: "Un plan patient qui rassure le staff, sans faire trembler personne.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "League of Legends — Worlds, phase de groupes",
    title: "Le pick qui peut tout changer",
    text: "En phase de draft au Championnat du Monde à {LOCATION}, face à {OPPONENT}, ton coach hésite. Tu peux picker ton champion signature — risqué mais dévastateur si ça passe — ou suivre le plan sécuritaire de l'équipe.",
    choices: [
      {
        label: "Picker ton champion signature",
        effects: { skill: 10, reputation: 8, mental: -6 },
        result: "Le pari paie : les commentateurs s'enflamment sur ta prise de risque devant des millions de viewers.",
      },
      {
        label: "Suivre le plan sécuritaire du coach",
        effects: { mental: 8, skill: -3 },
        result: "Rien de spectaculaire, mais l'équipe progresse sereinement vers les phases finales.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "League of Legends — Worlds, Finale mondiale",
    title: "La Coupe d'Invocateur en jeu",
    text: "Tu es en finale du Championnat du Monde à {LOCATION}, face à {RIVAL} sous les couleurs de {OPPONENT}, devant un stade plein et des dizaines de millions de spectateurs en ligne. C'est le sommet de la discipline.",
    choices: [
      {
        label: "Jouer ton style le plus agressif, sans filet",
        effects: { skill: 15, reputation: 18, health: -10, mental: -8 },
        result: "Une finale entrée dans l'histoire — pour le meilleur ou pour le pire, ton nom restera gravé.",
      },
      {
        label: "Jouer un style solide et éprouvé",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une finale maîtrisée, moins spectaculaire, mais tu la termines entier.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "lol",
    requiresFlag: { name: "wentPro", value: false },
    eyebrow: "League of Legends — Ligue Challengers, Grande Finale",
    title: "Ta revanche sur la scène amateur",
    text: "Tu n'as jamais rejoint une grande organisation, mais ça ne t'a pas empêché d'aller loin. En finale des Challengers, tu retrouves {RIVAL}, désormais sous les couleurs de {OPPONENT}, revenu défier ton équipe pour un dernier duel avant la fin de saison.",
    choices: [
      {
        label: "Jouer ton style le plus agressif, sans filet",
        effects: { skill: 13, reputation: 12, health: -8, mental: -6 },
        result: "Une finale intense qui prouve, une bonne fois pour toutes, que le niveau était là.",
      },
      {
        label: "Jouer un style solide et éprouvé",
        effects: { skill: 5, reputation: 6, mental: 5 },
        result: "Une victoire propre, moins spectaculaire, mais tu la termines la tête haute.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    eyebrow: "Dota 2 — Open Qualifiers",
    title: "Le bas de l'échelle",
    text: "Avant même de rêver de l'Aegis, il faut passer les Open Qualifiers, où des centaines d'équipes s'affrontent pour une poignée de places. La pression est déjà bien réelle.",
    choices: [
      {
        label: "Jouer un draft créatif pour surprendre",
        effects: { skill: 7, reputation: 4, mental: -4 },
        result: "Le pari surprend des adversaires plus expérimentés. Tu passes un tour de plus que prévu.",
      },
      {
        label: "Jouer un draft classique et sûr",
        effects: { mental: 6, skill: 1 },
        result: "Rien de mémorable, mais efficace : direction le tour suivant.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    dynamic: "league",
    eyebrow: "Dota 2 — {LEAGUE}",
    title: "Une place dans le circuit professionnel",
    text: "Ton équipe intègre enfin la {LEAGUE}, l'un des circuits régionaux qui mènent vers The International. Chaque série compte double pour le classement.",
    choices: [
      {
        label: "Jouer un style tout-terrain pour accumuler les points",
        effects: { skill: 7, reputation: 5, mental: -4 },
        result: "Ta polyvalence impressionne les analystes du circuit.",
      },
      {
        label: "Se spécialiser sur quelques héros maîtrisés",
        effects: { mental: 6, skill: 3 },
        result: "Une approche plus étroite, mais redoutablement efficace sur la durée.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    eyebrow: "Dota 2 — The International, groupe de la mort",
    title: "Draft face au champion en titre",
    text: "À TI, tu affrontes l'équipe qui a soulevé l'Aegis l'an dernier. Ton support propose un draft à contre-pied, complètement hors-meta, devant le plus gros prize pool de l'esport.",
    choices: [
      {
        label: "Valider le draft hors-meta",
        effects: { skill: 10, reputation: 9, mental: -7 },
        result: "Le pari surprend tout le monde. Si ça marche, ce sera la série dont on parlera pendant des années.",
      },
      {
        label: "Revenir à un draft standard",
        effects: { mental: 7, skill: -2 },
        result: "Moins de risques, moins de gloire — mais une base solide pour la série.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    eyebrow: "Dota 2 — The International, Grande Finale",
    title: "L'Aegis of Champions",
    text: "Tu es en finale de The International à {LOCATION}, face à {RIVAL} sous les couleurs de {OPPONENT}, sous les lumières du plus grand tournoi Dota au monde, l'Aegis à portée de main.",
    choices: [
      {
        label: "Tenter le pari tout ou rien en fin de partie",
        effects: { skill: 14, reputation: 16, mental: -10, health: -5 },
        result: "La partie la plus folle de ta carrière. On en parlera encore des années après.",
      },
      {
        label: "Jouer un macro-jeu patient",
        effects: { skill: 6, reputation: 8, mental: 4 },
        result: "Une victoire construite méthodiquement, sans coup d'éclat individuel.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "carry",
    eyebrow: "Dota 2 — Carry",
    title: "Le farm avant tout",
    text: "En début de partie, ton équipe insiste pour rotate et sécuriser ta jungle, au risque de perdre du terrain ailleurs sur la carte.",
    choices: [
      {
        label: "Accepter l'aide et prioriser ton farm",
        effects: { skill: 8, reputation: -3 },
        result: "Ton timing d'objets est parfait, mais le reste de la carte souffre visiblement.",
      },
      {
        label: "Refuser et laisser l'équipe jouer normalement",
        effects: { mental: 6, skill: -2 },
        result: "Un farm plus lent, mais une équipe qui ne se sent jamais sacrifiée pour toi.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "carry",
    eyebrow: "Dota 2 — Carry",
    title: "Le buyback à 6000 gold",
    text: "En pleine tentative de comeback, une mort au mauvais moment pourrait coûter la partie. Le buyback viderait presque toute ta banque.",
    choices: [
      {
        label: "Payer le buyback pour sécuriser le comeback",
        effects: { skill: 7, reputation: 5, health: -3 },
        result: "Le pari paie, l'équipe termine le jeu dans la foulée.",
      },
      {
        label: "Économiser pour ton prochain objet core",
        effects: { mental: 6, skill: -3 },
        result: "Tu restes riche en objets, mais la fenêtre de comeback se referme.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "mid",
    eyebrow: "Dota 2 — Mid",
    title: "Le duel de mid lane",
    text: "Ton adversaire direct en mid pousse agressivement dès le niveau 3. Un tower dive semble possible, mais risqué.",
    choices: [
      {
        label: "Tenter le tower dive",
        effects: { skill: 9, reputation: 6, health: -5 },
        result: "Un kill spectaculaire qui bascule tout le tempo de la partie en ta faveur.",
      },
      {
        label: "Jouer patient et laisser passer la vague",
        effects: { mental: 7, skill: -2 },
        result: "Rien de flashy, mais ta lane reste saine et stable.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "mid",
    eyebrow: "Dota 2 — Mid",
    title: "Rotation ou farm",
    text: "Une side lane demande de l'aide en vocal alors que ton camp de jungle est libre juste à côté.",
    choices: [
      {
        label: "Rotate immédiatement pour aider",
        effects: { reputation: 7, skill: -3 },
        result: "Le kill assist sauve la lane, même si ton propre farm en pâtit.",
      },
      {
        label: "Finir ton camp avant de bouger",
        effects: { skill: 6, mental: -4 },
        result: "Tu arrives trop tard pour empêcher les dégâts, malgré un meilleur score personnel.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "offlane",
    eyebrow: "Dota 2 — Offlane",
    title: "Lane à deux contre un",
    text: "Ton offlane est en infériorité numérique dès le début de la partie. Le support adverse harcèle sans relâche.",
    choices: [
      {
        label: "Tenir la position coûte que coûte",
        effects: { mental: 8, skill: -3, health: -4 },
        result: "Tu perds du niveau, mais l'équipe garde sa tour offlane intacte.",
      },
      {
        label: "Rotate en jungle pour éviter le harcèlement",
        effects: { skill: 5, reputation: -4 },
        result: "Tu farmes tranquillement, mais la tour offlane tombe sans résistance.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "offlane",
    eyebrow: "Dota 2 — Offlane",
    title: "Initier le fight ou attendre",
    text: "L'équipe adverse se regroupe près de Roshan. Ton kit d'initiation pourrait tout déclencher, mais un mauvais timing serait fatal.",
    choices: [
      {
        label: "Initier immédiatement",
        effects: { skill: 9, reputation: 6, health: -6 },
        result: "Un engage parfait qui prend l'ennemi totalement au dépourvu.",
      },
      {
        label: "Attendre un meilleur angle",
        effects: { mental: 6, skill: -2 },
        result: "La prudence paie sur le moment, mais l'opportunité ne revient jamais vraiment.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "support4",
    eyebrow: "Dota 2 — Soft Support",
    title: "La rune de la rivière",
    text: "Une rune de bounty apparaît côté rivière, à la limite entre ta lane et le territoire ennemi.",
    choices: [
      {
        label: "Prendre le risque d'aller la chercher",
        effects: { skill: 6, reputation: 5, health: -4 },
        result: "Le gold supplémentaire booste bien ton objet core, malgré le danger.",
      },
      {
        label: "Rester en sécurité près de ta tour",
        effects: { mental: 6, skill: -2 },
        result: "Rien à signaler, mais rien à gagner non plus ce tour-ci.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "support4",
    eyebrow: "Dota 2 — Soft Support",
    title: "Sauver le carry ou soi-même",
    text: "Un gank adverse surprend ta lane. Ton carry est bas en vie, toi aussi — un seul de vous deux peut vraiment s'en sortir.",
    choices: [
      {
        label: "Sacrifier ta vie pour sauver le carry",
        effects: { reputation: 8, mental: 4, health: -8 },
        result: "Le carry survit et continuera de farmer — exactement le plan prévu pour toi.",
      },
      {
        label: "Te mettre en sécurité toi-même",
        effects: { skill: 4, reputation: -5 },
        result: "Tu restes en vie, mais la perte du carry change complètement la dynamique de la partie.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "support5",
    eyebrow: "Dota 2 — Hard Support",
    title: "Le budget ward",
    text: "Ton or est presque entièrement englouti par les wards et les smokes de toute l'équipe depuis le début de la partie.",
    choices: [
      {
        label: "Continuer à tout sacrifier pour la vision",
        effects: { reputation: 7, mental: -5 },
        result: "L'équipe voit venir chaque gank adverse — au prix d'un score personnel proche de zéro.",
      },
      {
        label: "Garder un peu d'or pour un objet personnel",
        effects: { skill: 5, reputation: -4 },
        result: "Tu te sens un peu plus utile en combat, mais la vision de l'équipe en pâtit clairement.",
      },
    ],
  },
  {
    discipline: "moba",
    game: "dota2",
    role: "support5",
    eyebrow: "Dota 2 — Hard Support",
    title: "Le dernier salut",
    text: "Ton carry est pourchassé loin de toute tour. Un Glimmer Cape ou un Force Staff bien placé pourrait le sauver in extremis.",
    choices: [
      {
        label: "Utiliser ton objet de sauvetage immédiatement",
        effects: { reputation: 8, mental: 5 },
        result: "Un sauvetage parfait qui restera dans les highlights de l'équipe.",
      },
      {
        label: "Le garder pour une situation encore pire plus tard",
        effects: { skill: 4, reputation: -6 },
        result: "Le carry meurt, et la question du \"pourquoi tu n'as rien fait\" plane sur le prochain draft.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    eyebrow: "Counter-Strike 2 — FACEIT",
    title: "Repéré sur FACEIT",
    text: "Ton niveau en FACEIT Premier ne passe plus inaperçu. Tes démos circulent dans quelques cercles restreints, et une petite structure locale commence à s'intéresser à ton profil.",
    choices: [
      {
        label: "Balancer tes meilleures démos publiquement pour te faire remarquer",
        effects: { reputation: 7, mental: -3 },
        result: "Ton nom circule plus vite, mais chaque frag manqué se retrouve désormais commenté.",
      },
      {
        label: "Continuer à grinder discrètement, sans faire de bruit",
        effects: { skill: 6, reputation: -1 },
        result: "Ton niveau progresse solidement, même si personne ne sait encore vraiment qui tu es.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    eyebrow: "Counter-Strike 2 — Qualification ouverte ESL",
    title: "Sortir de l'anonymat",
    text: "Ta toute première qualification ouverte en ligne pour un tournoi ESL. Des centaines d'équipes, une seule place qui t'intéresse vraiment.",
    choices: [
      {
        label: "Jouer un style hyper agressif pour te faire remarquer",
        effects: { skill: 7, reputation: 5, mental: -4 },
        result: "Un style clivant qui attire l'attention des observateurs de talents.",
      },
      {
        label: "Jouer discipliné pour sécuriser la qualification",
        effects: { mental: 6, skill: 1 },
        result: "Pas de highlight, mais la qualification est en poche.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    dynamic: "league",
    eyebrow: "Counter-Strike 2 — {LEAGUE}",
    title: "Une place en compétition relevée",
    text: "Ton équipe décroche enfin une place en {LEAGUE}, l'un des circuits majeurs de la scène. Fini les qualifications en ligne, place aux LAN et aux vrais adversaires du top mondial.",
    choices: [
      {
        label: "Jouer un style hyper agressif dès le pistol round",
        effects: { skill: 8, reputation: 6, mental: -5 },
        result: "Le style tranche avec les habitudes de la ligue et fait déjà parler de toi.",
      },
      {
        label: "Adapter ton jeu aux standards de la ligue",
        effects: { mental: 6, skill: 3 },
        result: "Une transition plus posée, qui rassure ton staff sur ta capacité d'adaptation.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    role: "igl",
    eyebrow: "Counter-Strike 2 — In-Game Leader",
    title: "Le call qui engage toute la manche",
    text: "En pleine manche décisive, tu dois annoncer une stratégie à la volée. Deux options s'offrent à toi, et l'équipe attend ta décision en silence dans le comms.",
    choices: [
      {
        label: "Appeler un split hasardeux mais imprévisible",
        effects: { skill: 8, reputation: 5, mental: -6 },
        result: "Le call surprend l'adversaire — s'il avait raté, tout le monde t'en aurait tenu responsable.",
      },
      {
        label: "Appeler un exécute classique et éprouvé",
        effects: { mental: 7, skill: -1 },
        result: "Moins spectaculaire, mais personne ne peut te reprocher d'avoir pris un risque inutile.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    role: "igl",
    eyebrow: "Counter-Strike 2 — In-Game Leader",
    title: "Une économie à gérer seul",
    text: "L'équipe est financièrement juste après deux rounds perdus. C'est à toi seul de décider s'il faut forcer un achat ou repartir en éco totale.",
    choices: [
      {
        label: "Forcer un semi-buy collectif",
        effects: { skill: 9, reputation: 4, mental: -5 },
        result: "Le pari économique passe de justesse — la pression retombe entièrement sur tes épaules.",
      },
      {
        label: "Repartir en éco totale pour sécuriser la manche suivante",
        effects: { mental: 8, skill: -2 },
        result: "Une décision impopulaire sur le moment, mais qui protège l'équipe sur la durée.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    role: "awper",
    eyebrow: "Counter-Strike 2 — AWPer",
    title: "Le duel à l'entrée de site",
    text: "Toute l'équipe attend que tu ouvres le point d'entrée du site avec ton AWP. Un seul duel raté et c'est toute l'exécution qui s'effondre.",
    choices: [
      {
        label: "Prendre le duel en peek agressif",
        effects: { skill: 11, reputation: 5, mental: -6 },
        result: "Le duel tombe en ta faveur. L'exécution peut suivre sans accroc.",
      },
      {
        label: "Jouer passif et attendre une meilleure fenêtre",
        effects: { mental: 7, skill: -2 },
        result: "Tu perds un peu de temps, mais tu évites le duel à sens unique.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    role: "awper",
    eyebrow: "Counter-Strike 2 — AWPer",
    title: "La pression du seul kill qui compte",
    text: "En manche de match point, toute l'équipe attend un seul pick de ta part pour lancer l'exécution. C'est le genre de moment où l'AWPer porte toute l'équipe sur ses épaules.",
    choices: [
      {
        label: "Prendre une position extrêmement agressive",
        effects: { skill: 12, reputation: 6, mental: -8 },
        result: "Le pick tombe. La salle explose — et ta réputation de clutch player avec elle.",
      },
      {
        label: "Jouer une position sûre et laisser l'équipe construire autour",
        effects: { mental: 8, skill: 1 },
        result: "Moins de gloire individuelle, mais une manche construite collectivement.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    role: "rifler",
    eyebrow: "Counter-Strike 2 — Rifler / Entry",
    title: "Premier au contact",
    text: "Ton rôle d'entry fragger t'oblige à ouvrir chaque site en premier, exposé avant tout le monde. La pression psychologique de ce rôle est immense, match après match.",
    choices: [
      {
        label: "Foncer en premier sans hésiter",
        effects: { skill: 10, reputation: 5, mental: -6 },
        result: "L'entrée passe. Le reste de l'équipe peut suivre dans ton sillage.",
      },
      {
        label: "Ralentir l'exécution pour sécuriser l'info avant d'entrer",
        effects: { mental: 7, skill: -1 },
        result: "Une approche plus prudente, qui rassure un peu plus le reste du groupe.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    role: "rifler",
    eyebrow: "Counter-Strike 2 — Rifler / Entry",
    title: "Le trade qui sauve le round",
    text: "Ton coéquipier vient de tomber en duel. Tu es en position de le venger immédiatement, mais ça t'expose à ton tour à un deuxième adversaire.",
    choices: [
      {
        label: "Foncer venger ton coéquipier immédiatement",
        effects: { skill: 9, mental: -5 },
        result: "Le trade fonctionne. L'équipe reste à effectif égal pour la suite de la manche.",
      },
      {
        label: "Te replier et laisser filer le trade",
        effects: { mental: 6, skill: -2 },
        result: "Tu restes en vie, mais l'équipe se retrouve en désavantage numérique.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    eyebrow: "Counter-Strike 2 — DreamHack Masters Marseille",
    title: "Devant un public français en délire",
    text: "DreamHack Masters Marseille t'amène pour la première fois devant une foule française. L'ambiance est électrique, presque déstabilisante.",
    choices: [
      {
        label: "Te nourrir de l'énergie de la foule",
        effects: { reputation: 9, mental: 6, skill: 3 },
        result: "L'ambiance te porte. Tu livres l'une des meilleures performances de ta carrière.",
      },
      {
        label: "Bloquer le bruit et garder ta bulle de concentration",
        effects: { mental: 4, skill: 5 },
        result: "Tu restes performant, mais tu rates un moment de connexion avec le public.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    eyebrow: "Counter-Strike 2 — Major, manche économique",
    title: "Eco round ou tout miser ?",
    text: "Ton équipe est à sec après une manche perdue contre {OPPONENT} en Major. La gestion économique fait souvent toute la différence en playoffs. Le capitaine hésite à forcer un semi-buy risqué.",
    choices: [
      {
        label: "Forcer un semi-buy et prendre le round",
        effects: { skill: 8, reputation: 6, mental: -6 },
        result: "Le pari économique passe de justesse. La salle explose, ton cœur aussi.",
      },
      {
        label: "Rester sur l'éco et préserver le fullbuy",
        effects: { mental: 7, skill: -2 },
        result: "Round sacrifié, mais l'équipe revient armée jusqu'aux dents la manche suivante.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cs2",
    eyebrow: "Counter-Strike 2 — Major, Grande Finale",
    title: "Soulever le trophée du Major",
    text: "Tu es en finale du Major à {LOCATION}, contre {RIVAL} et son équipe {OPPONENT}, l'événement le plus prestigieux du jeu. Le stade est plein, la tension à son comble sur la dernière manche.",
    choices: [
      {
        label: "Forcer un clutch tout ou rien",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Un clutch entré dans la légende du jeu — au prix d'une pression immense.",
      },
      {
        label: "Jouer le round avec l'équipe, sans forcer",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une victoire collective, moins spectaculaire individuellement mais tout aussi payante.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    eyebrow: "Valorant — Premier",
    title: "Une division qui grimpe vite",
    text: "Ton équipe cartonne en Valorant Premier, le circuit compétitif ouvert de Riot. Les résultats commencent à attirer l'attention de recruteurs qui suivent la scène amateur de près.",
    choices: [
      {
        label: "Pousser un style spectaculaire pour attirer l'œil des recruteurs",
        effects: { reputation: 6, mental: -4, skill: 2 },
        result: "Les clips circulent bien, mais le style à haut risque use les nerfs plus vite que prévu.",
      },
      {
        label: "Jouer un style solide en équipe pour maximiser vos résultats",
        effects: { skill: 5, mental: 3 },
        result: "Moins de moments spectaculaires, mais une équipe qui monte sereinement dans le classement.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    eyebrow: "Valorant — VCT Ascension",
    title: "Une place en ligue ascendante",
    text: "Le circuit VCT Ascension est ta porte d'entrée vers le haut niveau. Une victoire ici peut t'ouvrir les portes d'une franchise VCT.",
    choices: [
      {
        label: "Proposer des compositions d'agents non conventionnelles",
        effects: { skill: 8, reputation: 6, mental: -5 },
        result: "Le pari tactique paie : les analystes commentent déjà ton style de jeu.",
      },
      {
        label: "Jouer une meta éprouvée",
        effects: { mental: 6, skill: 1 },
        result: "Rien de flashy, mais une qualification propre et nette.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    dynamic: "league",
    eyebrow: "Valorant — {LEAGUE}",
    title: "Promu en ligue franchisée",
    text: "Ton équipe est promue en {LEAGUE}, l'une des ligues franchisées régionales du circuit VCT. Un budget, une infrastructure, et une pression toute nouvelle.",
    choices: [
      {
        label: "Proposer de nouveaux agents dès la première semaine",
        effects: { skill: 8, reputation: 6, mental: -5 },
        result: "Le pari surprend une ligue habituée à des metas bien installées.",
      },
      {
        label: "T'intégrer progressivement à l'effectif",
        effects: { mental: 6, skill: 3 },
        result: "Une intégration en douceur qui construit une vraie alchimie collective.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "duelist",
    eyebrow: "Valorant — Duelist",
    title: "Créer l'espace, coûte que coûte",
    text: "Toute l'exécution de ton équipe repose sur ta capacité à entrer en premier et à créer l'espace nécessaire. Un mauvais duel et c'est toute la stratégie qui s'effondre.",
    choices: [
      {
        label: "Utiliser ton ultime dès la première rotation",
        effects: { skill: 10, reputation: 5, mental: -6 },
        result: "L'entrée passe en force. Le site est ouvert pour le reste de l'équipe.",
      },
      {
        label: "Attendre une meilleure fenêtre avant d'engager",
        effects: { mental: 7, skill: -2 },
        result: "Tu perds un peu de tempo, mais tu évites le duel à sens unique.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "duelist",
    eyebrow: "Valorant — Duelist",
    title: "Le premier kill qui déséquilibre tout",
    text: "En manche décisive, l'équipe compte sur toi pour prendre l'avantage numérique dès les dix premières secondes du round.",
    choices: [
      {
        label: "Peek agressif immédiat",
        effects: { skill: 11, reputation: 6, mental: -7 },
        result: "Le pick tombe. Le round bascule instantanément en votre faveur.",
      },
      {
        label: "Jouer l'info avant de t'engager",
        effects: { mental: 8, skill: -1 },
        result: "Une entrée plus posée, qui rassure une équipe parfois trop dépendante de toi.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "controller",
    eyebrow: "Valorant — Controller",
    title: "Le fumigène qui bloque tout",
    text: "Le timing de ton utilitaire va déterminer si l'exécution de l'équipe passe ou échoue. Une seconde de retard et tout le plan s'écroule.",
    choices: [
      {
        label: "Poser l'utilitaire au tout dernier moment pour maximiser la surprise",
        effects: { skill: 9, reputation: 4, mental: -5 },
        result: "Le timing parfait laisse l'adversaire sans réaction possible.",
      },
      {
        label: "Poser l'utilitaire en avance pour sécuriser l'exécution",
        effects: { mental: 7, skill: -1 },
        result: "Moins spectaculaire, mais une exécution sans accroc.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "controller",
    eyebrow: "Valorant — Controller",
    title: "Retenir la zone ou repositionner ?",
    text: "L'adversaire pousse un site que tu contrôles seul avec ton utilitaire. Tenir la zone est risqué, mais l'abandonner donne un avantage énorme à l'ennemi.",
    choices: [
      {
        label: "Tenir la zone envers et contre tout",
        effects: { skill: 8, mental: -6 },
        result: "Le site tient. L'équipe salue une abnégation qui ne fera jamais un highlight.",
      },
      {
        label: "Repositionner et sacrifier la zone",
        effects: { mental: 7, skill: -2 },
        result: "Une retraite tactique qui évite le pire, au prix d'un terrain concédé.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "initiator",
    eyebrow: "Valorant — Initiator",
    title: "Le flash qui ouvre la voie",
    text: "Avant chaque exécution, c'est à toi de neutraliser la vision adverse. Un flash mal timé expose toute l'équipe au lieu de la protéger.",
    choices: [
      {
        label: "Flasher en aveugle et faire confiance à l'équipe",
        effects: { skill: 9, reputation: 4, mental: -5 },
        result: "Le timing est parfait. L'équipe entre sans perdre un joueur.",
      },
      {
        label: "Récolter d'abord l'information avant de flasher",
        effects: { mental: 7, skill: -1 },
        result: "Une approche plus lente, mais nettement plus sûre pour tout le monde.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "initiator",
    eyebrow: "Valorant — Initiator",
    title: "Localiser l'ennemi avant l'assaut",
    text: "Ton utilitaire de détection peut révéler la position exacte de l'adversaire, mais l'utiliser trop tôt donne aussi ta propre position.",
    choices: [
      {
        label: "Utiliser la détection immédiatement pour informer l'équipe",
        effects: { skill: 8, reputation: 5, mental: -4 },
        result: "L'information change complètement le plan de l'équipe en votre faveur.",
      },
      {
        label: "Garder l'utilitaire en réserve pour plus tard dans le round",
        effects: { mental: 6, skill: 1 },
        result: "Une gestion plus prudente de tes ressources, payante sur la durée du match.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "sentinel",
    eyebrow: "Valorant — Sentinel",
    title: "Le flanc qui doit absolument tenir",
    text: "Pendant que le reste de l'équipe exécute un site, tu es seul à surveiller un flanc critique. Une seule erreur et l'exécution est prise à revers.",
    choices: [
      {
        label: "Poser ton utilitaire de verrouillage et t'engager pleinement",
        effects: { skill: 9, mental: -5 },
        result: "Le flanc tient. L'exécution se déroule sans la moindre surprise.",
      },
      {
        label: "Rester extrêmement prudent, quitte à retarder l'info",
        effects: { mental: 7, skill: -1 },
        result: "Une couverture solide, même si l'équipe attend un peu plus longtemps ton signal.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    role: "sentinel",
    eyebrow: "Valorant — Sentinel",
    title: "Le dernier rempart en retake",
    text: "L'adversaire vient de prendre le site. C'est à toi d'organiser le retake avec ton utilitaire, sachant qu'un mauvais placement peut coûter la manche entière.",
    choices: [
      {
        label: "Lancer le retake en forçant l'utilitaire offensif",
        effects: { skill: 10, reputation: 5, mental: -6 },
        result: "Le site est repris de justesse. La salle retient son souffle jusqu'au bout.",
      },
      {
        label: "Jouer la patience et attendre un meilleur momentum",
        effects: { mental: 8, skill: -1 },
        result: "Un choix plus prudent, qui laisse filer le round mais préserve l'équipe pour la suite.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    eyebrow: "Valorant — VCT Masters",
    title: "Le premier Masters international",
    text: "Ton premier VCT Masters t'oppose à des équipes venues du monde entier. Le décalage horaire et le dépaysement pèsent presque autant que le niveau de jeu adverse.",
    choices: [
      {
        label: "Adapter ton style à l'agressivité adverse",
        effects: { skill: 9, mental: -6, reputation: 6 },
        result: "Un pari payant qui déstabilise complètement l'adversaire.",
      },
      {
        label: "Rester fidèle à ton style habituel",
        effects: { mental: 7, skill: 2 },
        result: "Confortable mentalement, mais tu passes à côté d'un ajustement tactique clé.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    eyebrow: "Valorant — VCT Champions",
    title: "Ultimates synchronisées",
    text: "En Champions, tout se joue sur la synergie des ultimates. Le coach veut caler une combo à haut risque pile pour le round décisif — si le timing rate, c'est la fin de la manche.",
    choices: [
      {
        label: "Valider la combo à haut risque",
        effects: { skill: 10, reputation: 7, mental: -8 },
        result: "Le timing est parfait. Le clip tourne déjà sur tous les réseaux avant la fin du match.",
      },
      {
        label: "Jouer une rotation plus prudente",
        effects: { mental: 7, skill: -3 },
        result: "Moins spectaculaire, mais personne ne peut te reprocher d'avoir pris un risque inutile.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "valorant",
    eyebrow: "Valorant — VCT Champions, Grande Finale",
    title: "Le trophée mondial en jeu",
    text: "Tu es en finale de VCT Champions à {LOCATION}, face à {RIVAL} sous les couleurs de {OPPONENT}, la consécration ultime du jeu, devant un stade rempli de fans venus du monde entier.",
    choices: [
      {
        label: "Forcer un clutch en pistol round",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Le moment le plus regardé de ta carrière. Ton nom devient synonyme du jeu.",
      },
      {
        label: "Jouer un round collectif prudent",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une finale maîtrisée, sans prise de risque inutile.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    eyebrow: "Call of Duty — Ranked Play",
    title: "Premier du classement Ranked Play",
    text: "Tes performances en Ranked Play, le mode compétitif classé du jeu, ne passent plus inaperçues. Ton nom commence à circuler dans les cercles qui cherchent la prochaine pépite.",
    choices: [
      {
        label: "Multiplier les sessions pour grimper le plus vite possible",
        effects: { skill: 7, health: -4 },
        result: "Tu montes en flèche dans le classement, au prix de nuits de plus en plus courtes.",
      },
      {
        label: "Prendre ton temps et soigner chaque partie",
        effects: { skill: 4, mental: 4 },
        result: "Une progression plus lente, mais des bases solides et un mental au beau fixe.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    eyebrow: "Call of Duty — Ligue Challengers",
    title: "Le bas de l'échelle",
    text: "Le circuit Challengers est ta porte d'entrée vers la Call of Duty League. Une bonne performance ici peut te faire repérer par une franchise.",
    choices: [
      {
        label: "Jouer un style hyper agressif au fusil à pompe",
        effects: { skill: 8, reputation: 6, mental: -5 },
        result: "Un style clivant qui fait déjà parler de toi sur les réseaux compétitifs.",
      },
      {
        label: "Jouer un style posé et tactique",
        effects: { mental: 6, skill: 1 },
        result: "Efficace sans éclat, mais suffisant pour progresser.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "ar",
    eyebrow: "Call of Duty — AR",
    title: "Le pilier de chaque engagement",
    text: "En tant que fusil d'assaut principal, on attend de toi une présence constante à toutes les distances, sur tous les modes de jeu de la manche.",
    choices: [
      {
        label: "Prendre les duels longue distance sans relâche",
        effects: { skill: 9, mental: -5 },
        result: "Ta polyvalence impressionne les observateurs. L'équipe compte sur toi à chaque round.",
      },
      {
        label: "Te concentrer sur les zones où tu es le plus efficace",
        effects: { mental: 7, skill: -1 },
        result: "Une approche plus économe en énergie, qui te préserve pour les moments décisifs.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "ar",
    eyebrow: "Call of Duty — AR",
    title: "Tenir le milieu de carte à tout prix",
    text: "Le contrôle du milieu de carte détermine toute la dynamique de la manche. C'est à toi, en tant qu'AR, de t'y imposer face à l'adversaire.",
    choices: [
      {
        label: "Pousser agressivement pour prendre le contrôle total",
        effects: { skill: 10, reputation: 5, mental: -6 },
        result: "Le pari fonctionne. L'équipe entière profite de l'espace que tu viens d'ouvrir.",
      },
      {
        label: "Jouer une position défensive et stable",
        effects: { mental: 7, skill: -1 },
        result: "Moins spectaculaire, mais un contrôle solide qui limite les prises de risque inutiles.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "slayer",
    eyebrow: "Call of Duty — Slayer (SMG)",
    title: "Le corps-à-corps qui décide de tout",
    text: "Dans les couloirs étroits de la carte, c'est ta vitesse et ton agressivité au SMG qui doivent faire la différence, round après round.",
    choices: [
      {
        label: "Foncer en aveugle dans chaque duel rapproché",
        effects: { skill: 11, reputation: 5, mental: -7 },
        result: "Ton style hyper agressif fait des ravages — et des highlights à répétition.",
      },
      {
        label: "Jouer plus posé et attendre que l'adversaire s'expose",
        effects: { mental: 8, skill: -2 },
        result: "Une approche plus calculée, moins spectaculaire mais tout aussi efficace.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "slayer",
    eyebrow: "Call of Duty — Slayer (SMG)",
    title: "Le triple kill qui change la manche",
    text: "Une ouverture parfaite se présente pour enchaîner plusieurs éliminations d'affilée, au prix d'une exposition maximale si le premier duel est perdu.",
    choices: [
      {
        label: "Tenter l'enchaînement complet sans hésiter",
        effects: { skill: 12, reputation: 6, mental: -8 },
        result: "L'enchaînement passe intégralement. La salle explose devant ce moment de folie.",
      },
      {
        label: "Prendre un seul duel sûr et te replier ensuite",
        effects: { mental: 8, skill: 1 },
        result: "Un choix plus sage, qui garde l'équipe à effectif complet pour la suite.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "support",
    eyebrow: "Call of Duty — Support",
    title: "L'utilitaire qui ouvre l'espace",
    text: "Ton rôle ne se voit jamais au scoreboard, mais chaque flash et chaque fumigène que tu poses conditionne la réussite de tes coéquipiers.",
    choices: [
      {
        label: "Sacrifier ta propre sécurité pour poser l'utilitaire parfait",
        effects: { mental: 7, reputation: -3 },
        result: "Personne ne retiendra ton nom dans les highlights, mais l'équipe enchaîne les manches grâce à toi.",
      },
      {
        label: "Jouer plus prudent pour rester en vie plus longtemps",
        effects: { skill: 6, mental: -3 },
        result: "Tu restes en vie plus longtemps, au prix d'un soutien un peu moins généreux pour l'équipe.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "support",
    eyebrow: "Call of Duty — Support",
    title: "Le round où personne ne te voit jouer",
    text: "Tu passes toute la manche à fournir de l'information et de l'utilitaire, sans jamais prendre un duel toi-même. Le résultat dépendra entièrement des autres.",
    choices: [
      {
        label: "Continuer ce travail de l'ombre sans t'en plaindre",
        effects: { mental: 7, reputation: -2 },
        result: "L'équipe gagne la manche. Le crédit ira à d'autres, comme souvent.",
      },
      {
        label: "Prendre un risque personnel pour enfin exister au score",
        effects: { skill: 7, mental: -4 },
        result: "Un pari qui te fait sortir de l'ombre, au prix d'une utilité collective un peu réduite.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "flex",
    eyebrow: "Call of Duty — Flex",
    title: "S'adapter à la dernière minute",
    text: "Ton coach change la composition d'arme et de rôle juste avant la manche décisive. En tant que flex, c'est à toi de t'ajuster sans préparation.",
    choices: [
      {
        label: "Accepter le changement et improviser complètement",
        effects: { skill: 9, mental: -6 },
        result: "L'adaptation est impressionnante. Ta polyvalence devient un vrai atout stratégique.",
      },
      {
        label: "Négocier de garder ta configuration habituelle",
        effects: { mental: 7, skill: -2 },
        result: "Tu restes dans ta zone de confort, au prix d'une certaine rigidité tactique.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    role: "flex",
    eyebrow: "Call of Duty — Flex",
    title: "Le couteau suisse sacrifié tactiquement",
    text: "Le plan de l'équipe repose sur un rôle ingrat : toi. Tu dois couvrir plusieurs responsabilités à la fois, sans jamais être mis en valeur individuellement.",
    choices: [
      {
        label: "Endosser pleinement ce rôle de sacrifice tactique",
        effects: { mental: 8, reputation: -4 },
        result: "Le plan fonctionne à la perfection — mais ton nom n'apparaît nulle part dans les résumés.",
      },
      {
        label: "Réclamer un rôle plus clair et plus valorisant",
        effects: { reputation: 5, mental: -5 },
        result: "La discussion tend l'ambiance du groupe, mais clarifie enfin ta place dans le dispositif.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "Call of Duty League — Major",
    title: "Ton premier Major CDL",
    text: "Ton équipe dispute son premier Major de la saison à {LOCATION}, face à {OPPONENT}, avec des points de classement cruciaux pour la qualification aux Champs en fin d'année.",
    choices: [
      {
        label: "Jouer un style risqué pour maximiser les points",
        effects: { skill: 9, reputation: 6, mental: -6 },
        result: "Un pari payant qui vous propulse dans le haut du classement.",
      },
      {
        label: "Sécuriser un résultat correct sans forcer",
        effects: { mental: 7, skill: 2 },
        result: "Un résultat honnête, sans éclat particulier.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "Call of Duty League — Champs, Hardpoint",
    title: "Rotation à contre-temps",
    text: "En plein Hardpoint décisif au Champs contre {OPPONENT}, ton IGL appelle une rotation agressive vers le point adverse alors que le timer est encore favorable à la défense.",
    choices: [
      {
        label: "Suivre la rotation agressive",
        effects: { skill: 9, reputation: 6, mental: -6 },
        result: "Le push surprend l'adversaire. Risqué, mais ça paie devant une foule en délire.",
      },
      {
        label: "Tenir la position actuelle",
        effects: { mental: 7, skill: -2 },
        result: "Rotation refusée, le point reste sûr — moins spectaculaire mais net.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    requiresFlag: { name: "wentPro", value: true },
    eyebrow: "Call of Duty League — Champs, Grande Finale",
    title: "Le trophée des Champs en jeu",
    text: "Tu es en finale des Champs à {LOCATION}, contre {RIVAL} et son équipe {OPPONENT}, le point culminant de la saison Call of Duty League, devant un public en délire.",
    choices: [
      {
        label: "Forcer le push final all-in",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Un moment de bravoure qui entre dans les highlights de la saison.",
      },
      {
        label: "Jouer la position et laisser venir",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une victoire maîtrisée, sans prise de risque superflue.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "cod",
    requiresFlag: { name: "wentPro", value: false },
    eyebrow: "Call of Duty — Ligue Challengers, Grande Finale",
    title: "Le trophée amateur, ta dernière chance",
    text: "Sans contrat CDL, tu disputes quand même la grande finale du circuit Challengers, contre {RIVAL} — passé pro entre-temps chez {OPPONENT}, revenu en exhibition pour cette occasion. Moins de projecteurs, mais la même envie de gagner.",
    choices: [
      {
        label: "Forcer le push final all-in",
        effects: { skill: 13, reputation: 12, mental: -8, health: -5 },
        result: "Un moment de bravoure qui circule bien au-delà du cercle des Challengers.",
      },
      {
        label: "Jouer la position et laisser venir",
        effects: { skill: 5, reputation: 6, mental: 5 },
        result: "Une victoire maîtrisée, sans prise de risque superflue.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    eyebrow: "Rainbow Six Siege — Ranked",
    title: "Repéré en Ranked",
    text: "Tes matchs classés enchaînent les clutchs et les lectures de site propres. Une petite structure qui suit la scène amateur de près commence à te suivre après chaque session.",
    choices: [
      {
        label: "Multiplier les sessions pour confirmer ton niveau",
        effects: { skill: 7, health: -4 },
        result: "Ton classement grimpe vite, au prix de nuits de plus en plus courtes.",
      },
      {
        label: "Jouer moins mais analyser chaque partie à froid",
        effects: { skill: 5, mental: 4 },
        result: "Une progression plus lente, mais une vraie compréhension du jeu qui s'installe.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    dynamic: "league",
    eyebrow: "Rainbow Six Siege — {LEAGUE}",
    title: "Première saison en ligue officielle",
    text: "Ta première saison complète en {LEAGUE}. Le format best-of-3 en élimination directe ne laisse aucune place à l'erreur — chaque round compte double.",
    choices: [
      {
        label: "Jouer un style disciplined, zéro prise de risque",
        effects: { mental: 7, reputation: 4 },
        result: "Une saison propre, sans éclat individuel mais sans accroc non plus.",
      },
      {
        label: "Prendre des risques pour marquer les esprits",
        effects: { skill: 8, reputation: 6, mental: -5 },
        result: "Une saison en dents de scie, mais ton nom commence à circuler dans les cercles pros.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    optional: true,
    eyebrow: "Rainbow Six Siege — Salle de scrim",
    title: "La strat ou l'instinct",
    text: "Le coach a préparé un default hyper précis pour ce round : chaque joueur a un rôle, un timing, une zone. Mais en plein money round, tu sens une ouverture différente, un move perso qui pourrait tout changer.",
    choices: [
      {
        label: "Respecter la strat à la lettre",
        effects: { reputation: 5, mental: 4 },
        result: "Le round se déroule exactement comme prévu — solide, prévisible, efficace.",
      },
      {
        label: "Tenter ton move perso, au risque de tout faire foirer",
        effects: { skill: 8, reputation: -4, mental: -3 },
        result: "Un pari individuel qui paie... cette fois. Le coach n'est pas franchement ravi sur le moment.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    optional: true,
    eyebrow: "Rainbow Six Siege — Ban Phase",
    title: "Le ban qui fait mal",
    text: "Avant le premier round, ton équipe doit choisir quel opérateur bannir à l'adversaire. Deux options se dégagent : neutraliser leur pick signature, ou garder de la flexibilité pour votre propre stratégie.",
    choices: [
      {
        label: "Bannir leur opérateur signature",
        effects: { reputation: 6, skill: 2 },
        result: "L'adversaire perd son plan A en plein direct — un coup psychologique fort.",
      },
      {
        label: "Préserver votre flexibilité stratégique",
        effects: { skill: 6, mental: 3 },
        result: "Moins spectaculaire, mais votre propre plan de jeu reste intact.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    optional: true,
    eyebrow: "Rainbow Six Siege — Phase de préparation",
    title: "Rester au site ou partir en roam",
    text: "Le round commence. Rester ancré au site garantit une défense solide ; partir en roam permet de glaner de l'info et de désorganiser le rush adverse, au prix d'un site moins gardé.",
    choices: [
      {
        label: "Ancrer la position et défendre le site",
        effects: { mental: 6, reputation: 3 },
        result: "Une défense propre, sans surprise ni prise de risque inutile.",
      },
      {
        label: "Partir en roam pour perturber leur exécution",
        effects: { skill: 7, health: -3 },
        result: "Le pick en amont désorganise leur attaque — mais toi, tu es maintenant seul, loin du site.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    optional: true,
    eyebrow: "Rainbow Six Siege — Salle de review",
    title: "Anti-strater à outrance",
    text: "L'équipe d'analystes a décortiqué chaque VOD de l'adversaire. Vous connaissez leurs habitudes par cœur — mais jouer purement en anti-strat, c'est aussi laisser de côté votre propre identité de jeu.",
    choices: [
      {
        label: "Tout miser sur l'anti-strat préparé",
        effects: { reputation: 7, skill: -2 },
        result: "Le plan fonctionne à la perfection tant que l'adversaire ne s'adapte pas — mais le jour où ils changent, vous êtes à découvert.",
      },
      {
        label: "Garder votre identité de jeu, quitte à ignorer certains reads",
        effects: { skill: 6, mental: 4 },
        result: "Vous restez fidèles à vous-mêmes, pour le meilleur et pour le pire.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    optional: true,
    eyebrow: "Rainbow Six Siege — Setup défensif",
    title: "Renforcer ou garder les murs souples",
    text: "Le temps de préparation touche à sa fin. Renforcer tous les murs clés sécurise le site, mais réduit vos propres options de rotation et de surprise en défense.",
    choices: [
      {
        label: "Tout renforcer pour verrouiller le site",
        effects: { mental: 5, reputation: 4 },
        result: "Le site est une forteresse — au prix d'une défense plus rigide et prévisible.",
      },
      {
        label: "Garder des murs souples pour improviser",
        effects: { skill: 6, health: -2 },
        result: "Vous gagnez en flexibilité, mais chaque brèche imprévue met vraiment la pression.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    optional: true,
    eyebrow: "Rainbow Six Siege — Prolongation",
    title: "Les nerfs à vif en overtime",
    text: "3-3, prolongation. Chaque round pèse désormais le poids d'une finale. La pression monte dans le vocal, chaque erreur individuelle devient inexcusable.",
    choices: [
      {
        label: "Prendre le lead vocal et rassurer l'équipe",
        effects: { mental: 8, reputation: 5 },
        result: "Ton sang-froid déteint sur tout le groupe — l'équipe traverse la prolongation solidée.",
      },
      {
        label: "Te murer dans ta bulle et jouer instinctivement",
        effects: { skill: 7, mental: -4 },
        result: "Ton jeu individuel prend le dessus — impressionnant à voir, épuisant à vivre.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    eyebrow: "Rainbow Six Siege — Six Major",
    title: "Ton premier Major",
    text: "Le Six Major à {LOCATION} réunit l'élite mondiale sur une LAN unique, dont {OPPONENT} en grand favori. La production est massive, la pression aussi — chaque round est commenté en direct devant des milliers de spectateurs.",
    choices: [
      {
        label: "Jouer offensif dès l'entame pour prendre le contrôle",
        effects: { skill: 10, reputation: 8, mental: -6 },
        result: "Un début de tournoi fracassant qui met immédiatement la pression sur le reste du bracket.",
      },
      {
        label: "Jouer patient et laisser le tournoi venir à toi",
        effects: { mental: 7, skill: 4 },
        result: "Une approche posée qui paie sur la durée, sans jamais voler la vedette.",
      },
    ],
  },
  {
    discipline: "fps",
    game: "r6",
    eyebrow: "Rainbow Six Siege — Six Invitational, Grande Finale",
    title: "Le trophée du Six Invitational en jeu",
    text: "Tu es en finale du Six Invitational à {LOCATION}, le championnat du monde de la scène, face à {RIVAL} sous les couleurs de {OPPONENT}. Le format best-of-5 s'annonce interminable, et l'issue peut basculer sur un seul retake mal négocié.",
    choices: [
      {
        label: "Tenter le pari tout ou rien sur le dernier round",
        effects: { skill: 14, reputation: 16, mental: -10, health: -5 },
        result: "La série la plus folle de ta carrière. On en reparlera encore des années après.",
      },
      {
        label: "Jouer un round posé, sans forcer l'exploit",
        effects: { skill: 6, reputation: 8, mental: 4 },
        result: "Une victoire construite méthodiquement, sans coup d'éclat individuel.",
      },
    ],
  },
  {
    discipline: "fps",
    eyebrow: "Réseaux sociaux",
    title: "Un clip viral… pour la mauvaise raison",
    text: "{RIVAL} poste un clip te montrant en train de rater une action facile. Les commentaires toxiques s'accumulent sous la vidéo.",
    choices: [
      {
        label: "Répondre aux trolls en commentaire",
        effects: { reputation: -10, mental: -10 },
        result: "La polémique enfle. Tu passes ta soirée à te justifier au lieu de t'entraîner.",
      },
      {
        label: "Ignorer et retourner en salle d'entraînement",
        effects: { mental: 6, skill: 6, reputation: -4 },
        result: "Tu canalises ta frustration dans le viseur. Ton aim n'a jamais été aussi propre — mais tu laisses la narration de l'histoire aux autres.",
      },
    ],
  },
  {
    discipline: "br",
    eyebrow: "Réseaux sociaux — Scène Battle Royale",
    title: "{RIVAL} te clash en direct",
    text: "{RIVAL}, streamer influent de la scène, te clash pendant un live regardé par des dizaines de milliers de personnes, juste avant un gros tournoi.",
    choices: [
      {
        label: "Répondre en direct sur ton propre stream",
        effects: { reputation: 12, mental: -8 },
        result: "Le clash devient viral. Ta communauté grandit, mais la pression aussi.",
      },
      {
        label: "Ignorer et couper les notifications",
        effects: { mental: 8, reputation: -3 },
        result: "Tu restes concentré sur ta préparation, loin du bruit des réseaux.",
      },
    ],
  },
  {
    discipline: "br",
    game: "fortnite",
    eyebrow: "Fortnite — Mode Arena",
    title: "Grinder les points de division",
    text: "Le mode Arena est ta porte d'entrée vers les tournois officiels. Chaque point de division compte pour espérer un jour disputer la FNCS.",
    choices: [
      {
        label: "Jouer agressif pour multiplier les éliminations",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Ton style spectaculaire attire déjà des abonnés sur les plateformes de stream.",
      },
      {
        label: "Jouer prudent pour sécuriser le placement",
        effects: { mental: 6, skill: 1 },
        result: "Moins de highlights, mais une progression stable en division.",
      },
    ],
  },
  {
    discipline: "br",
    game: "fortnite",
    dynamic: "league",
    eyebrow: "Fortnite — Circuit {LEAGUE}",
    title: "Une place parmi les meilleurs de ta région",
    text: "Tu intègres le haut du classement du circuit {LEAGUE}. La concurrence régionale est redoutable, et chaque cash cup compte pour la qualification à la FNCS.",
    choices: [
      {
        label: "Enchaîner les cash cups sans lever le pied",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Un rythme effréné qui paie en points de classement, au prix de nuits courtes.",
      },
      {
        label: "Choisir tes tournois avec parcimonie",
        effects: { mental: 6, skill: 2 },
        result: "Moins de points engrangés, mais une fraîcheur mentale précieuse pour la suite.",
      },
    ],
  },
  {
    discipline: "br",
    game: "fortnite",
    eyebrow: "Fortnite — FNCS",
    title: "Ta première FNCS",
    text: "Ta première Fortnite Champion Series t'oppose aux meilleurs joueurs de ta région. Le moindre édit raté peut coûter la partie entière.",
    choices: [
      {
        label: "Tenter des builds spectaculaires en zone finale",
        effects: { skill: 9, reputation: 7, mental: -6 },
        result: "Un final building de folie qui enflamme le chat en direct.",
      },
      {
        label: "Jouer une rotation discrète et sécuritaire",
        effects: { mental: 7, skill: 2 },
        result: "Un résultat correct, loin des projecteurs mais solide au classement.",
      },
    ],
  },
  {
    discipline: "br",
    game: "fortnite",
    eyebrow: "Fortnite — FNCS, Grande Finale mondiale",
    title: "Le sommet du battle royale",
    text: "Tu es en finale mondiale de la FNCS à {LOCATION}, avec {RIVAL} dans le dernier cercle, la compétition la plus prestigieuse de Fortnite, avec un prize pool colossal à la clé.",
    choices: [
      {
        label: "Prendre tous les risques en zone finale",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Une victoire de folie qui fait le tour de toutes les plateformes de streaming.",
      },
      {
        label: "Jouer la survie et le placement",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Un résultat solide et sans accroc, construit sur la patience.",
      },
    ],
  },
  {
    discipline: "br",
    game: "apex",
    eyebrow: "Apex Legends — Ranked Leagues",
    title: "Grimper en Predator",
    text: "Atteindre le rang Predator est ton ticket d'entrée vers les tournois officiels ALGS. La compétition en ranked est presque aussi féroce qu'en tournoi.",
    choices: [
      {
        label: "Chercher les fights à chaque rencontre",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Un style hyper agressif qui te fait grimper vite — ou redescendre tout aussi vite.",
      },
      {
        label: "Jouer pour les points de placement",
        effects: { mental: 6, skill: 1 },
        result: "Une progression lente mais régulière vers le rang visé.",
      },
    ],
  },
  {
    discipline: "br",
    game: "apex",
    dynamic: "league",
    eyebrow: "Apex Legends — Circuit régional {LEAGUE}",
    title: "Une place parmi l'élite régionale",
    text: "Ton équipe s'impose sur le circuit {LEAGUE}, l'un des trois grands pôles régionaux du jeu. La qualification pour l'ALGS dépend directement de ton classement ici.",
    choices: [
      {
        label: "Chercher les kills partout où c'est possible",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Un style spectaculaire qui te fait déjà remarquer par les observateurs de la scène.",
      },
      {
        label: "Jouer pour le placement, partie après partie",
        effects: { mental: 6, skill: 2 },
        result: "Une régularité payante qui construit un classement solide.",
      },
    ],
  },
  {
    discipline: "br",
    game: "apex",
    eyebrow: "Apex Legends — ALGS",
    title: "Ton premier tournoi ALGS",
    text: "Ta première Apex Legends Global Series t'oppose à des équipes du monde entier sur un format de points cumulés sur plusieurs parties. La régularité compte autant que le clutch.",
    choices: [
      {
        label: "Foncer sur les kills dès le début de partie",
        effects: { skill: 9, reputation: 6, mental: -6 },
        result: "Une stratégie payante qui vous propulse au sommet du classement provisoire.",
      },
      {
        label: "Jouer la régularité sur l'ensemble des parties",
        effects: { mental: 7, skill: 2 },
        result: "Un classement solide, construit partie après partie.",
      },
    ],
  },
  {
    discipline: "br",
    game: "apex",
    eyebrow: "Apex Legends — ALGS Championship, Grande Finale",
    title: "Le trophée mondial en jeu",
    text: "Tu es en finale du Championnat ALGS à {LOCATION}, {RIVAL} campant la même zone que toi, la consécration ultime du jeu, avec des millions de dollars de prize pool en jeu sur la dernière partie.",
    choices: [
      {
        label: "Forcer le dernier ring en solo contre plusieurs équipes",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Un exploit solo qui restera gravé dans l'histoire du jeu.",
      },
      {
        label: "Jouer la prudence et les points cumulés",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une victoire au classement, construite sans prise de risque inutile.",
      },
    ],
  },
  {
    discipline: "fight",
    eyebrow: "Session communautaire — FGC",
    title: "Un vétéran de la scène te teste en session",
    text: "Un joueur respecté de la communauté locale te propose une session de sets avant le tournoi, réputée sans pitié envers les jeunes joueurs.",
    choices: [
      {
        label: "Accepter et encaisser les critiques directes",
        effects: { skill: 8, mental: -6 },
        result: "Les retours sont durs mais justes. Ton jeu progresse vite.",
      },
      {
        label: "Décliner poliment et préparer seul",
        effects: { mental: 6, skill: -2 },
        result: "Tu gardes ta confiance intacte, mais tu passes à côté de retours précieux.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "sf6",
    eyebrow: "Street Fighter 6 — Circuit local",
    title: "Premiers pas en tournoi local",
    text: "Ton premier tournoi local de quartier, sur cabinet arcade, devant une trentaine de spectateurs. C'est ici que beaucoup de champions ont commencé.",
    choices: [
      {
        label: "Tenter des combos risqués pour impressionner",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Le pari fonctionne, et ton nom commence à circuler dans le milieu local.",
      },
      {
        label: "Jouer un style solide et défensif",
        effects: { mental: 6, skill: 1 },
        result: "Une victoire sans éclat particulier, mais qui construit ta réputation de joueur fiable.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "sf6",
    dynamic: "league",
    eyebrow: "Street Fighter 6 — {LEAGUE}",
    title: "Ton premier gros tournoi hors ligne",
    text: "{LEAGUE} rassemble des centaines de joueurs venus de tout le pays. C'est un cran au-dessus de ton circuit local, avec des adversaires bien plus expérimentés.",
    choices: [
      {
        label: "Foncer en bracket ouvert sans complexe",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Tu élimines plusieurs joueurs réputés, et ton nom commence à circuler au-delà de ta région.",
      },
      {
        label: "Jouer prudent pour apprendre du haut niveau",
        effects: { mental: 6, skill: 3 },
        result: "Une sortie rapide du tournoi, mais des heures de replays précieuses à étudier.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "sf6",
    eyebrow: "Street Fighter 6 — Capcom Cup",
    title: "Ta première Capcom Cup",
    text: "La Capcom Cup rassemble l'élite mondiale du jeu. Ton adversaire du jour est réputé injouable en neutral game.",
    choices: [
      {
        label: "Jouer un mix-up agressif dès le premier round",
        effects: { skill: 9, reputation: 6, mental: -6 },
        result: "Le style paie, tu déstabilises complètement ton adversaire.",
      },
      {
        label: "Jouer patient et attendre l'erreur adverse",
        effects: { mental: 7, skill: 2 },
        result: "Un jeu propre et méthodique qui t'amène à la manche décisive.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "sf6",
    eyebrow: "Street Fighter 6 — EVO, Grande Finale",
    title: "Le Grand Final d'EVO",
    text: "Tu es en grande finale d'EVO à Las Vegas, face à {RIVAL}, le tournoi le plus mythique du jeu de combat, devant une salle en pleine ébullition.",
    choices: [
      {
        label: "Tenter le combo optimal frame-parfait",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Une exécution parfaite qui entre directement dans les annales d'EVO.",
      },
      {
        label: "Jouer solide sans forcer l'exécution",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une victoire propre, sans prise de risque superflue.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "tekken8",
    eyebrow: "Tekken 8 — Circuit local",
    title: "Premiers pas en tournoi local",
    text: "Ton premier tournoi local sur borne d'arcade, dans une salle bondée. L'ambiance est électrique pour un événement aussi modeste.",
    choices: [
      {
        label: "Tenter des juggles risqués pour marquer les esprits",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Le pari fonctionne, la petite salle est en feu.",
      },
      {
        label: "Jouer un style défensif et posé",
        effects: { mental: 6, skill: 1 },
        result: "Une victoire sans éclat, mais qui pose les bases de ta réputation locale.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "tekken8",
    dynamic: "league",
    eyebrow: "Tekken 8 — {LEAGUE}",
    title: "Ton premier gros tournoi hors ligne",
    text: "{LEAGUE} rassemble des centaines de joueurs venus de tout le pays. C'est un cran au-dessus de ton circuit local, avec des adversaires bien plus expérimentés.",
    choices: [
      {
        label: "Foncer en bracket ouvert sans complexe",
        effects: { skill: 8, reputation: 5, mental: -5 },
        result: "Tu élimines plusieurs joueurs réputés, et ton nom commence à circuler au-delà de ta région.",
      },
      {
        label: "Jouer prudent pour apprendre du haut niveau",
        effects: { mental: 6, skill: 3 },
        result: "Une sortie rapide du tournoi, mais des heures de replays précieuses à étudier.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "tekken8",
    eyebrow: "Tekken 8 — Tekken World Tour, Masters",
    title: "Ton premier Masters du circuit mondial",
    text: "Le Tekken World Tour Masters rassemble les meilleurs joueurs de la région. Ton adversaire est connu pour sa lecture d'adversaire redoutable.",
    choices: [
      {
        label: "Varier constamment ton style pour brouiller les pistes",
        effects: { skill: 9, reputation: 6, mental: -6 },
        result: "La stratégie déstabilise complètement ton adversaire, habitué à lire des patterns fixes.",
      },
      {
        label: "Rester fidèle à ton style habituel",
        effects: { mental: 7, skill: 2 },
        result: "Confortable, mais prévisible face à un adversaire qui te lit bien.",
      },
    ],
  },
  {
    discipline: "fight",
    game: "tekken8",
    eyebrow: "Tekken 8 — Tekken World Tour Finals, Grande Finale",
    title: "Le trophée mondial en jeu",
    text: "Tu es en grande finale des Tekken World Tour Finals à {LOCATION}, face à {RIVAL}, la consécration ultime du circuit mondial, devant un public conquis.",
    choices: [
      {
        label: "Tenter le juggle optimal frame-parfait",
        effects: { skill: 15, reputation: 18, mental: -10, health: -5 },
        result: "Une exécution légendaire qui entre directement dans l'histoire du jeu.",
      },
      {
        label: "Jouer solide sans forcer l'exécution",
        effects: { skill: 5, reputation: 8, mental: 5 },
        result: "Une victoire propre, construite sur la solidité plutôt que le spectacle.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Rumeurs de vestiaire",
    title: "{ALLY} signe ailleurs",
    text: "La nouvelle tombe sans prévenir : {ALLY}, ton binôme de toujours, vient de signer chez une organisation concurrente. Vous étiez inséparables il y a encore quelques semaines.",
    choices: [
      {
        label: "Lui envoyer un message sincère malgré la déception",
        effects: { mental: 8, reputation: 3 },
        result: "La relation reste cordiale, même si une page importante se tourne.",
      },
      {
        label: "Couper les ponts et transformer ça en motivation",
        effects: { skill: 8, mental: -6 },
        result: "La rupture nourrit une rage compétitive nouvelle, canalisée à l'entraînement.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Interview d'après-match",
    title: "Un jeu extraordinaire, mais qui n'inspire personne",
    text: "Les analystes s'accordent : ton niveau de jeu est au sommet de la discipline. Mais ton style, purement optimisé, n'a jamais fait vibrer une foule. Ton agent te pousse à 'te vendre' davantage.",
    choices: [
      {
        label: "Continuer d'optimiser ton jeu à l'extrême, sans te soucier du spectacle",
        effects: { skill: 14, reputation: -12, mental: -3 },
        result: "Ton niveau de jeu devient une référence technique — mais personne ne regarde tes matchs pour le plaisir des yeux.",
      },
      {
        label: "Ajouter du spectacle et de la personnalité à ton jeu",
        effects: { skill: 3, reputation: 8 },
        result: "Le public commence à s'attacher à toi, même si ton jeu perd un peu de sa précision chirurgicale.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Communauté — Chasse aux tricheurs",
    title: "Une accusation de triche enflamme les réseaux",
    text: "Un clip sorti de son contexte te montre en train de réagir à un ennemi caché avant qu'il n'apparaisse à l'écran. La communauté s'enflamme et réclame une enquête.",
    choices: [
      {
        label: "Publier tes configs et coopérer pleinement avec l'enquête",
        effects: { reputation: 8, mental: -6 },
        result: "La transparence totale calme la polémique, mais l'expérience laisse une marque.",
        flag: { name: "cheatCloud", value: false },
      },
      {
        label: "Ignorer, la vérité n'a pas besoin de preuve",
        effects: { mental: 6, reputation: -8 },
        result: "Le doute persiste dans un coin de la communauté, prêt à ressurgir au moindre prétexte.",
        flag: { name: "cheatCloud", value: true },
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Off-season — Bilan personnel",
    title: "Une saison sans un seul trophée",
    text: "Après une saison entière sans le moindre résultat marquant, les critiques pleuvent sur les réseaux et en interview. Ton contrat arrive à échéance dans quelques mois.",
    choices: [
      {
        label: "Redoubler d'efforts en solo, quitte à t'isoler",
        effects: { skill: 10, mental: -10, health: -5 },
        result: "Tu progresses individuellement, mais tu t'éloignes de plus en plus de ton équipe et de tes proches.",
      },
      {
        label: "Prendre du recul et souffler avec tes proches",
        effects: { mental: 10, skill: -3 },
        result: "Tu reviens plus léger mentalement, même si ton niveau de jeu a un peu stagné.",
      },
    ],
  },
  {
    discipline: "all",
    dynamic: "team_top",
    eyebrow: "Mercato — Grande organisation",
    title: "Une offre de {TEAM}",
    text: "En fin de contrat, l'organisation {TEAM} te fait une offre pour rejoindre son roster. Nouveau maillot, nouvelle pression, nouveaux coéquipiers à apprivoiser.",
    choices: [
      {
        label: "Signer chez {TEAM} et changer d'air",
        effects: { reputation: 10, mental: -5 },
        result: "Le transfert fait du bruit sur les réseaux. Il va falloir prouver ta valeur rapidement sous ces nouvelles couleurs.",
        setTeam: true,
        flag: { name: "wentPro", value: true },
      },
      {
        label: "Rester fidèle à ton équipe actuelle",
        effects: { mental: 8, reputation: -3 },
        result: "Tu restes sur des bases connues, loin des projecteurs du mercato.",
        flag: { name: "wentPro", value: false },
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Litige contractuel",
    title: "Ton agent a-t-il vraiment joué pour toi ?",
    text: "Un audit indépendant révèle que ton agent touchait une commission occulte de la part de plusieurs sponsors, au détriment de tes propres gains. Il nie tout en bloc.",
    choices: [
      {
        label: "Engager un avocat et rompre le contrat",
        effects: { reputation: 6, mental: -8 },
        result: "La procédure est longue et éprouvante, mais tu reprends le contrôle de ta carrière.",
      },
      {
        label: "Négocier un arrangement à l'amiable en silence",
        effects: { mental: 6, reputation: -4 },
        result: "L'affaire est étouffée rapidement, mais un goût amer persiste.",
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "cheatCloud", value: true },
    eyebrow: "Rebondissement — Nouvelle enquête",
    title: "Le doute te poursuit",
    text: "Une nouvelle enquête communautaire est ouverte à ton sujet, ravivée par un streameur en quête de buzz. Cette fois, la fédération du jeu s'en mêle officiellement.",
    choices: [
      {
        label: "Te soumettre volontairement à un contrôle complet",
        effects: { reputation: 10, mental: -8 },
        result: "L'examen te blanchit totalement. Le soulagement est immense, la cicatrice reste.",
      },
      {
        label: "Refuser par principe, au risque d'une suspension",
        effects: { reputation: -15, mental: -5 },
        result: "Ton refus est interprété comme un aveu par une partie du public, malgré ton innocence.",
        banEnding: true,
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "cheatCloud", value: false },
    eyebrow: "Après l'enquête",
    title: "Un nom lavé de tout soupçon",
    text: "L'enquête officielle confirme ce que tu savais depuis le début : aucune trace de triche. Ta transparence de l'époque continue de payer aujourd'hui.",
    choices: [
      {
        label: "Utiliser cette histoire pour sensibiliser la communauté",
        effects: { reputation: 8, mental: 4 },
        result: "Ton témoignage aide d'autres joueurs accusés à tort à traverser la même épreuve.",
      },
      {
        label: "Tourner la page sans en reparler",
        effects: { mental: 6 },
        result: "Tu préfères refermer ce chapitre et te concentrer sur la suite.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Salle d'entraînement — Incident",
    title: "Une douleur qui ne passe pas",
    text: "Pendant une session intensive, une douleur vive te bloque soudainement le dos. Le médecin de l'équipe est formel : il faut lever le pied, sous peine d'aggraver sérieusement les choses.",
    choices: [
      {
        label: "Repousser la douleur et rester sur le roster pour les échéances à venir",
        effects: { health: -18, skill: 4 },
        result: "Tu tiens le rythme, mais chaque match ajoute un peu plus de dégâts silencieux.",
        flag: { name: "injuryRest", value: false },
      },
      {
        label: "Suivre les recommandations médicales et faire une vraie pause",
        effects: { health: 6, reputation: -6, skill: -6 },
        result: "La compétition continue sans toi. Difficile à encaisser mentalement, mais ton corps t'en remerciera.",
        flag: { name: "injuryRest", value: true },
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "injuryRest", value: false },
    eyebrow: "L'addition arrive",
    title: "Le corps finit par réclamer son dû",
    text: "La douleur que tu ignorais depuis des mois explose d'un coup, en plein tournoi. Cette fois, impossible de faire comme si de rien n'était.",
    choices: [
      {
        label: "Accepter enfin une vraie pause, aussi frustrante soit-elle",
        effects: { health: 10, mental: -6, reputation: -4 },
        result: "Tu perds du temps de jeu précieux, mais tu évites probablement le pire.",
      },
      {
        label: "Jouer sur les nerfs et les anti-douleurs jusqu'au bout",
        effects: { health: -20, skill: 5 },
        result: "Tu tiens l'échéance, mais ton corps envoie des signaux de plus en plus inquiétants.",
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "injuryRest", value: true },
    eyebrow: "Retour de blessure",
    title: "Le grand retour, prudence de rigueur",
    text: "Après plusieurs semaines loin de la compétition, ton staff te propose un protocole de reprise progressif. Le retour est déjà très attendu par la communauté.",
    choices: [
      {
        label: "Suivre le protocole à la lettre, sans brûler les étapes",
        effects: { health: 10, mental: 6, skill: -4 },
        result: "Le timing est un peu long, mais tu reviens sur des bases saines et durables.",
      },
      {
        label: "Forcer un retour plus rapide pour ne pas perdre ta place",
        effects: { health: -10, skill: 6, mental: -4 },
        result: "Tu regagnes vite ton niveau, au prix d'un corps encore fragile.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Boîte mail",
    title: "Une proposition de sponsoring perso",
    text: "Une marque de périphériques gaming te propose un partenariat personnel — logo sur ton stream, code promo à ton nom. Rien d'énorme, mais ton propre deal, en dehors de celui de l'équipe.",
    choices: [
      {
        label: "Signer et intégrer leurs produits à ton setup",
        effects: { reputation: 7, skill: -2 },
        result: "Le chèque tombe bien, mais l'adaptation au nouveau matos te coûte un peu de précision les premiers jours.",
      },
      {
        label: "Décliner pour rester sur ton matériel habituel",
        effects: { mental: 5, skill: 3 },
        result: "Tu restes fidèle à tes habitudes. Moins rentable, mais zéro friction.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Sortie de tournoi",
    title: "Un fan te reconnaît dans la rue",
    text: "En sortant d'un fast-food après une session d'entraînement, un fan te reconnaît et te demande une photo, visiblement ému de te croiser en vrai.",
    choices: [
      {
        label: "Prendre le temps de discuter avec lui",
        effects: { reputation: 6, mental: 5 },
        result: "Un petit moment simple qui te rappelle pourquoi tout ça vaut le coup.",
      },
      {
        label: "Rester poli mais pressé, tu es épuisé",
        effects: { mental: -3, reputation: -2 },
        result: "Le fan comprend, mais un clip de l'échange un peu froid circule quand même le soir même.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Plateau télé",
    title: "Une interview qui dérape légèrement",
    text: "En interview d'après-match, le journaliste pousse une question piège sur la gestion interne de ton équipe. La caméra tourne, l'équipe regarde en direct depuis les loges.",
    choices: [
      {
        label: "Répondre franchement, quitte à créer des remous",
        effects: { reputation: 6, mental: -5 },
        result: "Ta franchise fait le buzz. En interne, tout le monde n'apprécie pas également.",
      },
      {
        label: "Rester diplomate et éviter le sujet",
        effects: { mental: 5, reputation: -2 },
        result: "Une réponse sans relief, oubliée dès le lendemain — exactement ce que tu voulais.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Messagerie privée",
    title: "Un pote d'enfance refait surface",
    text: "Un ami que tu n'as pas vu depuis le collège te retrouve sur les réseaux, impressionné par ce que tu es devenu. Il propose de se revoir, alors que ton calendrier est plus chargé que jamais.",
    choices: [
      {
        label: "Prendre le temps de le revoir malgré l'emploi du temps",
        effects: { mental: 8, skill: -3 },
        result: "Une soirée qui te reconnecte à qui tu étais avant tout ça — ça fait un bien fou.",
      },
      {
        label: "Repousser à plus tard, la saison est trop chargée",
        effects: { skill: 4, mental: -4 },
        result: "Tu restes concentré sur l'objectif, au prix d'un peu plus de solitude.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Collab",
    title: "Une proposition de collab avec un créateur",
    text: "Un créateur de contenu bien plus suivi que toi propose une vidéo commune — un format fun, loin du sérieux de la compétition, mais qui pourrait sembler léger vu de l'extérieur.",
    choices: [
      {
        label: "Accepter, l'exposition est trop belle à refuser",
        effects: { reputation: 8, mental: 4, skill: -3 },
        result: "La vidéo cartonne et te fait connaître d'un tout nouveau public.",
      },
      {
        label: "Décliner pour rester concentré sur la compétition",
        effects: { skill: 5, mental: -2 },
        result: "Une opportunité de moins, mais un planning d'entraînement intact.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Vestiaire — Tension",
    title: "Un clash public avec un coéquipier",
    text: "Une frustration accumulée depuis des semaines explose en plein live, entre toi et un coéquipier. Le clip fait déjà le tour des réseaux avant même la fin du stream.",
    choices: [
      {
        label: "Régler ça cash, en public, sans filtre",
        effects: { reputation: -6, mental: 5 },
        result: "Ça soulage sur le moment, mais l'image de l'équipe en prend un coup.",
      },
      {
        label: "Calmer le jeu et régler ça en privé plus tard",
        effects: { mental: -4, reputation: 4 },
        result: "Une tension qui reste sous la surface, gérée loin des caméras — pour l'instant.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Académie locale",
    title: "Coacher bénévolement de jeunes joueurs",
    text: "Un club local te propose de venir coacher gratuitement, une soirée par semaine, une équipe de jeunes qui rêvent de faire ce que tu fais.",
    choices: [
      {
        label: "Accepter, transmettre ça te tient à cœur",
        effects: { reputation: 6, mental: 6, skill: -2 },
        result: "Voir leurs progrès te reconnecte à ce qui t'a donné envie de commencer, il y a des années.",
      },
      {
        label: "Décliner, ton emploi du temps ne le permet pas",
        effects: { skill: 4 },
        result: "Un choix pragmatique, sans regret apparent — pour l'instant.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Mise à jour",
    title: "Un patch qui bouleverse toute la méta",
    text: "Une mise à jour majeure change en profondeur l'équilibrage du jeu, à quelques semaines d'une échéance importante. Tout ce que ton équipe avait préparé est à moitié obsolète.",
    choices: [
      {
        label: "Tout reprendre à zéro pour s'adapter à fond",
        effects: { skill: 8, mental: -6, health: -3 },
        result: "Des jours entiers passés à tout redécouvrir — épuisant, mais vous arrivez prêts.",
      },
      {
        label: "Ajuster à la marge et garder vos fondamentaux",
        effects: { mental: 6, skill: -3 },
        result: "Vous restez sur ce que vous maîtrisez déjà, quitte à être un temps en retard sur la méta.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Demi-finale — Ancien binôme",
    title: "Face à {ALLY}, de l'autre côté de l'écran",
    text: "Le tirage au sort t'oppose directement à {ALLY} en demi-finale. Vous vous connaissez par cœur, chaque habitude, chaque tic de jeu — la partie s'annonce aussi technique qu'émotionnelle.",
    choices: [
      {
        label: "Jouer sur ce que tu sais de son style",
        effects: { skill: 10, mental: -6, reputation: 6 },
        result: "Tu exploites vos années de scrims communes. Une victoire au goût amer.",
      },
      {
        label: "Faire abstraction du passé et jouer ta partie",
        effects: { mental: 8, skill: 2 },
        result: "Une partie propre, sans calcul, qui préserve le respect mutuel entre vous deux.",
      },
    ],
  },
  {
    discipline: "all",
    optional: true,
    eyebrow: "Riyad — Esports World Cup",
    title: "Une invitation à l'EWC",
    text: "Ton équipe reçoit une invitation pour disputer l'Esports World Cup, la compétition multi-jeux la plus riche du circuit. Le calendrier est brutal : voyages, décalage horaire, exposition médiatique maximale.",
    choices: [
      {
        label: "Accepter, c'est l'opportunité d'une carrière",
        effects: { reputation: 15, health: -8, mental: -4 },
        result: "Les projecteurs du monde entier se braquent sur toi. Le rythme est infernal, mais ton nom circule enfin à l'international.",
      },
      {
        label: "Décliner pour préserver ta préparation habituelle",
        effects: { mental: 8, reputation: -6 },
        result: "Tu rates une vitrine énorme, mais tu arrives reposé et affûté sur tes échéances prioritaires.",
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Centre d'entraînement",
    title: "Suivi psychologique",
    text: "Ton club te propose un accompagnement avec un psychologue du sport, comme le font déjà plusieurs équipes pro. Certains coéquipiers trouvent ça 'inutile pour de vrais gamers'.",
    choices: [
      {
        label: "Accepter le suivi",
        effects: { mental: 15, health: 5 },
        result: "Tu apprends à mettre des mots sur la pression. Ça change tout, en silence.",
        flag: { name: "psySupport", value: true },
      },
      {
        label: "Refuser, par fierté",
        effects: { mental: -10, reputation: 3 },
        result: "Tu gardes une image de dur à cuire, mais la pression continue de s'accumuler en silence.",
        flag: { name: "psySupport", value: false },
      },
    ],
  },
  {
    discipline: "all",
    eyebrow: "Salle de bootcamp",
    title: "Douleurs au poignet",
    text: "Depuis quelques jours, une douleur sourde au poignet apparaît après chaque longue session. La grande finale approche à grands pas.",
    choices: [
      {
        label: "Consulter un kiné et lever le pied",
        effects: { health: 15, skill: -5 },
        result: "Tu perds un peu de rythme, mais ton poignet tient enfin la distance.",
        flag: { name: "wristCare", value: true },
      },
      {
        label: "Ignorer la douleur, la finale avant tout",
        effects: { health: -20, skill: 8 },
        result: "Tu repousses tes limites. Ton poignet, lui, commence à te le faire payer — le mal est fait.",
        flag: { name: "wristCare", value: false },
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "wristCare", value: false },
    eyebrow: "Mi-carrière — Cabinet médical",
    title: "Le diagnostic redouté",
    text: "Le médecin de l'équipe pose enfin un nom sur les douleurs que tu traînes depuis des mois : un syndrome du canal carpien avancé. Une opération est recommandée, avec plusieurs mois d'arrêt à la clé.",
    choices: [
      {
        label: "Te faire opérer et arrêter la compétition plusieurs mois",
        effects: { health: 20, skill: -10, reputation: -5 },
        result: "L'opération se passe bien. Tu rates une saison entière, mais tu repars sur des bases saines.",
      },
      {
        label: "Refuser l'opération et jouer avec une attelle",
        effects: { health: -15, skill: 5 },
        result: "Tu tiens le rythme de compétition, mais chaque partie devient un pari sur ton corps.",
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "wristCare", value: true },
    eyebrow: "Mi-carrière — Cabinet médical",
    title: "Un contrôle de routine",
    text: "Le suivi régulier avec le kiné continue de payer : ton poignet ne montre aucun signe d'alerte, contrairement à celui de plusieurs de tes adversaires directs.",
    choices: [
      {
        label: "Ajouter des exercices préventifs à ta routine",
        effects: { health: 8, skill: 2 },
        result: "Une routine discrète, mais qui te protège pour les saisons à venir.",
      },
      {
        label: "Passer à autre chose sans changer tes habitudes",
        effects: { health: 3, skill: 3 },
        result: "Tout va bien pour l'instant — tu profites de ce répit pour t'entraîner davantage.",
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "psySupport", value: false },
    eyebrow: "Off-season — Coup de moins bien",
    title: "La rechute",
    text: "Sans le suivi que tu avais refusé, la pression accumulée depuis des mois finit par exploser en pleine préparation. Impossible de dormir la veille des matchs, l'anxiété prend toute la place.",
    choices: [
      {
        label: "Craquer et accepter enfin de te faire aider",
        effects: { mental: 18, reputation: -4 },
        result: "Il t'aura fallu toucher le fond pour accepter l'aide que tu avais repoussée. Mieux vaut tard que jamais.",
        flag: { name: "psySupport", value: true },
      },
      {
        label: "Serrer les dents et continuer seul",
        effects: { mental: -15, skill: 5 },
        result: "Tu tiens, à la force du mental — mais la fissure est là, quelque part, prête à se rouvrir.",
      },
    ],
  },
  {
    discipline: "all",
    requiresFlag: { name: "psySupport", value: true },
    eyebrow: "Off-season — Bilan avec le psychologue",
    title: "Un suivi qui porte ses fruits",
    text: "Ton accompagnement psychologique continue de porter ses fruits. Ton préparateur mental note une nette progression dans ta gestion du stress en match serré.",
    choices: [
      {
        label: "Approfondir le travail sur la gestion de la pression",
        effects: { mental: 10, skill: 2 },
        result: "Chaque session te rend un peu plus solide face aux moments décisifs.",
      },
      {
        label: "Te contenter des acquis, sans forcer",
        effects: { mental: 5, health: 3 },
        result: "Tu gardes une base saine, sans t'investir davantage pour l'instant.",
      },
    ],
  },
  {
    discipline: "all",
    pin: "last",
    eyebrow: "Conférence de presse — Annonce de retraite",
    title: "L'heure de raccrocher",
    text: "Le moment est venu d'annoncer publiquement la fin de ta carrière. Un journaliste te demande un dernier mot pour {RIVAL}, ton adversaire de toujours.",
    choices: [
      {
        label: "Un message sincère de respect",
        effects: { reputation: 10, mental: 8 },
        result: "Le geste est salué par toute la communauté, {RIVAL} y compris.",
      },
      {
        label: "Une dernière pique, jusqu'au bout",
        effects: { reputation: 6, mental: -5 },
        result: "La rivalité reste intacte jusqu'à la dernière seconde, pour le plus grand plaisir du public.",
      },
    ],
  },
  {
    discipline: "all",
    pin: "last",
    eyebrow: "Et après ?",
    title: "La suite de ta vie",
    text: "Le rideau tombe sur ta carrière de joueur. Une question reste en suspens : par quoi remplacer l'adrénaline de la compétition ?",
    choices: [
      {
        label: "Devenir coach pour la nouvelle génération",
        effects: { mental: 5 },
        result: "Tu transmets à ta manière ce que {RIVAL} et {ALLY} t'ont appris malgré eux.",
        flag: { name: "reconversion", value: "coach" },
      },
      {
        label: "Te lancer à plein temps dans le streaming",
        effects: { reputation: 5 },
        result: "Ta communauté te suit dans cette nouvelle vie, caméra allumée du matin au soir.",
        flag: { name: "reconversion", value: "streamer" },
      },
      {
        label: "Devenir analyste ou commentateur pour les tournois",
        effects: { skill: 3, mental: 3 },
        result: "Ton œil affûté trouve une nouvelle utilité, micro à la main.",
        flag: { name: "reconversion", value: "analyste" },
      },
    ],
  },
];

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

// Âge réaliste en fonction du nombre de tours joués (et non +1 an par tour, ce qui menait
// à des retraites à 42-48 ans systématiquement). Une carrière complète (~26-32 tours) mène
// désormais à une fin de carrière entre 24 et 26 ans, cohérent avec la réalité de l'esport
// (la grande majorité des joueurs pro raccrochent avant 28-30 ans).
function ageForTurn(turnsPlayed) {
  return 16 + Math.floor(turnsPlayed / 3);
}

function computeEnding(stats, cause) {
  if (cause === "mental") {
    return {
      title: "Burnout total",
      tone: "#D9757F",
      desc: "Ton mental a lâché avant ton corps. Tu quittes la scène du jour au lendemain, sans dernier match, sans adieux. Le jeu continue sans toi.",
    };
  }
  if (cause === "health") {
    return {
      title: "Carrière brisée",
      tone: "#D9757F",
      desc: "Une blessure de trop. Ton corps a dit stop là où ta tête voulait continuer. Tu regardes désormais les finales depuis le canapé.",
    };
  }
  if (cause === "ban") {
    return {
      title: "Banni à vie",
      tone: "#D9757F",
      desc: "La fédération tranche sans appel : suspension à vie du circuit professionnel. Peu importe ce qui s'est vraiment passé — aux yeux de tous, {RIVAL} continue sans toi, et ton nom reste associé au scandale plutôt qu'au jeu.",
    };
  }
  const { skill, mental, reputation, health } = stats;
  if (reputation >= 78 && mental >= 68 && skill >= 72) {
    return {
      title: "Légende absolue",
      tone: "#C8A24B",
      desc: "Ton nom est cité dans tous les documentaires sur la scène compétitive, aux côtés de celui de {RIVAL}. Tu as réussi à durer, à gagner, et à rester toi-même.",
    };
  }
  if (reputation >= 65 && mental < 45) {
    return {
      title: "Streamer toxique",
      tone: "#D9924A",
      desc: "Ta communauté est immense, tes chiffres explosent — mais tes rages en direct, souvent dirigées contre {RIVAL}, sont devenues ta vraie signature.",
    };
  }
  if (skill >= 70 && reputation < 45) {
    return {
      title: "Génie incompris",
      tone: "#A99BD9",
      desc: "Les joueurs pros savent qui tu es et respectent ton niveau, y compris {RIVAL}. Le grand public, lui, ne retiendra jamais ton nom.",
    };
  }
  return {
    title: "Oublié de tous",
    tone: "#9A9DA8",
    desc: "Une carrière correcte, sans éclat ni drame. Même {RIVAL} a fini par oublier ton nom. Tu raccroches sans que personne ne s'en aperçoive vraiment.",
  };
}

/* ===========================================================
   PANTHÉON — sauvegarde persistante des carrières terminées
=========================================================== */
async function savePantheonEntry(entry) {
  try {
    await window.storage.set(`career:${entry.id}`, JSON.stringify(entry), false);
  } catch (err) {
    console.error("Échec de sauvegarde au Panthéon:", err);
  }
}

async function loadPantheonEntries() {
  try {
    const list = await window.storage.list("career:", false);
    if (!list || !list.keys) return [];
    const entries = [];
    for (const key of list.keys) {
      try {
        const res = await window.storage.get(key, false);
        if (res && res.value) entries.push(JSON.parse(res.value));
      } catch {
        // entrée corrompue ou absente, on l'ignore
      }
    }
    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries;
  } catch (err) {
    console.error("Échec de lecture du Panthéon:", err);
    return [];
  }
}

async function markReconversionUsed(id, path) {
  try {
    const res = await window.storage.get(`career:${id}`, false);
    if (!res || !res.value) return;
    const entry = { ...JSON.parse(res.value), reconversionUsed: path };
    await window.storage.set(`career:${id}`, JSON.stringify(entry), false);
  } catch (err) {
    console.error("Échec de mise à jour du Panthéon:", err);
  }
}

// Jeu favori choisi manuellement par le joueur (façon "favoris" Letterboxd) — distinct
// du calcul automatique "jeu le plus joué", que l'on garde comme suggestion par défaut.
async function saveFavoriteGame(gameId) {
  try {
    await window.storage.set("settings:favoriteGame", JSON.stringify({ gameId }), false);
  } catch (err) {
    console.error("Échec de sauvegarde du jeu favori:", err);
  }
}

async function loadFavoriteGame() {
  try {
    const res = await window.storage.get("settings:favoriteGame", false);
    return res && res.value ? JSON.parse(res.value).gameId : null;
  } catch {
    return null;
  }
}

// --- Carte de profil (vitrine) --------------------------------------------
// Un pseudo stable, stocké en personnel, et une version condensée du profil pour l'afficher
// proprement à l'écran — pensée pour être capturée en image, pas pour être publiée en ligne.
// --- Crédits Prodige & boutique cosmétique ---------------------------------
// Une monnaie virtuelle gagnée en terminant des carrières (jamais d'argent réel), dépensable
// sur du contenu purement cosmétique. L'esprit de la monétisation d'un jeu mobile façon
// Destiny Eleven, sans jamais toucher à un vrai système de paiement.
const CREDIT_REWARDS = {
  "Légende absolue": 500,
  "Streamer toxique": 220,
  "Génie incompris": 220,
  "Oublié de tous": 120,
  "Carrière brisée": 60,
  "Burnout total": 60,
  "Banni à vie": 40,
};

// MVP de la saison — reconnaissance intermédiaire décernée au bilan de saison (pas seulement
// au titre de fin). Seuils volontairement en dessous de ceux de "Légende absolue" dans
// computeEnding (reputation>=78 && mental>=68 && skill>=72) : un bon résultat de mi-carrière,
// atteignable plusieurs fois, pas garanti.
const MVP_SEASON_THRESHOLDS = { skill: 62, reputation: 58, mental: 45, health: 40 };
const MVP_SEASON_CREDIT_REWARD = 30;

function qualifiesForSeasonMvp(s) {
  return STAT_DEFS.every((def) => s[def.key] >= MVP_SEASON_THRESHOLDS[def.key]);
}

const COSMETICS = [
  { id: "accent_gold", type: "accent", label: "Gold Classique", value: "#C8A24B", cost: 0 },
  { id: "accent_teal", type: "accent", label: "Édition Glacier", value: "#4FBFAE", cost: 300 },
  { id: "accent_crimson", type: "accent", label: "Édition Braise", value: "#D9757F", cost: 300 },
  { id: "accent_violet", type: "accent", label: "Édition Nébuleuse", value: "#A99BD9", cost: 300 },
  { id: "accent_silver", type: "accent", label: "Édition Argent", value: "#B8BAC2", cost: 450 },
  { id: "title_veteran", type: "title", label: "Titre : Vétéran de la scène", value: "Vétéran de la scène", cost: 200 },
  { id: "title_legend", type: "title", label: "Titre : Légende vivante", value: "Légende vivante", cost: 600 },
  { id: "title_iron", type: "title", label: "Titre : Increvable", value: "Increvable", cost: 200 },
];

// Les crédits étaient stockés sur une seule clé relue-puis-réécrite à chaque gain — un
// mécanisme fragile en cas de coupure entre les deux étapes. On reprend ici le même principe
// fiable que l'historique des carrières : chaque gain est sa propre entrée, et le total est
// simplement la somme de toutes les entrées au chargement.
async function awardCredits(amount) {
  try {
    await window.storage.set(`credit:${Date.now()}_${Math.floor(Math.random() * 1e6)}`, JSON.stringify({ amount }), false);
  } catch (err) {
    console.error("Échec d'attribution des crédits:", err);
  }
}

async function loadCredits() {
  try {
    const list = await window.storage.list("credit:", false);
    if (!list || !list.keys) return 0;
    let total = 0;
    for (const key of list.keys) {
      try {
        const res = await window.storage.get(key, false);
        if (res && res.value) total += JSON.parse(res.value).amount || 0;
      } catch {
        // entrée corrompue ou absente, on l'ignore
      }
    }
    return total;
  } catch (err) {
    console.error("Échec de chargement des crédits:", err);
    return 0;
  }
}

// Dépenser des crédits (achat boutique) reste une soustraction ponctuelle, enregistrée comme
// un gain négatif — même mécanisme, aucun état partagé à corrompre.
async function spendCredits(amount) {
  await awardCredits(-amount);
}

async function loadCosmetics() {
  try {
    const res = await window.storage.get("settings:cosmetics", false);
    if (res && res.value) return JSON.parse(res.value);
  } catch {
    // pas encore de cosmétiques sauvegardés, on renvoie les valeurs par défaut ci-dessous
  }
  return { owned: ["accent_gold"], selectedAccent: "accent_gold", selectedTitle: null };
}

async function saveCosmetics(data) {
  try {
    await window.storage.set("settings:cosmetics", JSON.stringify(data), false);
  } catch (err) {
    console.error("Échec de sauvegarde des cosmétiques:", err);
  }
}

async function loadSoundPref() {
  try {
    const res = await window.storage.get("settings:soundOn", false);
    return res && res.value ? JSON.parse(res.value).on : false;
  } catch {
    return false;
  }
}

async function saveSoundPref(on) {
  try {
    await window.storage.set("settings:soundOn", JSON.stringify({ on }), false);
  } catch (err) {
    console.error("Échec de sauvegarde de la préférence son:", err);
  }
}

async function loadOnboardingSeen() {
  try {
    const res = await window.storage.get("settings:onboardingSeen", false);
    return res && res.value ? JSON.parse(res.value).seen : false;
  } catch {
    return false;
  }
}

async function saveOnboardingSeen() {
  try {
    await window.storage.set("settings:onboardingSeen", JSON.stringify({ seen: true }), false);
  } catch (err) {
    console.error("Échec de sauvegarde de l'onboarding:", err);
  }
}

async function loadPseudo() {
  try {
    const res = await window.storage.get("settings:pseudo", false);
    return res && res.value ? JSON.parse(res.value).pseudo : null;
  } catch {
    return null;
  }
}

async function savePseudo(pseudo) {
  try {
    await window.storage.set("settings:pseudo", JSON.stringify({ pseudo }), false);
  } catch (err) {
    console.error("Échec de sauvegarde du pseudo:", err);
  }
}

function buildShowcaseData(entries, pseudo, favoriteGameLabel) {
  const stats = computeProfileStats(entries);
  const badgeIds = computeBadges(entries)
    .filter((b) => b.unlocked)
    .map((b) => b.id);
  return {
    pseudo: pseudo && pseudo.trim() ? pseudo.trim() : "Joueur anonyme",
    total: stats ? stats.total : 0,
    bestEndingTitle: stats ? stats.bestEndingTitle : null,
    bestEndingTone: stats ? stats.bestEndingTone : null,
    // Le choix manuel (fait sur la carte) prime toujours sur le jeu le plus joué, calculé automatiquement.
    favoriteGame: favoriteGameLabel || (stats ? stats.favoriteGame : null),
    topRival: stats ? stats.topRival : null,
    badgeIds,
  };
}

// Une carrière ne débloque une reconversion que si elle a vraiment été à la hauteur.
function getUnlocks(entry) {
  const s = entry.stats;
  const coach = entry.endingTitle === "Légende absolue" || (s.mental >= 70 && s.skill >= 65);
  const founder =
    entry.endingTitle === "Légende absolue" || entry.endingTitle === "Streamer toxique" || s.reputation >= 75;
  return { coach, founder };
}

/* ===========================================================
   MODE COACH — seconde carrière débloquée depuis le Panthéon
=========================================================== */
const COACH_STAT_DEFS = [
  { key: "pedagogie", label: "Pédagogie", icon: BookOpen, color: "#C8A24B" },
  { key: "autorite", label: "Autorité", icon: Shield, color: "#A99BD9" },
  { key: "reputation", label: "Réputation", icon: Flame, color: "#D9924A" },
  { key: "equilibre", label: "Équilibre", icon: HeartPulse, color: "#D9757F" },
];

const COACH_EVENTS = [
  {
    eyebrow: "Premier recrutement",
    title: "Un talent brut ou une valeur sûre ?",
    text: "Ton budget ne permet qu'une seule recrue prioritaire. Un jeune joueur au potentiel énorme mais instable, ou un vétéran fiable, moins spectaculaire mais solide.",
    choices: [
      {
        label: "Miser sur le talent brut, quitte à devoir tout lui apprendre",
        effects: { pedagogie: 10, autorite: -4 },
        result: "Le pari est excitant, mais il va falloir énormément investir pour le canaliser.",
      },
      {
        label: "Sécuriser avec la valeur sûre",
        effects: { autorite: 8, pedagogie: -2 },
        result: "Moins de vagues, une base sur laquelle construire sereinement.",
      },
    ],
  },
  {
    eyebrow: "Vestiaire — Tension interne",
    title: "Deux egos, un seul roster",
    text: "Tes deux meilleurs joueurs se disputent ouvertement le statut de leader en interview. L'ambiance à l'entraînement commence à s'en ressentir.",
    choices: [
      {
        label: "Trancher publiquement en faveur de l'un des deux",
        effects: { autorite: 10, reputation: -5 },
        result: "Le message est clair, mais tu te mets à dos une partie du vestiaire.",
      },
      {
        label: "Organiser une médiation en interne, loin des caméras",
        effects: { pedagogie: 8, autorite: 3 },
        result: "La tension redescend progressivement, sans casse publique.",
      },
    ],
  },
  {
    eyebrow: "Salle d'entraînement",
    title: "Un jeune veut copier ton ancien style",
    text: "Une recrue prometteuse veut absolument reproduire ton style de jeu d'ancien pro, quitte à ignorer ses propres points forts.",
    choices: [
      {
        label: "Lui transmettre ta méthode telle quelle",
        effects: { pedagogie: 6, equilibre: -4 },
        result: "Il progresse vite dans ton moule, mais perd un peu de ce qui le rendait unique.",
      },
      {
        label: "L'aider à développer son propre style",
        effects: { pedagogie: 10, reputation: 3 },
        result: "Un travail plus long, mais qui donne naissance à un joueur pleinement lui-même.",
      },
    ],
  },
  {
    eyebrow: "Face à face",
    title: "{RIVAL} coache maintenant l'équipe d'en face",
    text: "Ton éternel rival {RIVAL} a lui aussi raccroché la manette pour le banc de touche. Vous voilà l'un en face de l'autre, cette fois en costume plutôt qu'en maillot.",
    choices: [
      {
        label: "Préparer un plan de match qui exploite ses habitudes de joueur",
        effects: { pedagogie: 9, equilibre: -5 },
        result: "Tu le connais par cœur — et lui aussi te connaît. Le duel est particulièrement serré.",
      },
      {
        label: "Rester focalisé sur ta propre équipe, sans obsession",
        effects: { autorite: 7, equilibre: 3 },
        result: "Une préparation plus saine, qui rassure un vestiaire parfois trop nerveux avant ce genre de match.",
      },
    ],
  },
  {
    eyebrow: "Mercato interne",
    title: "{ALLY} te demande sa chance",
    text: "Ton ancien binôme {ALLY} traverse une mauvaise passe dans sa carrière et te contacte directement : il veut rejoindre ton roster.",
    choices: [
      {
        label: "Lui donner sa chance, au nom de votre histoire commune",
        effects: { reputation: 8, autorite: -4 },
        result: "Le geste touche tout le monde, mais certains y voient déjà du favoritisme.",
      },
      {
        label: "Rester strictement professionnel et décliner",
        effects: { autorite: 8, reputation: -3 },
        result: "La décision est dure à prendre, mais personne ne peut te reprocher un traitement de faveur.",
      },
    ],
  },
  {
    eyebrow: "Réunion budget",
    title: "La direction veut des résultats immédiats",
    text: "Le propriétaire de la structure convoque une réunion : les résultats doivent s'améliorer ce trimestre, sans quoi le budget de la saison prochaine sera revu à la baisse.",
    choices: [
      {
        label: "Promettre des résultats et mettre une pression immédiate sur le groupe",
        effects: { reputation: 8, equilibre: -8 },
        result: "Le message passe, mais le stress redescend directement sur les épaules des joueurs — et les tiennes.",
      },
      {
        label: "Défendre un projet à plus long terme face à la direction",
        effects: { autorite: 6, reputation: -4 },
        result: "Un pari risqué politiquement, mais qui protège la sérénité du groupe.",
      },
    ],
  },
  {
    eyebrow: "Série noire",
    title: "Cinq défaites d'affilée",
    text: "L'équipe traverse sa pire série de la saison. Les critiques sur les réseaux commencent à cibler directement tes choix tactiques.",
    choices: [
      {
        label: "Tout remettre à plat en changeant radicalement l'approche",
        effects: { pedagogie: 8, equilibre: -6 },
        result: "Le changement brutal surprend tout le monde, à commencer par tes propres joueurs.",
      },
      {
        label: "Garder le cap et rassurer le groupe sur la méthode",
        effects: { autorite: 9, reputation: -3 },
        result: "La confiance affichée stabilise le vestiaire, même si les résultats tardent encore.",
      },
    ],
  },
  {
    eyebrow: "Suivi médical",
    title: "Un jeune joueur souffre déjà au poignet",
    text: "Un de tes joueurs les plus prometteurs se plaint de douleurs familières — les mêmes que tu as connues, au même âge, pour les mêmes raisons.",
    choices: [
      {
        label: "Le pousser encore un peu, l'échéance approche",
        effects: { reputation: 6, equilibre: -8 },
        result: "Tu revis presque ta propre histoire, cette fois de l'autre côté du banc.",
      },
      {
        label: "Le mettre au repos immédiatement, sans négociation possible",
        effects: { pedagogie: 9, autorite: 4 },
        result: "Une décision qui te coûte des résultats à court terme, mais qui pose ta réputation de coach responsable.",
      },
    ],
  },
  {
    eyebrow: "Fenêtre de transferts",
    title: "Ta star veut partir voir plus grand",
    text: "Ton meilleur joueur reçoit une offre d'une organisation plus prestigieuse. Il vient te voir directement pour en discuter, avant même d'en parler à la direction.",
    choices: [
      {
        label: "Le convaincre de rester avec un nouveau rôle sur mesure",
        effects: { pedagogie: 8, autorite: 5 },
        result: "Il reste, reconnaissant. Le pari devra désormais être tenu sur la durée.",
      },
      {
        label: "Le laisser partir et t'appuyer sur le reste du groupe",
        effects: { reputation: 5, equilibre: 5 },
        result: "Un vestiaire plus léger, mais un niveau collectif à reconstruire.",
      },
    ],
  },
  {
    eyebrow: "Fin de contrat",
    title: "L'heure du bilan",
    text: "Ton contrat de coach touche à sa fin. La direction, les joueurs et la presse attendent tous ta décision : rempiler, ou tourner la page du banc de touche.",
    choices: [
      {
        label: "Signer une prolongation et continuer l'aventure",
        effects: { autorite: 6, reputation: 6 },
        result: "Tu poses les bases d'un projet qui te dépasse déjà, joueur après joueur.",
      },
      {
        label: "Tourner la page sur tes propres termes",
        effects: { equilibre: 8, pedagogie: 4 },
        result: "Tu pars la tête haute, avec le sentiment d'avoir transmis l'essentiel.",
      },
    ],
  },
];

function computeCoachEnding(stats) {
  const { pedagogie, autorite, reputation, equilibre } = stats;
  if (equilibre <= 0) {
    return {
      title: "Épuisement total",
      tone: "#D9757F",
      desc: "Le stress du banc de touche a fini par avoir raison de toi, avant même tes joueurs. Tu quittes le poste du jour au lendemain.",
    };
  }
  if (autorite <= 0) {
    return {
      title: "Limogé",
      tone: "#D9757F",
      desc: "Le vestiaire a fini par ne plus t'écouter. La direction n'a eu d'autre choix que de te remercier.",
    };
  }
  if (reputation >= 75 && autorite >= 65 && pedagogie >= 65) {
    return {
      title: "Mentor légendaire",
      tone: "#C8A24B",
      desc: "Tes anciens joueurs citent ton nom à chaque interview. Tu as façonné une génération entière, à ta manière.",
    };
  }
  if (reputation >= 65 && autorite < 45) {
    return {
      title: "Coach tyran",
      tone: "#D9924A",
      desc: "Tes résultats parlent pour toi, mais plus aucun joueur ne garde un bon souvenir d'avoir évolué sous tes ordres.",
    };
  }
  if (pedagogie >= 65 && reputation < 40) {
    return {
      title: "Éminence discrète",
      tone: "#A99BD9",
      desc: "Dans le milieu, tout le monde sait que tu es excellent. Le grand public n'a jamais retenu ton nom.",
    };
  }
  return {
    title: "Un coach parmi d'autres",
    tone: "#9A9DA8",
    desc: "Une carrière de coach honnête, sans éclat particulier, vite oubliée du grand public.",
  };
}

/* ---------------------------------------------------------
   BARRE DE STAT — style HUD segmenté
--------------------------------------------------------- */
function StatBar({ def, value, delta }) {
  const Icon = def.icon;
  // Démarre à 0 puis rejoint la vraie valeur juste après le montage : la jauge "grandit"
  // à l'affichage (fin de carrière, profil...) et glisse en douceur à chaque changement en
  // cours de partie, plutôt que de sauter instantanément à la nouvelle valeur.
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplay(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={13} color={def.color} strokeWidth={2.5} className="shrink-0" />
          <span className="text-[10px] uppercase tracking-widest font-medium truncate" style={{ color: "#9A9DA8" }}>
            {def.label}
          </span>
        </div>
        <span
          className="text-[11px] font-bold tabular-nums shrink-0"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: def.color }}
        >
          {value}
          {delta ? (
            <span key={delta} className="delta-pop" style={{ color: delta > 0 ? "#C8A24B" : "#D9757F" }}>
              {" "}
              {delta > 0 ? `+${delta}` : delta}
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative h-2 w-full bg-[#262A32] overflow-hidden">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${display}%`, background: def.color }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(10,12,16,0.65) 6px, rgba(10,12,16,0.65) 8px)",
          }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : ACCUEIL
--------------------------------------------------------- */
/* ---------------------------------------------------------
   ÉCRAN : ONBOARDING — affiché une seule fois, avant la toute première carrière
--------------------------------------------------------- */
function OnboardingScreen({ onDone }) {
  const points = [
    {
      icon: Sparkles,
      color: "#A99BD9",
      title: "Un profil de croissance tiré au sort",
      desc: "Chaque carrière booste une stat et en pénalise une autre, en secret. Regarde le petit indice en haut de l'écran de jeu pour savoir lequel.",
    },
    {
      icon: HeartPulse,
      color: "#D9757F",
      title: "Santé et Mental ne sont pas décoratifs",
      desc: "Si l'une des deux tombe à 0, ta carrière s'arrête net — burnout ou blessure. Surveille-les autant que ton niveau de jeu.",
    },
    {
      icon: Trophy,
      color: "#C8A24B",
      title: "Chaque carrière rejoint ton Profil",
      desc: "Historique complet, badges à débloquer, carte à partager — accessible à tout moment en haut de l'écran.",
    },
    {
      icon: Star,
      color: "#E3B968",
      title: "Des Crédits Prodige à chaque fin",
      desc: "Plus la fin est marquante, plus tu en gagnes. Dépense-les dans la Boutique de ton Profil pour des cosmétiques.",
    },
    {
      icon: Repeat2,
      color: "#9A9DA8",
      title: "Aucune carrière ne se ressemble",
      desc: "Les mêmes grands moments peuvent revenir, mais jamais dans le même ordre ni avec les mêmes choix disponibles.",
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-10 text-center overflow-hidden">
      <div className="relative w-full max-w-lg">
        <div className="hero-stagger flex justify-center mb-4" style={{ animationDelay: "0s" }}>
          <TeamMark size={56} />
        </div>
        <div className="hero-stagger" style={{ animationDelay: "0.1s" }}>
          <TickLabel className="text-[11px] tracking-[0.4em] uppercase mb-2 justify-center" style={{ color: "#C8A24B", fontFamily: "'JetBrains Mono', monospace" }}>
            Avant de commencer
          </TickLabel>
        </div>
        <h2 className="hero-stagger text-2xl sm:text-3xl font-bold mb-8" style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif", animationDelay: "0.18s" }}>
          Ce qu'il faut savoir
        </h2>

        <div className="flex flex-col gap-3 mb-10 text-left">
          {points.map((p, i) => (
            <div
              key={i}
              className="hero-stagger flex items-start gap-3 p-4"
              style={{ background: "#23262D", borderLeft: `3px solid ${p.color}`, animationDelay: `${0.26 + i * 0.08}s` }}
            >
              <p.icon size={18} color={p.color} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: "#DCDEE3" }}>{p.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#9A9DA8" }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          className="hero-stagger press-feedback flex items-center gap-2 mx-auto pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm"
          style={{ clipPath: CLIP_SLANT, background: "#C8A24B", color: "#1B1D22", fontFamily: "'Oswald', sans-serif", animationDelay: "0.7s" }}
        >
          C'est parti <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function StartScreen({ background, setBackground, onNext }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-10 text-center overflow-hidden">
      {/* Mouvement ambiant continu — plus un simple dégradé statique */}
      <div
        className="absolute inset-0 pointer-events-none drift-glow"
        style={{
          background: "linear-gradient(115deg, transparent 40%, rgba(200,162,75,0.10) 55%, transparent 72%)",
        }}
      />
      <div
        className="absolute -top-24 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none drift-glow"
        style={{ background: "radial-gradient(circle, rgba(169,155,217,0.10), transparent 70%)", animationDelay: "1.5s" }}
      />

      <div className="relative">
        <div className="hero-stagger flex justify-center mb-2" style={{ animationDelay: "0s" }}>
          <HeroCrest size={150} />
        </div>
        <div className="hero-stagger" style={{ animationDelay: "0.15s" }}>
          <TickLabel className="text-[11px] tracking-[0.4em] uppercase mb-3 justify-center" style={{ color: "#C8A24B", fontFamily: "'JetBrains Mono', monospace" }}>
            Saison 01
          </TickLabel>
        </div>
        <h1
          className="hero-stagger text-4xl sm:text-5xl tracking-wide mb-2"
          style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif", animationDelay: "0.25s" }}
        >
          PRODIGE<span className="" style={{ color: "#C8A24B" }}>.GG</span>
        </h1>
        <p className="hero-stagger max-w-md mb-10 leading-relaxed" style={{ color: "#9A9DA8", animationDelay: "0.35s" }}>
          16 ans. Une manette, un clavier, une ambition démesurée. Ta carrière commence ce soir —
          et chaque choix t'écrit une légende, ou t'efface des mémoires.
        </p>

        <div className="w-full max-w-md mb-10">
          <div className="hero-stagger" style={{ animationDelay: "0.45s" }}>
            <TickLabel className="text-[10px] uppercase tracking-widest mb-3 text-left" style={{ color: "#9A9DA8" }}>
              Ton parcours
            </TickLabel>
          </div>
          <div className="flex flex-col gap-1.5">
            {BACKGROUNDS.map((b, i) => {
              const selected = background === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setBackground(b.id)}
                  className="hero-stagger press-feedback text-left pl-4 pr-4 py-3 transition-colors"
                  style={{
                    background: selected ? "rgba(200, 162, 75,0.08)" : "#23262D",
                    borderLeft: `3px solid ${selected ? "#C8A24B" : "#363A44"}`,
                    animationDelay: `${0.5 + i * 0.08}s`,
                  }}
                >
                  <div
                    className="text-sm font-semibold"
                    style={{ color: selected ? "#C8A24B" : "#DCDEE3" }}
                  >
                    {b.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#9A9DA8" }}>{b.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          disabled={!background}
          onClick={onNext}
          className="hero-stagger press-feedback group flex items-center gap-2 pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            clipPath: CLIP_SLANT,
            background: background ? "#C8A24B" : "#363A44",
            color: background ? "#1B1D22" : "#9A9DA8",
            fontFamily: "'Oswald', sans-serif",
            animationDelay: "0.85s",
          }}
        >
          Commencer ma carrière
          <ChevronRight size={16} className="group-disabled:hidden" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : CHOIX DE LA DISCIPLINE
--------------------------------------------------------- */
// Blasons custom par discipline — à la place des icônes génériques Lucide, pour donner à
// chaque discipline une vraie identité visuelle dessinée sur mesure plutôt qu'un pictogramme
// interchangeable.
function DisciplineCrest({ variant, color = "#C8A24B", size = 40 }) {
  const inner = {
    moba: (
      <>
        <line x1="30" y1="70" x2="70" y2="30" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <line x1="70" y1="70" x2="30" y2="30" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <circle cx="30" cy="70" r="4.5" fill={color} />
        <circle cx="70" cy="70" r="4.5" fill={color} />
        <polygon points="70,30 76,24 70,18 64,24" fill={color} />
        <polygon points="30,30 24,24 30,18 36,24" fill={color} />
      </>
    ),
    fps: (
      <>
        <circle cx="50" cy="50" r="16" fill="none" stroke={color} strokeWidth="4.5" />
        <circle cx="50" cy="50" r="3.5" fill={color} />
        <line x1="50" y1="22" x2="50" y2="32" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="50" y1="68" x2="50" y2="78" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="22" y1="50" x2="32" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <line x1="68" y1="50" x2="78" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    br: (
      <>
        <circle cx="50" cy="46" r="26" fill="none" stroke={color} strokeWidth="3" opacity="0.35" />
        <circle cx="50" cy="46" r="17" fill="none" stroke={color} strokeWidth="4" opacity="0.7" />
        <polygon points="50,42 58,58 42,58" fill={color} />
      </>
    ),
    fight: (
      <>
        <polygon
          points="50,16 58,38 82,38 63,52 71,76 50,62 29,76 37,52 18,38 42,38"
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="50" r="7" fill={color} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
      {inner[variant]}
    </svg>
  );
}

function DisciplineScreen({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">
      <TickLabel
        className="text-[11px] tracking-[0.4em] uppercase mb-2 justify-center"
        style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
      >
        Étape 1 / 2
      </TickLabel>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-8 text-center"
        style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}
      >
        Choisis ta discipline
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {DISCIPLINES.map((d, i) => {
          return (
            <button
              key={d.id}
              disabled={!d.active}
              onClick={() => d.active && onSelect(d.id)}
              className="hero-stagger press-feedback relative p-5 text-left transition-transform disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:-translate-y-0.5"
              style={{ clipPath: CLIP, background: "#23262D", border: `1px solid #363A44`, animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="absolute top-0 left-0 h-[2px] w-10"
                style={{ background: d.color }}
              />
              <DisciplineCrest variant={d.id} color={d.color} size={40} />
              <div
                className="text-lg font-semibold mt-3"
                style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}
              >
                {d.label}
              </div>
              <div className="text-xs mt-1" style={{ color: "#9A9DA8" }}>{d.sub}</div>
              {!d.active && (
                <div className="text-[10px] uppercase tracking-widest mt-3" style={{ color: "#9A9DA8" }}>
                  Bientôt disponible
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : CHOIX DU JEU AU SEIN DE LA DISCIPLINE
--------------------------------------------------------- */
function GameSelectScreen({ discipline, onSelect, onBack }) {
  const disc = DISCIPLINES.find((d) => d.id === discipline);
  const games = GAMES[discipline] || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">
      <TickLabel
        className="text-[11px] tracking-[0.4em] uppercase mb-2 justify-center"
        style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
      >
        Étape 2 / 2 — {disc.label}
      </TickLabel>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-8 text-center"
        style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}
      >
        Sur quel jeu débute ta carrière ?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
        {games.map((g, i) => (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className="hero-stagger press-feedback relative p-5 text-left transition-transform hover:-translate-y-0.5"
            style={{ clipPath: CLIP, background: "#23262D", border: "1px solid #363A44", animationDelay: `${i * 0.08}s` }}
          >
            <div className="absolute top-0 left-0 h-[2px] w-10" style={{ background: g.color }} />
            <DisciplineCrest variant={discipline} color={g.color} size={34} />
            <div
              className="text-lg font-semibold mt-2"
              style={{ fontFamily: "'Oswald', sans-serif", color: g.color }}
            >
              {g.label}
            </div>
            <div className="text-xs mt-1" style={{ color: "#9A9DA8" }}>{g.sub}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="text-[11px] uppercase tracking-widest hover:text-[#DCDEE3] transition-colors"
        style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
      >
        ← Changer de discipline
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : CHOIX DU RÔLE (pilote CS2 + LoL)
--------------------------------------------------------- */
function RoleSelectScreen({ game, onSelect, onBack }) {
  const gameInfo = Object.values(GAMES).flat().find((g) => g.id === game);
  const roles = ROLES[game] || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">
      <TickLabel
        className="text-[11px] tracking-[0.4em] uppercase mb-2 justify-center"
        style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {gameInfo ? gameInfo.label : game}
      </TickLabel>
      <h2
        className="text-2xl sm:text-3xl font-bold mb-8 text-center"
        style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}
      >
        Quel est ton poste ?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
        {roles.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="hero-stagger press-feedback relative p-5 text-left transition-transform hover:-translate-y-0.5"
            style={{ clipPath: CLIP, background: "#23262D", border: "1px solid #363A44", animationDelay: `${i * 0.08}s` }}
          >
            <div className="absolute top-0 left-0 h-[2px] w-10" style={{ background: r.color }} />
            <div
              className="text-lg font-semibold"
              style={{ fontFamily: "'Oswald', sans-serif", color: r.color }}
            >
              {r.label}
            </div>
            <div className="text-xs mt-1" style={{ color: "#9A9DA8" }}>{r.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="text-[11px] uppercase tracking-widest hover:text-[#DCDEE3] transition-colors"
        style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
      >
        ← Changer de jeu
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : JEU PRINCIPAL
--------------------------------------------------------- */
function GameScreen({ discipline, game, role, age, stats, deltas, event, onChoice, phase, lastResult, onContinue, turnIndex, total, rival, ally, team, growthProfile, soundOn, onToggleSound }) {
  const disc = DISCIPLINES.find((d) => d.id === discipline);
  const gameInfo = (GAMES[discipline] || []).find((g) => g.id === game);
  const roleInfo = (ROLES[game] || []).find((r) => r.id === role);
  const Icon = disc.icon;
  const accentColor = gameInfo ? gameInfo.color : disc.color;
  const teamMeta = getTeamMeta(team);

  // Si l'événement propose un transfert ou une montée en ligue, on tire une option une seule fois par tour
  const teamOffer = useMemo(() => {
    const pool = TEAMS[game];
    if (!pool) return null;
    if (event.dynamic === "team_early") return pickRandom(pool.early || pool.top || ["une organisation amateur"]);
    if (event.dynamic === "team_top") return pickRandom(pool.top || pool.early || ["une organisation indépendante"]);
    return null;
  }, [turnIndex, game, event.dynamic]);

  const leagueOffer = useMemo(() => {
    if (event.dynamic === "league") {
      return pickRandom(LEAGUES[game] || ["ligue régionale"]);
    }
    return null;
  }, [turnIndex, game, event.dynamic]);

  // Un adversaire réel (tiré du roster du jeu, jamais ta propre équipe) et un lieu, pour que
  // les grands moments (Majors, finales mondiales...) ne se ressemblent jamais deux fois de suite.
  const opponentOffer = useMemo(() => {
    const pool = TEAMS[game];
    if (!pool) return null;
    const candidates = (pool.top || pool.early || []).filter((t) => t !== team);
    if (!candidates.length) return null;
    return pickRandom(candidates);
  }, [turnIndex, game, team]);

  const locationOffer = useMemo(() => pickRandom(CITIES), [turnIndex]);

  const vars = {
    RIVAL: rival,
    ALLY: ally,
    TEAM: teamOffer || team || "",
    LEAGUE: leagueOffer || "",
    OPPONENT: opponentOffer || "l'équipe adverse",
    LOCATION: locationOffer || "la scène internationale",
  };
  const fmt = (str) => formatText(str, vars);

  // Le bouton actif (un choix, ou "Continuer") disparaît à chaque nouveau tour/phase, ce qui
  // renvoie sinon le focus clavier tout en haut de la page. On le ramène ici sur le premier
  // bouton disponible, pour que Tab enchaîne naturellement d'un tour au suivant.
  const actionsRef = useRef(null);
  useEffect(() => {
    actionsRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [phase, turnIndex]);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Identité visuelle de la discipline — grand pictogramme en filigrane, propre à
          chaque discipline (MOBA/FPS/BR/Fighting), pour qu'une partie ne ressemble jamais
          tout à fait à une autre rien qu'à l'ambiance. */}
      <Icon
        size={420}
        className="absolute pointer-events-none select-none"
        style={{ color: accentColor, opacity: 0.05, top: "-8%", right: "-10%", transform: "rotate(-12deg)" }}
      />

      {/* HEADER */}
      <div className="relative border-b px-4 sm:px-6 py-4 shrink-0" style={{ background: "#202329", borderColor: `${accentColor}33` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {teamMeta ? (
              <span
                className="shrink-0 flex items-center justify-center text-[9px] font-bold rounded-sm px-1.5 py-0.5"
                style={{ background: teamMeta.color, color: teamMeta.textColor, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {teamMeta.short}
              </span>
            ) : (
              <Icon size={16} color={accentColor} className="shrink-0" />
            )}
            <span
              className="text-xs uppercase tracking-widest truncate"
              style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {gameInfo ? gameInfo.label : disc.label}
              {roleInfo ? ` · ${roleInfo.label}` : ""} · {team || "Agent libre"} · Tour {turnIndex + 1}/{total}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <button onClick={onToggleSound} className="press-feedback" style={{ color: "#6B6E78" }} title={soundOn ? "Couper le son" : "Activer le son"}>
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <div
              className="text-sm font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#DCDEE3" }}
            >
              {age} <span className="text-xs" style={{ color: "#9A9DA8" }}>ANS</span>
            </div>
          </div>
        </div>
        {growthProfile && (
          <div className="flex items-center gap-1.5 mb-3 -mt-1">
            <Sparkles size={11} className="shrink-0" style={{ color: "#A99BD9" }} />
            <span className="text-[10px] truncate" style={{ color: "#9A9DA8" }}>
              <span className="font-semibold" style={{ color: "#A99BD9" }}>{growthProfile.label}</span> — {growthProfile.desc}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          {STAT_DEFS.map((def) => (
            <StatBar key={def.key} def={def} value={stats[def.key]} delta={deltas?.[def.key]} />
          ))}
        </div>
      </div>
      <div
        className="h-[2px] w-full shrink-0"
        style={{ background: "linear-gradient(90deg, #C8A24B, #A99BD9, #D9924A, #D9757F)" }}
      />

      {/* CENTRE : NARRATIF */}
      <div className="relative flex-1 overflow-y-auto flex items-center justify-center px-4 sm:px-8 py-8">
        <HudPanel className="w-full max-w-xl">
          <div className="p-6 sm:p-8 content-in" key={`${phase}-${turnIndex}`}>
            {phase === "event" ? (
              <>
                <TickLabel
                  className="text-[10px] uppercase tracking-[0.3em] mb-2"
                  color={accentColor}
                  style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {event.eyebrow}
                </TickLabel>
                <h3
                  className="text-xl sm:text-2xl font-bold mb-4"
                  style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}
                >
                  {fmt(event.title)}
                </h3>
                <p className="leading-relaxed text-sm sm:text-base" style={{ color: "#B8BAC2" }}>{fmt(event.text)}</p>
              </>
            ) : (
              <>
                <TickLabel
                  className="text-[10px] uppercase tracking-[0.3em] mb-2"
                  color="#9A9DA8"
                  style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Conséquence
                </TickLabel>
                <p className="leading-relaxed text-sm sm:text-base" style={{ color: "#DCDEE3" }}>{fmt(lastResult)}</p>
              </>
            )}
          </div>
        </HudPanel>
      </div>

      {/* BAS : ACTIONS */}
      <div className="relative px-4 sm:px-8 pb-8 shrink-0" ref={actionsRef}>
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {phase === "event"
            ? event.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => {
                    playClick();
                    onChoice(choice, teamOffer);
                  }}
                  className="press-feedback text-left pl-7 pr-6 py-3.5 transition-colors hover:bg-[#262A32]"
                  style={{ clipPath: CLIP_SLANT, background: "#23262D", border: "1px solid #363A44" }}
                >
                  <span className="text-sm sm:text-[15px] font-medium" style={{ color: "#DCDEE3" }}>
                    {fmt(choice.label)}
                  </span>
                </button>
              ))
            : (
                <button
                  onClick={() => {
                    playClick();
                    onContinue();
                  }}
                  className="press-feedback self-center flex items-center gap-2 pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm"
                  style={{
                    clipPath: CLIP_SLANT,
                    background: "#C8A24B",
                    color: "#1B1D22",
                    fontFamily: "'Oswald', sans-serif",
                  }}
                >
                  Continuer <ChevronRight size={16} />
                </button>
              )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : BILAN DE SAISON — point d'étape toutes les 2 ans (6 tours), entièrement dérivé
   des deltas déjà suivis dans choiceHistory, sans texte à écrire à la main.
--------------------------------------------------------- */
function SeasonRecapScreen({ discipline, game, role, age, stats, team, growthProfile, choiceHistory, soundOn, onToggleSound, onContinue, mvpAwarded }) {
  const disc = DISCIPLINES.find((d) => d.id === discipline);
  const gameInfo = (GAMES[discipline] || []).find((g) => g.id === game);
  const roleInfo = (ROLES[game] || []).find((r) => r.id === role);
  const Icon = disc.icon;
  const accentColor = gameInfo ? gameInfo.color : disc.color;
  const teamMeta = getTeamMeta(team);

  const seasonMoments = (choiceHistory || []).slice(-6);

  const netDeltas = STAT_DEFS.reduce((acc, def) => {
    acc[def.key] = seasonMoments.reduce((sum, m) => sum + (m.deltas[def.key] || 0), 0);
    return acc;
  }, {});
  const bestDef = STAT_DEFS.slice().sort((a, b) => netDeltas[b.key] - netDeltas[a.key])[0];
  const worstDef = STAT_DEFS.slice().sort((a, b) => netDeltas[a.key] - netDeltas[b.key])[0];
  const fmtSigned = (v) => (v > 0 ? `+${v}` : `${v}`);

  const topMoments = seasonMoments
    .slice()
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 2)
    .sort((a, b) => seasonMoments.indexOf(a) - seasonMoments.indexOf(b));

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <Icon
        size={420}
        className="absolute pointer-events-none select-none"
        style={{ color: accentColor, opacity: 0.05, top: "-8%", right: "-10%", transform: "rotate(-12deg)" }}
      />

      {/* HEADER — identique à GameScreen pour que le bilan s'inscrive dans le même fil visuel */}
      <div className="relative border-b px-4 sm:px-6 py-4 shrink-0" style={{ background: "#202329", borderColor: `${accentColor}33` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {teamMeta ? (
              <span
                className="shrink-0 flex items-center justify-center text-[9px] font-bold rounded-sm px-1.5 py-0.5"
                style={{ background: teamMeta.color, color: teamMeta.textColor, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {teamMeta.short}
              </span>
            ) : (
              <Icon size={16} color={accentColor} className="shrink-0" />
            )}
            <span
              className="text-xs uppercase tracking-widest truncate"
              style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {gameInfo ? gameInfo.label : disc.label}
              {roleInfo ? ` · ${roleInfo.label}` : ""} · {team || "Agent libre"} · Bilan de saison
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <button onClick={onToggleSound} className="press-feedback" style={{ color: "#6B6E78" }} title={soundOn ? "Couper le son" : "Activer le son"}>
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <div className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#DCDEE3" }}>
              {age} <span className="text-xs" style={{ color: "#9A9DA8" }}>ANS</span>
            </div>
          </div>
        </div>
        {growthProfile && (
          <div className="flex items-center gap-1.5 mb-3 -mt-1">
            <Sparkles size={11} className="shrink-0" style={{ color: "#A99BD9" }} />
            <span className="text-[10px] truncate" style={{ color: "#9A9DA8" }}>
              <span className="font-semibold" style={{ color: "#A99BD9" }}>{growthProfile.label}</span> — {growthProfile.desc}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          {STAT_DEFS.map((def) => (
            <StatBar key={def.key} def={def} value={stats[def.key]} delta={netDeltas[def.key]} />
          ))}
        </div>
      </div>
      <div
        className="h-[2px] w-full shrink-0"
        style={{ background: "linear-gradient(90deg, #C8A24B, #A99BD9, #D9924A, #D9757F)" }}
      />

      {/* CENTRE : TENDANCE + MOMENTS MARQUANTS */}
      <div className="relative flex-1 overflow-y-auto flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-xl flex flex-col gap-4 content-in">
          {mvpAwarded && (
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#23262D", borderLeft: "3px solid #C8A24B" }}>
              <Trophy size={16} style={{ color: "#C8A24B" }} className="shrink-0" />
              <span className="text-sm" style={{ color: "#DCDEE3" }}>
                <span className="font-semibold" style={{ color: "#C8A24B" }}>MVP de la saison</span> — tes stats
                dominent sur toute la ligne. +{MVP_SEASON_CREDIT_REWARD}{" "}
                <span style={{ color: "#C8A24B" }}>Crédits Prodige</span>
              </span>
            </div>
          )}
          <HudPanel>
            <div className="p-6 sm:p-8">
              <TickLabel
                className="text-[10px] uppercase tracking-[0.3em] mb-2"
                color={accentColor}
                style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}
              >
                Bilan de saison
              </TickLabel>
              <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}>
                {age - 2} → {age} ans
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm sm:text-[15px]" style={{ color: "#B8BAC2" }}>
                  <TrendingUp size={15} className="shrink-0" style={{ color: "#C8A24B" }} />
                  Ta meilleure progression : <span style={{ color: "#DCDEE3", fontWeight: 600 }}>{bestDef.label}</span>{" "}
                  <span style={{ color: "#C8A24B", fontFamily: "'JetBrains Mono', monospace" }}>({fmtSigned(netDeltas[bestDef.key])})</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-[15px]" style={{ color: "#B8BAC2" }}>
                  <TrendingDown size={15} className="shrink-0" style={{ color: "#D9757F" }} />
                  Ta stat la plus fragile : <span style={{ color: "#DCDEE3", fontWeight: 600 }}>{worstDef.label}</span>{" "}
                  <span style={{ color: "#D9757F", fontFamily: "'JetBrains Mono', monospace" }}>({fmtSigned(netDeltas[worstDef.key])})</span>
                </div>
              </div>
            </div>
          </HudPanel>

          {topMoments.length > 0 && (
            <div className="flex flex-col gap-2">
              {topMoments.map((moment, i) => (
                <HudPanel key={i}>
                  <div className="p-3">
                    {moment.eyebrow && (
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "#6B6E78" }}>
                        {moment.eyebrow}
                      </div>
                    )}
                    <div className="text-xs font-semibold mb-1" style={{ color: "#DCDEE3" }}>
                      {moment.title}
                    </div>
                    <div className="text-xs" style={{ color: "#9A9DA8" }}>→ {moment.choiceLabel}</div>
                  </div>
                </HudPanel>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BAS : ACTIONS */}
      <div className="relative px-4 sm:px-8 pb-8 shrink-0">
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          <button
            onClick={() => {
              playClick();
              onContinue();
            }}
            className="press-feedback self-center flex items-center gap-2 pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm"
            style={{
              clipPath: CLIP_SLANT,
              background: "#C8A24B",
              color: "#1B1D22",
              fontFamily: "'Oswald', sans-serif",
            }}
          >
            Saison suivante <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : BILAN / GAME OVER
--------------------------------------------------------- */
const RECONVERSION_TEXT = {
  coach: "Aujourd'hui, c'est sur le banc de touche que tu vis ta passion, à former la génération suivante.",
  streamer: "Aujourd'hui, c'est devant une caméra que tu vis ta passion, entouré d'une communauté fidèle.",
  analyste: "Aujourd'hui, c'est au micro que tu vis ta passion, à décortiquer les stars de demain.",
};

function EndScreen({ ending, stats, age, onRestart, rival, team, reconversion, growthProfile, choiceHistory, creditsEarned, statHistory, mvpCount }) {
  const teamMeta = getTeamMeta(team);
  const isLegend = ending.title === "Légende absolue";
  const keyMoments = (choiceHistory || [])
    .slice()
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 4)
    .sort((a, b) => choiceHistory.indexOf(a) - choiceHistory.indexOf(b));
  return (
    <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-10 text-center overflow-hidden">
      {/* Bandeau diagonal teinté selon la fin obtenue — le même "moment" que l'écran d'accueil */}
      <div
        className="absolute inset-0 pointer-events-none drift-glow"
        style={{
          background: `linear-gradient(115deg, transparent 40%, ${ending.tone}${isLegend ? "33" : "1A"} 55%, transparent 72%)`,
        }}
      />

      <div className="relative flex flex-col items-center">
        <div className="hero-stagger relative mb-2 flex items-center justify-center" style={{ animationDelay: "0s" }}>
          <HeroCrest size={isLegend ? 150 : 110} accent={ending.tone} />
          {isLegend &&
            [
              { top: 10, left: -55, delay: "0s" },
              { top: 20, left: 60, delay: "0.5s" },
              { top: -20, left: 15, delay: "1s" },
              { top: 55, left: -30, delay: "1.5s" },
            ].map((s, i) => (
              <Sparkles
                key={i}
                size={15}
                className="legend-float absolute pointer-events-none"
                style={{ top: s.top, left: `calc(50% + ${s.left}px)`, color: ending.tone, animation: `legendFloat 2.6s ease-in-out ${s.delay} infinite` }}
              />
            ))}
        </div>
        <div className="hero-stagger" style={{ animationDelay: "0.15s" }}>
          <TickLabel
            color={ending.tone}
            className="text-[11px] tracking-[0.4em] uppercase mb-2 justify-center"
            style={{ color: ending.tone, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="flex items-center gap-2">
              {teamMeta && (
                <span
                  className="flex items-center justify-center text-[9px] font-bold rounded-sm px-1.5 py-0.5 tracking-normal"
                  style={{ background: teamMeta.color, color: teamMeta.textColor }}
                >
                  {teamMeta.short}
                </span>
              )}
              <span>
                Fin de carrière · {age} ans{team ? ` · ${team}` : ""}
              </span>
            </span>
          </TickLabel>
        </div>
        <div className="hero-stagger relative overflow-hidden" style={{ isolation: "isolate", animationDelay: "0.25s" }}>
          <h2
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isLegend ? "px-2" : ""}`}
            style={{ color: ending.tone, fontFamily: "'Oswald', sans-serif" }}
          >
            {ending.title}
          </h2>
          {isLegend && (
            <div
              className="legend-shimmer absolute inset-y-0 w-1/3 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                animation: "legendShimmer 2.8s ease-in-out 0.3s infinite",
              }}
            />
          )}
        </div>
        <p className="hero-stagger max-w-md mb-2 leading-relaxed" style={{ color: "#B8BAC2", animationDelay: "0.35s" }}>{formatText(ending.desc, { RIVAL: rival })}</p>
        {reconversion && RECONVERSION_TEXT[reconversion] && (
          <p className="max-w-md mb-2 leading-relaxed text-sm italic" style={{ color: "#9A9DA8" }}>
            {RECONVERSION_TEXT[reconversion]}
          </p>
        )}
        {growthProfile && (
          <div className="flex items-center gap-1.5 mb-6 mt-1">
            <Sparkles size={12} className="shrink-0" style={{ color: "#A99BD9" }} />
            <span className="text-[11px]" style={{ color: "#9A9DA8" }}>
              Profil de carrière : <span className="font-semibold" style={{ color: "#A99BD9" }}>{growthProfile.label}</span>
            </span>
          </div>
        )}
        {mvpCount > 0 && (
          <div className="flex items-center gap-1.5 mb-6 mt-1">
            <Trophy size={12} className="shrink-0" style={{ color: "#C8A24B" }} />
            <span className="text-[11px]" style={{ color: "#9A9DA8" }}>
              MVP de la saison × <span className="font-semibold" style={{ color: "#C8A24B" }}>{mvpCount}</span>
            </span>
          </div>
        )}

        <HudPanel className="w-full max-w-sm mb-8">
          <div className="p-5 flex flex-col gap-3">
            {STAT_DEFS.map((def) => (
              <StatBar key={def.key} def={def} value={stats[def.key]} />
            ))}
          </div>
        </HudPanel>

        {statHistory && statHistory.length > 2 && (
          <div className="w-full max-w-sm mb-8">
            <TickLabel className="text-[10px] uppercase tracking-widest mb-3 justify-center" style={{ color: "#6B6E78" }}>
              Évolution de la carrière
            </TickLabel>
            <HudPanel>
              <div className="pt-4 px-2" style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statHistory} margin={{ top: 4, right: 10, left: -22, bottom: 0 }}>
                    <XAxis dataKey="turn" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{ background: "#1B1D22", border: "1px solid #363A44", borderRadius: 0, fontSize: 11 }}
                      labelFormatter={(t) => `Tour ${t}`}
                      labelStyle={{ color: "#9A9DA8", marginBottom: 4 }}
                      itemStyle={{ padding: 0 }}
                    />
                    {STAT_DEFS.map((def) => (
                      <Line
                        key={def.key}
                        type="monotone"
                        dataKey={def.key}
                        name={def.label}
                        stroke={def.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3 }}
                        isAnimationActive={true}
                        animationDuration={900}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pb-4 px-4">
                {STAT_DEFS.map((def) => (
                  <div key={def.key} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: def.color }} />
                    <span className="text-[10px]" style={{ color: "#9A9DA8" }}>{def.label}</span>
                  </div>
                ))}
              </div>
            </HudPanel>
          </div>
        )}

        {keyMoments.length > 0 && (
          <div className="w-full max-w-sm mb-8 text-left">
            <TickLabel className="text-[10px] uppercase tracking-widest mb-3 justify-center" style={{ color: "#6B6E78" }}>
              Moments clés de ta carrière
            </TickLabel>
            <div className="flex flex-col gap-2">
              {keyMoments.map((moment, i) => (
                <HudPanel key={i}>
                  <div className="p-3">
                    {moment.eyebrow && (
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "#6B6E78" }}>
                        {moment.eyebrow}
                      </div>
                    )}
                    <div className="text-xs font-semibold mb-1" style={{ color: "#DCDEE3" }}>
                      {moment.title}
                    </div>
                    <div className="text-xs" style={{ color: "#9A9DA8" }}>→ {moment.choiceLabel}</div>
                  </div>
                </HudPanel>
              ))}
            </div>
          </div>
        )}

        {creditsEarned > 0 && (
          <div className="flex items-center gap-2 mb-6 px-4 py-2" style={{ background: "#23262D", borderLeft: "3px solid #C8A24B" }}>
            <Sparkles size={14} style={{ color: "#C8A24B" }} />
            <span className="text-sm" style={{ color: "#DCDEE3" }}>
              +{creditsEarned} <span style={{ color: "#C8A24B" }}>Crédits Prodige</span>
            </span>
          </div>
        )}

        <button
          onClick={onRestart}
          className="pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm"
          style={{
            clipPath: CLIP_SLANT,
            background: "#363A44",
            color: "#DCDEE3",
            fontFamily: "'Oswald', sans-serif",
          }}
        >
          Nouvelle carrière
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ÉCRAN : PANTHÉON — galerie des carrières passées
--------------------------------------------------------- */
// Hiérarchie des fins de carrière, utilisée pour dégager "la meilleure" d'un ensemble de
// carrières (bannière de profil, meilleure fin par jeu, etc.)
const ENDING_RANK = {
  "Légende absolue": 5,
  "Streamer toxique": 4,
  "Génie incompris": 4,
  "Oublié de tous": 3,
  "Carrière brisée": 2,
  "Burnout total": 1,
  "Banni à vie": 0,
};

// Calcule les statistiques agrégées affichées en bannière de profil
function computeProfileStats(entries) {
  if (!entries.length) return null;
  let best = entries[0];
  entries.forEach((e) => {
    if ((ENDING_RANK[e.endingTitle] || 0) > (ENDING_RANK[best.endingTitle] || 0)) best = e;
  });
  const topOf = (key) => {
    const counts = {};
    entries.forEach((e) => {
      const v = e[key];
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    let top = null,
      topCount = 0;
    Object.entries(counts).forEach(([k, c]) => {
      if (c > topCount) {
        top = k;
        topCount = c;
      }
    });
    return top;
  };
  return {
    total: entries.length,
    bestEndingTitle: best.endingTitle,
    bestEndingTone: best.endingTone,
    favoriteGame: topOf("gameLabel"),
    topRival: topOf("rival"),
  };
}

// --- Badges de méta-progression ---------------------------------------
// Calculés à partir de l'historique complet des carrières (Panthéon), pas d'une seule partie.
// Certains champs (minStats, reconversionChoice) n'existent que sur les carrières jouées après
// l'ajout de ce système : les anciennes entrées sont ignorées pour ces badges-là plutôt que de
// planter, elles resteront simplement non comptabilisées rétroactivement.
const BADGES = [
  {
    id: "quatre_disciplines",
    label: "Touche-à-tout",
    desc: "Terminer une carrière dans les 4 disciplines.",
    Icon: Globe,
    check: (entries) => new Set(entries.map((e) => e.disciplineId)).size >= 4,
  },
  {
    id: "rival_eternel",
    label: "Rival éternel",
    desc: "Affronter le même rival dans 3 carrières différentes.",
    Icon: Swords,
    check: (entries) => {
      const counts = {};
      entries.forEach((e) => {
        if (e.rival) counts[e.rival] = (counts[e.rival] || 0) + 1;
      });
      return Object.values(counts).some((c) => c >= 3);
    },
  },
  {
    id: "legende_vivante",
    label: "Légende vivante",
    desc: 'Décrocher la fin "Légende absolue" au moins une fois.',
    Icon: Star,
    check: (entries) => entries.some((e) => e.endingTitle === "Légende absolue"),
  },
  {
    id: "toutes_les_fins",
    label: "Toutes les voies",
    desc: "Obtenir les 4 grandes fins : Légende absolue, Streamer toxique, Génie incompris, Oublié de tous.",
    Icon: Layers,
    check: (entries) => {
      const need = ["Légende absolue", "Streamer toxique", "Génie incompris", "Oublié de tous"];
      const have = new Set(entries.map((e) => e.endingTitle));
      return need.every((t) => have.has(t));
    },
  },
  {
    id: "increvable",
    label: "Increvable",
    desc: "Terminer une carrière sans jamais descendre sous 30 en Santé.",
    Icon: HeartPulse,
    check: (entries) => entries.some((e) => e.minStats && e.minStats.health >= 30),
  },
  {
    id: "sang_froid",
    label: "Sang-froid",
    desc: "Terminer une carrière sans jamais descendre sous 30 en Mental.",
    Icon: Brain,
    check: (entries) => entries.some((e) => e.minStats && e.minStats.mental >= 30),
  },
  {
    id: "reconverti_complet",
    label: "Toutes les reconversions",
    desc: "Choisir les 3 voies de reconversion en fin de carrière : Coach, Streamer, Analyste.",
    Icon: Repeat2,
    check: (entries) => {
      const have = new Set(entries.map((e) => e.reconversionChoice).filter(Boolean));
      return ["coach", "streamer", "analyste"].every((p) => have.has(p));
    },
  },
  {
    id: "veteran_scene",
    label: "Vétéran de la scène",
    desc: "Prendre sa retraite à 30 ans ou plus.",
    Icon: Award,
    check: (entries) => entries.some((e) => e.age >= 30),
  },
  {
    id: "fidele",
    label: "Fidèle au poste",
    desc: "Terminer 3 carrières sur le même jeu.",
    Icon: Users,
    check: (entries) => {
      const counts = {};
      entries.forEach((e) => {
        if (e.gameId) counts[e.gameId] = (counts[e.gameId] || 0) + 1;
      });
      return Object.values(counts).some((c) => c >= 3);
    },
  },
  {
    id: "dix_carrieres",
    label: "Pilier du Panthéon",
    desc: "Terminer 10 carrières.",
    Icon: Trophy,
    check: (entries) => entries.length >= 10,
  },
];

function computeBadges(entries) {
  return BADGES.map((b) => ({ ...b, unlocked: entries.length > 0 && b.check(entries) }));
}

// Regroupe les carrières par jeu pour un affichage moins chargé (un groupe repliable par jeu,
// plutôt qu'une grande grille brute) — trié par nombre de carrières décroissant.
function groupEntriesByGame(entries) {
  const groups = {};
  entries.forEach((e) => {
    const key = e.gameId || "inconnu";
    if (!groups[key]) {
      const gameInfo = Object.values(GAMES).flat().find((g) => g.id === e.gameId);
      groups[key] = {
        gameId: key,
        label: e.gameLabel || key,
        color: gameInfo ? gameInfo.color : "#9A9DA8",
        entries: [],
      };
    }
    groups[key].entries.push(e);
  });
  const list = Object.values(groups);
  list.forEach((g) => {
    let best = g.entries[0];
    g.entries.forEach((e) => {
      if ((ENDING_RANK[e.endingTitle] || 0) > (ENDING_RANK[best.endingTitle] || 0)) best = e;
    });
    g.bestEndingTitle = best.endingTitle;
    g.bestEndingTone = best.endingTone;
  });
  list.sort((a, b) => b.entries.length - a.entries.length);
  return list;
}

// Carte "vitrine" — volontairement condensée (pas le détail des carrières) pour rester nette
// et présentable, que ce soit affichée dans la galerie communautaire ou capturée en image.
function ShowcaseCard({ data, isMine, allGames, onSetFavoriteGame }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const unlockedBadges = BADGES.filter((b) => (data.badgeIds || []).includes(b.id));
  const editableFavorite = isMine && typeof onSetFavoriteGame === "function" && allGames;
  const accent = data.accentColor || "#C8A24B";
  return (
    <div
      style={{
        clipPath: CLIP,
        background: "linear-gradient(160deg, #23262D, #1B1D22)",
        border: `1px solid ${isMine ? accent : "#363A44"}`,
      }}
      className="p-5 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <TeamMark size={36} accent={accent} />
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold truncate" style={{ fontFamily: "'Oswald', sans-serif", color: "#DCDEE3" }}>
            {data.pseudo}
          </div>
          {data.titre ? (
            <div className="text-[10px] uppercase tracking-widest truncate" style={{ color: accent }}>
              {data.titre}
            </div>
          ) : (
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "#6B6E78" }}>
              {data.total} carrière{data.total > 1 ? "s" : ""}
            </div>
          )}
        </div>
        {isMine && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
            style={{ background: accent, color: "#1B1D22" }}
          >
            TOI
          </span>
        )}
      </div>

      {data.bestEndingTitle && (
        <div>
          <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#6B6E78" }}>
            Meilleure fin
          </div>
          <div className="text-lg leading-tight" style={{ color: data.bestEndingTone, fontFamily: "'Oswald', sans-serif" }}>
            {data.bestEndingTitle}
          </div>
        </div>
      )}

      {(data.favoriteGame || data.topRival || editableFavorite) && (
        <div className="flex gap-5 text-xs">
          {(data.favoriteGame || editableFavorite) && (
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#6B6E78" }}>
                Jeu favori
              </div>
              {editableFavorite ? (
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="flex items-center gap-1 hover:opacity-75 transition-opacity"
                  style={{ color: data.favoriteGame ? "#B8BAC2" : "#6B6E78" }}
                >
                  {data.favoriteGame || "Choisir"}
                  <ChevronRight size={11} style={{ transform: pickerOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              ) : (
                <div style={{ color: "#B8BAC2" }}>{data.favoriteGame}</div>
              )}
            </div>
          )}
          {data.topRival && (
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#6B6E78" }}>
                Rival récurrent
              </div>
              <div style={{ color: "#A99BD9" }}>{data.topRival}</div>
            </div>
          )}
        </div>
      )}

      {/* En flux normal (pas en position absolue) : le clip-path de la carte coupait le menu
          déroulant s'il débordait. En flux normal, la carte grandit simplement pour le contenir,
          et comme il n'y a que 9 jeux au total, tout tient sans avoir besoin de scroller. */}
      {editableFavorite && pickerOpen && (
        <div className="grid grid-cols-3 gap-1 p-2 -mt-2" style={{ background: "#1B1D22", border: "1px solid #363A44" }}>
          {allGames.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                onSetFavoriteGame(g.id, g.label);
                setPickerOpen(false);
              }}
              className="text-left text-[11px] px-2 py-1.5 hover:bg-[#262A32] transition-colors truncate"
              style={{ color: data.favoriteGame === g.label ? g.color : "#B8BAC2" }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {unlockedBadges.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[#363A44]">
          {unlockedBadges.slice(0, 8).map((b) => (
            <b.Icon key={b.id} size={16} title={b.label} style={{ color: "#C8A24B" }} />
          ))}
          {unlockedBadges.length > 8 && (
            <span className="text-[10px]" style={{ color: "#6B6E78" }}>
              +{unlockedBadges.length - 8}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// En-tête repliable unique, utilisé pour toutes les sections de la page Profil — garantit
// que "Badges" et "Carrières par jeu" se comportent et se lisent exactement de la même façon.
function CollapsibleHeader({ open, onToggle, color = "#6B6E78", children }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 group w-full">
      <ChevronRight
        size={13}
        style={{ color: "#6B6E78", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
      />
      <span className="w-[3px] h-[11px] shrink-0" style={{ background: color }} />
      <span className="text-[10px] uppercase tracking-widest group-hover:opacity-75 transition-opacity flex-1 text-left" style={{ color: "#9A9DA8" }}>
        {children}
      </span>
    </button>
  );
}

function ProfileScreen({ entries, loading, onStartCoach, favoriteGame, onSetFavoriteGame }) {
  const [expandedId, setExpandedId] = useState(null);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [openGames, setOpenGames] = useState({});
  const toggleGame = (gameId) => setOpenGames((o) => ({ ...o, [gameId]: !o[gameId] }));
  const profileStats = computeProfileStats(entries);
  const allGames = Object.values(GAMES).flat();
  const favoriteGameInfo = allGames.find((g) => g.id === favoriteGame);

  // --- Carte de profil (juste à screenshoter, rien n'est publié en ligne) ---
  const [pseudo, setPseudo] = useState("");
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [pseudoSaved, setPseudoSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await loadPseudo();
      setPseudo(p || "");
      setPseudoDraft(p || "");
    })();
  }, []);

  async function handleSavePseudo() {
    await savePseudo(pseudoDraft.trim());
    setPseudo(pseudoDraft.trim());
    setPseudoSaved(true);
    setTimeout(() => setPseudoSaved(false), 2000);
  }

  // --- Crédits Prodige & boutique cosmétique ---
  const [credits, setCredits] = useState(0);
  const [cosmetics, setCosmetics] = useState({ owned: ["accent_gold"], selectedAccent: "accent_gold", selectedTitle: null });
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, cos] = await Promise.all([loadCredits(), loadCosmetics()]);
      setCredits(c);
      setCosmetics(cos);
    })();
  }, []);

  const selectedAccentColor = (COSMETICS.find((c) => c.id === cosmetics.selectedAccent) || COSMETICS[0]).value;
  const selectedTitleValue = cosmetics.selectedTitle ? (COSMETICS.find((c) => c.id === cosmetics.selectedTitle) || {}).value : null;

  async function handleBuyCosmetic(item) {
    if (cosmetics.owned.includes(item.id) || credits < item.cost) return;
    const newCredits = credits - item.cost;
    const newCosmetics = { ...cosmetics, owned: [...cosmetics.owned, item.id] };
    setCredits(newCredits);
    setCosmetics(newCosmetics);
    await spendCredits(item.cost);
    await saveCosmetics(newCosmetics);
  }

  async function handleSelectCosmetic(item) {
    if (!cosmetics.owned.includes(item.id)) return;
    const key = item.type === "accent" ? "selectedAccent" : "selectedTitle";
    // Choisir un titre déjà sélectionné le désactive (façon interrupteur) ; l'accent, lui, reste toujours actif.
    const newValue = item.type === "title" && cosmetics.selectedTitle === item.id ? null : item.id;
    const newCosmetics = { ...cosmetics, [key]: newValue };
    setCosmetics(newCosmetics);
    await saveCosmetics(newCosmetics);
  }

  const livePreview = buildShowcaseData(entries, pseudoDraft, favoriteGameInfo ? favoriteGameInfo.label : null);
  livePreview.titre = selectedTitleValue;
  livePreview.accentColor = selectedAccentColor;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
      <div className="max-w-4xl w-full mx-auto">
        {/* BANNIÈRE — identité seulement, les stats vivent désormais dans la carte ci-dessous */}
        <div className="flex items-center gap-5 mb-8">
          <TeamMark size={56} mono={!profileStats} accent={selectedAccentColor} />
          <div className="text-left flex-1">
            <h2 className="text-2xl leading-tight" style={{ fontFamily: "'Oswald', sans-serif", color: "#DCDEE3" }}>
              Ton profil
            </h2>
            <p className="text-sm" style={{ color: "#9A9DA8" }}>
              {profileStats ? `${profileStats.total} carrière${profileStats.total > 1 ? "s" : ""} enregistrée${profileStats.total > 1 ? "s" : ""}` : "Aucune carrière pour l'instant"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 shrink-0" style={{ background: "#23262D", borderLeft: "3px solid #C8A24B" }}>
            <Sparkles size={13} style={{ color: "#C8A24B" }} />
            <span className="text-sm font-semibold" style={{ color: "#DCDEE3", fontFamily: "'JetBrains Mono', monospace" }}>
              {credits}
            </span>
          </div>
        </div>

        {/* TA CARTE DE PROFIL — seule et unique vitrine des stats agrégées (fin, jeu, rival) */}
        {entries.length > 0 && (
          <div className="mb-10 pb-10 border-b border-[#363A44]">
            <TickLabel className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#6B6E78" }}>
              Ta carte de profil
            </TickLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <ShowcaseCard
                data={livePreview}
                isMine
                allGames={allGames}
                onSetFavoriteGame={(gameId) => onSetFavoriteGame(gameId)}
              />
              <div className="flex flex-col gap-3">
                <input
                  value={pseudoDraft}
                  onChange={(e) => setPseudoDraft(e.target.value.slice(0, 24))}
                  placeholder="Ton pseudo"
                  className="px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#23262D", borderLeft: "3px solid #363A44", color: "#DCDEE3" }}
                />

                <button
                  onClick={handleSavePseudo}
                  className="flex items-center justify-center gap-2 pl-7 pr-5 py-2.5 text-sm font-semibold"
                  style={{ clipPath: CLIP_SLANT, background: "#C8A24B", color: "#1B1D22" }}
                >
                  {pseudo ? "Modifier le pseudo" : "Enregistrer le pseudo"}
                </button>
                <p className="text-[11px] leading-relaxed" style={{ color: "#6B6E78" }}>
                  Cette carte se met à jour automatiquement avec tes stats. Clique sur le jeu
                  favori pour le changer. Fais-en une capture d'écran pour la montrer où tu veux.
                </p>
                {pseudoSaved && <p className="text-[11px]" style={{ color: "#C8A24B" }}>Pseudo enregistré ✓</p>}
              </div>
            </div>
          </div>
        )}

        {/* BADGES DE MÉTA-PROGRESSION */}
        <div className="mb-8">
          <CollapsibleHeader open={badgesOpen} onToggle={() => setBadgesOpen((v) => !v)} color="#C8A24B">
            Badges {entries.length > 0 ? `(${computeBadges(entries).filter((b) => b.unlocked).length}/${BADGES.length})` : ""}
          </CollapsibleHeader>
          {badgesOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
              {computeBadges(entries).map((b) => (
                <div
                  key={b.id}
                  title={b.desc}
                  className="flex flex-col items-center text-center gap-1.5 px-2 py-3"
                  style={{
                    clipPath: CLIP,
                    background: "#23262D",
                    border: `1px solid ${b.unlocked ? "#C8A24B" : "#363A44"}`,
                    opacity: b.unlocked ? 1 : 0.45,
                  }}
                >
                  <b.Icon size={20} style={{ color: b.unlocked ? "#C8A24B" : "#6B6E78" }} />
                  <div className="text-[10px] font-semibold leading-tight" style={{ color: b.unlocked ? "#DCDEE3" : "#6B6E78" }}>
                    {b.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOUTIQUE COSMÉTIQUE — dépenser les Crédits Prodige gagnés en jouant */}
        <div className="mb-8">
          <CollapsibleHeader open={shopOpen} onToggle={() => setShopOpen((v) => !v)} color="#C8A24B">
            Boutique ({credits} crédits)
          </CollapsibleHeader>
          {shopOpen && (
            <div className="mt-3">
              <p className="text-[11px] leading-relaxed mb-4" style={{ color: "#6B6E78" }}>
                Purement cosmétique — gagné en terminant des carrières, jamais avec de l'argent réel.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {COSMETICS.map((item) => {
                  const owned = cosmetics.owned.includes(item.id);
                  const selected = item.type === "accent" ? cosmetics.selectedAccent === item.id : cosmetics.selectedTitle === item.id;
                  const affordable = credits >= item.cost;
                  return (
                    <button
                      key={item.id}
                      onClick={() => (owned ? handleSelectCosmetic(item) : handleBuyCosmetic(item))}
                      disabled={!owned && !affordable}
                      className="flex flex-col items-center text-center gap-1.5 px-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        clipPath: CLIP,
                        background: "#23262D",
                        border: `1px solid ${selected ? "#C8A24B" : "#363A44"}`,
                      }}
                    >
                      {item.type === "accent" ? (
                        <span className="w-5 h-5 rounded-full shrink-0" style={{ background: item.value, border: "1px solid #4A4E59" }} />
                      ) : (
                        <Star size={18} style={{ color: owned ? "#C8A24B" : "#6B6E78" }} />
                      )}
                      <div className="text-[10px] font-semibold leading-tight" style={{ color: owned ? "#DCDEE3" : "#6B6E78" }}>
                        {item.label}
                      </div>
                      <div className="text-[9px]" style={{ color: selected ? "#C8A24B" : "#6B6E78" }}>
                        {selected ? "Actif" : owned ? "Choisir" : `${item.cost} crédits`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center text-center py-12">
            <TeamMark size={90} mono className="mb-5 opacity-60" />
            <p className="text-sm max-w-xs" style={{ color: "#9A9DA8" }}>
              Ton profil est encore vide. Termine une première carrière pour qu'elle apparaisse ici.
            </p>
          </div>
        )}

        {/* CARRIÈRES REGROUPÉES PAR JEU */}
        {entries.length > 0 && (
          <div>
            <TickLabel className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#6B6E78" }}>
              Tes carrières
            </TickLabel>
            <div className="flex flex-col gap-2">
              {groupEntriesByGame(entries).map((group) => {
                const isOpen = !!openGames[group.gameId];
                return (
                  <div key={group.gameId}>
                    <CollapsibleHeader open={isOpen} onToggle={() => toggleGame(group.gameId)} color={group.color}>
                      <span className="flex items-center justify-between w-full normal-case tracking-normal">
                        <span className="text-sm font-semibold truncate" style={{ color: "#DCDEE3" }}>{group.label}</span>
                        <span className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-[10px] uppercase tracking-widest" style={{ color: "#6B6E78" }}>
                            {group.entries.length} carrière{group.entries.length > 1 ? "s" : ""}
                          </span>
                          <span
                            className="text-[10px] font-semibold hidden sm:inline"
                            style={{ color: group.bestEndingTone, fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {group.bestEndingTitle}
                          </span>
                        </span>
                      </span>
                    </CollapsibleHeader>

                    {isOpen && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start mt-3 mb-1 pl-5">
                        {group.entries.map((entry) => {
                          const unlocks = getUnlocks(entry);
                          const expanded = expandedId === entry.id;
                          return (
                            <HudPanel key={entry.id} style={{ gridColumn: expanded ? "1 / -1" : "auto" }}>
                              <button
                                onClick={() => setExpandedId(expanded ? null : entry.id)}
                                className="w-full text-left p-4 sm:p-5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div
                                      className="text-[10px] uppercase tracking-widest mb-1 truncate"
                                      style={{ color: entry.endingTone, fontFamily: "'JetBrains Mono', monospace" }}
                                    >
                                      {entry.roleLabel ? `${entry.roleLabel} · ` : ""}
                                      {entry.age} ans
                                    </div>
                                    <div
                                      className="text-base truncate"
                                      style={{ color: entry.endingTone, fontFamily: "'Oswald', sans-serif" }}
                                    >
                                      {entry.endingTitle}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {unlocks.coach && <BookOpen size={14} className="" style={{ color: "#C8A24B" }} />}
                                    {unlocks.founder && <Landmark size={14} className="" style={{ color: "#D9924A" }} />}
                                    {!unlocks.coach && !unlocks.founder && <Lock size={13} className="" style={{ color: "#4A4E59" }} />}
                                  </div>
                                </div>
                              </button>

                              {expanded && (
                                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#363A44]">
                                  <div className="grid grid-cols-2 gap-3 my-4">
                                    {Object.entries(entry.stats).map(([key, value]) => {
                                      const def = STAT_DEFS.find((d) => d.key === key);
                                      if (!def) return null;
                                      return <StatBar key={key} def={def} value={value} />;
                                    })}
                                  </div>
                                  <p className="text-xs mb-4" style={{ color: "#9A9DA8" }}>
                                    Profil : <span className="" style={{ color: "#A99BD9" }}>{entry.growthProfileLabel}</span>
                                    {entry.team ? <> · Équipe : {entry.team}</> : null}
                                    {entry.rival ? <> · Rival : {entry.rival}</> : null}
                                  </p>

                                  <div className="flex flex-col gap-2">
                                    {unlocks.coach ? (
                                      <button
                                        onClick={() => onStartCoach(entry)}
                                        className="flex items-center justify-center gap-2 pl-7 pr-5 py-2.5 text-sm font-semibold"
                                        style={{ clipPath: CLIP_SLANT, background: "#C8A24B", color: "#1B1D22" }}
                                      >
                                        <BookOpen size={15} /> Devenir coach
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2 px-4 py-2.5 text-xs" style={{ color: "#6B6E78" }}>
                                        <Lock size={13} /> Coach non débloqué (il faut une carrière plus solide)
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 px-4 py-2.5 text-xs" style={{ color: "#6B6E78" }}>
                                      <Lock size={13} />
                                      {unlocks.founder
                                        ? "Fonder ta structure — bientôt disponible"
                                        : "Fondateur non débloqué (il faut une carrière plus solide)"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </HudPanel>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MODE COACH — écran de jeu et écran de bilan
--------------------------------------------------------- */
function CoachGameScreen({ base, age, stats, deltas, event, onChoice, phase, lastResult, onContinue, turnIndex, total, soundOn, onToggleSound }) {
  const vars = { RIVAL: base.rival, ALLY: base.ally, TEAM: base.team || "ton ancienne équipe" };
  const fmt = (str) => formatText(str, vars);

  const actionsRef = useRef(null);
  useEffect(() => {
    actionsRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [phase, turnIndex]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#363A44] bg-[#202329] px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen size={16} color="#C8A24B" className="shrink-0" />
            <span
              className="text-xs uppercase tracking-widest truncate"
              style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}
            >
              Coach · Tour {turnIndex + 1}/{total}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <button onClick={onToggleSound} className="press-feedback" style={{ color: "#6B6E78" }} title={soundOn ? "Couper le son" : "Activer le son"}>
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <div className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#DCDEE3" }}>
              {age} <span className="text-xs" style={{ color: "#9A9DA8" }}>ANS</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          {COACH_STAT_DEFS.map((def) => (
            <StatBar key={def.key} def={def} value={stats[def.key]} delta={deltas?.[def.key]} />
          ))}
        </div>
      </div>
      <div className="h-[2px] w-full shrink-0" style={{ background: "linear-gradient(90deg, #C8A24B, #A99BD9, #D9924A, #D9757F)" }} />

      <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 sm:px-8 py-8">
        <HudPanel className="w-full max-w-xl">
          <div className="p-6 sm:p-8 content-in" key={`${phase}-${turnIndex}`}>
            {phase === "event" ? (
              <>
                <TickLabel className="text-[10px] uppercase tracking-[0.3em] mb-2" color="#C8A24B" style={{ color: "#C8A24B", fontFamily: "'JetBrains Mono', monospace" }}>
                  {event.eyebrow}
                </TickLabel>
                <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}>
                  {fmt(event.title)}
                </h3>
                <p className="leading-relaxed text-sm sm:text-base" style={{ color: "#B8BAC2" }}>{fmt(event.text)}</p>
              </>
            ) : (
              <>
                <TickLabel className="text-[10px] uppercase tracking-[0.3em] mb-2" color="#9A9DA8" style={{ color: "#9A9DA8", fontFamily: "'JetBrains Mono', monospace" }}>
                  Conséquence
                </TickLabel>
                <p className="leading-relaxed text-sm sm:text-base" style={{ color: "#DCDEE3" }}>{fmt(lastResult)}</p>
              </>
            )}
          </div>
        </HudPanel>
      </div>

      <div className="px-4 sm:px-8 pb-8 shrink-0" ref={actionsRef}>
        <div className="max-w-xl mx-auto flex flex-col gap-3">
          {phase === "event"
            ? event.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => {
                    playClick();
                    onChoice(choice);
                  }}
                  className="press-feedback text-left pl-7 pr-6 py-3.5 transition-colors hover:bg-[#262A32]"
                  style={{ clipPath: CLIP_SLANT, background: "#23262D", border: "1px solid #363A44" }}
                >
                  <span className="text-sm sm:text-[15px] font-medium" style={{ color: "#DCDEE3" }}>{fmt(choice.label)}</span>
                </button>
              ))
            : (
                <button
                  onClick={() => {
                    playClick();
                    onContinue();
                  }}
                  className="press-feedback self-center flex items-center gap-2 pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm"
                  style={{ clipPath: CLIP_SLANT, background: "#C8A24B", color: "#1B1D22", fontFamily: "'Oswald', sans-serif" }}
                >
                  Continuer <ChevronRight size={16} />
                </button>
              )}
        </div>
      </div>
    </div>
  );
}

function CoachEndScreen({ ending, stats, age, onRestart }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-10 text-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(115deg, transparent 40%, ${ending.tone}1A 55%, transparent 72%)` }}
      />
      <div className="relative flex flex-col items-center">
        <BookOpen size={28} color={ending.tone} className="mb-4" />
        <TickLabel color={ending.tone} className="text-[11px] tracking-[0.4em] uppercase mb-2 justify-center" style={{ color: ending.tone, fontFamily: "'JetBrains Mono', monospace" }}>
          Fin de carrière de coach · {age} ans
        </TickLabel>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: ending.tone, fontFamily: "'Oswald', sans-serif" }}>
          {ending.title}
        </h2>
        <p className="max-w-md mb-8 leading-relaxed" style={{ color: "#B8BAC2" }}>{ending.desc}</p>

        <HudPanel className="w-full max-w-sm mb-8">
          <div className="p-5 flex flex-col gap-3">
            {COACH_STAT_DEFS.map((def) => (
              <StatBar key={def.key} def={def} value={stats[def.key]} />
            ))}
          </div>
        </HudPanel>

        <button
          onClick={onRestart}
          className="pl-9 pr-7 py-3 font-semibold uppercase tracking-widest text-sm"
          style={{ clipPath: CLIP_SLANT, background: "#363A44", color: "#DCDEE3", fontFamily: "'Oswald', sans-serif" }}
        >
          Retour au profil
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   APP
--------------------------------------------------------- */
export default function EsportCareerGame() {
  const [screen, setScreen] = useState("start");
  const [background, setBackground] = useState(null);
  const [discipline, setDiscipline] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [age, setAge] = useState(16);
  const [stats, setStats] = useState({ skill: 50, mental: 50, reputation: 50, health: 50 });
  // Le plus bas jamais atteint pour chaque stat pendant la carrière en cours (sert aux badges
  // type "Increvable" : distinct des stats finales, qui peuvent être remontées entre-temps).
  const [minStats, setMinStats] = useState({ skill: 50, mental: 50, reputation: 50, health: 50 });
  // Historique des choix de la carrière en cours, pour le récap "moments clés" en fin de partie.
  const [choiceHistory, setChoiceHistory] = useState([]);
  // Un instantané des 4 stats à chaque tour, pour tracer la courbe d'évolution sur l'écran de fin.
  const [statHistory, setStatHistory] = useState([{ turn: 0, skill: 50, mental: 50, reputation: 50, health: 50 }]);
  const [creditsEarned, setCreditsEarned] = useState(0);
  // MVP de la saison : total de la carrière en cours, dernière saison où il a été décerné
  // (pour éviter deux saisons MVP d'affilée), et indicateur transitoire pour le bilan affiché.
  const [mvpCount, setMvpCount] = useState(0);
  const [lastMvpSeason, setLastMvpSeason] = useState(null);
  const [seasonMvpAwarded, setSeasonMvpAwarded] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [phase, setPhase] = useState("event");
  const [lastResult, setLastResult] = useState("");
  const [lastDeltas, setLastDeltas] = useState(null);
  const [ending, setEnding] = useState(null);
  const [rival, setRival] = useState(() => pickRandom(RIVAL_NAMES));
  const [ally, setAlly] = useState(() => pickRandom(ALLY_NAMES));
  const [team, setTeam] = useState(null);
  const [flags, setFlags] = useState({ wristCare: true, psySupport: true, cheatCloud: false });
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [growthProfile, setGrowthProfile] = useState(() => pickRandom(GROWTH_PROFILES));

  // --- Panthéon ---
  const [pantheonEntries, setPantheonEntries] = useState([]);
  const [pantheonLoading, setPantheonLoading] = useState(false);
  const [favoriteGame, setFavoriteGame] = useState(null);

  // --- Préférence son (coupé par défaut, comme tout audio de navigateur) ---
  const [soundOn, setSoundOn] = useState(false);
  useEffect(() => {
    (async () => {
      const on = await loadSoundPref();
      setSoundOn(on);
      setSoundMuted(!on);
    })();
  }, []);

  function handleToggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundMuted(!next);
    saveSoundPref(next);
    if (next) unlockAudio();
  }

  // --- Onboarding (affiché une seule fois, avant la toute première carrière) ---
  const [onboardingSeen, setOnboardingSeen] = useState(true); // true par défaut le temps du chargement, pour ne rien afficher à tort
  useEffect(() => {
    (async () => {
      setOnboardingSeen(await loadOnboardingSeen());
    })();
  }, []);

  function handleStartFromStartScreen() {
    if (!onboardingSeen) {
      setScreen("onboarding");
    } else {
      setScreen("discipline");
    }
  }

  function handleFinishOnboarding() {
    setOnboardingSeen(true);
    saveOnboardingSeen();
    setScreen("discipline");
  }

  async function refreshPantheon() {
    setPantheonLoading(true);
    const [entries, fav] = await Promise.all([loadPantheonEntries(), loadFavoriteGame()]);
    setPantheonEntries(entries);
    setFavoriteGame(fav);
    setPantheonLoading(false);
  }

  function handleSetFavoriteGame(gameId) {
    setFavoriteGame(gameId);
    saveFavoriteGame(gameId);
  }

  // --- Mode Coach (seconde carrière débloquée depuis le Panthéon) ---
  const [coachBase, setCoachBase] = useState(null);
  const [coachStats, setCoachStats] = useState({ pedagogie: 50, autorite: 50, reputation: 50, equilibre: 50 });
  const [coachAge, setCoachAge] = useState(28);
  const [coachTurnIndex, setCoachTurnIndex] = useState(0);
  const [coachPhase, setCoachPhase] = useState("event");
  const [coachLastResult, setCoachLastResult] = useState("");
  const [coachLastDeltas, setCoachLastDeltas] = useState(null);
  const [coachEnding, setCoachEnding] = useState(null);

  function startCoachCareer(entry) {
    setCoachBase(entry);
    setCoachStats({ pedagogie: 50, autorite: 50, reputation: 50, equilibre: 50 });
    setCoachAge(28);
    setCoachTurnIndex(0);
    setCoachPhase("event");
    setCoachLastResult("");
    setCoachLastDeltas(null);
    setCoachEnding(null);
    markReconversionUsed(entry.id, "coach");
    setScreen("coach-game");
  }

  function handleCoachChoice(choice) {
    const newStats = { ...coachStats };
    const appliedDeltas = {};
    Object.entries(choice.effects).forEach(([key, val]) => {
      const before = newStats[key];
      const adjustedVal = val > 0 ? Math.round(val * (1 - (before / 100) * 0.6)) : val;
      newStats[key] = clamp(before + adjustedVal);
      appliedDeltas[key] = newStats[key] - before;
    });

    if (newStats.autorite <= 0 || newStats.equilibre <= 0) {
      setCoachStats(newStats);
      setCoachEnding(computeCoachEnding(newStats));
      setScreen("coach-end");
      return;
    }

    setCoachStats(newStats);
    setCoachLastDeltas(appliedDeltas);
    setCoachLastResult(choice.result);
    setCoachPhase("result");
  }

  function handleCoachContinue() {
    setCoachAge((a) => a + 1);
    setCoachLastDeltas(null);
    if (coachTurnIndex + 1 >= COACH_EVENTS.length) {
      setCoachEnding(computeCoachEnding(coachStats));
      setScreen("coach-end");
    } else {
      setCoachTurnIndex((i) => i + 1);
      setCoachPhase("event");
    }
  }

  // L'ordre est calculé une fois par carrière (dépend de la graine, PAS des flags),
  // pour ne jamais se réorganiser sous les pieds du joueur en cours de partie.
  const orderedSequence = useMemo(() => {
    if (!discipline) return [];
    return buildEventSequence(discipline, selectedGame, selectedRole, background, seed);
  }, [discipline, selectedGame, selectedRole, background, seed]);

  // Le filtre par flags s'applique ensuite, en préservant l'ordre déjà déterminé ci-dessus.
  const events = useMemo(() => {
    return orderedSequence.filter((e) => !e.requiresFlag || flags[e.requiresFlag.name] === e.requiresFlag.value);
  }, [orderedSequence, flags]);

  function resetAll() {
    setScreen("start");
    setDiscipline(null);
    setSelectedGame(null);
    setSelectedRole(null);
    setAge(16);
    setStats({ skill: 50, mental: 50, reputation: 50, health: 50 });
    setMinStats({ skill: 50, mental: 50, reputation: 50, health: 50 });
    setChoiceHistory([]);
    setStatHistory([{ turn: 0, skill: 50, mental: 50, reputation: 50, health: 50 }]);
    setCreditsEarned(0);
    setMvpCount(0);
    setLastMvpSeason(null);
    setSeasonMvpAwarded(false);
    setTurnIndex(0);
    setPhase("event");
    setLastResult("");
    setLastDeltas(null);
    setEnding(null);
    setRival(pickRandom(RIVAL_NAMES));
    setAlly(pickRandom(ALLY_NAMES));
    setTeam(null);
    setFlags({ wristCare: true, psySupport: true, cheatCloud: false });
    setSeed(Math.floor(Math.random() * 1e9));
    setGrowthProfile(pickRandom(GROWTH_PROFILES));
  }

  function finalizeCareer(finalStats, cause, ageAtEnd, minStatsAtEnd) {
    const endingObj = computeEnding(finalStats, cause);
    // Cas rare : une "Légende absolue" a duré bien plus longtemps que la moyenne — c'est
    // justement l'exception ("il y en a peu qui l'ont fait"), pas la norme. Les autres fins
    // gardent l'âge réaliste calculé par ageForTurn.
    const finalAge =
      endingObj.title === "Légende absolue" ? ageAtEnd + 4 + Math.floor(Math.random() * 6) : ageAtEnd;
    setAge(finalAge);
    setEnding(endingObj);
    setScreen("end");
    if (endingObj.title === "Légende absolue") playFanfare();
    const gameInfo = (GAMES[discipline] || []).find((g) => g.id === selectedGame);
    const roleInfo = (ROLES[selectedGame] || []).find((r) => r.id === selectedRole);
    savePantheonEntry({
      id: `${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      disciplineId: discipline,
      gameId: selectedGame,
      gameLabel: gameInfo ? gameInfo.label : selectedGame,
      roleId: selectedRole,
      roleLabel: roleInfo ? roleInfo.label : null,
      background,
      growthProfileId: growthProfile.id,
      growthProfileLabel: growthProfile.label,
      rival,
      ally,
      team,
      stats: finalStats,
      minStats: minStatsAtEnd,
      age: finalAge,
      mvpCount,
      endingTitle: endingObj.title,
      endingTone: endingObj.tone,
      reconversionUsed: null,
      reconversionChoice: flags.reconversion || null,
      timestamp: Date.now(),
    });
    const reward = CREDIT_REWARDS[endingObj.title] || 50;
    setCreditsEarned(reward);
    awardCredits(reward);
  }

  function handleChoice(choice, teamOffer) {
    const newStats = { ...stats };
    const appliedDeltas = {};
    Object.entries(choice.effects).forEach(([key, val]) => {
      const before = newStats[key];
      // Profil de croissance : multiplie (positif ET négatif) selon le point fort/faible de la carrière.
      const withProfile = val * (growthProfile.multipliers[key] ?? 1);
      // Rendements décroissants : un gain positif compte moins quand la stat est déjà haute
      // (100 -> 40% d'effet, 0 -> 100% d'effet). Les pertes ne sont pas atténuées.
      const adjustedVal = withProfile > 0 ? Math.round(withProfile * (1 - (before / 100) * 0.6)) : Math.round(withProfile);
      newStats[key] = clamp(before + adjustedVal);
      appliedDeltas[key] = newStats[key] - before;
    });

    // On combine ici (plutôt que d'attendre le prochain rendu) pour que finalizeCareer puisse
    // recevoir le minimum à jour dès ce tour, y compris en cas de fin de carrière immédiate.
    const combinedMin = {
      skill: Math.min(minStats.skill, newStats.skill),
      mental: Math.min(minStats.mental, newStats.mental),
      reputation: Math.min(minStats.reputation, newStats.reputation),
      health: Math.min(minStats.health, newStats.health),
    };
    setMinStats(combinedMin);
    setStatHistory((h) => [...h, { turn: turnIndex + 1, ...newStats }]);

    const currentEvent = events[turnIndex];
    const magnitude = Object.values(appliedDeltas).reduce((sum, d) => sum + Math.abs(d), 0);
    const historyVars = { RIVAL: rival, ALLY: ally, TEAM: teamOffer || team || "", LEAGUE: "" };
    setChoiceHistory((h) => [
      ...h,
      {
        eyebrow: currentEvent ? formatText(currentEvent.eyebrow, historyVars) : "",
        title: currentEvent ? formatText(currentEvent.title, historyVars) : "",
        choiceLabel: formatText(choice.label, historyVars),
        deltas: appliedDeltas,
        magnitude,
      },
    ]);

    if (choice.setTeam && teamOffer) {
      setTeam(teamOffer);
    }
    if (choice.flag) {
      setFlags((f) => ({ ...f, [choice.flag.name]: choice.flag.value }));
    }

    if (choice.banEnding) {
      setStats(newStats);
      finalizeCareer(newStats, "ban", age, combinedMin);
      return;
    }

    if (newStats.mental <= 0) {
      setStats(newStats);
      finalizeCareer(newStats, "mental", age, combinedMin);
      return;
    }
    if (newStats.health <= 0) {
      setStats(newStats);
      finalizeCareer(newStats, "health", age, combinedMin);
      return;
    }

    setStats(newStats);
    setLastDeltas(appliedDeltas);
    setLastResult(choice.result);
    setPhase("result");
  }

  function handleContinue() {
    const nextAge = ageForTurn(turnIndex + 1);
    const nextTurn = turnIndex + 1;
    setLastDeltas(null);
    if (nextTurn >= events.length) {
      setAge(nextAge);
      finalizeCareer(stats, null, nextAge, minStats);
      return;
    }
    setAge(nextAge);
    if (nextTurn % 6 === 0) {
      // Saison de 6 tours (2 ans) bouclée — turnIndex avance seulement en quittant le bilan,
      // pour que l'écran de bilan affiche encore les 6 derniers choix de choiceHistory.
      const seasonIndex = nextTurn / 6;
      const awarded = qualifiesForSeasonMvp(stats) && seasonIndex - (lastMvpSeason ?? -2) >= 2;
      if (awarded) {
        setMvpCount((c) => c + 1);
        setLastMvpSeason(seasonIndex);
        awardCredits(MVP_SEASON_CREDIT_REWARD);
      }
      setSeasonMvpAwarded(awarded);
      setPhase("season");
    } else {
      setTurnIndex((i) => i + 1);
      setPhase("event");
    }
  }

  function handleContinueFromSeason() {
    setTurnIndex((i) => i + 1);
    setPhase("event");
  }

  return (
    <div
      className="w-full h-full min-h-screen min-h-[640px] bg-[#1B1D22] flex flex-col"
      style={{ color: "#DCDEE3", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
        html, body { background: #1B1D22 !important; margin: 0; }

        /* Traitement spécial, réservé à la fin "Légende absolue" — la plus rare, la plus méritée. */
        @keyframes legendPulse {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.18); opacity: 0.85; }
        }
        @keyframes legendFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-8px) scale(1.15); opacity: 1; }
        }
        @keyframes legendShimmer {
          0% { transform: translateX(-130%) skewX(-20deg); }
          100% { transform: translateX(230%) skewX(-20deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .legend-pulse, .legend-float, .legend-shimmer { animation: none !important; }
        }

        /* Feedback léger à chaque interaction — un contenu qui entre plutôt que d'apparaître
           sec, un delta qui "pop" au lieu de juste s'afficher, un bouton qui réagit au clic. */
        @keyframes contentIn {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes deltaPop {
          0% { opacity: 0; transform: scale(0.4); }
          60% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        .content-in { animation: contentIn 0.28s ease-out; }
        .delta-pop { display: inline-block; animation: deltaPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .press-feedback { transition: transform 0.1s ease; }
        .press-feedback:active { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) {
          .content-in, .delta-pop { animation: none !important; }
        }

        /* Écran d'accueil : entrée en scène échelonnée + mouvement ambiant continu, pour que
           ça vive dès le premier regard au lieu d'apparaître tout d'un bloc, figé. */
        @keyframes heroRise {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes crestSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crestPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.06); }
        }
        @keyframes driftGlow {
          0%, 100% { opacity: 0.7; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(3%); }
        }
        .hero-stagger { opacity: 0; animation: heroRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .crest-ring { animation: crestSpin 40s linear infinite; }
        .crest-glow { animation: crestPulse 3.5s ease-in-out infinite; }
        .drift-glow { animation: driftGlow 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hero-stagger { opacity: 1; animation: none !important; }
          .crest-ring, .crest-glow, .drift-glow { animation: none !important; }
        }

        /* Accessibilité clavier : un indicateur de focus net et cohérent avec le thème (gold),
           au lieu du contour par défaut du navigateur — souvent peu visible sur fond sombre,
           ou mal rendu sur les éléments à coins coupés/inclinés. Ne s'affiche qu'à la navigation
           clavier (:focus-visible), jamais au clic/tap, pour ne rien changer à l'usage souris.
           Le contour (outline) est coupé par clip-path sur les boutons à forme découpée/inclinée
           — la bordure forcée ci-dessous, elle, suit toujours la forme et reste visible partout. */
        button:focus-visible,
        input:focus-visible,
        a:focus-visible {
          outline: 2px solid #C8A24B;
          outline-offset: 3px;
          border-radius: 2px;
        }
        button:focus-visible {
          border: 2px solid #C8A24B !important;
        }

        /* Filet de sécurité : force les classes Tailwind en notation crochet (text-[#xxxxxx],
           bg-[#xxxxxx], border-[#xxxxxx]) qui ne sont pas toujours générées correctement dans
           cet environnement, ce qui faisait apparaître du texte quasi noir sur fond sombre. */
        .text-\[\#9A9DA8\] { color: #9A9DA8 !important; }
        .text-\[\#DCDEE3\] { color: #DCDEE3 !important; }
        .text-\[\#A99BD9\] { color: #A99BD9 !important; }
        .text-\[\#6B6E78\] { color: #6B6E78 !important; }
        .text-\[\#B8BAC2\] { color: #B8BAC2 !important; }
        .text-\[\#C8A24B\] { color: #C8A24B !important; }
        .text-\[\#D9924A\] { color: #D9924A !important; }
        .text-\[\#D9757F\] { color: #D9757F !important; }
        .text-\[\#4A4E59\] { color: #4A4E59 !important; }
        .bg-\[\#262A32\] { background-color: #262A32 !important; }
        .bg-\[\#202329\] { background-color: #202329 !important; }
        .bg-\[\#23262D\] { background-color: #23262D !important; }
        .bg-\[\#1B1D22\] { background-color: #1B1D22 !important; }
        .border-\[\#363A44\] { border-color: #363A44 !important; }
        .hover\:text-\[\#DCDEE3\]:hover { color: #DCDEE3 !important; }
      `}</style>

      {screen !== "game" && screen !== "coach-game" && (
        <TopNav
          current={screen === "pantheon" ? "profile" : "home"}
          onHome={resetAll}
          onProfile={() => {
            refreshPantheon();
            setScreen("pantheon");
          }}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
        />
      )}

      <ScreenFade screenKey={screen}>
      {screen === "start" && (
        <StartScreen
          background={background}
          setBackground={setBackground}
          onNext={handleStartFromStartScreen}
        />
      )}

      {screen === "onboarding" && <OnboardingScreen onDone={handleFinishOnboarding} />}

      {screen === "pantheon" && (
        <ProfileScreen
          entries={pantheonEntries}
          loading={pantheonLoading}
          onStartCoach={startCoachCareer}
          favoriteGame={favoriteGame}
          onSetFavoriteGame={handleSetFavoriteGame}
        />
      )}

      {screen === "discipline" && (
        <DisciplineScreen
          onSelect={(id) => {
            setDiscipline(id);
            setScreen("game-select");
          }}
        />
      )}

      {screen === "game-select" && discipline && (
        <GameSelectScreen
          discipline={discipline}
          onSelect={(gameId) => {
            setSelectedGame(gameId);
            setSelectedRole(null);
            setScreen(ROLES[gameId] ? "role-select" : "game");
          }}
          onBack={() => {
            setDiscipline(null);
            setScreen("discipline");
          }}
        />
      )}

      {screen === "role-select" && selectedGame && (
        <RoleSelectScreen
          game={selectedGame}
          onSelect={(roleId) => {
            setSelectedRole(roleId);
            setScreen("game");
          }}
          onBack={() => {
            setSelectedGame(null);
            setScreen("game-select");
          }}
        />
      )}

      {screen === "game" && events.length > 0 && phase !== "season" && (
        <GameScreen
          discipline={discipline}
          game={selectedGame}
          role={selectedRole}
          age={age}
          stats={stats}
          deltas={lastDeltas}
          event={events[turnIndex]}
          onChoice={handleChoice}
          phase={phase}
          lastResult={lastResult}
          onContinue={handleContinue}
          turnIndex={turnIndex}
          total={events.length}
          rival={rival}
          ally={ally}
          team={team}
          growthProfile={growthProfile}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
        />
      )}

      {screen === "game" && events.length > 0 && phase === "season" && (
        <SeasonRecapScreen
          discipline={discipline}
          game={selectedGame}
          role={selectedRole}
          age={age}
          stats={stats}
          team={team}
          growthProfile={growthProfile}
          choiceHistory={choiceHistory}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
          onContinue={handleContinueFromSeason}
          mvpAwarded={seasonMvpAwarded}
        />
      )}

      {screen === "end" && ending && (
        <EndScreen ending={ending} stats={stats} age={age} onRestart={resetAll} rival={rival} team={team} reconversion={flags.reconversion} growthProfile={growthProfile} choiceHistory={choiceHistory} creditsEarned={creditsEarned} statHistory={statHistory} mvpCount={mvpCount} />
      )}

      {screen === "coach-game" && coachBase && (
        <CoachGameScreen
          base={coachBase}
          age={coachAge}
          stats={coachStats}
          deltas={coachLastDeltas}
          event={COACH_EVENTS[coachTurnIndex]}
          onChoice={handleCoachChoice}
          phase={coachPhase}
          lastResult={coachLastResult}
          onContinue={handleCoachContinue}
          turnIndex={coachTurnIndex}
          total={COACH_EVENTS.length}
          soundOn={soundOn}
          onToggleSound={handleToggleSound}
        />
      )}

      {screen === "coach-end" && coachEnding && (
        <CoachEndScreen
          ending={coachEnding}
          stats={coachStats}
          age={coachAge}
          onRestart={() => {
            refreshPantheon();
            setScreen("pantheon");
          }}
        />
      )}
      </ScreenFade>
    </div>
  );
}
