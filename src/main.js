import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "./styles.css";

const atmoUrl = new URL("../sounds/atmo.mp3", import.meta.url).href;
const musicUrls = [
  new URL("../sounds/music_1.mp3", import.meta.url).href,
  new URL("../sounds/music_2.mp3", import.meta.url).href
];
const beamSoundUrl = new URL("../sounds/beam.mp3", import.meta.url).href;
const takeoffSoundUrl = new URL("../sounds/takeoff.mp3", import.meta.url).href;
const countdownSoundUrl = new URL("../sounds/countdown.mp3", import.meta.url).href;

const canvas = document.querySelector("#game");
const minimapCanvas = document.querySelector("#minimap");
const minimap = minimapCanvas.getContext("2d");
const scoreNode = document.querySelector("#score");
const comboNode = document.querySelector("#combo");
const targetCountNode = document.querySelector("#target-count");
const waveTimerNode = document.querySelector("#wave-timer");
const bonusStatusNode = document.querySelector("#bonus-status");
const dangerStatusNode = document.querySelector("#danger-status");
const energyNode = document.querySelector("#energy");
const energyFillNode = document.querySelector("#energy-fill");
const energyLabelNode = document.querySelector("#energy-label");
const messageNode = document.querySelector("#message");
const endScreenNode = document.querySelector("#end-screen");
const finalTitleNode = document.querySelector("#final-title");
const finalLevelNode = document.querySelector("#final-level");
const finalTimeNode = document.querySelector("#final-time");
const finalScoreNode = document.querySelector("#final-score");
const breakdownAnimalsNode = document.querySelector("#breakdown-animals");
const breakdownBoostersNode = document.querySelector("#breakdown-boosters");
const breakdownHumanNode = document.querySelector("#breakdown-human");
const breakdownWavesNode = document.querySelector("#breakdown-waves");
const breakdownBonusNode = document.querySelector("#breakdown-bonus");
const breakdownStatsNode = document.querySelector("#breakdown-stats");
const mainMenuNode = document.querySelector("#main-menu");
const playButtonNode = document.querySelector("#play-button");
const selectMissionButtonNode = document.querySelector("#select-mission-button");
const mainSettingsButtonNode = document.querySelector("#main-settings-button");
const levelScreenNode = document.querySelector("#level-screen");
const confirmLevelButtonNode = document.querySelector("#confirm-level-button");
const missionBackButtonNode = document.querySelector("#mission-back-button");
const levelCardNodes = [...document.querySelectorAll(".level-card")];
const startScreenNode = document.querySelector("#start-screen");
const startKickerNode = document.querySelector("#start-kicker");
const startCopyNode = document.querySelector("#start-copy");
const beamTipNode = document.querySelector("#beam-tip");
const animalTipLabelNode = document.querySelector("#animal-tip-label");
const animalTipCopyNode = document.querySelector("#animal-tip-copy");
const waveTipCopyNode = document.querySelector("#wave-tip-copy");
const startButtonNode = document.querySelector("#start-button");
const settingsToggleNode = document.querySelector("#settings-toggle");
const settingsPanelNode = document.querySelector("#settings-panel");
const settingsCloseNode = document.querySelector("#settings-close");
const mainMenuButtonNode = document.querySelector("#main-menu-button");
const startVolumeNode = document.querySelector("#start-volume");
const settingsVolumeNode = document.querySelector("#settings-volume");
const startVolumeValueNode = document.querySelector("#start-volume-value");
const settingsVolumeValueNode = document.querySelector("#settings-volume-value");
const startMusicVolumeNode = document.querySelector("#start-music-volume");
const settingsMusicVolumeNode = document.querySelector("#settings-music-volume");
const startMusicVolumeValueNode = document.querySelector("#start-music-volume-value");
const settingsMusicVolumeValueNode = document.querySelector("#settings-music-volume-value");
const musicEnabledNode = document.querySelector("#music-enabled");
const difficultyButtonNodes = [...document.querySelectorAll(".difficulty-button")];
const tutorialEnabledNode = document.querySelector("#tutorial-enabled");
const tutorialHintNode = document.querySelector("#tutorial-hint");
const tutorialTitleNode = document.querySelector("#tutorial-title");
const tutorialCopyNode = document.querySelector("#tutorial-copy");
const playAgainButtonNode = document.querySelector("#play-again-button");
const chooseLevelButtonNode = document.querySelector("#choose-level-button");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030713);
scene.fog = new THREE.FogExp2(0x061226, 0.012);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
const maxPixelRatio = 1.65;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  430
);
camera.position.set(0, 18, 34);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
const gtaoPass = new GTAOPass(
  scene,
  camera,
  Math.floor(window.innerWidth * 0.62),
  Math.floor(window.innerHeight * 0.62),
  undefined,
  { radius: 0.32, distanceExponent: 1.7, thickness: 0.72, distanceFallOff: 0.78, scale: 0.72, samples: 8 }
);
gtaoPass.blendIntensity = 0.46;
gtaoPass.pdSamples = 8;
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.28,
  0.36,
  0.82
);
const outputPass = new OutputPass();
composer.addPass(renderPass);
composer.addPass(gtaoPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

const clock = new THREE.Clock();
const tempObject = new THREE.Object3D();
const tempVector = new THREE.Vector3();
const tempVector2 = new THREE.Vector3();

const worldSize = 170;
const halfWorld = worldSize / 2;
const terrainSegments = 112;
const ufoCruiseHeight = 10.6;
const energyCoreHoverHeight = ufoCruiseHeight + 0.25;
const ufoPickupRadius = 3.6;
const energyCorePickupRadius = 1.35;
const activeEnergyCoresPerWave = 3;
const energyCoreMinSpawnDistance = 32;
const desertPyramid = { x: 21, z: -10, radius: 17, plateauRadius: 20, blendRadius: 28, baseHeight: 0.8 };
const desertOases = [
  { x: -48, z: 20, rx: 7.2, rz: 4.2 },
  { x: 54, z: 44, rx: 5.8, rz: 3.4 }
];
const desertTentSites = [
  { x: -52, z: 47, rotation: -0.35, scale: 1, seed: 610, cloth: 0xd6a45a },
  { x: 65, z: -20, rotation: 0.48, scale: 0.82, seed: 627, cloth: 0xb75c42 },
  { x: -30, z: -62, rotation: -0.9, scale: 0.76, seed: 644, cloth: 0xc98a48 },
  { x: 42, z: 56, rotation: 0.2, scale: 0.7, seed: 661, cloth: 0xa85a4b },
  { x: -68, z: -16, rotation: 0.72, scale: 0.64, seed: 678, cloth: 0xd0a15d }
];
const iceWaterBodies = [
  { x: -42, z: -28, rx: 19, rz: 10 },
  { x: 39, z: 44, rx: 15, rz: 8 },
  { x: 54, z: -48, rx: 10, rz: 6 }
];
const iceOutpost = { x: -58, z: 48, rx: 10, rz: 8 };
const iceLandmarks = {
  mainIceberg: { x: -54, z: -10, rx: 17, rz: 22 },
  secondaryIceberg: { x: 57, z: 46, rx: 12, rz: 11 },
  smallCentralIceberg: { x: 20, z: -34, rx: 7, rz: 7 },
  arch: { x: 12, z: -56, rx: 11, rz: 8 },
  crystalField: { x: -18, z: 61, rx: 10, rz: 7 },
  brokenWall: { x: 46, z: -8, rx: 13, rz: 6 },
  iceSpire: { x: -4, z: 68, rx: 6, rz: 6 }
};
const farmWaterBodies = [
  { x: -39, z: -35, rx: 22, rz: 10.5 },
  { x: 42, z: -57, rx: 12.5, rz: 7.2 }
];
const desertWaterBodies = [];
const farmLandmarks = {
  silo: { x: 70, z: -68, rx: 8, rz: 8 },
  windmill: { x: 6, z: -47, rx: 10, rz: 10, rotation: 3.05 }
};
const farmSpawnBlockers = [
  { x: 48, z: 48, rx: 14, rz: 12 },
  farmLandmarks.silo,
  farmLandmarks.windmill
];
const desertSpawnBlockers = [
  ...desertTentSites.map((site) => ({ x: site.x, z: site.z, rx: 7.5 * site.scale, rz: 5.5 * site.scale })),
  { x: desertPyramid.x, z: desertPyramid.z, rx: desertPyramid.radius, rz: desertPyramid.radius },
  ...desertOases.map((oasis) => ({ x: oasis.x, z: oasis.z, rx: oasis.rx + 4, rz: oasis.rz + 4 }))
];
const iceSpawnBlockers = [
  iceOutpost,
  iceLandmarks.mainIceberg,
  iceLandmarks.secondaryIceberg,
  iceLandmarks.smallCentralIceberg,
  iceLandmarks.arch,
  iceLandmarks.crystalField,
  iceLandmarks.brokenWall,
  iceLandmarks.iceSpire,
  ...iceWaterBodies.map((body) => ({ x: body.x, z: body.z, rx: body.rx + 4, rz: body.rz + 4 }))
];
const farmAnimalSpawnZones = [
  { x: 22, z: 27, width: 34, depth: 24 },
  { x: -48, z: 36, width: 33, depth: 28 },
  { x: 48, z: -34, width: 35, depth: 28 },
  { x: -2, z: 54, width: 31, depth: 20 },
  { x: -58, z: 6, width: 28, depth: 26 },
  { x: 64, z: 25, width: 28, depth: 24 },
  { x: -24, z: -56, width: 32, depth: 24 },
  { x: 17, z: -59, width: 28, depth: 22 }
];
const desertAnimalSpawnZones = [
  { x: -58, z: -34, width: 31, depth: 25 },
  { x: -20, z: 34, width: 34, depth: 24 },
  { x: 42, z: 28, width: 32, depth: 26 },
  { x: 58, z: -40, width: 30, depth: 25 },
  { x: 0, z: -58, width: 34, depth: 22 },
  { x: -62, z: 42, width: 25, depth: 22 },
  { x: 22, z: 61, width: 30, depth: 19 },
  { x: 66, z: 5, width: 24, depth: 24 }
];
const iceAnimalSpawnZones = [
  { x: -62, z: -47, width: 29, depth: 24 },
  { x: -14, z: 34, width: 34, depth: 24 },
  { x: 36, z: 22, width: 32, depth: 26 },
  { x: 60, z: -22, width: 28, depth: 24 },
  { x: -4, z: -62, width: 32, depth: 20 },
  { x: -66, z: 18, width: 25, depth: 22 },
  { x: 28, z: 62, width: 30, depth: 18 },
  { x: 68, z: 34, width: 22, depth: 22 }
];
const farmBonusSpawnZones = [
  { x: -66, z: 28, width: 24, depth: 28 },
  { x: 18, z: 63, width: 28, depth: 18 },
  { x: 63, z: -20, width: 24, depth: 26 },
  { x: -24, z: 60, width: 24, depth: 20 }
];
const desertBonusSpawnZones = [
  { x: -54, z: 50, width: 22, depth: 18 },
  { x: 52, z: 45, width: 24, depth: 18 },
  { x: 63, z: -17, width: 24, depth: 22 },
  { x: -28, z: -63, width: 24, depth: 18 }
];
const iceBonusSpawnZones = [
  { x: -58, z: 48, width: 20, depth: 16 },
  { x: 50, z: 54, width: 24, depth: 16 },
  { x: 65, z: -36, width: 22, depth: 20 },
  { x: -30, z: -62, width: 24, depth: 16 }
];
let waterBodies = farmWaterBodies;
let spawnBlockers = farmSpawnBlockers;
let cowSpawnZones = farmAnimalSpawnZones;
let bonusSpawnZones = farmBonusSpawnZones;
const keys = new Set();
const collectibles = [];
const powerups = [];
const hazards = [];
const windmillRotors = [];
const waterSurfaces = [];
const waterRipples = [];
const difficultyConfigs = {
  easy: { label: "Easy", droneCount: 0 },
  normal: { label: "Normal", droneCount: 3 },
  hard: { label: "Hard", droneCount: 4 }
};
const UI_STATES = {
  MAIN_MENU: "MAIN_MENU",
  MISSION_SELECT: "MISSION_SELECT",
  SETTINGS: "SETTINGS",
  MISSION_INTRO: "MISSION_INTRO",
  PLAYING: "PLAYING",
  MISSION_COMPLETE: "MISSION_COMPLETE"
};
const storageKeys = {
  selectedMission: "ufoCowHunt.selectedMission",
  tutorialEnabled: "ufoCowHunt.tutorial.enabled",
  tutorialVersion: "ufoCowHunt.tutorial.version",
  tutorialSteps: "ufoCowHunt.tutorial.steps"
};
const tutorialVersion = "menu-onboarding-v1";
const waveConfigs = [
  { number: 1, cowGoal: 10, bonus: 500, timeLimit: 95 },
  { number: 2, cowGoal: 15, bonus: 750, timeLimit: 115 },
  { number: 3, cowGoal: 20, bonus: 1000, timeLimit: 135 }
];
const maxWaveCows = Math.max(...waveConfigs.map((wave) => wave.cowGoal));
const visualPresets = {
  farm: {
    background: 0x02091b,
    fog: 0x071a30,
    fogDensity: 0.014,
    exposure: 1.14,
    moonColor: 0xa9d4ff,
    moonIntensity: 3.15,
    moonPosition: [-44, 76, -54],
    hemiSky: 0x608ed2,
    hemiGround: 0x071a11,
    hemiIntensity: 1.45,
    bloomStrength: 0.3,
    bloomRadius: 0.36,
    bloomThreshold: 0.8,
    aoIntensity: 0.5,
    beamColor: 0x55ffe8,
    beamCore: 0xb8fff8
  },
  desert: {
    background: 0x150817,
    fog: 0x351928,
    fogDensity: 0.012,
    exposure: 1.22,
    moonColor: 0xbfd8ff,
    moonIntensity: 2.85,
    moonPosition: [-36, 70, -38],
    hemiSky: 0x765f9c,
    hemiGround: 0x3d1b10,
    hemiIntensity: 1.32,
    bloomStrength: 0.26,
    bloomRadius: 0.34,
    bloomThreshold: 0.84,
    aoIntensity: 0.43,
    beamColor: 0x5dffe9,
    beamCore: 0xbffff8
  },
  ice: {
    background: 0x031122,
    fog: 0x092b43,
    fogDensity: 0.013,
    exposure: 1.2,
    moonColor: 0xc9f5ff,
    moonIntensity: 3.05,
    moonPosition: [-38, 78, 42],
    hemiSky: 0x9fd9ff,
    hemiGround: 0x061522,
    hemiIntensity: 1.52,
    bloomStrength: 0.32,
    bloomRadius: 0.4,
    bloomThreshold: 0.82,
    aoIntensity: 0.4,
    beamColor: 0x62fff4,
    beamCore: 0xd4fffb
  }
};
const levelObjects = [];
const levelConfigs = {
  farm: {
    id: "farm",
    displayName: "Farm Night",
    cardTitle: "Farm / Cow Hunt",
    kicker: "Night farm abduction run",
    previewClass: "farm",
    animalSingular: "cow",
    animalPlural: "cows",
    animalTitle: "Cows",
    objectiveCopy: "Fly the UFO, abduct every cow, avoid search drones, and keep your beam charged with energy diamonds.",
    beamTip: "Hover over cows or bonus targets.",
    animalTip: "Beam them up for points.",
    waveTip: "Timed waves: 10 in 1:35, 15 in 1:55, 20 in 2:15.",
    waveStartHint: "Collect every cow to advance.",
    calmText: "Rare bonus hidden",
    alarmText: "Farm alarm!",
    animalSpots: farmAnimalSpawnZones,
    bonusSpots: farmBonusSpawnZones,
    water: farmWaterBodies,
    blockers: farmSpawnBlockers,
    colliders: [
      { x: farmLandmarks.silo.x, z: farmLandmarks.silo.z, radius: 5.6, label: "silo" },
      { x: farmLandmarks.windmill.x, z: farmLandmarks.windmill.z, radius: 6.2, label: "windmill" }
    ],
    powerupSpots: [
      [-62, 60],
      [50, 36],
      [69, -41],
      [-22, -59],
      [34, 6]
    ],
    hazardSpots: [
      [24, 28, 17, 0.9],
      [48, -34, 19, -0.82],
      [-50, 35, 16, 1.05],
      [-34, -44, 15, -1.14]
    ]
  },
  desert: {
    id: "desert",
    displayName: "Desert Hunt",
    cardTitle: "Desert / Camel Hunt",
    kicker: "Warm desert abduction run",
    previewClass: "desert",
    animalSingular: "camel",
    animalPlural: "camels",
    animalTitle: "Camels",
    objectiveCopy: "Fly the UFO across dunes, abduct every camel, dodge search drones, and recharge with energy diamonds.",
    beamTip: "Hover over camels or bonus travelers.",
    animalTip: "Beam them up for points.",
    waveTip: "Timed waves: 10 in 1:35, 15 in 1:55, 20 in 2:15.",
    waveStartHint: "Collect every camel to advance.",
    calmText: "Traveler hidden",
    alarmText: "Desert alarm!",
    animalSpots: desertAnimalSpawnZones,
    bonusSpots: desertBonusSpawnZones,
    water: desertWaterBodies,
    blockers: desertSpawnBlockers,
    colliders: [
      { x: desertPyramid.x, z: desertPyramid.z, radius: desertPyramid.radius, label: "pyramid" }
    ],
    powerupSpots: [
      [-54, 50],
      [42, 30],
      [66, -12],
      [-30, -58],
      [6, 6]
    ],
    hazardSpots: [
      [-23, 31, 18, 0.82],
      [48, -36, 20, -0.88],
      [58, 14, 16, 1.05],
      [-58, -32, 15, -1.12]
    ]
  },
  ice: {
    id: "ice",
    displayName: "Ice Drift",
    cardTitle: "Ice / Polar Bear Hunt",
    kicker: "Frozen ridge abduction run",
    previewClass: "ice",
    animalSingular: "polar bear",
    animalPlural: "polar bears",
    animalTitle: "Polar Bears",
    objectiveCopy: "Fly the UFO over frozen lakes, abduct every polar bear, avoid search drones, and recharge with energy diamonds.",
    beamTip: "Hover over polar bears or the bonus explorer.",
    animalTip: "Beam them up for points.",
    waveTip: "Timed waves: 10 in 1:35, 15 in 1:55, 20 in 2:15.",
    waveStartHint: "Collect every polar bear to advance.",
    calmText: "Explorer hidden",
    alarmText: "Ice alarm!",
    animalSpots: iceAnimalSpawnZones,
    bonusSpots: iceBonusSpawnZones,
    water: iceWaterBodies,
    blockers: iceSpawnBlockers,
    colliders: [
      { x: iceLandmarks.mainIceberg.x, z: iceLandmarks.mainIceberg.z, radius: 12.5, label: "iceberg" }
    ],
    powerupSpots: [
      [-60, 60],
      [46, 36],
      [70, -36],
      [-28, -60],
      [8, 2]
    ],
    hazardSpots: [
      [-22, 30, 17, 0.88],
      [44, -28, 19, -0.84],
      [58, 34, 16, 1.08],
      [-54, -36, 15, -1.16]
    ]
  }
};

let score = 0;
let scoreBreakdown = createEmptyScoreBreakdown();
let combo = 1;
let lastCollectTime = -Infinity;
let firstMove = false;
let beamActive = false;
let boostActive = false;
let beamLatchUntil = 0;
let abductingTarget = null;
let bonusCollected = false;
let beamEnergy = 100;
let alertLevel = 0;
let gameWon = false;
let gameStarted = false;
let currentWaveIndex = 0;
let waveCowGoal = waveConfigs[0].cowGoal;
let waveCowsCollected = 0;
let waveStartedAt = 0;
let waveTimeRemaining = waveConfigs[0].timeLimit;
let countdownPlayedForWave = -1;
let totalCowsCollected = 0;
let selectedLevelId = readStoredMission();
let activeLevelId = selectedLevelId;
let uiState = UI_STATES.MAIN_MENU;
let previousUiState = UI_STATES.MAIN_MENU;
let waveTransitionActive = false;
let waveTransitionTimers = [];
let soundMuted = false;
let effectsVolume = 1;
let musicVolume = 0.75;
let moonLight = null;
let hemisphereLight = null;
let musicEnabled = true;
let difficulty = readStoredDifficulty();
let audio = null;
let atmoAudio = null;
let atmoTimer = null;
let musicAudio = null;
let musicTrackIndex = 0;
let beamAudio = null;
let beamPreviewAudio = null;
let takeoffAudio = null;
let countdownAudio = null;
let tutorialManager = null;
let lastAlertSound = 0;
let lastNoPowerFeedback = -Infinity;
let lastCollisionFeedback = -Infinity;
let lastDroneFeedback = -Infinity;
let droneDrainUntil = -Infinity;
let droneDrainStrength = 0;
let missionStartTime = 0;
let missionEndTime = 0;
let takeoffUntil = 0;
let lastHudUpdate = 0;
const maxMasterGain = 0.95;
const maxEffectsGain = 2.15;
const maxMusicGain = 0.82;

const ufoState = {
  velocity: new THREE.Vector3(),
  heading: new THREE.Vector3(0, 0, -1),
  yaw: Math.PI
};

let terrain = null;

addNightSky();
addLights();

const ufo = createUfo();
scene.add(ufo.group);

const beam = createBeam();
ufo.group.add(beam);

const cowHint = createCowHint();
scene.add(cowHint);

tutorialManager = createTutorialManager();
applyLevel(selectedLevelId);
updateMissionCards();
setUiState(UI_STATES.MAIN_MENU);
updateHud(true);

window.addEventListener("resize", onResize);
window.addEventListener("pointerdown", initAudio, { once: true });
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", (event) => {
  keys.delete(normalizeKey(event));
});
levelCardNodes.forEach((card) => {
  card.addEventListener("click", () => selectLevel(card.dataset.level));
});
playButtonNode.addEventListener("click", () => startMission(selectedLevelId));
selectMissionButtonNode.addEventListener("click", () => setUiState(UI_STATES.MISSION_SELECT));
mainSettingsButtonNode.addEventListener("click", () => openSettings());
confirmLevelButtonNode.addEventListener("click", confirmSelectedLevel);
missionBackButtonNode.addEventListener("click", () => setUiState(UI_STATES.MAIN_MENU));
startButtonNode.addEventListener("click", startGame);
playAgainButtonNode.addEventListener("click", playAgain);
chooseLevelButtonNode.addEventListener("click", returnToMainMenu);
settingsToggleNode.addEventListener("click", () => {
  openSettings();
});
settingsCloseNode.addEventListener("click", () => {
  closeSettings();
});
mainMenuButtonNode.addEventListener("click", returnToMainMenu);
startVolumeNode?.addEventListener("input", () => setVolume(startVolumeNode.value, true));
settingsVolumeNode.addEventListener("input", () => setVolume(settingsVolumeNode.value, true));
startMusicVolumeNode?.addEventListener("input", () => setMusicVolume(startMusicVolumeNode.value));
settingsMusicVolumeNode.addEventListener("input", () => setMusicVolume(settingsMusicVolumeNode.value));
difficultyButtonNodes.forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});
tutorialEnabledNode.addEventListener("change", () => {
  tutorialManager.setEnabled(tutorialEnabledNode.checked);
});
musicEnabledNode.addEventListener("change", () => {
  musicEnabled = musicEnabledNode.checked;
  updateMusicVolume();
  if (musicEnabled) playMusicTrack();
  else if (musicAudio) musicAudio.pause();
});
setVolume(effectsVolume * 100);
setMusicVolume(musicVolume * 100);
setDifficulty(difficulty, { persist: false, rebuild: false });

renderer.setAnimationLoop(tick);
initAudio();

function onKeyDown(event) {
  const key = normalizeKey(event);
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "Space",
      "Escape",
      "ShiftLeft",
      "ShiftRight"
    ].includes(key)
  ) {
    event.preventDefault();
  }

  if (key === "KeyM" && !event.repeat) {
    soundMuted = !soundMuted;
    updateMasterVolume();
    flashMessage(soundMuted ? "Sound muted" : "Sound on");
  }

  if (key === "Escape" && !event.repeat) {
    if (uiState === UI_STATES.SETTINGS) closeSettings();
    else if (uiState === UI_STATES.PLAYING) openSettings();
    else if (uiState === UI_STATES.MISSION_SELECT) setUiState(UI_STATES.MAIN_MENU);
    return;
  }

  if (uiState !== UI_STATES.PLAYING) {
    keys.clear();
    if ((key === "Space" || key === "Enter") && !event.repeat) {
      event.preventDefault();
      if (uiState === UI_STATES.MAIN_MENU) startMission(selectedLevelId);
      else if (uiState === UI_STATES.MISSION_SELECT) confirmSelectedLevel();
    }
    return;
  }

  initAudio();
  keys.add(key);

  if (key === "Space") {
    beamLatchUntil = performance.now() + 2300;
  }
}

function openSettings() {
  previousUiState = uiState === UI_STATES.SETTINGS ? previousUiState : uiState;
  updateSettingsActions();
  setUiState(UI_STATES.SETTINGS);
}

function closeSettings() {
  setUiState(previousUiState || UI_STATES.MAIN_MENU);
}

function updateSettingsActions() {
  const showMainMenuAction = previousUiState === UI_STATES.PLAYING;
  mainMenuButtonNode.classList.toggle("hidden", !showMainMenuAction);
  mainMenuButtonNode.parentElement.classList.toggle("single-action", !showMainMenuAction);
}

function toggleSettings() {
  if (settingsPanelNode.classList.contains("hidden")) openSettings();
  else closeSettings();
}

function startGame() {
  startMission(selectedLevelId);
}

function startMission(levelId = selectedLevelId) {
  if (!levelConfigs[levelId]) levelId = "farm";
  saveSelectedMission(levelId);
  applyLevel(levelId);
  resetRunState();
  gameStarted = true;
  firstMove = true;
  initAudio();
  clock.getDelta();
  showMissionIntro(0, { firstMission: true });
}

function returnToMainMenu() {
  resetRunState();
  gameStarted = false;
  firstMove = false;
  tutorialManager.cancel();
  messageNode.classList.add("hidden");
  setUiState(UI_STATES.MAIN_MENU);
  updateHud(true, clock.elapsedTime);
  clock.getDelta();
}

function selectLevel(levelId) {
  if (!levelConfigs[levelId]) return;
  selectedLevelId = levelId;
  saveSelectedMission(levelId);
  updateMissionCards();
  applyLevel(levelId);
}

function updateMissionCards() {
  levelCardNodes.forEach((card) => {
    const selected = card.dataset.level === selectedLevelId;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function readStoredMission() {
  try {
    const storedMission = window.localStorage.getItem(storageKeys.selectedMission);
    return levelConfigs[storedMission] ? storedMission : "farm";
  } catch {
    return "farm";
  }
}

function saveSelectedMission(levelId) {
  if (!levelConfigs[levelId]) return;
  selectedLevelId = levelId;
  try {
    window.localStorage.setItem(storageKeys.selectedMission, levelId);
  } catch {
    // localStorage can be unavailable in embedded browsers.
  }
  updateMissionCards();
}

function confirmSelectedLevel() {
  startMission(selectedLevelId);
}

function playAgain() {
  startMission(selectedLevelId);
}

function setUiState(nextState) {
  uiState = nextState;
  document.body.dataset.uiState = nextState;

  mainMenuNode.classList.toggle("hidden", nextState !== UI_STATES.MAIN_MENU);
  levelScreenNode.classList.toggle("hidden", nextState !== UI_STATES.MISSION_SELECT);
  settingsPanelNode.classList.toggle("hidden", nextState !== UI_STATES.SETTINGS);
  endScreenNode.classList.toggle("hidden", nextState !== UI_STATES.MISSION_COMPLETE);
  startScreenNode.classList.add("hidden");

  if (nextState !== UI_STATES.PLAYING) {
    keys.clear();
    beamLatchUntil = 0;
  }

  if (nextState !== UI_STATES.PLAYING && tutorialManager) {
    tutorialManager.hide();
  }
}

function showMissionIntro(waveIndex, { firstMission = false } = {}) {
  clearWaveTransitionTimers();
  setUiState(UI_STATES.MISSION_INTRO);
  waveTransitionActive = true;
  beamActive = false;
  boostActive = false;
  beam.visible = false;
  updateBeamSound(false);

  const level = getActiveLevel();
  const wave = waveConfigs[waveIndex];
  const targetText = `${wave.cowGoal} ${level.animalPlural}`.toUpperCase();
  const introLine = firstMission
    ? `ABDUCT ${targetText}`
    : `ABDUCT ${targetText} · TIME LIMIT: ${formatTime(wave.timeLimit)}`;
  messageNode.classList.add("mission-intro", "wave-message");
  messageNode.classList.remove("hidden");
  messageNode.innerHTML = `<strong>${level.displayName}</strong><span>WAVE ${wave.number}</span><small>${introLine}</small>`;

  waveTransitionTimers.push(window.setTimeout(() => {
    if (waveIndex !== currentWaveIndex) prepareWave(waveIndex);
    missionStartTime = firstMission ? clock.elapsedTime : missionStartTime;
    startWaveTimer(clock.elapsedTime);
    waveTransitionActive = false;
    setUiState(UI_STATES.PLAYING);
    messageNode.classList.add("hidden");
    messageNode.classList.remove("wave-message", "mission-intro");
    updateHud(true, clock.elapsedTime);
    if (firstMission) tutorialManager.startMission();
  }, firstMission ? 2050 : 1650));
}

function resetRunState() {
  clearWaveTransitionTimers();
  if (tutorialManager) tutorialManager.cancel();
  gameWon = false;
  beamActive = false;
  boostActive = false;
  beamLatchUntil = 0;
  abductingTarget = null;
  bonusCollected = false;
  score = 0;
  scoreBreakdown = createEmptyScoreBreakdown();
  combo = 1;
  lastCollectTime = -Infinity;
  beamEnergy = 100;
  alertLevel = 0;
  missionStartTime = 0;
  missionEndTime = 0;
  takeoffUntil = 0;
  lastHudUpdate = 0;
  currentWaveIndex = 0;
  waveStartedAt = 0;
  waveTimeRemaining = waveConfigs[0].timeLimit;
  countdownPlayedForWave = -1;
  totalCowsCollected = 0;
  waveTransitionActive = false;
  keys.clear();
  stopBeamSound();
  stopTakeoffSound();
  stopCountdownSound();

  ufoState.velocity.set(0, 0, 0);
  ufoState.yaw = Math.PI;
  ufoState.heading.set(0, 0, -1);
  ufo.group.position.set(0, 12, 18);
  ufo.group.rotation.set(0, Math.PI, 0);
  ufo.rim.rotation.z = 0;
  ufo.trail.scale.set(1, 0.9, 1);
  ufo.trail.material.opacity = 0.2;
  ufo.engineGlow.intensity = 5.2;
  ufo.boostGlow.material.opacity = 0;
  beam.visible = false;

  prepareWave(0);
}

function applyLevel(levelId) {
  if (!levelConfigs[levelId]) return;
  activeLevelId = levelId;
  selectedLevelId = levelId;
  const level = getActiveLevel();
  waterBodies = level.water;
  spawnBlockers = level.blockers;
  cowSpawnZones = level.animalSpots;
  bonusSpawnZones = level.bonusSpots;
  document.body.dataset.previewLevel = level.previewClass;
  applyVisualPreset(level.id);
  rebuildLevel();
  updateStartScreenText();
  updateHud(true, clock.elapsedTime);
}

function applyVisualPreset(levelId) {
  const preset = visualPresets[levelId] || visualPresets.farm;
  scene.background = new THREE.Color(preset.background);
  scene.fog = new THREE.FogExp2(preset.fog, preset.fogDensity);
  renderer.toneMappingExposure = preset.exposure;
  if (moonLight) {
    moonLight.color.setHex(preset.moonColor);
    moonLight.intensity = preset.moonIntensity;
    moonLight.position.set(...preset.moonPosition);
  }
  if (hemisphereLight) {
    hemisphereLight.color.setHex(preset.hemiSky);
    hemisphereLight.groundColor.setHex(preset.hemiGround);
    hemisphereLight.intensity = preset.hemiIntensity;
  }
  if (bloomPass) {
    bloomPass.strength = preset.bloomStrength;
    bloomPass.radius = preset.bloomRadius;
    bloomPass.threshold = preset.bloomThreshold;
  }
  if (gtaoPass) {
    gtaoPass.blendIntensity = preset.aoIntensity;
  }
  updateBeamPalette(preset);
}

function rebuildLevel() {
  clearLevelObjects();
  collectibles.length = 0;
  powerups.length = 0;
  hazards.length = 0;
  windmillRotors.length = 0;
  waterSurfaces.length = 0;
  waterRipples.length = 0;
  terrain = createTerrain();
  addLevelObject(terrain);
  addLandscapeDetails();
  spawnCollectibles();
  spawnPowerups();
  spawnHazards();
}

function clearLevelObjects() {
  levelObjects.forEach((object) => {
    scene.remove(object);
  });
  levelObjects.length = 0;
  terrain = null;
}

function addLevelObject(...objects) {
  objects.forEach((object) => {
    if (!object) return;
    levelObjects.push(object);
    scene.add(object);
  });
}

function getActiveLevel() {
  return levelConfigs[activeLevelId] || levelConfigs.farm;
}

function updateStartScreenText() {
  const level = getActiveLevel();
  startKickerNode.textContent = level.kicker;
  startCopyNode.textContent = level.objectiveCopy;
  beamTipNode.textContent = level.beamTip;
  animalTipLabelNode.textContent = level.animalTitle;
  animalTipCopyNode.textContent = level.animalTip;
  waveTipCopyNode.textContent = level.waveTip;
}

function createEmptyScoreBreakdown() {
  return {
    animalScore: 0,
    boosterScore: 0,
    humanBonusScore: 0,
    waveBonusScore: 0,
    energyBonusScore: 0,
    animalsCollectedTotal: 0,
    boostersCollectedTotal: 0,
    humansCollectedTotal: 0
  };
}

function setVolume(value, preview = false) {
  effectsVolume = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
  const label = `${Math.round(effectsVolume * 100)}%`;
  const sliderValue = String(Math.round(effectsVolume * 100));

  if (startVolumeNode) startVolumeNode.value = sliderValue;
  settingsVolumeNode.value = sliderValue;
  if (startVolumeValueNode) startVolumeValueNode.textContent = label;
  settingsVolumeValueNode.textContent = label;
  updateEffectsVolume();
  if (preview) playBeamPreviewSound();
}

function setMusicVolume(value) {
  musicVolume = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
  const label = `${Math.round(musicVolume * 100)}%`;
  const sliderValue = String(Math.round(musicVolume * 100));

  if (startMusicVolumeNode) startMusicVolumeNode.value = sliderValue;
  settingsMusicVolumeNode.value = sliderValue;
  if (startMusicVolumeValueNode) startMusicVolumeValueNode.textContent = label;
  settingsMusicVolumeValueNode.textContent = label;
  updateMusicVolume();
}

function readStoredDifficulty() {
  return "normal";
}

function setDifficulty(value, { persist = true, rebuild = true } = {}) {
  difficulty = difficultyConfigs[value] ? value : "normal";
  difficultyButtonNodes.forEach((button) => {
    const selected = button.dataset.difficulty === difficulty;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  if (persist) {
    try {
      window.localStorage.setItem("ufoCowHuntDifficulty", difficulty);
    } catch {
      // localStorage can be unavailable in some embedded builds.
    }
  }

  if (rebuild) {
    rebuildHazards();
    updateHud(true, clock.elapsedTime);
  }
}

function rebuildHazards() {
  hazards.forEach((hazard) => {
    scene.remove(hazard);
    const objectIndex = levelObjects.indexOf(hazard);
    if (objectIndex >= 0) levelObjects.splice(objectIndex, 1);
  });
  hazards.length = 0;
  alertLevel = 0;
  droneDrainUntil = -Infinity;
  droneDrainStrength = 0;
  document.body.classList.remove("drone-alert");
  energyNode.classList.remove("draining");
  energyNode.style.setProperty("--drone-drain-strength", "0");
  document.body.style.setProperty("--drone-drain-strength", "0");
  spawnHazards();
}

function createTutorialManager() {
  const defaultSteps = {
    movement: false,
    beam: false,
    energy: false,
    drone: false,
    boost: false
  };
  let enabled = readTutorialEnabled();
  let steps = readTutorialSteps();
  let activeStep = null;
  let hintTimer = null;
  let delayTimer = null;
  let moveInputTime = 0;
  let moveAfterBeamTime = 0;
  let beamWasUsed = false;
  let missionActiveSince = 0;
  let boostScheduled = false;

  if (tutorialEnabledNode) tutorialEnabledNode.checked = enabled;

  function readTutorialEnabled() {
    try {
      const stored = window.localStorage.getItem(storageKeys.tutorialEnabled);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  }

  function readTutorialSteps() {
    try {
      const version = window.localStorage.getItem(storageKeys.tutorialVersion);
      if (version !== tutorialVersion) return { ...defaultSteps };
      const parsed = JSON.parse(window.localStorage.getItem(storageKeys.tutorialSteps) || "{}");
      return { ...defaultSteps, ...parsed };
    } catch {
      return { ...defaultSteps };
    }
  }

  function save() {
    try {
      window.localStorage.setItem(storageKeys.tutorialVersion, tutorialVersion);
      window.localStorage.setItem(storageKeys.tutorialSteps, JSON.stringify(steps));
      window.localStorage.setItem(storageKeys.tutorialEnabled, String(enabled));
    } catch {
      // localStorage can be unavailable in embedded browsers.
    }
  }

  function canShow() {
    return enabled && gameStarted && !gameWon && uiState === UI_STATES.PLAYING && !waveTransitionActive;
  }

  function schedule(callback, delay) {
    window.clearTimeout(delayTimer);
    delayTimer = window.setTimeout(() => {
      delayTimer = null;
      callback();
    }, delay);
  }

  function show(step, title, copy, { duration = 5200, completeOnHide = false, force = false, persistent = false } = {}) {
    if (!canShow() || (!force && steps[step]) || activeStep) return false;
    activeStep = step;
    tutorialTitleNode.textContent = title;
    tutorialCopyNode.textContent = copy;
    tutorialHintNode.classList.remove("hidden");
    window.clearTimeout(hintTimer);
    if (!persistent) {
      hintTimer = window.setTimeout(() => {
        hide();
        if (completeOnHide) complete(step);
      }, duration);
    }
    return true;
  }

  function queueBoostHint(delay = 450) {
    if (boostScheduled || steps.boost) return;
    boostScheduled = true;
    schedule(() => {
      if (steps.boost) {
        boostScheduled = false;
        return;
      }
      const shown = show("boost", "NEED MORE SPEED?", "Hold SHIFT to boost", { force: true, persistent: true });
      if (!shown && canShow() && !steps.boost) {
        boostScheduled = false;
        queueBoostHint(900);
      }
    }, delay);
  }

  function hide() {
    window.clearTimeout(hintTimer);
    hintTimer = null;
    activeStep = null;
    tutorialHintNode.classList.add("hidden");
  }

  function complete(step) {
    if (!steps[step]) {
      steps[step] = true;
      save();
    }
    if (activeStep === step) hide();

    if (step === "movement") {
      schedule(() => show("beam", "TRACTOR BEAM", "Hold SPACE above a target", { force: true, persistent: true }), 700);
    }
  }

  function startMission() {
    if (!enabled) return;
    hide();
    window.clearTimeout(delayTimer);
    moveInputTime = 0;
    moveAfterBeamTime = 0;
    beamWasUsed = false;
    missionActiveSince = clock.elapsedTime;
    boostScheduled = false;
    steps.movement = false;
    steps.beam = false;
    steps.boost = false;
    schedule(() => show("movement", "MOVE THE UFO", "WASD or Arrow Keys", { force: true }), 750);
  }

  function event(name, payload = {}) {
    if (!enabled) return;
    if (!canShow() && name !== "missionEnded") return;

    if (name === "movementInput" && !steps.movement) {
      moveInputTime += payload.delta || 0;
      if (moveInputTime > 0.72) complete("movement");
    }

    if (name === "movementInput" && beamWasUsed && steps.beam && !steps.boost && !boostScheduled) {
      moveAfterBeamTime += payload.delta || 0;
      if (moveAfterBeamTime > 2.2) {
        queueBoostHint(1200);
      }
    }

    if (name === "beamUsed") {
      beamWasUsed = true;
      if (!steps.beam) complete("beam");
      if (!steps.energy && beamEnergy < 70) {
        show("energy", "BEAM ENERGY", "Collect diamonds to recharge", { duration: 6500 });
      }
    }

    if (name === "targetAbducted") {
      complete("beam");
    }

    if (name === "energyLow" && beamWasUsed && !steps.energy) {
      show("energy", "BEAM ENERGY", "Collect diamonds to recharge", { duration: 6500 });
    }

    if (name === "energyCollected") {
      complete("energy");
    }

    if (name === "droneDetected" && difficulty !== "easy" && !steps.drone) {
      show("drone", "DRONE ALERT", "Avoid search drones - they drain energy", {
        duration: 5200,
        completeOnHide: true
      });
    }

    if (name === "boostUsed") {
      complete("boost");
    }

    if (
      name === "tick" &&
      !steps.boost &&
      !boostScheduled &&
      beamWasUsed &&
      clock.elapsedTime - missionActiveSince > 34
    ) {
      queueBoostHint(0);
    }

    if (name === "missionEnded") cancel();
  }

  function cancel() {
    window.clearTimeout(delayTimer);
    delayTimer = null;
    hide();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (tutorialEnabledNode) tutorialEnabledNode.checked = enabled;
    if (!enabled) cancel();
    save();
  }

  return {
    startMission,
    event,
    cancel,
    hide,
    setEnabled
  };
}

function normalizeKey(event) {
  if (event.key === " " || event.key === "Spacebar" || event.key === "Space") return "Space";
  if (event.key === "Shift") return event.location === 1 ? "ShiftLeft" : "ShiftRight";
  if (event.key === "m" || event.key === "M") return "KeyM";
  if (event.key?.startsWith("Arrow")) return event.key;
  if (event.code) return event.code;
  return event.key || "";
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(
    worldSize,
    worldSize,
    terrainSegments,
    terrainSegments
  );
  geometry.rotateX(-Math.PI / 2);

  const colors = [];
  const color = new THREE.Color();
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = terrainHeight(x, z);
    positions.setY(i, height);

    const water = isWater(x, z);
    const ridge = ridgeAmount(x, z);
    const shore = shoreAmount(x, z);
    const path = pathAmount(x, z);
    const pasture = pastureAmount(x, z);
    const dryLand = dryLandAmount(x, z);
    const detail =
      Math.sin(x * 0.43 + z * 0.19) * 0.018 +
      Math.cos(x * 0.25 - z * 0.37) * 0.012 +
      Math.sin((x - z) * 0.61) * 0.008;
    if (activeLevelId === "desert") {
      const dune = desertDuneAmount(x, z);
      const sandLight = THREE.MathUtils.clamp(0.47 + height * 0.007 + dune * 0.13 + detail * 0.62, 0.34, 0.69);
      color.setHSL(0.115 + Math.sin(x * 0.025) * 0.01, 0.88, sandLight);
      if (path > 0.2) color.setHSL(0.095, 0.78, 0.4 + path * 0.06 + detail * 0.16);
      if (ridge > 0.42) color.setHSL(0.085, 0.74, 0.43 + ridge * 0.08 + detail * 0.16);
      if (height > 5.4) color.setHSL(0.09, 0.66, 0.47 + height * 0.006);
    } else if (activeLevelId === "ice") {
      const frost = iceFrostAmount(x, z);
      const snowLight = THREE.MathUtils.clamp(0.52 + height * 0.008 + frost * 0.09 + detail * 0.34, 0.4, 0.74);
      color.setHSL(0.56 + Math.sin(x * 0.02) * 0.012, 0.54, snowLight);
      if (path > 0.18) color.setHSL(0.54, 0.48, 0.46 + path * 0.075 + detail * 0.13);
      if (shore > 0.08) color.setHSL(0.52, 0.62, 0.5 + shore * 0.11);
      if (ridge > 0.42) color.setHSL(0.58, 0.4, 0.55 + ridge * 0.09 + detail * 0.12);
      if (water) color.setHSL(0.53, 0.76, 0.5 + Math.max(0, shore) * 0.07);
    } else {
      const meadow =
        0.18 +
        height * 0.01 +
        dryLand * 0.03 +
        detail;

      color.setHSL(0.26 + Math.sin(x * 0.04) * 0.02, 0.62, meadow);
      if (pasture > 0.25) color.setHSL(0.3, 0.58, 0.2 + pasture * 0.06 + detail * 0.32);
      if (path > 0.24) color.setHSL(0.095, 0.42, 0.19 + path * 0.055 + detail * 0.18);
      if (shore > 0.08) color.setHSL(0.14, 0.36, 0.16 + shore * 0.07);
      if (ridge > 0.42) color.setHSL(0.17, 0.42, 0.18 + ridge * 0.085 + detail * 0.18);
      if (height > 5.4) color.setHSL(0.13, 0.38, 0.29 + height * 0.006);
      if (water) color.setHSL(0.54, 0.68, 0.13 + Math.max(0, shore) * 0.025);
    }
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.02,
    emissive: activeLevelId === "desert" ? 0x6a4514 : activeLevelId === "ice" ? 0x102a3a : 0x000000,
    emissiveIntensity: activeLevelId === "desert" ? 0.24 : activeLevelId === "ice" ? 0.16 : 0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function terrainHeight(x, z) {
  if (activeLevelId === "desert") return desertTerrainHeight(x, z);
  if (activeLevelId === "ice") return iceTerrainHeight(x, z);
  const water = isWater(x, z);
  const lakeSink = water ? -1.55 : 0;
  const shoreLift = shoreAmount(x, z) * 0.46;
  const dryLand = dryLandAmount(x, z);
  const ridge =
    Math.max(0, 1 - Math.abs(x * 0.034 + z * 0.016 - 0.7)) * 2.4 +
    Math.max(0, 1 - Math.abs(x * -0.02 + z * 0.038 + 1.2)) * 1.8;
  const baseHeight =
    Math.sin(x * 0.085) * 2.2 +
    Math.cos(z * 0.078) * 2.4 +
    Math.sin((x + z) * 0.042) * 1.8 +
    Math.cos((x - z) * 0.028) * 1.2 +
    Math.sin(x * 0.19 + z * 0.07) * 0.65 +
    ridge +
    shoreLift +
    dryLand * 1.12 +
    lakeSink;

  if (water) return baseHeight;
  return Math.max(baseHeight, -0.72 + dryLand * 0.34);
}

function desertTerrainHeight(x, z) {
  const water = isWater(x, z);
  const lakeSink = water ? -1.25 : 0;
  const shoreLift = shoreAmount(x, z) * 0.32;
  const pyramidDistance = Math.hypot(x - desertPyramid.x, z - desertPyramid.z);
  const dune =
    Math.sin(x * 0.052 + z * 0.018) * 2.6 +
    Math.cos(z * 0.046 - x * 0.021) * 2.3 +
    Math.sin((x + z) * 0.035) * 1.6 +
    Math.cos((x - z) * 0.026) * 1.1 +
    desertRidgeAmount(x, z) * 3.2 +
    shoreLift +
    lakeSink;

  if (pyramidDistance < desertPyramid.plateauRadius) {
    return desertPyramid.baseHeight;
  }

  if (pyramidDistance < desertPyramid.blendRadius) {
    const blend = (pyramidDistance - desertPyramid.plateauRadius) / (desertPyramid.blendRadius - desertPyramid.plateauRadius);
    return THREE.MathUtils.lerp(desertPyramid.baseHeight, Math.max(dune, -0.46), THREE.MathUtils.smoothstep(blend, 0, 1));
  }

  if (water) return dune;
  return Math.max(dune, -0.46);
}

function iceTerrainHeight(x, z) {
  const frozen = isWater(x, z);
  const lakeSink = frozen ? -0.85 : 0;
  const shoreLift = shoreAmount(x, z) * 0.42;
  const ridge =
    Math.sin(x * 0.056 + z * 0.018) * 2.0 +
    Math.cos(z * 0.052 - x * 0.016) * 2.2 +
    Math.sin((x + z) * 0.032) * 1.4 +
    Math.cos((x - z) * 0.024) * 1.0 +
    iceRidgeAmount(x, z) * 3.4 +
    shoreLift +
    lakeSink;

  if (frozen) return ridge;
  return Math.max(ridge, -0.38);
}

function desertDuneAmount(x, z) {
  return THREE.MathUtils.clamp(
    (Math.sin(x * 0.045 + z * 0.02) + Math.cos(z * 0.04 - x * 0.018) + 2) * 0.25,
    0,
    1
  );
}

function desertRidgeAmount(x, z) {
  return Math.max(
    0,
    Math.max(0, 1 - Math.abs(x * 0.03 + z * 0.019 - 0.2)),
    Math.max(0, 1 - Math.abs(x * -0.024 + z * 0.032 + 1.0))
  );
}

function iceFrostAmount(x, z) {
  return THREE.MathUtils.clamp(
    (Math.sin(x * 0.06) + Math.cos(z * 0.055) + Math.sin((x - z) * 0.035) + 3) / 6,
    0,
    1
  );
}

function iceRidgeAmount(x, z) {
  return Math.max(
    0,
    Math.max(0, 1 - Math.abs(x * 0.028 + z * 0.026 - 0.15)),
    Math.max(0, 1 - Math.abs(x * -0.026 + z * 0.031 + 0.86))
  );
}

function ridgeAmount(x, z) {
  if (activeLevelId === "desert") return desertRidgeAmount(x, z);
  if (activeLevelId === "ice") return iceRidgeAmount(x, z);
  return Math.max(
    0,
    Math.max(0, 1 - Math.abs(x * 0.034 + z * 0.016 - 0.7)),
    Math.max(0, 1 - Math.abs(x * -0.02 + z * 0.038 + 1.2))
  );
}

function isWater(x, z, padding = 0) {
  return waterBodies.some((body) => {
    const nx = (x - body.x) / (body.rx + padding);
    const nz = (z - body.z) / (body.rz + padding);
    return nx * nx + nz * nz < 1;
  });
}

function shoreAmount(x, z) {
  return waterBodies.reduce((amount, body) => {
    const nx = (x - body.x) / body.rx;
    const nz = (z - body.z) / body.rz;
    const distance = Math.sqrt(nx * nx + nz * nz);
    const ring = 1 - Math.min(Math.abs(distance - 1) / 0.34, 1);
    return Math.max(amount, ring);
  }, 0);
}

function dryLandAmount(x, z) {
  if (activeLevelId === "desert") {
    return Math.max(
      1 - distanceToSegment(x, z, -72, -42, 64, 38) / 12,
      1 - distanceToSegment(x, z, -62, 43, 54, -34) / 10,
      softRectAmount(x, z, -52, 47, 32, 20) * 0.65
    );
  }
  if (activeLevelId === "ice") {
    return Math.max(
      1 - distanceToSegment(x, z, -72, 50, 60, 36) / 9,
      1 - distanceToSegment(x, z, -60, -42, 56, -12) / 10,
      softRectAmount(x, z, -58, 48, 26, 20) * 0.72
    );
  }
  return Math.max(
    pastureAmount(x, z) * 0.62,
    softRectAmount(x, z, 54, 43, 31, 26),
    softRectAmount(x, z, -55, 57, 36, 25) * 0.75,
    1 - distanceToSegment(x, z, -76, 59, 56, 42) / 9.5,
    1 - distanceToSegment(x, z, 10, 31, 57, 43) / 8.5
  );
}

function pathAmount(x, z) {
  if (activeLevelId === "desert") {
    return Math.max(
      0,
      1 - distanceToSegment(x, z, -78, -44, -28, -18) / 5.2,
      1 - distanceToSegment(x, z, -28, -18, 20, 3) / 4.8,
      1 - distanceToSegment(x, z, 20, 3, 70, 38) / 5.5,
      1 - distanceToSegment(x, z, -52, 48, 44, -32) / 4.4
    );
  }
  if (activeLevelId === "ice") {
    return Math.max(
      0,
      1 - distanceToSegment(x, z, -76, 48, -26, 32) / 4.8,
      1 - distanceToSegment(x, z, -26, 32, 26, 14) / 4.6,
      1 - distanceToSegment(x, z, 26, 14, 70, -22) / 5.2,
      1 - distanceToSegment(x, z, -52, -46, 44, -12) / 4.4
    );
  }
  return Math.max(
    0,
    1 - distanceToSegment(x, z, -78, 60, -38, 40) / 5.4,
    1 - distanceToSegment(x, z, -38, 40, 12, 30) / 4.2,
    1 - distanceToSegment(x, z, 12, 30, 54, 43) / 4.8,
    1 - distanceToSegment(x, z, 12, 30, 30, -18) / 3.8
  );
}

function pastureAmount(x, z) {
  if (activeLevelId === "desert") {
    return Math.max(
      softRectAmount(x, z, -58, -34, 30, 24),
      softRectAmount(x, z, -20, 34, 32, 22),
      softRectAmount(x, z, 42, 28, 30, 24),
      softRectAmount(x, z, 58, -40, 28, 22)
    );
  }
  if (activeLevelId === "ice") {
    return Math.max(
      softRectAmount(x, z, -62, -47, 30, 24),
      softRectAmount(x, z, -14, 34, 32, 22),
      softRectAmount(x, z, 36, 22, 30, 24),
      softRectAmount(x, z, 60, -22, 28, 22)
    );
  }
  return Math.max(
    softRectAmount(x, z, 22, 27, 34, 25),
    softRectAmount(x, z, -48, 36, 32, 28),
    softRectAmount(x, z, 48, -34, 34, 27),
    softRectAmount(x, z, -2, 54, 28, 18),
    softRectAmount(x, z, 59, 25, 26, 20) * 0.68
  );
}

function softRectAmount(x, z, centerX, centerZ, width, depth) {
  const edge = Math.max(Math.abs(x - centerX) / (width * 0.5), Math.abs(z - centerZ) / (depth * 0.5));
  return THREE.MathUtils.clamp(1 - (edge - 0.72) / 0.38, 0, 1);
}

function distanceToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq === 0) return Math.hypot(px - ax, pz - az);
  const t = THREE.MathUtils.clamp(((px - ax) * dx + (pz - az) * dz) / lengthSq, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

function addNightSky() {
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];

  for (let i = 0; i < 900; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 115 + Math.random() * 175;
    const y = 38 + Math.random() * 126;
    starPositions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xd9f3ff,
      size: 0.72,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.88
    })
  );
  scene.add(stars);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xdfeeff })
  );
  moon.position.set(-74, 86, -96);
  scene.add(moon);

  const moonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(13.5, 32, 16),
    new THREE.MeshBasicMaterial({
      color: 0x7ebdff,
      transparent: true,
      opacity: 0.14,
      depthWrite: false
    })
  );
  moonGlow.position.copy(moon.position);
  scene.add(moonGlow);
}

function addLights() {
  moonLight = new THREE.DirectionalLight(0x9fcaff, 2.55);
  moonLight.position.set(-42, 72, -48);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 180;
  moonLight.shadow.camera.left = -88;
  moonLight.shadow.camera.right = 88;
  moonLight.shadow.camera.top = 88;
  moonLight.shadow.camera.bottom = -88;
  moonLight.shadow.bias = -0.00018;
  moonLight.shadow.normalBias = 0.036;
  scene.add(moonLight);

  hemisphereLight = new THREE.HemisphereLight(0x567fb6, 0x102414, 1.8);
  scene.add(hemisphereLight);
}

function addLandscapeDetails() {
  if (activeLevelId === "desert") {
    addDesertLighting();
    addDesertGroundDetails();
    addDesertBoundaryBlocks();
    addDesertDetails();
    addRocks();
    addClouds();
    addFireflies();
    return;
  }

  if (activeLevelId === "ice") {
    addIceLighting();
    addIceGroundDetails();
    addFrozenLakes();
    addIceBoundaryBlocks();
    addIceDetails();
    addRocks();
    addClouds();
    addFireflies();
    return;
  }

  addWater();
  addShoreDetails();
  addMeadowPatches();
  addBoundaryFence();
  addFarmDetails();
  addTrees();
  addRocks();
  addCropCircles();
  addClouds();
  addFireflies();
}

function addDesertGroundDetails() {
  const patchMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd487,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x7b4b2a,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const geometry = new THREE.CircleGeometry(1, 24);

  for (let i = 0; i < 32; i += 1) {
    const x = ((i * 37) % 144) - 72 + Math.sin(i * 1.1) * 4.5;
    const z = ((i * 53) % 144) - 72 + Math.cos(i * 0.8) * 4.5;
    if (!isDryObjectSpot(x, z, 6) || isWater(x, z, 10)) continue;
    const patch = new THREE.Mesh(geometry, i % 3 === 0 ? shadowMaterial : patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = i * 0.41;
    patch.position.set(x, terrainHeight(x, z) + 0.06, z);
    patch.scale.set(5 + (i % 6) * 0.9, 1.2 + (i % 5) * 0.36, 1);
    addLevelObject(patch);
  }
}

function addDesertLighting() {
  const warmFill = new THREE.HemisphereLight(0xffc886, 0x3b1c12, 0.48);
  const lowSun = new THREE.DirectionalLight(0xffb56f, 0.42);
  lowSun.position.set(54, 42, 26);
  lowSun.castShadow = false;
  addLevelObject(warmFill, lowSun);
}

function addIceLighting() {
  const blueFill = new THREE.HemisphereLight(0xb8eaff, 0x0a1724, 0.44);
  const auroraMoon = new THREE.DirectionalLight(0xc8f7ff, 0.38);
  auroraMoon.position.set(-34, 66, 46);
  auroraMoon.castShadow = false;
  addLevelObject(blueFill, auroraMoon);
}

function addIceGroundDetails() {
  const snowMaterial = new THREE.MeshBasicMaterial({
    color: 0xe9fbff,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const blueMaterial = new THREE.MeshBasicMaterial({
    color: 0x7edcff,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const geometry = new THREE.CircleGeometry(1, 24);

  for (let i = 0; i < 34; i += 1) {
    const x = ((i * 41) % 148) - 74 + Math.sin(i * 1.2) * 3.8;
    const z = ((i * 59) % 148) - 74 + Math.cos(i * 0.9) * 4.1;
    if (!isDryObjectSpot(x, z, 5.8)) continue;
    const patch = new THREE.Mesh(geometry, i % 3 === 0 ? blueMaterial : snowMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = i * 0.39;
    patch.position.set(x, terrainHeight(x, z) + 0.065, z);
    patch.scale.set(4.2 + (i % 6) * 0.8, 1.4 + (i % 5) * 0.34, 1);
    addLevelObject(patch);
  }
}

function addFrozenLakes() {
  const iceMaterial = new THREE.MeshStandardMaterial({
    color: 0x8adbf4,
    emissive: 0x1b6f8f,
    emissiveIntensity: 0.3,
    roughness: 0.18,
    metalness: 0.16,
    transparent: true,
    opacity: 0.82
  });
  const rimMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8fbff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const crackMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8fbff,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  iceWaterBodies.forEach((body, index) => {
    const y = terrainHeight(body.x, body.z);
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.94, 1.22, 60), rimMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(body.x, y + 0.06, body.z);
    rim.scale.set(body.rx, body.rz, 1);
    addLevelObject(rim);

    const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 64), iceMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(body.x, y + 0.11, body.z);
    lake.scale.set(body.rx, body.rz, 1);
    lake.name = `frozen-lake-${index}`;
    lake.userData = { waveOffset: index * 0.9 };
    waterSurfaces.push(lake);
    addLevelObject(lake);

    for (let crack = 0; crack < 4; crack += 1) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(body.rx * 0.58, 0.025, 0.05), crackMaterial);
      line.position.set(
        body.x + Math.cos(crack * 1.7 + index) * body.rx * 0.15,
        y + 0.14 + crack * 0.004,
        body.z + Math.sin(crack * 1.2) * body.rz * 0.16
      );
      line.rotation.y = crack * 0.85 + index * 0.35;
      addLevelObject(line);
    }
  });
}

function addIceBoundaryBlocks() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xb9eaff,
    emissive: 0x143e52,
    emissiveIntensity: 0.12,
    roughness: 0.5,
    metalness: 0.04
  });
  const geometry = new THREE.BoxGeometry(4.6, 1.2, 1.5);
  const group = new THREE.Group();
  const inset = 4.4;
  const edge = halfWorld - inset;
  const spacing = 7.4;
  const sides = [
    { start: [-edge, -edge], end: [edge, -edge], angle: 0 },
    { start: [-edge, edge], end: [edge, edge], angle: 0 },
    { start: [-edge, -edge], end: [-edge, edge], angle: Math.PI / 2 },
    { start: [edge, -edge], end: [edge, edge], angle: Math.PI / 2 }
  ];

  sides.forEach((side, sideIndex) => {
    const [x1, z1] = side.start;
    const [x2, z2] = side.end;
    const length = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.floor(length / spacing);
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(x1, x2, t);
      const z = THREE.MathUtils.lerp(z1, z2, t);
      const block = new THREE.Mesh(geometry, material);
      block.position.set(x, terrainHeight(x, z) + 0.56, z);
      block.rotation.y = side.angle + Math.sin((i + sideIndex) * 1.4) * 0.08;
      block.scale.set(0.86 + (i % 3) * 0.1, 0.7 + (i % 2) * 0.12, 0.8);
      block.castShadow = true;
      block.receiveShadow = true;
      group.add(block);
    }
  });

  addLevelObject(group);
}

function addIceDetails() {
  addIceOutpost();
  addIcebergs();
  addIceArch();
  addIceCrystalField();
  addBrokenIceWall();
  addIsolatedIceSpire();
  addSnowPines();
  addIceCrystals();
}

function addIceOutpost() {
  const spot = findDryObjectSpot(iceOutpost.x, iceOutpost.z, 9, 830);
  const group = new THREE.Group();
  const iceBlock = new THREE.MeshStandardMaterial({
    color: 0xd6f7ff,
    emissive: 0x1d566b,
    emissiveIntensity: 0.15,
    roughness: 0.54,
    transparent: true,
    opacity: 0.94
  });
  const iceCap = new THREE.MeshStandardMaterial({
    color: 0xf1feff,
    emissive: 0x1d485d,
    emissiveIntensity: 0.1,
    roughness: 0.62
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x101b27,
    emissive: 0x03070c,
    roughness: 0.9
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x9df7ff,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

  const makeBlock = (x, y, z, sx, sy, sz, rotationY = 0, material = iceBlock) => {
    const block = new THREE.Mesh(blockGeometry, material);
    block.position.set(x, y, z);
    block.scale.set(sx, sy, sz);
    block.rotation.y = rotationY;
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
    return block;
  };

  const layers = [
    { radius: 3.25, y: 0.42, count: 18, height: 0.62 },
    { radius: 2.85, y: 0.95, count: 16, height: 0.58 },
    { radius: 2.35, y: 1.43, count: 14, height: 0.54 },
    { radius: 1.82, y: 1.85, count: 11, height: 0.48 },
    { radius: 1.22, y: 2.17, count: 8, height: 0.38 }
  ];

  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i += 1) {
      const angle = (i / layer.count) * Math.PI * 2 + layerIndex * 0.16;
      const frontGap = Math.abs(Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI)));
      if (frontGap < 0.34 && layerIndex < 3) continue;
      const x = Math.sin(angle) * layer.radius;
      const z = Math.cos(angle) * layer.radius;
      const width = (Math.PI * 2 * layer.radius) / layer.count * 0.78;
      makeBlock(x, layer.y, z, width, layer.height, 0.52, angle);
    }
  });

  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.06, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), iceCap);
  cap.position.y = 2.42;
  cap.scale.set(1.0, 0.48, 0.9);
  cap.castShadow = true;
  cap.receiveShadow = true;

  const portal = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.74, 6, 12), dark);
  portal.position.set(0, 0.82, -3.02);
  portal.scale.set(1.0, 1.0, 0.18);
  portal.castShadow = true;

  makeBlock(-0.72, 0.48, -3.12, 0.34, 0.78, 0.5, -0.16);
  makeBlock(0.72, 0.48, -3.12, 0.34, 0.78, 0.5, 0.16);
  makeBlock(-0.5, 1.14, -3.15, 0.42, 0.34, 0.48, -0.54);
  makeBlock(0, 1.32, -3.15, 0.5, 0.32, 0.48, 0);
  makeBlock(0.5, 1.14, -3.15, 0.42, 0.34, 0.48, 0.54);

  const threshold = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.1, 0.84), iceCap);
  threshold.position.set(0, 0.08, -3.34);
  threshold.castShadow = true;
  threshold.receiveShadow = true;

  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.58, 18), glowMaterial);
  glow.position.set(0, 0.85, -3.21);
  glow.rotation.y = Math.PI;

  const lamp = new THREE.PointLight(0x91eaff, 1.55, 15, 1.9);
  lamp.position.set(0, 1.55, -3.0);
  group.add(cap, portal, threshold, glow, lamp);
  group.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.02, spot.z);
  group.rotation.y = -0.45;
  addLevelObject(group);
}

function createPolarBear(index) {
  const group = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({
    color: index % 2 === 0 ? 0xfffbec : 0xe4f4f6,
    emissive: 0x102a38,
    emissiveIntensity: 0.08,
    roughness: 0.78
  });
  const shadowFur = new THREE.MeshStandardMaterial({
    color: 0xb9d1da,
    emissive: 0x0a2431,
    emissiveIntensity: 0.08,
    roughness: 0.82
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141a1f, roughness: 0.82 });
  const groundShadow = new THREE.MeshBasicMaterial({
    color: 0x14364a,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.55, 22), groundShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.32, 0.035, 0);
  shadow.scale.set(1.35, 0.58, 1);

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.72, 0.78), fur);
  body.position.y = 0.88;
  body.castShadow = true;
  body.receiveShadow = true;

  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.82, 0.86), fur);
  shoulder.position.set(0.62, 1.0, 0);
  shoulder.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.5), fur);
  head.position.set(1.46, 1.1, 0);
  head.castShadow = true;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.32), shadowFur);
  snout.position.set(1.92, 1.03, 0);
  snout.castShadow = true;

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.18), dark);
  nose.position.set(2.12, 1.06, 0);

  for (const z of [-0.17, 0.17]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), fur);
    ear.position.set(1.34, 1.38, z);
    ear.scale.set(0.8, 1.0, 0.7);
    group.add(ear);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 5), dark);
    eye.position.set(1.82, 1.18, z * 0.72);
    group.add(eye);
  }

  const legGeometry = new THREE.BoxGeometry(0.26, 0.68, 0.24);
  for (const x of [-0.72, 0.12, 0.82, 1.16]) {
    const side = x === -0.72 || x === 0.82 ? -0.24 : 0.24;
    const leg = new THREE.Mesh(legGeometry, x < 0 ? shadowFur : fur);
    leg.position.set(x, 0.38, side);
    leg.rotation.z = x < 0 ? -0.08 : 0.08;
    leg.castShadow = true;
    group.add(leg);

    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.3), dark);
    paw.position.set(x + 0.06, 0.08, side);
    paw.castShadow = true;
    group.add(paw);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), fur);
  tail.position.set(-1.22, 0.95, 0);
  tail.scale.set(0.75, 0.75, 0.75);

  group.add(shadow, body, shoulder, head, snout, nose, tail);
  group.scale.setScalar(1.18);
  return group;
}

function addIcebergs() {
  addIcebergFormation({
    ...iceLandmarks.mainIceberg,
    scale: 1,
    rotation: -0.38,
    seed: 910,
    peaks: [
      [0, 0, 5.6, 17.8, 4.2, 0.1, 0.0],
      [-4.2, 1.6, 3.8, 10.8, 3.1, -0.3, -0.1],
      [4.7, -1.8, 3.3, 12.4, 3.2, 0.42, 0.07],
      [-1.8, -4.5, 2.7, 8.4, 2.6, 0.76, 0.04],
      [5.5, 3.9, 2.1, 6.0, 2.0, -0.72, -0.08]
    ],
    floeCount: 20,
    floeRadius: 22
  });

  addIcebergFormation({
    ...iceLandmarks.secondaryIceberg,
    scale: 0.68,
    rotation: 0.76,
    seed: 960,
    peaks: [
      [0.4, 0, 4.5, 12.2, 3.1, 0.0, 0.0],
      [-3.3, -1.7, 2.6, 7.5, 2.25, 0.54, 0.06],
      [3.4, 2.0, 2.2, 6.4, 1.95, -0.44, -0.08],
      [0.2, 4.0, 1.7, 4.6, 1.7, 0.94, 0.05]
    ],
    floeCount: 11,
    floeRadius: 15
  });

  [
    [28, -66, 1.5, 0.2],
    [-72, 27, 1.25, -0.55],
    [72, -20, 1.15, 0.62],
    [iceLandmarks.smallCentralIceberg.x, iceLandmarks.smallCentralIceberg.z, 1.28, -0.18]
  ].forEach(([x, z, scale, rotation], index) => {
    addSmallIceShard(x, z, scale, rotation, 990 + index);
  });
}

function createIceLandmarkMaterials() {
  return {
    highlight: new THREE.MeshStandardMaterial({
      color: 0xf1feff,
      emissive: 0x15394b,
      emissiveIntensity: 0.1,
      roughness: 0.58,
      flatShading: true
    }),
    ice: new THREE.MeshStandardMaterial({
      color: 0xb9efff,
      emissive: 0x13455d,
      emissiveIntensity: 0.17,
      roughness: 0.52,
      metalness: 0.02,
      flatShading: true
    }),
    shadow: new THREE.MeshStandardMaterial({
      color: 0x6da6c2,
      emissive: 0x092839,
      emissiveIntensity: 0.16,
      roughness: 0.68,
      flatShading: true
    }),
    deep: new THREE.MeshStandardMaterial({
      color: 0x326882,
      emissive: 0x071d2b,
      emissiveIntensity: 0.18,
      roughness: 0.72,
      flatShading: true
    }),
    floeTop: new THREE.MeshStandardMaterial({
      color: 0xe8fbff,
      emissive: 0x1b5268,
      emissiveIntensity: 0.08,
      roughness: 0.62,
      flatShading: true
    }),
    floeEdge: new THREE.MeshStandardMaterial({
      color: 0x7bcde6,
      emissive: 0x0f3a50,
      emissiveIntensity: 0.1,
      roughness: 0.7,
      flatShading: true
    })
  };
}

function addIcebergFormation(config) {
  const materials = createIceLandmarkMaterials();
  const group = new THREE.Group();
  const baseGeometry = new THREE.DodecahedronGeometry(1, 0);
  const peakGeometry = new THREE.ConeGeometry(1, 1, 5);

  const base = new THREE.Mesh(baseGeometry, materials.deep);
  base.position.set(0, 1.05 * config.scale, 0);
  base.scale.set(8.5 * config.scale, 2.05 * config.scale, 7.2 * config.scale);
  base.rotation.set(0.2, config.rotation * 0.4, -0.08);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  config.peaks.forEach(([x, z, radius, height, depth, yaw, tilt], index) => {
    const material = index === 0 ? materials.highlight : index % 2 === 0 ? materials.ice : materials.shadow;
    const peak = new THREE.Mesh(peakGeometry, material);
    peak.position.set(x * config.scale, (height * config.scale) / 2 + 0.65 * config.scale, z * config.scale);
    peak.scale.set(radius * config.scale, height * config.scale, depth * config.scale);
    peak.rotation.set(tilt, yaw, tilt * -0.7);
    peak.castShadow = true;
    peak.receiveShadow = true;
    group.add(peak);
  });

  for (let i = 0; i < 6; i += 1) {
    const angle = config.seed * 0.03 + i * 1.13;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1, 5), i % 2 === 0 ? materials.ice : materials.shadow);
    const radius = (6 + (i % 3) * 1.7) * config.scale;
    const height = (2.8 + (i % 4) * 0.85) * config.scale;
    shard.position.set(Math.cos(angle) * radius, height / 2 + 0.2, Math.sin(angle) * radius);
    shard.scale.set(1.2 * config.scale, height, 0.9 * config.scale);
    shard.rotation.set(0.08, angle + Math.PI * 0.5, -0.08);
    shard.castShadow = true;
    shard.receiveShadow = true;
    group.add(shard);
  }

  const y = terrainHeight(config.x, config.z);
  group.position.set(config.x, y + 0.08, config.z);
  group.rotation.y = config.rotation;
  addLevelObject(group);
  addIceFloesAround(config, materials);
}

function addIceFloesAround(config, materials) {
  const group = new THREE.Group();
  const topGeometry = new THREE.CircleGeometry(1, 7);
  const edgeGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 7);

  for (let i = 0; i < config.floeCount; i += 1) {
    const angle = config.seed * 0.017 + i * 1.618;
    const ring = config.floeRadius * (0.55 + ((i * 19) % 41) / 100);
    const x = config.x + Math.cos(angle) * ring;
    const z = config.z + Math.sin(angle) * ring * (0.68 + (i % 4) * 0.08);
    if (Math.abs(x) > halfWorld - 8 || Math.abs(z) > halfWorld - 8) continue;
    if (!isDryObjectSpot(x, z, 2.4) && !isWater(x, z, 3)) continue;

    const y = terrainHeight(x, z) + 0.18;
    const sx = 1.8 + (i % 5) * 0.62;
    const sz = 0.85 + (i % 4) * 0.34;

    const edge = new THREE.Mesh(edgeGeometry, materials.floeEdge);
    edge.position.set(x, y - 0.08, z);
    edge.scale.set(sx, 1, sz);
    edge.rotation.y = angle + i * 0.22;
    edge.castShadow = true;
    edge.receiveShadow = true;

    const top = new THREE.Mesh(topGeometry, materials.floeTop);
    top.rotation.x = -Math.PI / 2;
    top.rotation.z = angle + i * 0.31;
    top.position.set(x, y + 0.04, z);
    top.scale.set(sx, sz, 1);
    top.receiveShadow = true;
    group.add(edge, top);
  }

  addLevelObject(group);
}

function addSmallIceShard(x, z, scale, rotation, seed) {
  const materials = createIceLandmarkMaterials();
  const spot = findDryObjectSpot(x, z, 4, seed);
  const group = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 5), i === 0 ? materials.highlight : materials.ice);
    const height = (3.2 - i * 0.55) * scale;
    shard.position.set((i - 1) * 0.85 * scale, height / 2, Math.sin(i) * 0.7 * scale);
    shard.scale.set(1.05 * scale, height, 0.78 * scale);
    shard.rotation.set(0.08, rotation + i * 0.55, -0.08);
    shard.castShadow = true;
    shard.receiveShadow = true;
    group.add(shard);
  }
  group.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.1, spot.z);
  group.rotation.y = rotation;
  addLevelObject(group);
}

function addIceArch() {
  const materials = createIceLandmarkMaterials();
  const spot = findDryObjectSpot(iceLandmarks.arch.x, iceLandmarks.arch.z, 7, 1040);
  const group = new THREE.Group();
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  [
    [-2.6, 1.25, 0, 1.1, 2.5, 1.35, -0.18],
    [2.55, 1.45, 0.15, 1.15, 2.9, 1.25, 0.2],
    [0, 3.05, 0.1, 4.7, 0.9, 1.15, 0.04],
    [-0.8, 3.68, -0.1, 2.2, 0.65, 1.0, -0.2],
    [1.28, 3.58, 0.18, 1.7, 0.58, 0.85, 0.36]
  ].forEach(([x, y, z, sx, sy, sz, rz], index) => {
    const block = new THREE.Mesh(blockGeometry, index % 2 === 0 ? materials.ice : materials.highlight);
    block.position.set(x, y, z);
    block.scale.set(sx, sy, sz);
    block.rotation.set(0.05 * index, 0.18 * index, rz);
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  });
  group.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.05, spot.z);
  group.rotation.y = 0.72;
  addLevelObject(group);
}

function addIceCrystalField() {
  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0xa4f6ff,
    emissive: 0x2cd8f0,
    emissiveIntensity: 0.22,
    roughness: 0.36,
    flatShading: true
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x8ff7ff,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const group = new THREE.Group();
  for (let i = 0; i < 13; i += 1) {
    const angle = i * 1.94;
    const radius = i === 0 ? 0 : 2.5 + (i % 5) * 1.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.62;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42 + (i % 3) * 0.16, 0), crystalMaterial);
    crystal.position.set(x, 0.72 + (i % 4) * 0.12, z);
    crystal.scale.set(0.7, 1.6 + (i % 4) * 0.28, 0.7);
    crystal.rotation.set(i * 0.2, angle, i * 0.11);
    crystal.castShadow = true;
    group.add(crystal);
  }
  const glow = new THREE.Mesh(new THREE.CircleGeometry(8.2, 24), glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.06;
  group.add(glow);
  group.position.set(
    iceLandmarks.crystalField.x,
    terrainHeight(iceLandmarks.crystalField.x, iceLandmarks.crystalField.z) + 0.08,
    iceLandmarks.crystalField.z
  );
  group.rotation.y = -0.35;
  addLevelObject(group);
}

function addBrokenIceWall() {
  const materials = createIceLandmarkMaterials();
  const spot = findDryObjectSpot(iceLandmarks.brokenWall.x, iceLandmarks.brokenWall.z, 7, 1080);
  const group = new THREE.Group();
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 11; i += 1) {
    if (i === 5) continue;
    const x = (i - 5) * 1.45;
    const height = 0.8 + (i % 4) * 0.42;
    const block = new THREE.Mesh(blockGeometry, i % 3 === 0 ? materials.shadow : materials.ice);
    block.position.set(x, height / 2, Math.sin(i * 1.7) * 0.55);
    block.scale.set(1.12, height, 0.78 + (i % 2) * 0.3);
    block.rotation.set(0.08 * Math.sin(i), i * 0.18, 0.12 * Math.cos(i));
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);
  }
  group.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.05, spot.z);
  group.rotation.y = -0.48;
  addLevelObject(group);
}

function addIsolatedIceSpire() {
  addSmallIceShard(iceLandmarks.iceSpire.x, iceLandmarks.iceSpire.z, 1.05, 0.28, 1110);
}

function addSnowPines() {
  const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.28, 1.5, 6);
  const crownGeometry = new THREE.ConeGeometry(0.95, 2.2, 7);
  const snowCapGeometry = new THREE.ConeGeometry(1.05, 0.75, 7);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2c231f, roughness: 0.88 });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x103948, roughness: 0.92 });
  const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xe8fbff, roughness: 0.7 });
  const group = new THREE.Group();

  for (let i = 0; i < 76; i += 1) {
    const edgeAngle = i * 1.83;
    const ring = i % 3 === 0 ? halfWorld - 18 - (i % 7) * 2 : 38 + (i % 11) * 3;
    const x = Math.cos(edgeAngle) * ring + Math.sin(i * 0.7) * 3;
    const z = Math.sin(edgeAngle) * ring + Math.cos(i * 0.9) * 3;
    if (!isDryObjectSpot(x, z, 4.5) || pastureAmount(x, z) > 0.45 || pathAmount(x, z) > 0.35) continue;
    const y = terrainHeight(x, z);
    const scale = 0.65 + (i % 5) * 0.08;

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 0.72 * scale, z);
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;

    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(x, y + 2.05 * scale, z);
    crown.scale.setScalar(scale);
    crown.castShadow = true;

    const cap = new THREE.Mesh(snowCapGeometry, snowMaterial);
    cap.position.set(x, y + 2.65 * scale, z);
    cap.scale.set(scale * 0.92, scale, scale * 0.92);
    cap.castShadow = true;

    group.add(trunk, crown, cap);
  }

  addLevelObject(group);
}

function addIceCrystals() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x86f2ff,
    emissive: 0x28bde0,
    emissiveIntensity: 0.45,
    roughness: 0.24,
    metalness: 0.06
  });
  for (let i = 0; i < 24; i += 1) {
    const x = ((i * 53) % 148) - 74 + Math.sin(i) * 2.5;
    const z = ((i * 37) % 148) - 74 + Math.cos(i * 1.2) * 2.5;
    if (!isDryObjectSpot(x, z, 4.2)) continue;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.58 + (i % 3) * 0.12, 0), material);
    crystal.position.set(x, terrainHeight(x, z) + 0.7, z);
    crystal.scale.set(0.72, 1.35 + (i % 4) * 0.18, 0.72);
    crystal.rotation.set(i * 0.2, i * 0.7, i * 0.12);
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    addLevelObject(crystal);
  }
}

function addDesertDetails() {
  addPyramid();
  addDesertOases();
  addDesertCamp();
  addCacti();
  addDryShrubs();
  addDesertMarkers();
}

function addDesertBoundaryBlocks() {
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8874d,
    emissive: 0x2b1809,
    emissiveIntensity: 0.12,
    roughness: 0.94
  });
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1a15e,
    emissive: 0x321b08,
    emissiveIntensity: 0.11,
    roughness: 0.9
  });
  const blockGeometry = new THREE.BoxGeometry(4.8, 1.0, 1.45);
  const capGeometry = new THREE.BoxGeometry(3.2, 1.25, 1.6);
  const group = new THREE.Group();
  const inset = 4.5;
  const fenceHalf = halfWorld - inset;
  const spacing = 7.2;
  const sides = [
    { start: [-fenceHalf, -fenceHalf], end: [fenceHalf, -fenceHalf], angle: 0 },
    { start: [-fenceHalf, fenceHalf], end: [fenceHalf, fenceHalf], angle: 0 },
    { start: [-fenceHalf, -fenceHalf], end: [-fenceHalf, fenceHalf], angle: Math.PI / 2 },
    { start: [fenceHalf, -fenceHalf], end: [fenceHalf, fenceHalf], angle: Math.PI / 2 }
  ];

  sides.forEach((side, sideIndex) => {
    const [x1, z1] = side.start;
    const [x2, z2] = side.end;
    const length = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.floor(length / spacing);
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(x1, x2, t);
      const z = THREE.MathUtils.lerp(z1, z2, t);
      const isCap = i % 5 === 0;
      const block = new THREE.Mesh(isCap ? capGeometry : blockGeometry, isCap ? capMaterial : blockMaterial);
      block.position.set(x, terrainHeight(x, z) + (isCap ? 0.62 : 0.5), z);
      block.rotation.y = side.angle + Math.sin((i + sideIndex) * 1.7) * 0.05;
      block.scale.set(0.9 + ((i + sideIndex) % 3) * 0.08, 0.78 + (i % 2) * 0.16, 0.86);
      block.castShadow = true;
      block.receiveShadow = true;
      group.add(block);
    }
  });

  addLevelObject(group);
}

function addPyramid() {
  const x = desertPyramid.x;
  const z = desertPyramid.z;
  const baseY = terrainHeight(x, z);
  const group = new THREE.Group();
  const stoneTexture = createPyramidStoneTexture();
  const sandStone = new THREE.MeshStandardMaterial({
    color: 0xd9a65a,
    map: stoneTexture,
    emissive: 0x3f250c,
    emissiveIntensity: 0.16,
    roughness: 0.94
  });
  const darkStone = new THREE.MeshStandardMaterial({
    color: 0x8a6536,
    emissive: 0x1d1005,
    emissiveIntensity: 0.08,
    roughness: 0.96
  });

  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(15.5, 21, 4), sandStone);
  pyramid.rotation.y = Math.PI / 4;
  pyramid.position.y = 10.5;
  pyramid.castShadow = true;
  pyramid.receiveShadow = true;

  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(15.9, 16.4, 0.55, 4), darkStone);
  foundation.rotation.y = Math.PI / 4;
  foundation.position.y = 0.02;
  foundation.castShadow = true;
  foundation.receiveShadow = true;

  const entrance = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.1, 0.18), darkStone);
  entrance.position.set(0, 2, -7.8);
  entrance.rotation.x = -0.18;

  group.add(foundation, pyramid, entrance);
  group.position.set(x, baseY, z);
  group.name = "desert-collision-pyramid";
  addLevelObject(group);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(17, 48),
    new THREE.MeshBasicMaterial({
      color: 0x3a1b0c,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, baseY + 0.08, z);
  shadow.scale.set(1.15, 0.78, 1);
  addLevelObject(shadow);
}

function createPyramidStoneTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, textureCanvas.height);
  gradient.addColorStop(0, "#e0b168");
  gradient.addColorStop(1, "#bd8748");
  context.fillStyle = gradient;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  context.strokeStyle = "rgba(99, 61, 25, 0.44)";
  context.lineWidth = 3;
  for (let row = 0; row < 15; row += 1) {
    const y = 22 + row * 32 + Math.sin(row * 1.3) * 3;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(textureCanvas.width, y + Math.sin(row * 0.8) * 3);
    context.stroke();

    const blockWidth = 54 + (row % 4) * 8;
    const offset = row % 2 === 0 ? 0 : blockWidth * 0.48;
    for (let x = -offset; x < textureCanvas.width; x += blockWidth) {
      context.beginPath();
      context.moveTo(x, y - 30);
      context.lineTo(x + Math.sin((x + row) * 0.04) * 2, y - 2);
      context.stroke();
    }
  }

  context.fillStyle = "rgba(255, 225, 156, 0.12)";
  for (let i = 0; i < 120; i += 1) {
    const px = (i * 71) % textureCanvas.width;
    const py = (i * 43) % textureCanvas.height;
    context.fillRect(px, py, 2 + (i % 3), 1);
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 2.1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addDesertOases() {
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x16839c,
    emissive: 0x0a809b,
    emissiveIntensity: 0.34,
    roughness: 0.24,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82
  });
  const shoreMaterial = new THREE.MeshBasicMaterial({
    color: 0x7b5a33,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  desertOases.forEach((oasis, index) => {
    const y = terrainHeight(oasis.x, oasis.z);
    const shore = new THREE.Mesh(new THREE.CircleGeometry(1, 42), shoreMaterial);
    shore.rotation.x = -Math.PI / 2;
    shore.position.set(oasis.x, y + 0.07, oasis.z);
    shore.scale.set(oasis.rx * 1.55, oasis.rz * 1.65, 1);
    addLevelObject(shore);

    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 42), waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(oasis.x, y + 0.12, oasis.z);
    water.scale.set(oasis.rx, oasis.rz, 1);
    water.receiveShadow = true;
    water.name = `desert-oasis-${index}`;
    water.userData = { waveOffset: index * 1.2 };
    waterSurfaces.push(water);
    addLevelObject(water);

    for (let palm = 0; palm < 5; palm += 1) {
      const angle = palm * 1.256 + index * 0.8;
      const px = oasis.x + Math.cos(angle) * oasis.rx * 1.55;
      const pz = oasis.z + Math.sin(angle) * oasis.rz * 1.75;
      addPalmTree(px, pz, angle, 0.82 + (palm % 3) * 0.1);
    }
  });
}

function addPalmTree(x, z, angle, scale = 1) {
  const spot = findDryObjectSpot(x, z, 2.5, Math.floor((x + z) * 3));
  const group = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x7b4a25, roughness: 0.9 });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f7d55,
    emissive: 0x062415,
    emissiveIntensity: 0.08,
    roughness: 0.86
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 4.2, 7), trunkMaterial);
  trunk.position.y = 2.1 * scale;
  trunk.rotation.z = Math.sin(angle) * 0.16;
  trunk.scale.set(scale, scale, scale);
  trunk.castShadow = true;
  group.add(trunk);

  for (let i = 0; i < 7; i += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.34, 3.5, 5), leafMaterial);
    leaf.position.y = 4.25 * scale;
    leaf.rotation.z = Math.PI / 2.25;
    leaf.rotation.y = angle + (i / 7) * Math.PI * 2;
    leaf.scale.set(scale, 0.58 * scale, scale);
    leaf.castShadow = true;
    group.add(leaf);
  }

  group.position.set(spot.x, terrainHeight(spot.x, spot.z), spot.z);
  group.rotation.y = angle;
  addLevelObject(group);
}


function addDesertCamp() {
  desertTentSites.forEach((site) => {
    addBedouinTent(site);
  });
}

function addBedouinTent(site) {
  const spot = findDryObjectSpot(site.x, site.z, 6.5 * site.scale, site.seed);
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({
    color: site.cloth,
    emissive: 0x241006,
    roughness: 0.86
  });
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x4d2c1c, roughness: 0.9 });
  const rugMaterial = new THREE.MeshBasicMaterial({
    color: 0x7c2c34,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide
  });

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.4), rugMaterial);
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.08;

  const tent = new THREE.Mesh(new THREE.ConeGeometry(3.4, 3.3, 4), cloth);
  tent.rotation.y = Math.PI / 4;
  tent.scale.z = 0.62;
  tent.position.y = 1.7;
  tent.castShadow = true;
  tent.receiveShadow = true;

  for (const x of [-2.2, 2.2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.7, 6), poleMaterial);
    pole.position.set(x, 1.35, 0);
    pole.castShadow = true;
    group.add(pole);
  }

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd67a })
  );
  lamp.position.set(0, 1.5, -2.2);
  const glow = new THREE.PointLight(0xffa95c, 1.2, 13, 1.8);
  glow.position.copy(lamp.position);

  const shade = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 22),
    new THREE.MeshBasicMaterial({
      color: 0x3a1b0c,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    })
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.set(0.2, 0.045, 0.4);
  shade.scale.set(1.45, 0.58, 1);

  group.add(shade, rug, tent, lamp, glow);
  group.scale.setScalar(site.scale);
  group.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.04, spot.z);
  group.rotation.y = site.rotation;
  addLevelObject(group);
}

function addCacti() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x2d7a53,
    emissive: 0x0a2116,
    roughness: 0.92
  });
  const trunkGeometry = new THREE.CylinderGeometry(0.28, 0.34, 2.6, 7);
  const armGeometry = new THREE.CylinderGeometry(0.16, 0.19, 1.25, 7);

  for (let i = 0; i < 46; i += 1) {
    const x = ((i * 43) % 150) - 75 + Math.sin(i * 0.7) * 3.2;
    const z = ((i * 59) % 150) - 75 + Math.cos(i * 1.2) * 3.2;
    if (!isDryObjectSpot(x, z, 4.8) || pastureAmount(x, z) > 0.66 || pathAmount(x, z) > 0.36) continue;
    const scale = 0.72 + (i % 5) * 0.1;
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, material);
    trunk.position.y = 1.3 * scale;
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;
    group.add(trunk);

    if (i % 3 !== 0) {
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(armGeometry, material);
        arm.position.set(side * 0.46 * scale, 1.55 * scale, 0);
        arm.rotation.z = side * Math.PI / 2.4;
        arm.scale.setScalar(scale);
        arm.castShadow = true;
        group.add(arm);
      }
    }

    group.position.set(x, terrainHeight(x, z), z);
    group.rotation.y = i * 0.37;
    addLevelObject(group);
  }
}

function addDryShrubs() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x7f6a35,
    roughness: 0.96
  });
  const geometry = new THREE.ConeGeometry(0.34, 0.72, 5);
  const shrubs = new THREE.InstancedMesh(geometry, material, 100);
  let count = 0;

  for (let i = 0; i < 100; i += 1) {
    const x = ((i * 29) % 152) - 76 + Math.sin(i * 1.9) * 2.6;
    const z = ((i * 71) % 152) - 76 + Math.cos(i * 1.3) * 2.6;
    if (!isDryObjectSpot(x, z, 3.2) || isWater(x, z, 9)) continue;
    const scale = 0.45 + (i % 4) * 0.09;
    tempObject.position.set(x, terrainHeight(x, z) + 0.32 * scale, z);
    tempObject.rotation.set(0, i * 0.93, 0);
    tempObject.scale.set(scale, scale * 0.8, scale);
    tempObject.updateMatrix();
    shrubs.setMatrixAt(count, tempObject.matrix);
    count += 1;
  }

  shrubs.count = count;
  shrubs.castShadow = true;
  shrubs.receiveShadow = true;
  addLevelObject(shrubs);
}

function addDesertMarkers() {
  const material = new THREE.MeshStandardMaterial({ color: 0x9b7646, roughness: 0.88 });
  [
    [-18, -14],
    [18, 4],
    [46, 24],
    [-40, 34]
  ].forEach(([x, z], index) => {
    const spot = findDryObjectSpot(x, z, 3.5, 720 + index);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.4, 4), material);
    marker.position.set(spot.x, terrainHeight(spot.x, spot.z) + 1.2, spot.z);
    marker.rotation.y = Math.PI / 4 + index * 0.2;
    marker.scale.set(1, 1, 0.72);
    marker.castShadow = true;
    marker.receiveShadow = true;
    addLevelObject(marker);
  });
}

function addWater() {
  const shoreMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d442c,
    roughness: 0.96,
    metalness: 0.02,
    transparent: true,
    opacity: 0.72
  });
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x123d56,
    emissive: 0x0b7c99,
    emissiveIntensity: 0.25,
    roughness: 0.26,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88
  });
  const rippleMaterial = new THREE.MeshBasicMaterial({
    color: 0x8cecff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  waterBodies.forEach((body, index) => {
    const shore = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.22, 72), shoreMaterial);
    shore.rotation.x = -Math.PI / 2;
    shore.position.set(body.x, terrainHeight(body.x, body.z) + 0.035, body.z);
    shore.scale.set(body.rx, body.rz, 1);
    shore.receiveShadow = true;
    addLevelObject(shore);

    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 72), waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(body.x, terrainHeight(body.x, body.z) + 0.1, body.z);
    water.scale.set(body.rx, body.rz, 1);
    water.receiveShadow = true;
    water.name = `moonlit-pond-${index}`;
    water.userData = { waveOffset: index * 0.8 + body.x * 0.03 };
    waterSurfaces.push(water);
    addLevelObject(water);

    for (let ripple = 0; ripple < 3; ripple += 1) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.18 + ripple * 0.18, 0.2 + ripple * 0.18, 64), rippleMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(
        body.x + Math.cos(index + ripple * 1.7) * body.rx * 0.2,
        terrainHeight(body.x, body.z) + 0.13 + ripple * 0.006,
        body.z + Math.sin(index * 0.7 + ripple) * body.rz * 0.2
      );
      ring.scale.set(body.rx * 0.8, body.rz * 0.8, 1);
      ring.name = `water-ripple-${index}-${ripple}`;
      ring.userData = {
        baseScaleX: ring.scale.x,
        baseScaleY: ring.scale.y,
        rippleOffset: index * 1.3 + ripple * 0.8
      };
      waterRipples.push(ring);
      addLevelObject(ring);
    }
  });
}

function addShoreDetails() {
  const reedGeometry = new THREE.ConeGeometry(0.12, 0.9, 5);
  const reedMaterial = new THREE.MeshStandardMaterial({
    color: 0x214d2f,
    roughness: 0.92
  });
  const pebbleGeometry = new THREE.DodecahedronGeometry(0.32, 0);
  const pebbleMaterial = new THREE.MeshStandardMaterial({
    color: 0x60675f,
    roughness: 0.96
  });
  const reedMesh = new THREE.InstancedMesh(reedGeometry, reedMaterial, 88);
  const pebbleMesh = new THREE.InstancedMesh(pebbleGeometry, pebbleMaterial, 64);
  let reedCount = 0;
  let pebbleCount = 0;

  waterBodies.forEach((body, bodyIndex) => {
    for (let i = 0; i < 44; i += 1) {
      const angle = i * 1.618 + bodyIndex * 0.7;
      const side = 1.12 + ((i * 17) % 9) * 0.018;
      const x = body.x + Math.cos(angle) * body.rx * side;
      const z = body.z + Math.sin(angle) * body.rz * side;
      if (isWater(x, z, 0.8) || terrainHeight(x, z) < -0.9) continue;

      if (i % 3 !== 0 && reedCount < 88) {
        const scale = 0.55 + (i % 4) * 0.12;
        tempObject.position.set(x, terrainHeight(x, z) + 0.43 * scale, z);
        tempObject.rotation.set(0, angle + Math.PI * 0.5, 0);
        tempObject.scale.set(scale, scale, scale);
        tempObject.updateMatrix();
        reedMesh.setMatrixAt(reedCount, tempObject.matrix);
        reedCount += 1;
      } else if (pebbleCount < 64) {
        tempObject.position.set(x, terrainHeight(x, z) + 0.12, z);
        tempObject.rotation.set(i * 0.31, angle, i * 0.17);
        tempObject.scale.set(0.7 + (i % 5) * 0.12, 0.32, 0.48 + (i % 3) * 0.1);
        tempObject.updateMatrix();
        pebbleMesh.setMatrixAt(pebbleCount, tempObject.matrix);
        pebbleCount += 1;
      }
    }
  });

  reedMesh.count = reedCount;
  pebbleMesh.count = pebbleCount;
  reedMesh.castShadow = true;
  pebbleMesh.castShadow = true;
  pebbleMesh.receiveShadow = true;
  addLevelObject(reedMesh, pebbleMesh);
}

function addMeadowPatches() {
  const patchMaterial = new THREE.MeshBasicMaterial({
    color: 0x3d6b3b,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mossMaterial = new THREE.MeshBasicMaterial({
    color: 0x6f7e48,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const geometry = new THREE.CircleGeometry(1, 22);

  for (let i = 0; i < 24; i += 1) {
    const x = ((i * 31) % 136) - 68 + Math.sin(i * 0.8) * 5.5;
    const z = ((i * 47) % 138) - 69 + Math.cos(i * 1.1) * 5.5;
    if (!isDryObjectSpot(x, z, 7) || pathAmount(x, z) > 0.32) continue;

    const patch = new THREE.Mesh(geometry, i % 3 === 0 ? mossMaterial : patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = i * 0.37;
    patch.position.set(x, terrainHeight(x, z) + 0.055, z);
    patch.scale.set(3.2 + (i % 5) * 0.72, 1.55 + (i % 4) * 0.55, 1);
    addLevelObject(patch);
  }
}

function addBoundaryFence() {
  const fenceInset = 3.6;
  const fenceHalf = halfWorld - fenceInset;
  const spacing = 6.8;
  const segmentCount = Math.floor((fenceHalf * 2) / spacing);
  const postGeometry = new THREE.CylinderGeometry(0.12, 0.16, 1.35, 6);
  const railGeometry = new THREE.BoxGeometry(1, 0.12, 0.12);
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a3a22,
    roughness: 0.88,
    metalness: 0.02
  });
  const group = new THREE.Group();

  const north = [];
  const south = [];
  const west = [];
  const east = [];
  for (let i = 0; i <= segmentCount; i += 1) {
    const t = -fenceHalf + i * spacing;
    north.push([t, -fenceHalf]);
    south.push([t, fenceHalf]);
    west.push([-fenceHalf, t]);
    east.push([fenceHalf, t]);
  }

  [north, south, west, east].forEach((points) => {
    addFenceLine(group, points, postGeometry, railGeometry, woodMaterial, {
      postHeight: 1.35,
      railHeights: [0.72, 1.08],
      skipWater: false
    });
  });

  addLevelObject(group);
}

function addFenceLine(group, points, postGeometry, railGeometry, material, options) {
  points.forEach(([x, z]) => {
    if (options.skipWater && !isDryObjectSpot(x, z, 2.8)) return;
    const post = new THREE.Mesh(postGeometry, material);
    post.position.set(x, terrainHeight(x, z) + options.postHeight * 0.5, z);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  });

  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[i + 1];
    const midX = (x1 + x2) * 0.5;
    const midZ = (z1 + z2) * 0.5;
    if (options.skipWater && !isDryObjectSpot(midX, midZ, 4.2)) continue;

    options.railHeights.forEach((heightOffset) => {
      addFenceRail(group, railGeometry, material, x1, z1, x2, z2, heightOffset);
    });
  }
}

function addFenceRail(group, railGeometry, material, x1, z1, x2, z2, heightOffset) {
  const start = new THREE.Vector3(x1, terrainHeight(x1, z1) + heightOffset, z1);
  const end = new THREE.Vector3(x2, terrainHeight(x2, z2) + heightOffset, z2);
  const direction = end.clone().sub(start);
  const length = direction.length();
  if (length < 0.1) return;

  const rail = new THREE.Mesh(railGeometry, material);
  rail.position.copy(start).addScaledVector(direction, 0.5);
  rail.scale.set(length * 0.88, 1, 1);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.normalize());
  rail.castShadow = true;
  rail.receiveShadow = true;
  group.add(rail);
}

function addFarmDetails() {
  addGrainSilo();
  addWindmill();
  addPastureFences();
  addBarn(48, 48, -0.34);
  addFarmLanterns();
  addHayBales();
  addPathStones();
  addGrassClumps();
}

function addGrainSilo() {
  const { x, z } = farmLandmarks.silo;
  const group = new THREE.Group();
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb7b5a7,
    emissive: 0x10100b,
    roughness: 0.62,
    metalness: 0.18,
    flatShading: true
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c7a4c,
    emissive: 0x161005,
    roughness: 0.78,
    metalness: 0.08,
    flatShading: true
  });
  const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x4c4335, roughness: 0.82 });
  const ladderMaterial = new THREE.MeshStandardMaterial({ color: 0x2d241d, roughness: 0.88 });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x07100b,
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(6.6, 18), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.35, 12.6, 14), metalMaterial);
  body.position.y = 6.3;
  body.castShadow = true;
  body.receiveShadow = true;

  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.95, 2.25, 14), roofMaterial);
  roof.position.y = 13.55;
  roof.castShadow = true;

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.55, 8), bandMaterial);
  cap.position.y = 14.95;
  cap.castShadow = true;

  [2.2, 6.1, 9.95].forEach((height) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(3.23, 0.055, 6, 28), bandMaterial);
    band.position.y = height;
    band.rotation.x = Math.PI / 2;
    band.castShadow = true;
    group.add(band);
  });

  for (let i = 0; i < 5; i += 1) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 0.08), ladderMaterial);
    rung.position.set(-2.35, 3.1 + i * 1.28, -2.42);
    rung.rotation.y = -0.18;
    rung.castShadow = true;
    group.add(rung);
  }

  const ladderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6.8, 0.08), ladderMaterial);
  ladderLeft.position.set(-2.82, 5.6, -2.38);
  ladderLeft.rotation.y = -0.18;
  const ladderRight = ladderLeft.clone();
  ladderRight.position.x = -1.88;
  group.add(ladderLeft, ladderRight);

  const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.6, 7), bandMaterial);
  chute.position.set(3.06, 2.8, 0.7);
  chute.rotation.z = -0.38;
  chute.castShadow = true;

  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd37a }));
  lamp.position.set(-2.1, 2.2, -2.8);
  const glow = new THREE.PointLight(0xffbd66, 0.65, 9, 1.9);
  glow.position.copy(lamp.position);

  group.add(shadow, body, roof, cap, chute, lamp, glow);
  group.rotation.y = -0.38;
  group.position.set(x, terrainHeight(x, z) + 0.02, z);
  addLevelObject(group);
}

function addWindmill() {
  const { x, z, rotation } = farmLandmarks.windmill;
  const group = new THREE.Group();
  const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.9 });
  const plasterMaterial = new THREE.MeshStandardMaterial({
    color: 0xc6c0aa,
    emissive: 0x10100c,
    roughness: 0.82,
    flatShading: true
  });
  const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3125, roughness: 0.86 });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0xb69042,
    emissive: 0x1b1205,
    roughness: 0.9,
    flatShading: true
  });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x44281d, roughness: 0.82 });
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffcf77 });

  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(4.9, 5.4, 1.05, 8), foundationMaterial);
  foundation.position.y = 0.55;
  foundation.castShadow = true;
  foundation.receiveShadow = true;

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 3.85, 12.4, 9), plasterMaterial);
  tower.position.y = 6.7;
  tower.castShadow = true;
  tower.receiveShadow = true;

  const lowerBand = new THREE.Mesh(new THREE.CylinderGeometry(3.95, 4.2, 0.42, 9), beamMaterial);
  lowerBand.position.y = 1.42;
  const upperBand = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.7, 0.32, 9), beamMaterial);
  upperBand.position.y = 10.7;

  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.25, 2.45, 8), roofMaterial);
  roof.position.y = 14.1;
  roof.castShadow = true;

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.25, 0.16), doorMaterial);
  door.position.set(0, 1.95, -3.86);
  const window = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.14), windowMaterial);
  window.position.set(1.28, 7.9, -2.45);
  const windowGlow = new THREE.PointLight(0xffc46a, 0.72, 10, 1.85);
  windowGlow.position.copy(window.position);

  const rotor = new THREE.Group();
  rotor.position.set(0, 11.65, -2.92);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.64, 10), beamMaterial);
  hub.rotation.x = Math.PI / 2;
  hub.castShadow = true;
  rotor.add(hub);

  for (let i = 0; i < 4; i += 1) {
    const blade = new THREE.Group();
    blade.rotation.z = i * Math.PI * 0.5;
    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.6, 0.18), beamMaterial);
    spar.position.y = 3.25;
    spar.castShadow = true;
    const sail = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.8, 0.1), plasterMaterial);
    sail.position.set(0.36, 4.45, 0);
    sail.rotation.z = -0.12;
    sail.castShadow = true;
    blade.add(spar, sail);
    rotor.add(blade);
  }

  rotor.userData.rotationSpeed = 0.56;
  windmillRotors.push(rotor);
  group.add(foundation, tower, lowerBand, upperBand, roof, door, window, windowGlow, rotor);
  group.rotation.y = rotation;
  group.position.set(x, terrainHeight(x, z) + 0.03, z);
  addLevelObject(group);
}

function addPastureFences() {
  [
    [22, 27, 36, 27],
    [-48, 36, 34, 30],
    [48, -34, 36, 29],
    [-2, 54, 30, 20]
  ].forEach(([x, z, width, depth]) => {
    addRectFence(x, z, width, depth, 5.8);
  });
}

function addRectFence(centerX, centerZ, width, depth, spacing) {
  const postGeometry = new THREE.CylinderGeometry(0.1, 0.13, 1.18, 6);
  const railGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x6d4a2b,
    roughness: 0.86,
    metalness: 0.02
  });
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const xSegments = Math.max(3, Math.round(width / spacing));
  const zSegments = Math.max(3, Math.round(depth / spacing));
  const group = new THREE.Group();

  const north = [];
  const south = [];
  const west = [];
  const east = [];

  for (let i = 0; i <= xSegments; i += 1) {
    const x = centerX - halfWidth + (i / xSegments) * width;
    north.push([x, centerZ - halfDepth]);
    south.push([x, centerZ + halfDepth]);
  }

  for (let i = 0; i <= zSegments; i += 1) {
    const z = centerZ - halfDepth + (i / zSegments) * depth;
    west.push([centerX - halfWidth, z]);
    east.push([centerX + halfWidth, z]);
  }

  [north, south, west, east].forEach((points) => {
    addFenceLine(group, points, postGeometry, railGeometry, material, {
      postHeight: 1.18,
      railHeights: [0.56, 0.9],
      skipWater: false
    });
  });

  addLevelObject(group);
}

function addBarn(x, z, rotationY = 0) {
  const spot = findDryObjectSpot(x, z, 11, 210);
  const group = new THREE.Group();
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a2e2d,
    emissive: 0x170706,
    roughness: 0.74
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x232737,
    roughness: 0.82,
    metalness: 0.06
  });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xd7c9a1, roughness: 0.7 });
  const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4b3c, roughness: 0.94 });

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.12, 8.2), foundationMaterial);
  foundation.position.y = 0.06;
  foundation.receiveShadow = true;

  const body = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.8, 6.8), wallMaterial);
  body.position.y = 2.4;
  body.castShadow = true;
  body.receiveShadow = true;

  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.2, 4), roofMaterial);
  roof.position.y = 5.3;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.72;
  roof.castShadow = true;

  const door = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, 0.12), trimMaterial);
  door.position.set(0, 1.45, -3.45);

  const loft = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 0.13), trimMaterial);
  loft.position.set(0, 3.72, -3.46);

  const warmWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.64, 0.14),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  warmWindow.position.set(-2.75, 2.65, -3.47);

  group.add(foundation, body, roof, door, loft, warmWindow);
  group.rotation.y = rotationY;
  group.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.02, spot.z);
  addLevelObject(group);
}

function addFarmLanterns() {
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2a1a, roughness: 0.82 });
  const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffc46a });

  [
    [39, 45],
    [54, 43],
    [-64, 54],
    [11, 30],
    [-34, 27]
  ].forEach(([x, z], index) => {
    const spot = findDryObjectSpot(x, z, 3.5, 240 + index);
    const group = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), postMaterial);
    post.position.y = 1.2;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), lampMaterial);
    lamp.position.y = 2.48;
    const glow = new THREE.PointLight(0xffb45e, 1.25, 14, 1.9);
    glow.position.y = 2.35;
    group.add(post, lamp, glow);
    group.position.set(spot.x, terrainHeight(spot.x, spot.z), spot.z);
    group.rotation.y = index * 0.4;
    addLevelObject(group);
  });
}

function addHayBales() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xb9903b,
    emissive: 0x201304,
    roughness: 0.92
  });
  const geometry = new THREE.CylinderGeometry(0.72, 0.72, 1.2, 12);

  [
    [40, 42, 0.1],
    [43, 45, 0.6],
    [53, 40, -0.25],
    [56, 46, 0.45],
    [47, 35, -0.55],
    [-30, 48, 0.4],
    [-34, 44, -0.4],
    [-41, 50, 0.2],
    [-58, 55, -0.35],
    [28, -16, 0.25],
    [33, -20, -0.2],
    [52, -27, 0.35],
    [-3, 49, -0.45],
    [8, 54, 0.28],
    [63, 18, -0.1],
    [69, 24, 0.52]
  ].forEach(([x, z, rotation], index) => {
    const spot = findDryObjectSpot(x, z, 3.6, 270 + index);
    const bale = new THREE.Mesh(geometry, material);
    bale.rotation.z = Math.PI / 2;
    bale.rotation.y = rotation;
    bale.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.72, spot.z);
    bale.castShadow = true;
    bale.receiveShadow = true;
    addLevelObject(bale);
  });
}

function addPathStones() {
  const geometry = new THREE.DodecahedronGeometry(0.45, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x5c5c55,
    roughness: 0.96
  });
  const points = [];
  for (let i = 0; i < 36; i += 1) {
    const t = i / 35;
    points.push([
      THREE.MathUtils.lerp(-72, 44, t) + Math.sin(i * 1.9) * 2.1,
      THREE.MathUtils.lerp(56, 43, t) + Math.cos(i * 1.3) * 1.5
    ]);
  }

  points.forEach(([x, z], index) => {
    if (index % 3 === 0) return;
    if (!isDryObjectSpot(x, z, 2.4)) return;
    const stone = new THREE.Mesh(geometry, material);
    stone.position.set(x, terrainHeight(x, z) + 0.12, z);
    stone.scale.set(0.6 + (index % 4) * 0.1, 0.16, 0.42 + (index % 3) * 0.08);
    stone.rotation.set(index * 0.13, index * 0.41, index * 0.07);
    stone.receiveShadow = true;
    addLevelObject(stone);
  });
}

function addGrassClumps() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x2f6a34,
    roughness: 0.95
  });
  const geometry = new THREE.ConeGeometry(0.24, 0.9, 5);
  const clumps = new THREE.InstancedMesh(geometry, material, 140);
  let count = 0;

  for (let i = 0; i < 140; i += 1) {
    const x = ((i * 47) % 150) - 75 + Math.sin(i * 1.8) * 2.4;
    const z = ((i * 61) % 150) - 75 + Math.cos(i * 1.4) * 2.4;
    if (!isDryObjectSpot(x, z, 3.8) || pathAmount(x, z) > 0.45) continue;
    const scale = 0.55 + (i % 5) * 0.08;
    tempObject.position.set(x, terrainHeight(x, z) + 0.42 * scale, z);
    tempObject.rotation.set(0, i * 0.77, 0);
    tempObject.scale.set(scale, scale * (0.75 + (i % 4) * 0.12), scale);
    tempObject.updateMatrix();
    clumps.setMatrixAt(count, tempObject.matrix);
    count += 1;
  }

  clumps.count = count;
  clumps.castShadow = true;
  clumps.receiveShadow = true;
  addLevelObject(clumps);
}

function addTrees() {
  const trunkGeometry = new THREE.CylinderGeometry(0.22, 0.32, 1.8, 6);
  const crownGeometry = new THREE.ConeGeometry(1.05, 2.6, 7);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x123c2b, roughness: 0.95 });
  const maxTrees = 145;
  const trunkMesh = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, maxTrees);
  const crownMesh = new THREE.InstancedMesh(crownGeometry, crownMaterial, maxTrees);
  let count = 0;
  const clusterCenters = [
    [-67, -58, 18, 19],
    [-66, 8, 16, 18],
    [-26, 70, 18, 16],
    [32, 67, 18, 14],
    [72, 11, 14, 18],
    [65, -63, 12, 13],
    [-5, -72, 18, 13]
  ];

  for (let i = 0; i < maxTrees; i += 1) {
    const cluster = clusterCenters[i % clusterCenters.length];
    const angle = i * 2.39996 + cluster[0] * 0.01;
    const spread = i < 95 ? cluster[2] : cluster[3] + 8;
    const radius = 2 + ((i * 13) % 100) / 100 * spread;
    const edgeBias = i >= 105 ? 18 + ((i * 19) % 54) : 0;
    let x = cluster[0] + Math.cos(angle) * radius + Math.sin(i * 0.77) * 1.8;
    let z = cluster[1] + Math.sin(angle) * radius + Math.cos(i * 0.39) * 1.8;

    if (edgeBias > 0) {
      const edgeAngle = i * 1.37;
      x = Math.cos(edgeAngle) * (halfWorld - edgeBias);
      z = Math.sin(edgeAngle) * (halfWorld - 7 - ((i * 11) % 18));
    }

    if (Math.abs(x) > halfWorld - 5 || Math.abs(z) > halfWorld - 5) continue;
    if (isWater(x, z, 12) || pastureAmount(x, z) > 0.55 || pathAmount(x, z) > 0.38) continue;

    const scale = 0.72 + ((i * 13) % 9) * 0.075;
    const y = terrainHeight(x, z);
    tempObject.position.set(x, y + 0.86 * scale, z);
    tempObject.rotation.set(0, angle, 0);
    tempObject.scale.setScalar(scale);
    tempObject.updateMatrix();
    trunkMesh.setMatrixAt(count, tempObject.matrix);

    tempObject.position.set(x, y + 2.55 * scale, z);
    tempObject.rotation.set(0, angle, 0);
    tempObject.scale.setScalar(scale);
    tempObject.updateMatrix();
    crownMesh.setMatrixAt(count, tempObject.matrix);
    count += 1;
  }

  trunkMesh.count = count;
  crownMesh.count = count;
  trunkMesh.castShadow = true;
  crownMesh.castShadow = true;
  addLevelObject(trunkMesh, crownMesh);
}

function addRocks() {
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({ color: 0x565f62, roughness: 0.98 });
  const rockSpots = [
    [-62, 60],
    [-58, 66],
    [-24, -58],
    [-18, -62],
    [36, 7],
    [42, 9],
    [50, 36],
    [57, 32],
    [69, -41],
    [73, -36],
    [-68, -12],
    [14, 66],
    [4, -73],
    [60, 5],
    [-9, 8],
    [31, -67],
    [-72, 36],
    [72, 57]
  ];
  const rockMesh = new THREE.InstancedMesh(geometry, material, rockSpots.length);
  let count = 0;

  rockSpots.forEach(([x, z], i) => {
    if (!isDryObjectSpot(x, z, 5.4) || pathAmount(x, z) > 0.48) return;
    tempObject.position.set(x, terrainHeight(x, z) + 0.42, z);
    tempObject.rotation.set(i * 0.27, i * 0.41, i * 0.19);
    tempObject.scale.set(
      0.35 + (i % 4) * 0.17,
      0.26 + (i % 3) * 0.12,
      0.45 + (i % 5) * 0.12
    );
    tempObject.updateMatrix();
    rockMesh.setMatrixAt(count, tempObject.matrix);
    count += 1;
  });

  rockMesh.count = count;
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  addLevelObject(rockMesh);
}

function addCropCircles() {
  const material = new THREE.MeshBasicMaterial({
    color: 0xaaffd6,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });

  [
    [26, 31, 7],
    [-22, 45, 5],
    [49, -22, 6],
    [-61, -16, 5]
  ].forEach(([x, z, radius], index) => {
    const spot = findDryObjectSpot(x, z, radius + 2, 320 + index);
    const circle = new THREE.Mesh(new THREE.RingGeometry(radius * 0.64, radius, 48), material);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.12, spot.z);
    addLevelObject(circle);
  });
}

function addClouds() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x1d2e45,
    emissive: 0x071020,
    roughness: 0.82,
    transparent: true,
    opacity: 0.68
  });

  for (let i = 0; i < 10; i += 1) {
    const cloud = new THREE.Group();
    for (let puff = 0; puff < 5; puff += 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.6 + puff * 0.2, 10, 8), material);
      mesh.position.set((puff - 2) * 1.45, Math.sin(puff) * 0.42, Math.cos(puff) * 0.6);
      mesh.scale.set(1.5, 0.62, 0.95);
      cloud.add(mesh);
    }
    cloud.position.set(((i * 29) % 146) - 73, 22 + (i % 4) * 2.8, ((i * 43) % 148) - 74);
    cloud.rotation.y = i * 0.33;
    addLevelObject(cloud);
  }
}

function addFireflies() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 110; i += 1) {
    const x = ((i * 41) % 154) - 77;
    const z = ((i * 67) % 154) - 77;
    positions.push(x, terrainHeight(x, z) + 1.1 + (i % 5) * 0.18, z);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const fireflies = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xfff1a5,
      size: 0.22,
      transparent: true,
      opacity: 0.7
    })
  );
  fireflies.name = "fireflies";
  addLevelObject(fireflies);
}

function createUfo() {
  const group = new THREE.Group();
  group.position.set(0, 12, 18);

  const saucer = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 40, 14),
    new THREE.MeshStandardMaterial({
      color: 0xa9bbc7,
      roughness: 0.22,
      metalness: 0.76,
      emissive: 0x071421,
      emissiveIntensity: 0.08
    })
  );
  saucer.scale.set(1.65, 0.24, 1.65);
  saucer.castShadow = true;
  saucer.receiveShadow = true;

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(3.55, 0.26, 10, 52),
    new THREE.MeshStandardMaterial({ color: 0x5f7484, roughness: 0.28, metalness: 0.82, emissive: 0x03111a, emissiveIntensity: 0.12 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({
      color: 0x8df6ff,
      emissive: 0x1aa8c8,
      emissiveIntensity: 0.55,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.76
    })
  );
  dome.position.y = 0.36;
  dome.castShadow = true;

  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xa9fff5,
    emissive: 0x35ffe5,
    emissiveIntensity: 2.35
  });
  for (let i = 0; i < 12; i += 1) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), lampMaterial);
    const angle = (i / 12) * Math.PI * 2;
    lamp.position.set(Math.cos(angle) * 3.36, -0.1, Math.sin(angle) * 3.36);
    group.add(lamp);
  }

  const rivetMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7d0d4,
    roughness: 0.36,
    metalness: 0.86
  });
  const rivets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), rivetMaterial, 40);
  for (let i = 0; i < 40; i += 1) {
    const angle = (i / 40) * Math.PI * 2;
    const radius = i % 2 === 0 ? 2.92 : 2.46;
    tempObject.position.set(Math.cos(angle) * radius, 0.05 + (i % 2) * 0.08, Math.sin(angle) * radius);
    tempObject.scale.setScalar(i % 2 === 0 ? 1.15 : 0.9);
    tempObject.updateMatrix();
    rivets.setMatrixAt(i, tempObject.matrix);
  }
  rivets.castShadow = true;

  const panelRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.18, 0.025, 6, 64),
    new THREE.MeshStandardMaterial({
      color: 0x45525b,
      roughness: 0.42,
      metalness: 0.82
    })
  );
  panelRing.rotation.x = Math.PI / 2;
  panelRing.position.y = 0.22;

  const alien = new THREE.Group();
  const alienSkin = new THREE.MeshStandardMaterial({
    color: 0x8de08f,
    emissive: 0x1b5f3a,
    emissiveIntensity: 0.22,
    roughness: 0.7
  });
  const alienHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), alienSkin);
  alienHead.scale.set(0.78, 1.08, 0.72);
  alienHead.position.y = 0.74;
  const alienBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 4, 10), alienSkin);
  alienBody.position.y = 0.26;
  const alienEyeMaterial = new THREE.MeshBasicMaterial({ color: 0x061315 });
  for (const x of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), alienEyeMaterial);
    eye.position.set(x, 0.8, 0.3);
    eye.scale.set(1.15, 1.55, 0.6);
    alien.add(eye);
  }
  alien.add(alienHead, alienBody);
  alien.position.set(0, 0.18, -0.12);

  const engineGlow = new THREE.PointLight(0x72fff0, 7.5, 28);
  engineGlow.position.y = -0.35;

  const boostGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.15, 36, 14),
    new THREE.MeshBasicMaterial({
      color: 0x8ffff1,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  boostGlow.scale.set(1.55, 0.18, 1.55);
  boostGlow.position.y = -0.02;

  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 3.2, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x86fff0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  trail.rotation.x = Math.PI;
  trail.position.y = -1.8;

  group.add(boostGlow, saucer, rim, rivets, panelRing, alien, dome, engineGlow, trail);
  return { group, rim, trail, engineGlow, boostGlow };
}

function createBeam() {
  const group = new THREE.Group();
  group.visible = false;
  const outerMaterial = new THREE.MeshBasicMaterial({
    color: 0x55ffe8,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8fff8,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const groundGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x46ffe2,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 12.4, 42, 1, true),
    outerMaterial
  );
  cone.position.y = -6.2;
  cone.rotation.x = Math.PI;

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 1.9, 11.1, 34, 1, true),
    coreMaterial
  );
  core.position.y = -5.55;

  const groundGlow = new THREE.Mesh(new THREE.CircleGeometry(3.2, 42), groundGlowMaterial);
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = -12.25;

  const light = new THREE.SpotLight(0x55ffe8, 11, 29, 0.46, 0.7, 0.78);
  light.position.y = -0.6;
  light.target.position.y = -10;
  group.add(light.target, light, cone, core, groundGlow);
  group.userData = { outerMaterial, coreMaterial, groundGlowMaterial, light };
  return group;
}

function updateBeamPalette(preset) {
  if (!beam || !beam.userData.outerMaterial) return;
  beam.userData.outerMaterial.color.setHex(preset.beamColor);
  beam.userData.coreMaterial.color.setHex(preset.beamCore);
  beam.userData.groundGlowMaterial.color.setHex(preset.beamColor);
  beam.userData.light.color.setHex(preset.beamColor);
}

function createCowHint() {
  const group = new THREE.Group();
  group.visible = false;

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffec7a,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.045, 8, 36), ringMaterial);
  outerRing.rotation.x = Math.PI / 2;

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 8, 30), ringMaterial);
  innerRing.rotation.x = Math.PI / 2;

  const spark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshBasicMaterial({
      color: 0xfff8b2,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
  );
  spark.position.y = 0.55;

  const light = new THREE.PointLight(0xffdf6b, 0.75, 7);
  light.position.y = 0.35;

  group.add(outerRing, innerRing, spark, light);
  return group;
}

function spawnCollectibles() {
  const cowSpots = generateCowSpawnSpots(maxWaveCows);

  cowSpots.forEach(({ x, z }, index) => {
    const animal = createAnimal(index);
    addCollectible(animal, "animal", x, z, 100);
  });

  const human = createHumanForLevel();
  const bonusSpot = findRandomSpawnSpot({
    zones: bonusSpawnZones,
    used: cowSpots,
    minDistance: 16,
    fallbackSeed: 99
  });
  addCollectible(human, "bonus", bonusSpot.x, bonusSpot.z, 750);
  prepareWave(0);
}

function addCollectible(group, type, x, z, points) {
  positionCollectible(group, type, x, z);
  group.userData = {
    type,
    points,
    collected: false,
    active: true,
    wobble: Math.random() * Math.PI * 2,
    baseY: group.position.y,
    moveTarget: null,
    moveSpeed: 0,
    moveUntil: 0,
    scareCooldownUntil: 0,
    wanderPauseUntil: 0
  };
  collectibles.push(group);
  addLevelObject(group);
}

function prepareWave(waveIndex) {
  currentWaveIndex = THREE.MathUtils.clamp(waveIndex, 0, waveConfigs.length - 1);
  const config = getCurrentWaveConfig();
  waveCowGoal = config.cowGoal;
  waveCowsCollected = 0;
  bonusCollected = false;
  abductingTarget = null;
  beamActive = false;
  beam.visible = false;

  const cowSpots = generateCowSpawnSpots(waveCowGoal);
  let cowIndex = 0;

  collectibles.forEach((item) => {
    if (item.userData.type !== "animal") return;
    if (cowIndex < waveCowGoal) {
      const spot = cowSpots[cowIndex];
      positionCollectible(item, "animal", spot.x, spot.z);
      resetCollectibleState(item, true);
    } else {
      resetCollectibleState(item, false);
    }
    cowIndex += 1;
  });

  const bonusSpot = findRandomSpawnSpot({
    zones: bonusSpawnZones,
    used: cowSpots,
    minDistance: 16,
    fallbackSeed: 99
  });

  collectibles.forEach((item) => {
    if (item.userData.type !== "bonus") return;
    positionCollectible(item, "bonus", bonusSpot.x, bonusSpot.z);
    resetCollectibleState(item, true);
  });

  resetWavePowerups();
}

function getCurrentWaveConfig() {
  return waveConfigs[currentWaveIndex];
}

function startWaveTimer(elapsed = clock.elapsedTime) {
  const config = getCurrentWaveConfig();
  waveStartedAt = elapsed;
  waveTimeRemaining = config.timeLimit;
  countdownPlayedForWave = -1;
  stopCountdownSound();
}

function updateWaveTimer(elapsed) {
  if (!gameStarted || gameWon || waveTransitionActive) return;
  const config = getCurrentWaveConfig();
  waveTimeRemaining = Math.max(0, config.timeLimit - (elapsed - waveStartedAt));

  if (waveTimeRemaining <= 11 && countdownPlayedForWave !== currentWaveIndex) {
    countdownPlayedForWave = currentWaveIndex;
    playCountdownSound();
  }

  if (waveTimeRemaining <= 0) {
    timeoutWave(elapsed);
  }
}

function resetCollectibleState(item, active = true) {
  item.visible = active;
  item.rotation.z = 0;
  item.userData.active = active;
  item.userData.collected = !active;
  item.userData.wobble = Math.random() * Math.PI * 2;
  item.userData.moveTarget = null;
  item.userData.moveSpeed = 0;
  item.userData.moveUntil = 0;
  item.userData.scareCooldownUntil = 0;
  item.userData.wanderPauseUntil = clock.elapsedTime + 1 + Math.random() * 2.5;
}

function positionCollectible(group, type, x, z) {
  group.position.set(x, collectibleBaseHeight(type, x, z), z);
  group.rotation.y = Math.atan2(x, z) + Math.PI * 0.5;
  if (group.userData) {
    group.userData.baseY = group.position.y;
  }
}

function generateCowSpawnSpots(cowCount = waveCowGoal) {
  const spots = [];

  for (let index = 0; index < cowCount; index += 1) {
    const zone = cowSpawnZones[index % cowSpawnZones.length];
    spots.push(findRandomSpawnSpot({
      zones: [zone],
      used: spots,
      minDistance: 9.5,
      fallbackSeed: index
    }));
  }

  return spots;
}

function findRandomSpawnSpot({ zones, used = [], minDistance = 9, fallbackSeed = 0 }) {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const x = zone.x + (Math.random() - 0.5) * zone.width;
    const z = zone.z + (Math.random() - 0.5) * zone.depth;
    if (isSpawnCandidateSafe(x, z, used, minDistance)) return { x, z };
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const zone = zones[(attempt + fallbackSeed) % zones.length];
    const angle = fallbackSeed * 1.37 + attempt * 2.11;
    const radiusX = zone.width * (0.12 + ((attempt * 17) % 37) / 100);
    const radiusZ = zone.depth * (0.12 + ((attempt * 23) % 37) / 100);
    const x = zone.x + Math.cos(angle) * radiusX;
    const z = zone.z + Math.sin(angle) * radiusZ;
    if (isSpawnCandidateSafe(x, z, used, minDistance * 0.82)) return { x, z };
  }

  for (const zone of zones) {
    const spot = findDrySpot(zone.x, zone.z, fallbackSeed);
    if (isSpawnCandidateSafe(spot.x, spot.z, used, minDistance * 0.65)) return spot;
  }

  return findDrySpot(0, 0, fallbackSeed);
}

function isSpawnCandidateSafe(x, z, used, minDistance) {
  if (!isSpawnSafe(x, z)) return false;
  return used.every((spot) => Math.hypot(spot.x - x, spot.z - z) >= minDistance);
}

function collectibleBaseHeight(type, x, z) {
  if (type === "animal") return maxTerrainHeightAround(x, z, activeLevelId === "desert" ? 1.7 : activeLevelId === "ice" ? 2.1 : 1.45) + 0.12;
  if (type === "bonus") return maxTerrainHeightAround(x, z, 0.8) + 0.08;
  return terrainHeight(x, z);
}

function createAnimal(index) {
  if (activeLevelId === "desert") return createCamel(index);
  if (activeLevelId === "ice") return createPolarBear(index);
  return createCow(index);
}

function createCow(index) {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({
    color: 0xe8e1cf,
    emissive: 0x121212,
    roughness: 0.78
  });
  const black = new THREE.MeshStandardMaterial({ color: 0x171a1a, roughness: 0.78 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xd98791, roughness: 0.65 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 0.72), white);
  body.position.y = 0.92;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.58, 0.58), white);
  head.position.set(1.12, 1.08, 0);
  head.castShadow = true;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.25, 0.45), pink);
  snout.position.set(1.52, 1.02, 0);

  const spotMaterial = index % 2 === 0
    ? black
    : new THREE.MeshStandardMaterial({ color: 0x4f3d31, roughness: 0.8 });
  [
    [-0.36, 1.15, 0.38],
    [0.34, 0.86, -0.38],
    [0.08, 1.28, 0.39]
  ].forEach(([x, y, z]) => {
    const spot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.28), spotMaterial);
    spot.position.set(x, y, z);
    group.add(spot);
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ffcff,
    emissive: 0x55e9ff,
    emissiveIntensity: 0.8
  });
  for (const z of [-0.16, 0.16]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), eyeMaterial);
    eye.position.set(1.47, 1.15, z);
    group.add(eye);
  }

  const legGeometry = new THREE.BoxGeometry(0.22, 0.72, 0.22);
  for (const x of [-0.62, 0.56]) {
    for (const z of [-0.24, 0.24]) {
      const leg = new THREE.Mesh(legGeometry, black);
      leg.position.set(x, 0.36, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  const hornGeometry = new THREE.ConeGeometry(0.08, 0.36, 8);
  for (const z of [-0.24, 0.24]) {
    const horn = new THREE.Mesh(hornGeometry, new THREE.MeshStandardMaterial({ color: 0xd8cb94 }));
    horn.position.set(1.28, 1.46, z);
    horn.rotation.z = -Math.PI / 2.8;
    group.add(horn);
  }

  group.add(body, head, snout);
  group.scale.setScalar(1.2);
  return group;
}

function createCamel(index) {
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({
    color: index % 2 === 0 ? 0xc89455 : 0xb98047,
    emissive: 0x241005,
    roughness: 0.86
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.86 });
  const saddle = new THREE.MeshStandardMaterial({ color: 0x7d2f35, roughness: 0.74 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.82, 0.64), coat);
  body.position.y = 1.05;
  body.castShadow = true;

  const hump = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.86, 4), coat);
  hump.position.set(-0.28, 1.6, 0);
  hump.rotation.y = Math.PI / 4;
  hump.scale.z = 0.72;
  hump.castShadow = true;

  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.86, 4, 8), coat);
  neck.position.set(0.98, 1.55, 0);
  neck.rotation.z = -0.44;
  neck.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.44, 0.42), coat);
  head.position.set(1.38, 1.86, 0);
  head.castShadow = true;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.34), dark);
  snout.position.set(1.74, 1.8, 0);

  const saddleBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 0.72), saddle);
  saddleBlanket.position.set(-0.22, 1.5, 0);

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x061315 });
  for (const z of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMaterial);
    eye.position.set(1.68, 1.94, z);
    group.add(eye);
  }

  const legGeometry = new THREE.CapsuleGeometry(0.11, 0.68, 4, 8);
  for (const x of [-0.64, 0.54]) {
    for (const z of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(legGeometry, dark);
      leg.position.set(x, 0.48, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  group.add(body, hump, neck, head, snout, saddleBlanket);
  group.scale.setScalar(1.22);
  return group;
}

function createHumanForLevel() {
  if (activeLevelId === "desert") return createDesertHuman();
  if (activeLevelId === "ice") return createIceHuman();
  return createBonusHuman();
}

function createBonusHuman() {
  const group = new THREE.Group();
  const pants = new THREE.MeshStandardMaterial({ color: 0x1e3d85, roughness: 0.78 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xb43937, roughness: 0.72 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe2a875, roughness: 0.68 });
  const hat = new THREE.MeshStandardMaterial({ color: 0x1a1818, roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.9, 5, 12), shirt);
  body.position.y = 1.05;
  body.rotation.z = 0.28;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
  head.position.set(0.18, 1.78, 0);
  head.castShadow = true;

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.18, 12), hat);
  cap.position.set(0.18, 2.02, 0);
  cap.rotation.z = 0.28;

  const legGeometry = new THREE.CapsuleGeometry(0.12, 0.52, 4, 8);
  [-0.15, 0.18].forEach((x, index) => {
    const leg = new THREE.Mesh(legGeometry, pants);
    leg.position.set(x, 0.36, 0);
    leg.rotation.z = index === 0 ? 0.35 : -0.18;
    leg.castShadow = true;
    group.add(leg);
  });

  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.45, 10),
    new THREE.MeshStandardMaterial({
      color: 0x1f7f55,
      emissive: 0x0f5f3b,
      emissiveIntensity: 0.35,
      roughness: 0.44,
      metalness: 0.08
    })
  );
  bottle.position.set(-0.55, 1.13, 0.1);
  bottle.rotation.z = 1.0;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 14, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff77dd,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    })
  );
  glow.position.set(0.1, 1.36, 0);

  group.add(body, head, cap, bottle, glow);
  group.scale.setScalar(1.2);
  return group;
}

function createDesertHuman() {
  const group = new THREE.Group();
  const robe = new THREE.MeshStandardMaterial({ color: 0xd6c28a, roughness: 0.82 });
  const scarf = new THREE.MeshStandardMaterial({ color: 0x497a87, roughness: 0.74 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd99a6c, roughness: 0.68 });
  const boots = new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.86 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.95, 5, 12), robe);
  body.position.y = 1.08;
  body.rotation.z = -0.12;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
  head.position.set(-0.08, 1.82, 0);
  head.castShadow = true;

  const turban = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.075, 8, 18), scarf);
  turban.position.set(-0.08, 2.04, 0);
  turban.rotation.x = Math.PI / 2;

  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.08), scarf);
  scarfTail.position.set(-0.38, 1.78, -0.04);
  scarfTail.rotation.z = 0.28;

  const legGeometry = new THREE.CapsuleGeometry(0.11, 0.5, 4, 8);
  [-0.14, 0.16].forEach((x, index) => {
    const leg = new THREE.Mesh(legGeometry, boots);
    leg.position.set(x, 0.34, 0);
    leg.rotation.z = index === 0 ? 0.18 : -0.2;
    leg.castShadow = true;
    group.add(leg);
  });

  const canteen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.18, 10),
    new THREE.MeshStandardMaterial({ color: 0x6a4d34, roughness: 0.7 })
  );
  canteen.position.set(0.52, 1.02, 0.12);
  canteen.rotation.x = Math.PI / 2;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 14, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff77dd,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    })
  );
  glow.position.set(0.02, 1.36, 0);

  group.add(body, head, turban, scarfTail, canteen, glow);
  group.scale.setScalar(1.2);
  return group;
}

function createIceHuman() {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xd94c58, roughness: 0.78 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x24344f, roughness: 0.78 });
  const fur = new THREE.MeshStandardMaterial({ color: 0xe8f4ef, roughness: 0.72 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd99a6c, roughness: 0.68 });
  const visor = new THREE.MeshBasicMaterial({ color: 0x9ffcff });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.92, 5, 12), suit);
  body.position.y = 1.06;
  body.rotation.z = 0.12;
  body.castShadow = true;

  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10), fur);
  hood.position.set(0.08, 1.82, 0);
  hood.scale.set(1, 1.05, 0.92);
  hood.castShadow = true;

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 8), skin);
  face.position.set(0.22, 1.8, 0);
  face.scale.set(0.7, 0.72, 0.64);

  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.34), visor);
  goggles.position.set(0.38, 1.86, 0);

  const legGeometry = new THREE.CapsuleGeometry(0.11, 0.5, 4, 8);
  [-0.14, 0.16].forEach((x, index) => {
    const leg = new THREE.Mesh(legGeometry, pants);
    leg.position.set(x, 0.34, 0);
    leg.rotation.z = index === 0 ? 0.12 : -0.22;
    leg.castShadow = true;
    group.add(leg);
  });

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xff77dd })
  );
  beacon.position.set(-0.42, 1.35, 0.12);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 14, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff77dd,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    })
  );
  glow.position.set(0.02, 1.36, 0);

  group.add(body, hood, face, goggles, beacon, glow);
  group.scale.setScalar(1.2);
  return group;
}

function spawnPowerups() {
  getActiveLevel().powerupSpots.forEach(([x, z], index) => {
    const safeSpot = findDrySpot(x, z, index + 120);
    const powerup = createEnergyCore();
    powerup.position.set(safeSpot.x, terrainHeight(safeSpot.x, safeSpot.z) + energyCoreHoverHeight, safeSpot.z);
    powerup.userData = { collected: true, baseY: powerup.position.y };
    powerup.visible = false;
    powerups.push(powerup);
    addLevelObject(powerup);
  });
}

function resetWavePowerups() {
  const spots = generatePowerupSpawnSpots(activeEnergyCoresPerWave);

  powerups.forEach((powerup, index) => {
    const spot = spots[index];
    const active = Boolean(spot);
    powerup.userData.collected = !active;
    powerup.visible = active;

    if (!active) return;

    powerup.position.set(spot.x, terrainHeight(spot.x, spot.z) + energyCoreHoverHeight, spot.z);
    powerup.userData.baseY = powerup.position.y;
    powerup.rotation.set(0, Math.random() * Math.PI * 2, 0);
  });
}

function generatePowerupSpawnSpots(count) {
  const baseSpots = getActiveLevel().powerupSpots;
  const used = [];
  const offset = (currentWaveIndex * 2 + Math.floor(Math.random() * baseSpots.length)) % baseSpots.length;

  for (let index = 0; index < baseSpots.length && used.length < count; index += 1) {
    const [x, z] = baseSpots[(index + offset) % baseSpots.length];
    const spot = findPowerupSpawnSpot(x, z, used, index + currentWaveIndex * 17);
    if (spot) used.push(spot);
  }

  return used;
}

function findPowerupSpawnSpot(x, z, used, seed = 0) {
  for (let attempt = 0; attempt < 54; attempt += 1) {
    const angle = seed * 1.43 + attempt * 1.78;
    const radius = attempt === 0 ? 0 : 8 + attempt * 0.82;
    const candidateX = x + Math.cos(angle) * radius;
    const candidateZ = z + Math.sin(angle) * radius;

    if (Math.abs(candidateX) > halfWorld - 13 || Math.abs(candidateZ) > halfWorld - 13) continue;
    if (!isSpawnCandidateSafe(candidateX, candidateZ, used, energyCoreMinSpawnDistance)) continue;
    const safeSpot = findDrySpot(candidateX, candidateZ, seed + attempt + 130);
    if (isSpawnCandidateSafe(safeSpot.x, safeSpot.z, used, energyCoreMinSpawnDistance * 0.9)) return safeSpot;
  }

  return null;
}

function findDrySpot(x, z, seed = 0) {
  let candidateX = x;
  let candidateZ = z;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (isSpawnSafe(candidateX, candidateZ)) {
      return { x: candidateX, z: candidateZ };
    }
    const angle = seed * 1.71 + attempt * 1.94;
    const radius = 8 + attempt * 3.5;
    candidateX = THREE.MathUtils.clamp(x + Math.cos(angle) * radius, -halfWorld + 8, halfWorld - 8);
    candidateZ = THREE.MathUtils.clamp(z + Math.sin(angle) * radius, -halfWorld + 8, halfWorld - 8);
  }

  for (let step = 0; step < 400; step += 1) {
    const gridX = -70 + (((step * 17 + seed * 11) % 21) * 7);
    const gridZ = -70 + (((step * 29 + seed * 5) % 21) * 7);
    if (isSpawnSafe(gridX, gridZ)) return { x: gridX, z: gridZ };
  }

  return { x: THREE.MathUtils.clamp(x, -55, 55), z: THREE.MathUtils.clamp(z, -55, 55) };
}

function findDryObjectSpot(x, z, clearance = 5, seed = 0) {
  if (isDryObjectSpot(x, z, clearance)) return { x, z };

  for (let attempt = 0; attempt < 36; attempt += 1) {
    const angle = seed * 0.91 + attempt * 1.62;
    const radius = 5 + attempt * 2.4;
    const candidateX = THREE.MathUtils.clamp(x + Math.cos(angle) * radius, -halfWorld + 10, halfWorld - 10);
    const candidateZ = THREE.MathUtils.clamp(z + Math.sin(angle) * radius, -halfWorld + 10, halfWorld - 10);
    if (isDryObjectSpot(candidateX, candidateZ, clearance)) {
      return { x: candidateX, z: candidateZ };
    }
  }

  return findDrySpot(x, z, seed);
}

function isDryObjectSpot(x, z, clearance = 4) {
  if (Math.abs(x) > halfWorld - 5 || Math.abs(z) > halfWorld - 5) return false;
  const diagonal = clearance * 0.72;
  const offsets = [
    [0, 0],
    [clearance, 0],
    [-clearance, 0],
    [0, clearance],
    [0, -clearance],
    [diagonal, diagonal],
    [-diagonal, diagonal],
    [diagonal, -diagonal],
    [-diagonal, -diagonal]
  ];

  return offsets.every(([offsetX, offsetZ]) => {
    const sampleX = x + offsetX;
    const sampleZ = z + offsetZ;
    return !isWater(sampleX, sampleZ, 4) && terrainHeight(sampleX, sampleZ) > -0.92;
  });
}

function isSpawnSafe(x, z) {
  if (Math.abs(x) > halfWorld - 8 || Math.abs(z) > halfWorld - 8) return false;
  if (isWater(x, z, 12)) return false;
  if (!isClearOfSpawnBlockers(x, z, 4)) return false;

  const sampleRadius = 5.5;
  const sampleOffsets = [
    [0, 0],
    [sampleRadius, 0],
    [-sampleRadius, 0],
    [0, sampleRadius],
    [0, -sampleRadius],
    [sampleRadius * 0.7, sampleRadius * 0.7],
    [-sampleRadius * 0.7, sampleRadius * 0.7],
    [sampleRadius * 0.7, -sampleRadius * 0.7],
    [-sampleRadius * 0.7, -sampleRadius * 0.7]
  ];

  const heights = sampleOffsets.map(([offsetX, offsetZ]) => {
    const sampleX = x + offsetX;
    const sampleZ = z + offsetZ;
    if (isWater(sampleX, sampleZ, 10)) return null;
    return terrainHeight(sampleX, sampleZ);
  });

  if (heights.some((height) => height === null || height <= -0.72)) return false;
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  return maxHeight - minHeight < 1.15;
}

function isClearOfSpawnBlockers(x, z, clearance = 0) {
  return spawnBlockers.every((blocker) => {
    const nx = Math.abs(x - blocker.x) / (blocker.rx + clearance);
    const nz = Math.abs(z - blocker.z) / (blocker.rz + clearance);
    return nx > 1 || nz > 1;
  });
}

function maxTerrainHeightAround(x, z, radius) {
  const diagonal = radius * 0.72;
  return Math.max(
    terrainHeight(x, z),
    terrainHeight(x + radius, z),
    terrainHeight(x - radius, z),
    terrainHeight(x, z + radius),
    terrainHeight(x, z - radius),
    terrainHeight(x + diagonal, z + diagonal),
    terrainHeight(x - diagonal, z + diagonal),
    terrainHeight(x + diagonal, z - diagonal),
    terrainHeight(x - diagonal, z - diagonal)
  );
}

function createEnergyCore() {
  const group = new THREE.Group();
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.72, 0),
    new THREE.MeshStandardMaterial({
      color: 0x6ffff2,
      emissive: 0x21d8cb,
      emissiveIntensity: 1.2,
      roughness: 0.18,
      metalness: 0.08
    })
  );
  crystal.castShadow = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.98, 0.04, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xbffff8, transparent: true, opacity: 0.76 })
  );
  ring.rotation.x = Math.PI / 2;
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 18, 12),
    new THREE.MeshBasicMaterial({
      color: 0x6ffff2,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    })
  );
  group.add(crystal, ring, aura);
  return group;
}

function spawnHazards() {
  const droneCount = difficultyConfigs[difficulty]?.droneCount ?? difficultyConfigs.normal.droneCount;
  getActiveLevel().hazardSpots.slice(0, droneCount).forEach(([x, z, radius, speed], index) => {
    const hazard = createPatrolDrone(index);
    hazard.userData = {
      ...hazard.userData,
      center: new THREE.Vector3(x, 0, z),
      radius,
      speed,
      angle: index * 2.1,
      warningRadius: 12.25
    };
    hazards.push(hazard);
    addLevelObject(hazard);
  });
}

function createPatrolDrone(index) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.45, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0x202b3f,
      emissive: 0x34101a,
      emissiveIntensity: 0.35,
      roughness: 0.34,
      metalness: 0.48
    })
  );
  body.castShadow = true;

  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff5b70,
      emissive: 0xff233f,
      emissiveIntensity: 2
    })
  );
  lens.position.set(0, -0.08, 0.58);

  const rotorMaterial = new THREE.MeshBasicMaterial({
    color: 0xff9ca8,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });
  const rotorGeometry = new THREE.CircleGeometry(0.62, 24);
  const rotors = [];
  for (const x of [-0.88, 0.88]) {
    const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(x, 0.1, 0);
    rotor.rotation.x = -Math.PI / 2;
    rotors.push(rotor);
    group.add(rotor);
  }

  const scan = new THREE.Mesh(
    new THREE.ConeGeometry(1.85, 6.4, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff3555,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  scan.rotation.x = Math.PI;
  scan.position.y = -3.55;

  const light = new THREE.PointLight(0xff405f, 3, 12);
  group.add(body, lens, scan, light);
  group.name = `farm-search-drone-${index}`;
  group.userData.scan = scan;
  group.userData.rotors = rotors;
  return group;
}

function tick() {
  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;
  const gameplayActive = gameStarted && !gameWon && uiState === UI_STATES.PLAYING && !waveTransitionActive;

  if (gameplayActive) {
    updateUfo(delta, elapsed);
    updateBeam(delta, elapsed);
    updatePowerups(delta, elapsed, true);
    updateHazards(delta, elapsed, true);
    updateWaveTimer(elapsed);
    tutorialManager.event("tick");
  } else {
    beam.visible = false;
    beamActive = false;
    boostActive = false;
    updateBeamSound(false);
    updatePowerups(delta, elapsed, false);
    updateHazards(delta, elapsed, false);
    if (gameWon) updateTakeoff(delta, elapsed);
    ufoState.velocity.multiplyScalar(Math.pow(gameWon ? 0.02 : 0.12, delta));
    ufo.rim.rotation.z += delta * 1.4;
  }

  updateCollectibles(delta, elapsed);
  updateCowHint(elapsed);
  updateLandscape(elapsed);
  updateCamera(delta);
  updateAudio();
  updateHud(false, elapsed);
  drawMinimap(elapsed);

  composer.render();
}

function updateUfo(delta, elapsed) {
  const leftInput = keys.has("ArrowLeft") || keys.has("KeyA");
  const rightInput = keys.has("ArrowRight") || keys.has("KeyD");
  const turnInput = (leftInput ? 1 : 0) - (rightInput ? 1 : 0);
  const forwardInput = keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0;
  const brakeInput = keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0;
  const moving = forwardInput > 0 || brakeInput > 0;
  const boosting =
    forwardInput > 0 &&
    (keys.has("ShiftLeft") || keys.has("ShiftRight")) &&
    beamEnergy > 14;
  boostActive = boosting;

  if (moving || turnInput !== 0) {
    tutorialManager.event("movementInput", { delta });
  }
  if (boosting) {
    tutorialManager.event("boostUsed");
  }

  if (turnInput !== 0) {
    const turnRate = boosting ? 1.25 : 1.65;
    ufoState.yaw += turnInput * turnRate * delta;
    ufoState.heading.set(Math.sin(ufoState.yaw), 0, Math.cos(ufoState.yaw)).normalize();
  }

  if (boosting) {
    beamEnergy = Math.max(0, beamEnergy - 13 * delta);
  }

  if (forwardInput > 0) {
    const acceleration = boosting ? 73 : 43;
    ufoState.velocity.addScaledVector(ufoState.heading, acceleration * delta);
  }

  if (brakeInput > 0) {
    ufoState.velocity.multiplyScalar(Math.pow(0.016, delta));
    if (ufoState.velocity.length() < 3.2) {
      ufoState.velocity.addScaledVector(ufoState.heading, -16 * delta);
    }
  }

  const maxSpeed = boosting ? 28 : 17;
  if (ufoState.velocity.length() > maxSpeed) {
    ufoState.velocity.setLength(maxSpeed);
  }

  ufoState.velocity.multiplyScalar(Math.pow(0.06, delta));
  ufo.group.position.addScaledVector(ufoState.velocity, delta);
  ufo.group.position.x = THREE.MathUtils.clamp(ufo.group.position.x, -halfWorld + 6, halfWorld - 6);
  ufo.group.position.z = THREE.MathUtils.clamp(ufo.group.position.z, -halfWorld + 6, halfWorld - 6);
  handleUfoCollisions();

  const ground = terrainHeight(ufo.group.position.x, ufo.group.position.z);
  const desiredY = ground + ufoCruiseHeight + Math.sin(elapsed * 2.3) * 0.44;
  ufo.group.position.y = THREE.MathUtils.lerp(ufo.group.position.y, desiredY, 0.07);

  const speed = ufoState.velocity.length();
  const pitch = THREE.MathUtils.clamp(-speed * 0.009, -0.22, 0.08);
  const bank = THREE.MathUtils.clamp(turnInput * -0.32, -0.34, 0.34);
  ufo.group.rotation.x = THREE.MathUtils.lerp(ufo.group.rotation.x, pitch, 0.08);
  ufo.group.rotation.z = THREE.MathUtils.lerp(ufo.group.rotation.z, bank, 0.1);
  ufo.group.rotation.y = lerpAngle(ufo.group.rotation.y, ufoState.yaw, 0.08);
  ufo.rim.rotation.z += delta * (boosting ? 5.2 : 2.5);
  ufo.trail.scale.set(1, boosting ? 1.75 : 0.9 + ufoState.velocity.length() * 0.02, 1);
  ufo.trail.material.opacity = boosting ? 0.38 : 0.2;
  ufo.engineGlow.intensity = boosting ? 10 : 5.2 + ufoState.velocity.length() * 0.12;
  ufo.boostGlow.material.opacity = THREE.MathUtils.lerp(
    ufo.boostGlow.material.opacity,
    boosting ? 0.18 + Math.sin(elapsed * 16) * 0.035 : 0,
    0.18
  );
  ufo.boostGlow.scale.set(
    1.55 + (boosting ? Math.sin(elapsed * 12) * 0.03 : 0),
    0.18,
    1.55 + (boosting ? Math.cos(elapsed * 11) * 0.03 : 0)
  );
}

function handleUfoCollisions() {
  const colliders = getActiveLevel().colliders || [];
  for (const collider of colliders) {
    const dx = ufo.group.position.x - collider.x;
    const dz = ufo.group.position.z - collider.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.001 || distance >= collider.radius) continue;

    const pushX = dx / distance;
    const pushZ = dz / distance;
    ufo.group.position.x = collider.x + pushX * collider.radius;
    ufo.group.position.z = collider.z + pushZ * collider.radius;

    const inwardSpeed = ufoState.velocity.x * pushX + ufoState.velocity.z * pushZ;
    if (inwardSpeed < 0) {
      ufoState.velocity.x -= pushX * inwardSpeed * 1.25;
      ufoState.velocity.z -= pushZ * inwardSpeed * 1.25;
    }
    ufoState.velocity.multiplyScalar(0.42);
    const elapsed = clock.elapsedTime;
    if (elapsed - lastCollisionFeedback > 1.25) {
      lastCollisionFeedback = elapsed;
      flashMessage(`Collision: ${capitalize(collider.label)}`);
      playNoPowerSound();
    }
  }
}

function updateTakeoff(delta, elapsed) {
  if (elapsed > takeoffUntil) {
    ufo.trail.material.opacity = THREE.MathUtils.lerp(ufo.trail.material.opacity, 0, 0.08);
    ufo.trail.scale.set(1, 0.8, 1);
    return;
  }
  const progress = THREE.MathUtils.clamp(1 - (takeoffUntil - elapsed) / 4.2, 0, 1);
  const liftSpeed = THREE.MathUtils.lerp(18, 64, progress);
  ufo.group.position.y += liftSpeed * delta;
  ufo.group.rotation.x = THREE.MathUtils.lerp(ufo.group.rotation.x, -0.42, 0.08);
  ufo.group.rotation.z = THREE.MathUtils.lerp(ufo.group.rotation.z, 0, 0.08);
  ufo.trail.scale.set(1.2 + progress * 0.6, 0.9, 1.2 + progress * 0.6);
  ufo.trail.material.opacity = THREE.MathUtils.lerp(ufo.trail.material.opacity, 0.18, 0.18);
  ufo.engineGlow.intensity = 14 + progress * 10;
}

function updateBeam(delta, elapsed) {
  const wantsBeam = keys.has("Space") || performance.now() < beamLatchUntil;
  const hasBeamPower = beamEnergy > 2.5;
  beamActive = wantsBeam && hasBeamPower && !waveTransitionActive;
  beam.visible = beamActive;

  if (wantsBeam) {
    tutorialManager.event("beamUsed");
  }

  if (!beamActive) {
    abductingTarget = null;
    if (wantsBeam && !hasBeamPower) {
      showNoPowerFeedback(elapsed);
    }
    if (!keys.has("ShiftLeft") && !keys.has("ShiftRight")) {
      beamEnergy = Math.min(100, beamEnergy + delta * 8.5);
    }
    return;
  }

  beamEnergy = Math.max(0, beamEnergy - delta * (abductingTarget ? 14 : 10));
  if (beamEnergy < 70) tutorialManager.event("energyLow");
  const beamPulse = 0.94 + Math.sin(elapsed * 12) * 0.035;
  beam.scale.setScalar(beamPulse);
  beam.userData.outerMaterial.opacity = 0.28 + Math.sin(elapsed * 8.5) * 0.045;
  beam.userData.coreMaterial.opacity = abductingTarget ? 0.34 : 0.22;
  beam.userData.groundGlowMaterial.opacity = 0.14 + Math.sin(elapsed * 7) * 0.035;
  beam.userData.light.intensity = abductingTarget ? 15 : 10.5;
  const target =
    abductingTarget && !abductingTarget.userData.collected
      ? abductingTarget
      : findBeamTarget();

  abductingTarget = target;
  if (!target) return;

  const targetPos = target.position;
  const ufoPos = ufo.group.position;
  targetPos.x = THREE.MathUtils.lerp(targetPos.x, ufoPos.x, 0.058);
  targetPos.z = THREE.MathUtils.lerp(targetPos.z, ufoPos.z, 0.058);
  targetPos.y += delta * 6.4;
  target.rotation.y += delta * 4.5;
  target.rotation.z = Math.sin(elapsed * 12) * 0.28;

  if (target.position.distanceTo(ufo.group.position) < 2.7) {
    collectTarget(target);
  }
}

function findBeamTarget() {
  if (waveTransitionActive) return null;
  const ufoPos = ufo.group.position;
  let best = null;
  let bestDistance = Infinity;

  for (const item of collectibles) {
    if (item.userData.collected || item.userData.active === false) continue;
    const dx = item.position.x - ufoPos.x;
    const dz = item.position.z - ufoPos.z;
    const horizontalDistance = Math.hypot(dx, dz);
    const underUfo = horizontalDistance < 4.9;
    const withinBeamHeight = item.position.y < ufoPos.y && ufoPos.y - item.position.y < 19;
    if (underUfo && withinBeamHeight && horizontalDistance < bestDistance) {
      best = item;
      bestDistance = horizontalDistance;
    }
  }
  return best;
}

function collectTarget(target) {
  if (gameWon) return;
  const now = clock.elapsedTime;
  combo = now - lastCollectTime < 7 ? Math.min(combo + 1, 6) : 1;
  lastCollectTime = now;

  target.userData.collected = true;
  target.visible = false;
  abductingTarget = null;

  const points = target.userData.points * combo;
  score += points;
  beamEnergy = Math.min(100, beamEnergy + 18);

  if (target.userData.type === "bonus") {
    bonusCollected = true;
    scoreBreakdown.humanBonusScore += points;
    scoreBreakdown.humansCollectedTotal += 1;
  } else if (target.userData.type === "animal") {
    scoreBreakdown.animalScore += points;
    scoreBreakdown.animalsCollectedTotal += 1;
  }
  playCollectSound(target.userData.type === "bonus");
  const level = getActiveLevel();
  flashMessage(
    target.userData.type === "bonus"
      ? `Bonus collected: +${points}`
      : `${capitalize(level.animalSingular)} abducted: +${points}`
  );
  if (target.userData.type === "animal") {
    waveCowsCollected += 1;
    totalCowsCollected += 1;
    if (waveCowsCollected >= waveCowGoal) completeWave(now);
  }
  tutorialManager.event("targetAbducted", { type: target.userData.type });
  updateHud(true, now);
}

function updateCollectibles(delta, elapsed) {
  collectibles.forEach((item, index) => {
    if (item.userData.collected || item.userData.active === false || item === abductingTarget) return;
    updateCollectibleMovement(item, delta, elapsed);
    item.position.y = item.userData.baseY + Math.sin(elapsed * 1.7 + item.userData.wobble) * 0.06;
    if (item.userData.type === "bonus") {
      item.rotation.y += 0.017;
      item.rotation.z = Math.sin(elapsed * 4.2) * 0.18;
    } else {
      item.rotation.y += Math.sin(elapsed * 0.8 + index) * 0.0015;
    }
  });
}

function updateCollectibleMovement(item, delta, elapsed) {
  const type = item.userData.type;
  if (type === "animal" && currentWaveIndex >= 1) {
    maybeScareCow(item, elapsed);
  }

  if (currentWaveIndex >= 2 && (type === "animal" || type === "bonus")) {
    maybeStartIdleWander(item, elapsed);
  }

  if (!item.userData.moveTarget) return;

  const target = item.userData.moveTarget;
  const dx = target.x - item.position.x;
  const dz = target.z - item.position.z;
  const distance = Math.hypot(dx, dz);

  if (distance < 0.25 || elapsed > item.userData.moveUntil) {
    item.position.x = target.x;
    item.position.z = target.z;
    item.userData.baseY = collectibleBaseHeight(type, item.position.x, item.position.z);
    item.userData.moveTarget = null;
    item.userData.moveSpeed = 0;
    item.userData.wanderPauseUntil = elapsed + 2.4 + Math.random() * 4;
    return;
  }

  const step = Math.min(distance, item.userData.moveSpeed * delta);
  const nextX = item.position.x + (dx / distance) * step;
  const nextZ = item.position.z + (dz / distance) * step;
  if (!isSpawnSafe(nextX, nextZ)) {
    item.userData.moveTarget = null;
    item.userData.moveSpeed = 0;
    item.userData.wanderPauseUntil = elapsed + 2.5 + Math.random() * 3;
    return;
  }
  item.position.x = nextX;
  item.position.z = nextZ;
  item.userData.baseY = collectibleBaseHeight(type, item.position.x, item.position.z);
  item.rotation.y = Math.atan2(-dz, dx);
}

function maybeScareCow(cow, elapsed) {
  if (!boostActive || waveTransitionActive || elapsed < cow.userData.scareCooldownUntil) return;
  const distance = horizontalDistance(cow.position, ufo.group.position);
  if (distance > 15 || distance < 0.1) return;

  const awayX = cow.position.x - ufo.group.position.x;
  const awayZ = cow.position.z - ufo.group.position.z;
  const target = findSafeMoveTarget(
    cow.position.x,
    cow.position.z,
    awayX,
    awayZ,
    9 + Math.random() * 5.5
  );
  if (!target) return;

  cow.userData.moveTarget = target;
  cow.userData.moveSpeed = 4.35 + Math.random() * 0.95;
  cow.userData.moveUntil = elapsed + 3.2;
  cow.userData.scareCooldownUntil = elapsed + 7.5;
}

function maybeStartIdleWander(item, elapsed) {
  if (waveTransitionActive || item.userData.moveTarget || elapsed < item.userData.wanderPauseUntil) return;
  const angle = Math.random() * Math.PI * 2;
  const distance = item.userData.type === "animal" ? 3.5 + Math.random() * 5 : 2.5 + Math.random() * 3.5;
  const target = findSafeMoveTarget(
    item.position.x,
    item.position.z,
    Math.cos(angle),
    Math.sin(angle),
    distance
  );
  if (!target) {
    item.userData.wanderPauseUntil = elapsed + 2.5;
    return;
  }

  item.userData.moveTarget = target;
  item.userData.moveSpeed = item.userData.type === "animal" ? 1.65 : 1.15;
  item.userData.moveUntil = elapsed + 4.5;
}

function findSafeMoveTarget(startX, startZ, dirX, dirZ, distance) {
  const length = Math.hypot(dirX, dirZ) || 1;
  const baseAngle = Math.atan2(dirZ / length, dirX / length);
  const angleOffsets = [0, 0.45, -0.45, 0.9, -0.9, Math.PI];

  for (const angleOffset of angleOffsets) {
    const angle = baseAngle + angleOffset;
    for (const factor of [1, 0.72, 0.48]) {
      const targetX = THREE.MathUtils.clamp(
        startX + Math.cos(angle) * distance * factor,
        -halfWorld + 8,
        halfWorld - 8
      );
      const targetZ = THREE.MathUtils.clamp(
        startZ + Math.sin(angle) * distance * factor,
        -halfWorld + 8,
        halfWorld - 8
      );
      if (isSpawnSafe(targetX, targetZ)) return { x: targetX, z: targetZ };
    }
  }

  return null;
}

function updateCowHint(elapsed) {
  const remainingCows = collectibles.filter(
    (item) => item.userData.type === "animal" && item.userData.active !== false && !item.userData.collected
  );
  const lastCow = remainingCows.length === 1 ? remainingCows[0] : null;

  if (!lastCow || lastCow === abductingTarget) {
    cowHint.visible = false;
    return;
  }

  cowHint.visible = true;
  cowHint.position.set(
    lastCow.position.x,
    lastCow.userData.baseY + 3.65 + Math.sin(elapsed * 3.2) * 0.28,
    lastCow.position.z
  );
  cowHint.rotation.y = elapsed * 1.8;
  cowHint.children[1].rotation.z = -elapsed * 2.4;
  cowHint.scale.setScalar(0.9 + Math.sin(elapsed * 5.5) * 0.08);
}

function updatePowerups(delta, elapsed, active = true) {
  for (const powerup of powerups) {
    if (powerup.userData.collected) continue;
    powerup.position.y = powerup.userData.baseY + Math.sin(elapsed * 2.4 + powerup.position.x) * 0.18;
    powerup.rotation.y += delta * 2.1;
    powerup.children[1].rotation.z += delta * 1.9;

    if (active && powerup.position.distanceTo(ufo.group.position) < ufoPickupRadius + energyCorePickupRadius) {
      powerup.userData.collected = true;
      powerup.visible = false;
      score += 50;
      scoreBreakdown.boosterScore += 50;
      scoreBreakdown.boostersCollectedTotal += 1;
      beamEnergy = Math.min(100, beamEnergy + 42);
      alertLevel = Math.max(0, alertLevel - 18);
      playPowerupSound();
      flashMessage("Energy core: +50, beam recharged");
      tutorialManager.event("energyCollected");
      updateHud(true, elapsed);
    }
  }
}

function updateHazards(delta, elapsed, active = true) {
  let detected = false;
  let strongestLock = 0;
  let totalEnergyDrain = 0;

  for (const hazard of hazards) {
    const data = hazard.userData;
    data.angle += delta * data.speed;
    const x = data.center.x + Math.cos(data.angle) * data.radius;
    const z = data.center.z + Math.sin(data.angle) * data.radius;
    hazard.position.set(x, terrainHeight(x, z) + 10.2 + Math.sin(elapsed * 2 + data.radius) * 0.55, z);
    hazard.rotation.y = data.angle + Math.PI;
    if (data.scan) {
      data.scan.scale.setScalar(0.92 + Math.sin(elapsed * 8 + data.radius) * 0.06);
      data.scan.material.opacity = active ? 0.16 : 0.1;
    }
    if (data.rotors) {
      for (const rotor of data.rotors) rotor.rotation.z += delta * 24;
    }

    const distance = hazard.position.distanceTo(ufo.group.position);
    if (active && distance < data.warningRadius) {
      const lockStrength = THREE.MathUtils.clamp(1 - distance / data.warningRadius, 0.12, 1);
      const contactStrength = THREE.MathUtils.smoothstep(lockStrength, 0.42, 0.92);
      strongestLock = Math.max(strongestLock, lockStrength);
      detected = true;
      alertLevel = Math.min(100, alertLevel + delta * (beamActive ? 72 : 54) * lockStrength);
      const energyDrain = delta * (22 + lockStrength * 30 + contactStrength * 22);
      totalEnergyDrain += energyDrain;
      beamEnergy = Math.max(0, beamEnergy - energyDrain);
      ufoState.velocity.multiplyScalar(Math.pow(0.18 + lockStrength * 0.35, delta));
      ufo.group.position.y += Math.sin(elapsed * 46) * (0.02 + contactStrength * 0.03) * lockStrength;
      if (data.scan) {
        data.scan.material.opacity = 0.24 + lockStrength * 0.34 + contactStrength * 0.1;
        data.scan.scale.setScalar(1 + lockStrength * 0.15 + Math.sin(elapsed * 15) * 0.05);
      }
    }
  }

  if (active && !detected) {
    alertLevel = Math.max(0, alertLevel - delta * 11);
    droneDrainStrength = Math.max(0, droneDrainStrength - delta * 3.5);
  }

  if (active && detected) {
    droneDrainUntil = elapsed + 0.25;
    droneDrainStrength = THREE.MathUtils.lerp(droneDrainStrength, strongestLock, 0.45);
    tutorialManager.event("droneDetected");
  }

  if (active && detected && elapsed - lastAlertSound > 0.54) {
    lastAlertSound = elapsed;
    playAlertSound(strongestLock, totalEnergyDrain);
  }

  if (active && detected && elapsed - lastDroneFeedback > 1.35) {
    lastDroneFeedback = elapsed;
    flashMessage(strongestLock > 0.55 ? "Drone contact! Beam energy draining." : "Drone lock! Energy draining.");
  }
}

function updateCamera(delta) {
  const speed = ufoState.velocity.length();
  const followDistance = THREE.MathUtils.lerp(24, 31, Math.min(speed / 28, 1));
  const height = THREE.MathUtils.lerp(13, 17, Math.min(speed / 28, 1));

  tempVector.copy(ufoState.heading).multiplyScalar(-followDistance);
  tempVector.y = height;
  const cameraTarget = tempVector.add(ufo.group.position);
  camera.position.lerp(cameraTarget, 1 - Math.pow(0.018, delta));
  if (gameStarted && !gameWon && alertLevel > 35) {
    const shake = Math.min(alertLevel / 100, 1) * 0.08;
    camera.position.x += Math.sin(clock.elapsedTime * 44) * shake;
    camera.position.y += Math.cos(clock.elapsedTime * 37) * shake * 0.55;
  }

  tempVector2.copy(ufoState.heading).multiplyScalar(12);
  tempVector2.y = -2.5;
  camera.lookAt(tempVector2.add(ufo.group.position));
}

function updateAudio() {
  if (!audio) return;
  const now = audio.ctx.currentTime;
  const speed = ufoState.velocity.length();
  const engineActive = gameStarted && !gameWon;
  const takeoffActive = gameWon && clock.elapsedTime < takeoffUntil;
  const engineLevel = engineActive ? 0.006 + speed * 0.0052 : takeoffActive ? 0.085 : 0;
  const subLevel = engineActive ? 0.002 + speed * 0.0022 : takeoffActive ? 0.035 : 0;
  audio.engineOsc.frequency.setTargetAtTime(48 + speed * 4.2, now, 0.1);
  audio.engineSubOsc.frequency.setTargetAtTime(24 + speed * 1.45, now, 0.12);
  audio.engineGain.gain.setTargetAtTime(engineLevel, now, 0.12);
  audio.engineSubGain.gain.setTargetAtTime(subLevel, now, 0.14);
  updateBeamSound(beamActive);
}

function updateHud(force = false, elapsed = clock.elapsedTime) {
  if (!force && elapsed - lastHudUpdate < 0.12) return;
  lastHudUpdate = elapsed;

  scoreNode.textContent = score.toLocaleString("en-US");
  comboNode.textContent = `Combo x${combo}`;

  targetCountNode.textContent = `Wave ${currentWaveIndex + 1} / ${waveConfigs.length}`;
  const level = getActiveLevel();
  bonusStatusNode.textContent = `${capitalize(level.animalPlural)}: ${waveCowsCollected} / ${waveCowGoal}`;
  waveTimerNode.textContent = `Time ${formatTime(waveTimeRemaining)}`;
  waveTimerNode.classList.toggle("timer-warning", gameStarted && !gameWon && !waveTransitionActive && waveTimeRemaining <= 10);

  if (elapsed < droneDrainUntil) dangerStatusNode.textContent = "Energy draining!";
  else if (alertLevel > 70) dangerStatusNode.textContent = level.alarmText;
  else if (alertLevel > 32) dangerStatusNode.textContent = "Patrol nearby";
  else if (gameStarted && uiState === UI_STATES.PLAYING && elapsed - missionStartTime < 8) dangerStatusNode.textContent = "Mission active";
  else dangerStatusNode.textContent = bonusCollected ? "Bonus found" : level.calmText;

  const energyPercent = Math.round(beamEnergy);
  const draining = elapsed < droneDrainUntil || droneDrainStrength > 0.08;
  energyNode.classList.toggle("draining", draining);
  document.body.classList.toggle("drone-alert", draining);
  energyFillNode.style.transform = `scaleX(${beamEnergy / 100})`;
  energyLabelNode.textContent = draining ? `${energyPercent}% - DRAINING` : `${energyPercent}%`;
  energyNode.style.setProperty("--drone-drain-strength", draining ? droneDrainStrength.toFixed(2) : "0");
  document.body.style.setProperty("--drone-drain-strength", draining ? droneDrainStrength.toFixed(2) : "0");
}

function completeWave(elapsed) {
  if (waveTransitionActive || gameWon) return;
  const completedWave = getCurrentWaveConfig();
  stopCountdownSound();
  score += completedWave.bonus;
  scoreBreakdown.waveBonusScore += completedWave.bonus;
  waveTransitionActive = true;
  setUiState(UI_STATES.MISSION_INTRO);
  beamActive = false;
  abductingTarget = null;
  beam.visible = false;
  updateBeamSound(false);
  updateHud(true, elapsed);
  showWaveMessage(
    `WAVE ${completedWave.number} COMPLETE`,
    `SCORE: ${score.toLocaleString("en-US")}`,
    `WAVE BONUS +${completedWave.bonus.toLocaleString("en-US")}`
  );

  if (currentWaveIndex >= waveConfigs.length - 1) {
    waveTransitionTimers.push(window.setTimeout(() => {
      finishMission(clock.elapsedTime);
    }, 1800));
    return;
  }

  const nextWave = waveConfigs[currentWaveIndex + 1];
  const nextHint = nextWave.number === 3
    ? "Targets wander slowly now. Keep scanning."
    : `Boost scares ${getActiveLevel().animalPlural} now. Keep your beam charged.`;
  waveTransitionTimers.push(window.setTimeout(() => {
    showWaveMessage(
      `WAVE ${nextWave.number} START`,
      `${getActiveLevel().animalPlural.toUpperCase()}: 0 / ${nextWave.cowGoal} - TIME ${formatTime(nextWave.timeLimit)}`,
      nextHint
    );
  }, 1350));
  waveTransitionTimers.push(window.setTimeout(() => {
    prepareWave(currentWaveIndex + 1);
    startWaveTimer(clock.elapsedTime);
    waveTransitionActive = false;
    setUiState(UI_STATES.PLAYING);
    messageNode.classList.add("hidden");
    messageNode.classList.remove("wave-message");
    updateHud(true, clock.elapsedTime);
  }, 2600));
}

function timeoutWave(elapsed) {
  if (waveTransitionActive || gameWon) return;
  const timedOutWave = getCurrentWaveConfig();
  stopCountdownSound();
  waveTimeRemaining = 0;
  waveTransitionActive = true;
  setUiState(UI_STATES.MISSION_INTRO);
  beamActive = false;
  abductingTarget = null;
  beam.visible = false;
  updateBeamSound(false);
  updateHud(true, elapsed);
  showWaveMessage(
    `WAVE ${timedOutWave.number} TIME UP`,
    `SCORE: ${score.toLocaleString("en-US")}`,
    `${waveCowsCollected} / ${waveCowGoal} collected`
  );

  if (currentWaveIndex >= waveConfigs.length - 1) {
    waveTransitionTimers.push(window.setTimeout(() => {
      finishMission(clock.elapsedTime, { completed: false });
    }, 1800));
    return;
  }

  const nextWave = waveConfigs[currentWaveIndex + 1];
  waveTransitionTimers.push(window.setTimeout(() => {
    showWaveMessage(
      `WAVE ${nextWave.number} START`,
      `${getActiveLevel().animalPlural.toUpperCase()}: 0 / ${nextWave.cowGoal} - TIME ${formatTime(nextWave.timeLimit)}`,
      "Time is up, but the hunt continues."
    );
  }, 1350));
  waveTransitionTimers.push(window.setTimeout(() => {
    prepareWave(currentWaveIndex + 1);
    startWaveTimer(clock.elapsedTime);
    waveTransitionActive = false;
    setUiState(UI_STATES.PLAYING);
    messageNode.classList.add("hidden");
    messageNode.classList.remove("wave-message");
    updateHud(true, clock.elapsedTime);
  }, 2600));
}

function showWaveMessage(title, lineOne, lineTwo = "") {
  window.clearTimeout(flashMessage.timeout);
  messageNode.classList.add("wave-message");
  messageNode.classList.remove("mission-intro");
  messageNode.classList.remove("hidden");
  messageNode.innerHTML = `<strong>${title}</strong><span>${lineOne}</span>${lineTwo ? `<small>${lineTwo}</small>` : ""}`;
}

function clearWaveTransitionTimers() {
  waveTransitionTimers.forEach((timer) => window.clearTimeout(timer));
  waveTransitionTimers = [];
  window.clearTimeout(flashMessage.timeout);
  stopCountdownSound();
  messageNode.classList.remove("wave-message", "mission-intro");
}

function finishMission(elapsed, { completed = true } = {}) {
  if (gameWon) return;
  clearWaveTransitionTimers();
  stopCountdownSound();
  updateBeamSound(false);
  tutorialManager.event("missionEnded");
  gameWon = true;
  missionEndTime = elapsed;
  takeoffUntil = completed ? elapsed + 4.2 : elapsed;
  if (completed) {
    const energyBonus = Math.round(beamEnergy) * 4;
    score += energyBonus;
    scoreBreakdown.energyBonusScore += energyBonus;
  }
  scoreNode.textContent = score.toLocaleString("en-US");
  finalTitleNode.textContent = completed ? "Level Complete!" : "Time Up!";
  finalLevelNode.textContent = getActiveLevel().displayName;
  finalTimeNode.textContent = `Time: ${formatTime(missionEndTime - missionStartTime)}`;
  finalScoreNode.textContent = `Score: ${score.toLocaleString("en-US")}`;
  updateFinalBreakdown();
  setUiState(UI_STATES.MISSION_COMPLETE);
  flashMessage(completed ? "Mission complete. All targets collected." : "Time up. Score locked.");
  if (completed) {
    playTakeoffSound();
    playBonusJingle();
  } else {
    playNoPowerSound();
  }
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function updateFinalBreakdown() {
  const totalBonus =
    scoreBreakdown.boosterScore +
    scoreBreakdown.humanBonusScore +
    scoreBreakdown.waveBonusScore +
    scoreBreakdown.energyBonusScore;
  const level = getActiveLevel();
  const totalMissionAnimals = waveConfigs.reduce((sum, wave) => sum + wave.cowGoal, 0);
  breakdownAnimalsNode.textContent =
    `${scoreBreakdown.animalsCollectedTotal} / ${totalMissionAnimals} ${level.animalPlural} ` +
    `(${scoreBreakdown.animalScore.toLocaleString("en-US")} pts)`;
  breakdownBoostersNode.textContent = `${scoreBreakdown.boosterScore.toLocaleString("en-US")} pts`;
  breakdownHumanNode.textContent = `${scoreBreakdown.humanBonusScore.toLocaleString("en-US")} pts`;
  breakdownWavesNode.textContent = `${scoreBreakdown.waveBonusScore.toLocaleString("en-US")} pts`;
  breakdownBonusNode.textContent = `${totalBonus.toLocaleString("en-US")} pts`;
  breakdownStatsNode.textContent =
    `${scoreBreakdown.animalsCollectedTotal} ${level.animalPlural}, ` +
    `${scoreBreakdown.humansCollectedTotal} humans, ` +
    `${scoreBreakdown.boostersCollectedTotal} diamonds, waves 3 / 3`;
}

function drawMinimap(elapsed) {
  const size = minimapCanvas.width;
  const center = size / 2;
  const scale = size / 92;

  minimap.clearRect(0, 0, size, size);
  const gradient = minimap.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 1.1);
  gradient.addColorStop(0, "rgba(18, 39, 67, 0.98)");
  gradient.addColorStop(1, "rgba(5, 13, 28, 0.98)");
  minimap.fillStyle = gradient;
  minimap.fillRect(0, 0, size, size);

  drawMapBoundary(size, scale);
  drawMapWater(size, scale);

  minimap.strokeStyle = "rgba(150, 220, 255, 0.12)";
  minimap.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const p = (size / 4) * i;
    minimap.beginPath();
    minimap.moveTo(p, 0);
    minimap.lineTo(p, size);
    minimap.moveTo(0, p);
    minimap.lineTo(size, p);
    minimap.stroke();
  }

  const remainingCows = collectibles.filter(
    (item) => item.userData.type === "animal" && item.userData.active !== false && !item.userData.collected
  );
  const lastCow = remainingCows.length === 1 ? remainingCows[0] : null;

  drawMapDots(collectibles, (item) => {
    if (item.userData.collected || item.userData.active === false) return null;
    if (item.userData.type === "bonus") {
      const near = horizontalDistance(item.position, ufo.group.position) < 42;
      return near ? "#ff77dd" : "rgba(255, 119, 221, 0.28)";
    }
    if (item === lastCow) return null;
    return "#fff1a5";
  }, size, scale, 2.4);

  if (lastCow) {
    const point = radarPoint(lastCow.position, size, scale);
    if (point) {
      const pulse = 5.4 + Math.sin(elapsed * 5.8) * 1.2;
      minimap.beginPath();
      minimap.arc(point.x, point.y, pulse, 0, Math.PI * 2);
      minimap.fillStyle = "rgba(255, 232, 107, 0.24)";
      minimap.fill();
      minimap.beginPath();
      minimap.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
      minimap.fillStyle = "#ffe86b";
      minimap.fill();
    }
  }

  drawMapDots(powerups, (item) => (item.userData.collected ? null : "#79fff0"), size, scale, 2.8);
  drawMapDots(hazards, () => "#ff4b68", size, scale, 3);

  for (const hazard of hazards) {
    const point = radarPoint(hazard.position, size, scale);
    if (!point) continue;
    const radius = hazard.userData.warningRadius * scale;
    minimap.beginPath();
    minimap.arc(point.x, point.y, radius, 0, Math.PI * 2);
    minimap.fillStyle = "rgba(255, 75, 104, 0.1)";
    minimap.fill();
  }

  const pulse = 6 + Math.sin(elapsed * 5) * 1.4;

  minimap.beginPath();
  minimap.arc(center, center, pulse, 0, Math.PI * 2);
  minimap.strokeStyle = "rgba(126, 255, 237, 0.35)";
  minimap.stroke();

  minimap.save();
  minimap.translate(center, center);
  minimap.rotate(-Math.PI / 2);
  minimap.beginPath();
  minimap.moveTo(5, 0);
  minimap.lineTo(-4, -4);
  minimap.lineTo(-2, 0);
  minimap.lineTo(-4, 4);
  minimap.closePath();
  minimap.fillStyle = "#8ffff1";
  minimap.fill();
  minimap.restore();
}

function updateLandscape(elapsed) {
  windmillRotors.forEach((rotor) => {
    rotor.rotation.z = elapsed * rotor.userData.rotationSpeed;
  });

  waterSurfaces.forEach((water) => {
    water.material.emissiveIntensity = 0.22 + Math.sin(elapsed * 1.4 + water.userData.waveOffset) * 0.04;
  });

  waterRipples.forEach((ripple) => {
    const offset = ripple.userData.rippleOffset || 0;
    const pulse = 1 + Math.sin(elapsed * 1.7 + offset) * 0.035;
    ripple.scale.set(
      ripple.userData.baseScaleX * pulse,
      ripple.userData.baseScaleY * pulse,
      1
    );
    ripple.material.opacity = 0.16 + Math.sin(elapsed * 1.4 + offset) * 0.06;
  });
}

function drawMapDots(items, colorForItem, size, scale, radius) {
  for (const item of items) {
    const color = colorForItem(item);
    if (!color) continue;
    const point = radarPoint(item.position, size, scale);
    if (!point) continue;
    minimap.beginPath();
    minimap.arc(point.x, point.y, radius, 0, Math.PI * 2);
    minimap.fillStyle = color;
    minimap.fill();
  }
}

function drawMapWater(size, scale) {
  minimap.fillStyle = "rgba(35, 144, 190, 0.32)";
  minimap.strokeStyle = "rgba(130, 235, 255, 0.26)";
  minimap.lineWidth = 1;

  for (const body of waterBodies) {
    minimap.beginPath();
    for (let i = 0; i <= 40; i += 1) {
      const angle = (i / 40) * Math.PI * 2;
      const point = radarPoint({
        x: body.x + Math.cos(angle) * body.rx,
        z: body.z + Math.sin(angle) * body.rz
      }, size, scale, false);
      if (i === 0) minimap.moveTo(point.x, point.y);
      else minimap.lineTo(point.x, point.y);
    }
    minimap.closePath();
    minimap.fill();
    minimap.stroke();
  }
}

function drawMapBoundary(size, scale) {
  const corners = [
    { x: -halfWorld, z: -halfWorld },
    { x: halfWorld, z: -halfWorld },
    { x: halfWorld, z: halfWorld },
    { x: -halfWorld, z: halfWorld }
  ].map((corner) => radarPoint(corner, size, scale, false));

  minimap.beginPath();
  minimap.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i += 1) {
    minimap.lineTo(corners[i].x, corners[i].y);
  }
  minimap.closePath();
  minimap.strokeStyle = "rgba(150, 220, 255, 0.22)";
  minimap.lineWidth = 1.2;
  minimap.stroke();
}

function radarPoint(position, size, scale, clip = true) {
  const dx = position.x - ufo.group.position.x;
  const dz = position.z - ufo.group.position.z;
  const rightX = -ufoState.heading.z;
  const rightZ = ufoState.heading.x;
  const screenX = size / 2 + (dx * rightX + dz * rightZ) * scale;
  const screenY = size / 2 - (dx * ufoState.heading.x + dz * ufoState.heading.z) * scale;
  if (clip && (screenX < -10 || screenX > size + 10 || screenY < -10 || screenY > size + 10)) {
    return null;
  }
  return { x: screenX, y: screenY };
}

function initAudio() {
  if (audio) {
    resumeAudioContext(audio.ctx);
    playMusicTrack();
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = getMasterGain();
  master.connect(ctx.destination);

  const effectsGain = ctx.createGain();
  effectsGain.gain.value = getEffectsGain();
  effectsGain.connect(master);

  const fxInput = ctx.createGain();
  fxInput.gain.value = 0.62;
  const delay = ctx.createDelay(0.5);
  delay.delayTime.value = 0.18;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.16;
  const wet = ctx.createGain();
  wet.gain.value = 0.12;
  fxInput.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(master);

  const musicGain = ctx.createGain();
  musicGain.gain.value = getMusicGain();
  musicGain.connect(master);
  musicGain.connect(fxInput);

  const engineOsc = ctx.createOscillator();
  engineOsc.type = "triangle";
  engineOsc.frequency.value = 48;
  const engineSubOsc = ctx.createOscillator();
  engineSubOsc.type = "sine";
  engineSubOsc.frequency.value = 24;
  const engineFilter = ctx.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 520;
  const engineGain = ctx.createGain();
  engineGain.gain.value = 0;
  const engineSubGain = ctx.createGain();
  engineSubGain.gain.value = 0;
  engineOsc.connect(engineFilter).connect(engineGain).connect(effectsGain);
  engineSubOsc.connect(engineSubGain).connect(effectsGain);
  engineOsc.start();
  engineSubOsc.start();

  audio = {
    ctx,
    master,
    effectsGain,
    fxInput,
    musicGain,
    engineOsc,
    engineSubOsc,
    engineGain,
    engineSubGain
  };
  startMusicPlaylist();
  setupBeamSound();
  setupTakeoffSound();
  setupCountdownSound();
  startAtmoLoop();
  resumeAudioContext(ctx);
  playMusicTrack();
}

function resumeAudioContext(ctx) {
  if (!ctx || ctx.state === "running") return;
  ctx.resume().catch(() => {
    // Browsers may block autoplay until the first user gesture.
  });
}

function updateMasterVolume() {
  if (!audio) return;
  audio.master.gain.setTargetAtTime(getMasterGain(), audio.ctx.currentTime, 0.03);
  updateEffectsVolume();
  updateMusicVolume();
  if (!soundMuted && musicEnabled) playMusicTrack();
}

function updateEffectsVolume() {
  if (!audio) return;
  audio.effectsGain.gain.setTargetAtTime(getEffectsGain(), audio.ctx.currentTime, 0.03);
  updateBeamVolume();
  updateTakeoffVolume();
  updateCountdownVolume();
}

function updateMusicVolume() {
  if (!audio) return;
  audio.musicGain.gain.setTargetAtTime(getMusicGain(), audio.ctx.currentTime, 0.05);
  updateMusicTrackVolume();
  updateAtmoVolume();
}

function getMasterGain() {
  return soundMuted ? 0 : maxMasterGain;
}

function getEffectsGain() {
  return effectsVolume * maxEffectsGain;
}

function getMusicGain() {
  return musicEnabled ? musicVolume * maxMusicGain : 0;
}

function updateMusicTrackVolume() {
  if (!musicAudio) return;
  musicAudio.volume = soundMuted || !musicEnabled ? 0 : THREE.MathUtils.clamp(musicVolume * 0.78, 0, 1);
}

function startMusicPlaylist() {
  if (!musicAudio) {
    musicAudio = new Audio(musicUrls[musicTrackIndex]);
    musicAudio.preload = "auto";
    musicAudio.addEventListener("ended", playNextMusicTrack);
    updateMusicTrackVolume();
  }

  playMusicTrack();
}

function playNextMusicTrack() {
  musicTrackIndex = (musicTrackIndex + 1) % musicUrls.length;
  if (!musicAudio) return;
  musicAudio.src = musicUrls[musicTrackIndex];
  musicAudio.load();
  playMusicTrack();
}

function playMusicTrack() {
  if (!musicAudio || soundMuted || !musicEnabled) return;
  updateMusicTrackVolume();
  musicAudio.play().catch(() => {
    // The browser will allow playback after the first user gesture.
  });
}

function startAtmoLoop() {
  if (!atmoAudio) {
    atmoAudio = new Audio(atmoUrl);
    atmoAudio.preload = "auto";
    updateAtmoVolume();
  }

  if (atmoTimer) return;
  atmoTimer = window.setInterval(playAtmoSound, 30000);
}

function updateAtmoVolume() {
  if (!atmoAudio) return;
  atmoAudio.volume = soundMuted || !musicEnabled ? 0 : THREE.MathUtils.clamp(musicVolume * 0.28, 0, 1);
}

function playAtmoSound() {
  if (!atmoAudio || soundMuted || !musicEnabled) return;
  atmoAudio.currentTime = 0;
  atmoAudio.play().catch(() => {
    // The browser will allow playback after the first user gesture.
  });
}

function setupBeamSound() {
  if (!beamAudio) {
    beamAudio = new Audio(beamSoundUrl);
    beamAudio.preload = "auto";
    beamAudio.loop = true;
  }
  if (!beamPreviewAudio) {
    beamPreviewAudio = new Audio(beamSoundUrl);
    beamPreviewAudio.preload = "auto";
  }
  updateBeamVolume();
}

function updateBeamVolume() {
  const volume = soundMuted ? 0 : THREE.MathUtils.clamp(effectsVolume * 0.95, 0, 1);
  if (beamAudio) beamAudio.volume = volume;
  if (beamPreviewAudio) beamPreviewAudio.volume = volume;
}

function updateBeamSound(active) {
  if (!beamAudio) return;
  updateBeamVolume();

  if (active) {
    if (beamAudio.paused) {
      beamAudio.currentTime = 0;
      beamAudio.play().catch(() => {
        // The browser will allow playback after the first user gesture.
      });
    }
    return;
  }

  if (!beamAudio.paused) {
    beamAudio.pause();
    beamAudio.currentTime = 0;
  }
}

function stopBeamSound() {
  if (!beamAudio) return;
  beamAudio.pause();
  beamAudio.currentTime = 0;
}

function setupTakeoffSound() {
  if (takeoffAudio) return;
  takeoffAudio = new Audio(takeoffSoundUrl);
  takeoffAudio.preload = "auto";
  updateTakeoffVolume();
}

function updateTakeoffVolume() {
  if (!takeoffAudio) return;
  takeoffAudio.volume = soundMuted ? 0 : THREE.MathUtils.clamp(effectsVolume * 0.95, 0, 1);
}

function playTakeoffSound() {
  if (!takeoffAudio || soundMuted) return;
  updateTakeoffVolume();
  takeoffAudio.currentTime = 0;
  takeoffAudio.play().catch(() => {
    // The browser will allow playback after the first user gesture.
  });
}

function stopTakeoffSound() {
  if (!takeoffAudio) return;
  takeoffAudio.pause();
  takeoffAudio.currentTime = 0;
}

function setupCountdownSound() {
  if (countdownAudio) return;
  countdownAudio = new Audio(countdownSoundUrl);
  countdownAudio.preload = "auto";
  updateCountdownVolume();
}

function updateCountdownVolume() {
  if (!countdownAudio) return;
  countdownAudio.volume = soundMuted ? 0 : THREE.MathUtils.clamp(effectsVolume * 1.15, 0, 1);
}

function playCountdownSound() {
  initAudio();
  setupCountdownSound();
  if (!countdownAudio || soundMuted) return;
  updateCountdownVolume();
  countdownAudio.pause();
  countdownAudio.currentTime = 0;
  countdownAudio.play().catch(() => {
    // Browsers may allow this only after the first user gesture.
  });
}

function stopCountdownSound() {
  if (!countdownAudio) return;
  countdownAudio.pause();
  countdownAudio.currentTime = 0;
}

function playCollectSound(isBonus) {
  if (isBonus) {
    playTone(520, 0.1, "sine", 0.035);
    playTone(780, 0.16, "triangle", 0.032, 0.07);
    playTone(1260, 0.22, "sine", 0.026, 0.17);
    return;
  }
  playCowCollectSound();
}

function playCowCollectSound() {
  playSweep(260, 860, 0.24, "triangle", 0.11);
  playTone(880, 0.12, "sine", 0.075, 0.08);
  playTone(1320, 0.16, "triangle", 0.065, 0.16);
  playTone(1760, 0.12, "sine", 0.045, 0.24);
  playSweep(175, 112, 0.22, "sawtooth", 0.07, 0.03);
  playNoiseBurst(0.18, 0.052, 0.1);
}

function playPowerupSound() {
  playSweep(340, 980, 0.34, "sine", 0.065);
  playTone(1320, 0.18, "triangle", 0.045, 0.12);
  playTone(1780, 0.12, "sine", 0.032, 0.22);
  playNoiseBurst(0.12, 0.026, 0.05);
}

function playAlertSound(strength = 0.5, drainAmount = 0) {
  const amount = THREE.MathUtils.clamp(strength, 0.25, 1);
  const drainBoost = THREE.MathUtils.clamp(drainAmount * 2.8, 0, 0.5);
  const volume = (amount + drainBoost) * 1.28;
  playTone(88, 0.17, "square", 0.095 * volume);
  playTone(132, 0.17, "square", 0.074 * volume, 0.16);
  playSweep(1280, 210, 0.32, "sawtooth", 0.082 * volume, 0.01);
  playSweep(430, 960, 0.22, "triangle", 0.052 * volume, 0.08);
  playNoiseBurst(0.2, 0.068 * volume, 0.03);
  if (amount > 0.58) {
    playTone(56, 0.24, "sawtooth", 0.088 * volume, 0.07);
    playTone(44, 0.18, "square", 0.07 * volume, 0.22);
    playNoiseBurst(0.16, 0.06 * volume, 0.19);
  }
}

function showNoPowerFeedback(elapsed) {
  if (elapsed - lastNoPowerFeedback < 1.05) return;
  lastNoPowerFeedback = elapsed;
  flashMessage("No Power");
  playNoPowerSound();
}

function playNoPowerSound() {
  playTone(76, 0.16, "square", 0.06);
  playTone(76, 0.12, "square", 0.052, 0.2);
  playSweep(260, 58, 0.48, "sawtooth", 0.052, 0.04);
  playNoiseBurst(0.28, 0.04, 0.02);
}

function playBeamPreviewSound() {
  initAudio();
  setupBeamSound();
  if (!beamPreviewAudio || soundMuted) return;
  updateBeamVolume();
  beamPreviewAudio.pause();
  beamPreviewAudio.currentTime = 0;
  beamPreviewAudio.play().catch(() => {
    // The slider input is a user gesture in normal browsers; ignore blocked autoplay fallbacks.
  });
}

function playBonusJingle() {
  [520, 660, 880, 1180].forEach((frequency, index) => {
    playTone(frequency, 0.16, "triangle", 0.03, index * 0.1);
  });
}

function playTone(frequency, duration, type = "sine", volume = 0.06, delay = 0) {
  if (!audio || soundMuted) return;
  const ctx = audio.ctx;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.effectsGain);
  gain.connect(audio.fxInput);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function playSweep(fromFrequency, toFrequency, duration, type = "sine", volume = 0.025, delay = 0) {
  if (!audio || soundMuted) return;
  const ctx = audio.ctx;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(fromFrequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(toFrequency, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.effectsGain);
  gain.connect(audio.fxInput);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function playNoiseBurst(duration = 0.12, volume = 0.02, delay = 0) {
  if (!audio || soundMuted) return;
  const ctx = audio.ctx;
  const start = ctx.currentTime + delay;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1250, start);
  filter.Q.value = 3.8;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(gain).connect(audio.effectsGain);
  source.start(start);
}

function flashMessage(text, detail = "") {
  messageNode.classList.remove("wave-message", "mission-intro");
  messageNode.classList.remove("hidden");
  messageNode.innerHTML = `<strong>${text}</strong>${detail ? `<span>${detail}</span>` : ""}`;
  window.clearTimeout(flashMessage.timeout);
  flashMessage.timeout = window.setTimeout(() => {
    if (firstMove) messageNode.classList.add("hidden");
  }, 1900);
}

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function lerpAngle(current, target, amount) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * amount;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  gtaoPass.setSize(Math.floor(window.innerWidth * 0.62), Math.floor(window.innerHeight * 0.62));
  bloomPass.setSize(window.innerWidth, window.innerHeight);
}
