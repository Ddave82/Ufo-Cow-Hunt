import * as THREE from "three";
import "./styles.css";

const atmoUrl = new URL("../sounds/atmo.mp3", import.meta.url).href;
const musicUrls = [
  new URL("../sounds/music_1.mp3", import.meta.url).href,
  new URL("../sounds/music_2.mp3", import.meta.url).href
];
const beamSoundUrl = new URL("../sounds/beam.mp3", import.meta.url).href;
const takeoffSoundUrl = new URL("../sounds/takeoff.mp3", import.meta.url).href;

const canvas = document.querySelector("#game");
const minimapCanvas = document.querySelector("#minimap");
const minimap = minimapCanvas.getContext("2d");
const scoreNode = document.querySelector("#score");
const comboNode = document.querySelector("#combo");
const targetCountNode = document.querySelector("#target-count");
const bonusStatusNode = document.querySelector("#bonus-status");
const dangerStatusNode = document.querySelector("#danger-status");
const energyNode = document.querySelector("#energy");
const energyFillNode = document.querySelector("#energy-fill");
const energyLabelNode = document.querySelector("#energy-label");
const messageNode = document.querySelector("#message");
const endScreenNode = document.querySelector("#end-screen");
const finalLevelNode = document.querySelector("#final-level");
const finalTimeNode = document.querySelector("#final-time");
const finalScoreNode = document.querySelector("#final-score");
const breakdownAnimalsNode = document.querySelector("#breakdown-animals");
const breakdownBoostersNode = document.querySelector("#breakdown-boosters");
const breakdownHumanNode = document.querySelector("#breakdown-human");
const breakdownWavesNode = document.querySelector("#breakdown-waves");
const breakdownBonusNode = document.querySelector("#breakdown-bonus");
const breakdownStatsNode = document.querySelector("#breakdown-stats");
const levelScreenNode = document.querySelector("#level-screen");
const confirmLevelButtonNode = document.querySelector("#confirm-level-button");
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const camera = new THREE.PerspectiveCamera(
  58,
  window.innerWidth / window.innerHeight,
  0.1,
  430
);
camera.position.set(0, 18, 34);

const clock = new THREE.Clock();
const tempObject = new THREE.Object3D();
const tempVector = new THREE.Vector3();
const tempVector2 = new THREE.Vector3();

const worldSize = 170;
const halfWorld = worldSize / 2;
const terrainSegments = 112;
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
const farmWaterBodies = [
  { x: -39, z: -35, rx: 22, rz: 10.5 },
  { x: 42, z: -57, rx: 12.5, rz: 7.2 }
];
const desertWaterBodies = [];
const farmSpawnBlockers = [
  { x: 48, z: 48, rx: 14, rz: 12 }
];
const desertSpawnBlockers = [
  ...desertTentSites.map((site) => ({ x: site.x, z: site.z, rx: 7.5 * site.scale, rz: 5.5 * site.scale })),
  { x: desertPyramid.x, z: desertPyramid.z, rx: desertPyramid.radius, rz: desertPyramid.radius },
  ...desertOases.map((oasis) => ({ x: oasis.x, z: oasis.z, rx: oasis.rx + 4, rz: oasis.rz + 4 }))
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
let waterBodies = farmWaterBodies;
let spawnBlockers = farmSpawnBlockers;
let cowSpawnZones = farmAnimalSpawnZones;
let bonusSpawnZones = farmBonusSpawnZones;
const keys = new Set();
const collectibles = [];
const powerups = [];
const hazards = [];
const waterSurfaces = [];
const waterRipples = [];
const waveConfigs = [
  { number: 1, cowGoal: 10, bonus: 500 },
  { number: 2, cowGoal: 15, bonus: 750 },
  { number: 3, cowGoal: 20, bonus: 1000 }
];
const maxWaveCows = Math.max(...waveConfigs.map((wave) => wave.cowGoal));
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
    waveTip: "Clear 10, then 15, then 20 cows.",
    waveStartHint: "Collect every cow to advance.",
    calmText: "Rare bonus hidden",
    alarmText: "Farm alarm!",
    animalSpots: farmAnimalSpawnZones,
    bonusSpots: farmBonusSpawnZones,
    water: farmWaterBodies,
    blockers: farmSpawnBlockers,
    colliders: [],
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
      [-50, 35, 16, 1.05]
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
    waveTip: "Clear 10, then 15, then 20 camels.",
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
      [58, 14, 16, 1.05]
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
let totalCowsCollected = 0;
let selectedLevelId = "farm";
let activeLevelId = "farm";
let waveTransitionActive = false;
let waveTransitionTimers = [];
let soundMuted = false;
let effectsVolume = 1;
let musicVolume = 0.9;
let musicEnabled = true;
let audio = null;
let atmoAudio = null;
let atmoTimer = null;
let musicAudio = null;
let musicTrackIndex = 0;
let beamAudio = null;
let beamPreviewAudio = null;
let takeoffAudio = null;
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

applyLevel("farm");
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
confirmLevelButtonNode.addEventListener("click", confirmSelectedLevel);
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
musicEnabledNode.addEventListener("change", () => {
  musicEnabled = musicEnabledNode.checked;
  updateMusicVolume();
  if (musicEnabled) playMusicTrack();
  else if (musicAudio) musicAudio.pause();
});
setVolume(effectsVolume * 100);
setMusicVolume(musicVolume * 100);

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
    toggleSettings();
    return;
  }

  if (!gameStarted) {
    if ((key === "Space" || key === "Enter") && !event.repeat) {
      event.preventDefault();
      if (!startScreenNode.classList.contains("hidden")) startGame();
    }
    return;
  }

  initAudio();
  keys.add(key);

  if (key === "Space") {
    beamLatchUntil = performance.now() + 2300;
  }

  if (!firstMove) {
    firstMove = true;
    missionStartTime = clock.elapsedTime;
    messageNode.classList.add("hidden");
  }
}

function openSettings() {
  settingsPanelNode.classList.remove("hidden");
}

function closeSettings() {
  settingsPanelNode.classList.add("hidden");
}

function toggleSettings() {
  if (settingsPanelNode.classList.contains("hidden")) openSettings();
  else closeSettings();
}

function startGame() {
  if (gameStarted || gameWon) return;
  resetRunState();
  gameStarted = true;
  firstMove = true;
  missionStartTime = clock.elapsedTime;
  startScreenNode.classList.add("hidden");
  settingsPanelNode.classList.add("hidden");
  messageNode.classList.add("hidden");
  initAudio();
  clock.getDelta();
  const level = getActiveLevel();
  showWaveMessage(
    "WAVE 1 START",
    `${level.animalPlural.toUpperCase()}: 0 / ${waveConfigs[0].cowGoal}`,
    level.waveStartHint
  );
  waveTransitionTimers.push(window.setTimeout(() => {
    messageNode.classList.add("hidden");
    messageNode.classList.remove("wave-message");
  }, 1700));
}

function returnToMainMenu() {
  resetRunState();
  gameStarted = false;
  firstMove = false;
  levelScreenNode.classList.remove("hidden");
  startScreenNode.classList.add("hidden");
  settingsPanelNode.classList.add("hidden");
  endScreenNode.classList.add("hidden");
  messageNode.classList.add("hidden");
  updateHud(true, clock.elapsedTime);
  clock.getDelta();
}

function selectLevel(levelId) {
  if (!levelConfigs[levelId]) return;
  selectedLevelId = levelId;
  levelCardNodes.forEach((card) => {
    const selected = card.dataset.level === selectedLevelId;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  applyLevel(levelId);
}

function confirmSelectedLevel() {
  applyLevel(selectedLevelId);
  levelScreenNode.classList.add("hidden");
  startScreenNode.classList.remove("hidden");
  endScreenNode.classList.add("hidden");
  settingsPanelNode.classList.add("hidden");
  updateStartScreenText();
}

function playAgain() {
  applyLevel(selectedLevelId);
  levelScreenNode.classList.add("hidden");
  startScreenNode.classList.add("hidden");
  endScreenNode.classList.add("hidden");
  startGame();
}

function resetRunState() {
  clearWaveTransitionTimers();
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
  totalCowsCollected = 0;
  waveTransitionActive = false;
  keys.clear();
  stopBeamSound();
  stopTakeoffSound();

  ufoState.velocity.set(0, 0, 0);
  ufoState.yaw = Math.PI;
  ufoState.heading.set(0, 0, -1);
  ufo.group.position.set(0, 12, 18);
  ufo.group.rotation.set(0, Math.PI, 0);
  ufo.rim.rotation.z = 0;
  ufo.trail.scale.set(1, 0.9, 1);
  ufo.trail.material.opacity = 0.2;
  ufo.engineGlow.intensity = 5.2;
  beam.visible = false;

  prepareWave(0);

  powerups.forEach((item) => {
    item.userData.collected = false;
    item.visible = true;
    item.position.y = item.userData.baseY;
  });
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
  scene.background = new THREE.Color(level.id === "desert" ? 0x120b14 : 0x030713);
  scene.fog = new THREE.FogExp2(level.id === "desert" ? 0x2a1723 : 0x061226, level.id === "desert" ? 0.010 : 0.012);
  renderer.toneMappingExposure = level.id === "desert" ? 1.28 : 1.18;
  rebuildLevel();
  updateStartScreenText();
  updateHud(true, clock.elapsedTime);
}

function rebuildLevel() {
  clearLevelObjects();
  collectibles.length = 0;
  powerups.length = 0;
  hazards.length = 0;
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
      const sandLight = THREE.MathUtils.clamp(0.5 + height * 0.007 + dune * 0.13 + detail * 0.68, 0.38, 0.74);
      color.setHSL(0.125 + Math.sin(x * 0.025) * 0.01, 0.84, sandLight);
      if (path > 0.2) color.setHSL(0.11, 0.72, 0.44 + path * 0.06 + detail * 0.18);
      if (ridge > 0.42) color.setHSL(0.1, 0.68, 0.46 + ridge * 0.085 + detail * 0.18);
      if (height > 5.4) color.setHSL(0.095, 0.6, 0.5 + height * 0.006);
    } else {
      const meadow =
        0.19 +
        height * 0.01 +
        dryLand * 0.025 +
        detail;

      color.setHSL(0.25 + Math.sin(x * 0.04) * 0.02, 0.52, meadow);
      if (pasture > 0.25) color.setHSL(0.29, 0.5, 0.21 + pasture * 0.055 + detail * 0.35);
      if (path > 0.24) color.setHSL(0.1, 0.34, 0.2 + path * 0.055 + detail * 0.2);
      if (shore > 0.08) color.setHSL(0.13, 0.28, 0.17 + shore * 0.075);
      if (ridge > 0.42) color.setHSL(0.16, 0.34, 0.19 + ridge * 0.09 + detail * 0.2);
      if (height > 5.4) color.setHSL(0.12, 0.3, 0.32 + height * 0.006);
      if (water) color.setHSL(0.53, 0.54, 0.14 + Math.max(0, shore) * 0.02);
    }
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.02,
    emissive: activeLevelId === "desert" ? 0x6a4514 : 0x000000,
    emissiveIntensity: activeLevelId === "desert" ? 0.24 : 0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function terrainHeight(x, z) {
  if (activeLevelId === "desert") return desertTerrainHeight(x, z);
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

function ridgeAmount(x, z) {
  if (activeLevelId === "desert") return desertRidgeAmount(x, z);
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
  const moonLight = new THREE.DirectionalLight(0x9fcaff, 2.55);
  moonLight.position.set(-42, 72, -48);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 180;
  moonLight.shadow.camera.left = -98;
  moonLight.shadow.camera.right = 98;
  moonLight.shadow.camera.top = 98;
  moonLight.shadow.camera.bottom = -98;
  scene.add(moonLight);

  scene.add(new THREE.HemisphereLight(0x567fb6, 0x102414, 1.8));
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
  const warmFill = new THREE.HemisphereLight(0xffc886, 0x3b1c12, 1.45);
  const lowSun = new THREE.DirectionalLight(0xffb56f, 1.25);
  lowSun.position.set(54, 42, 26);
  lowSun.castShadow = true;
  lowSun.shadow.mapSize.set(1024, 1024);
  addLevelObject(warmFill, lowSun);
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
  const sandStone = new THREE.MeshStandardMaterial({
    color: 0xd9a65a,
    emissive: 0x3f250c,
    emissiveIntensity: 0.16,
    roughness: 0.92
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

  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.15, 2.2, 4), darkStone);
  cap.rotation.y = Math.PI / 4;
  cap.position.y = 21.4;
  cap.castShadow = true;

  group.add(foundation, pyramid, entrance, cap);
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
  addPastureFences();
  addBarn(48, 48, -0.34);
  addFarmLanterns();
  addHayBales();
  addPathStones();
  addGrassClumps();
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
      color: 0x9eb1bd,
      roughness: 0.26,
      metalness: 0.7
    })
  );
  saucer.scale.set(1.65, 0.24, 1.65);
  saucer.castShadow = true;
  saucer.receiveShadow = true;

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(3.55, 0.26, 10, 52),
    new THREE.MeshStandardMaterial({ color: 0x697884, roughness: 0.3, metalness: 0.78 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new THREE.MeshStandardMaterial({
      color: 0x8df6ff,
      emissive: 0x1aa8c8,
      emissiveIntensity: 0.4,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.76
    })
  );
  dome.position.y = 0.36;
  dome.castShadow = true;

  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff8a9,
    emissive: 0xffea7a,
    emissiveIntensity: 1.7
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

  const engineGlow = new THREE.PointLight(0x8ffff1, 6, 24);
  engineGlow.position.y = -0.35;

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

  group.add(saucer, rim, rivets, panelRing, alien, dome, engineGlow, trail);
  return { group, rim, trail, engineGlow };
}

function createBeam() {
  const group = new THREE.Group();
  group.visible = false;

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 12.4, 42, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff7a2,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  cone.position.y = -6.2;
  cone.rotation.x = Math.PI;

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 1.9, 11.1, 34, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xdffff3,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  core.position.y = -5.55;

  const light = new THREE.SpotLight(0xfff3a4, 8, 27, 0.43, 0.65, 0.8);
  light.position.y = -0.6;
  light.target.position.y = -10;
  group.add(light.target, light, cone, core);
  return group;
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
}

function getCurrentWaveConfig() {
  return waveConfigs[currentWaveIndex];
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
  if (type === "animal") return maxTerrainHeightAround(x, z, activeLevelId === "desert" ? 1.7 : 1.45) + 0.12;
  if (type === "bonus") return maxTerrainHeightAround(x, z, 0.8) + 0.08;
  return terrainHeight(x, z);
}

function createAnimal(index) {
  return activeLevelId === "desert" ? createCamel(index) : createCow(index);
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
  return activeLevelId === "desert" ? createDesertHuman() : createBonusHuman();
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

function spawnPowerups() {
  getActiveLevel().powerupSpots.forEach(([x, z], index) => {
    const safeSpot = findDrySpot(x, z, index + 120);
    const powerup = createEnergyCore();
    powerup.position.set(safeSpot.x, terrainHeight(safeSpot.x, safeSpot.z) + 1.15, safeSpot.z);
    powerup.userData = { collected: false, baseY: powerup.position.y };
    powerups.push(powerup);
    addLevelObject(powerup);
  });
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
  getActiveLevel().hazardSpots.forEach(([x, z, radius, speed], index) => {
    const hazard = createPatrolDrone(index);
    hazard.userData = {
      ...hazard.userData,
      center: new THREE.Vector3(x, 0, z),
      radius,
      speed,
      angle: index * 2.1,
      warningRadius: 15.5
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

  if (gameStarted && !gameWon) {
    updateUfo(delta, elapsed);
    updateBeam(delta, elapsed);
    updatePowerups(delta, elapsed, true);
    updateHazards(delta, elapsed, true);
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

  renderer.render(scene, camera);
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
  const desiredY = ground + 10.6 + Math.sin(elapsed * 2.3) * 0.44;
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
  beam.scale.setScalar(0.94 + Math.sin(elapsed * 12) * 0.035);
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

    if (active && horizontalDistance(powerup.position, ufo.group.position) < 3.2) {
      powerup.userData.collected = true;
      powerup.visible = false;
      score += 50;
      scoreBreakdown.boosterScore += 50;
      scoreBreakdown.boostersCollectedTotal += 1;
      beamEnergy = Math.min(100, beamEnergy + 42);
      alertLevel = Math.max(0, alertLevel - 18);
      playPowerupSound();
      flashMessage("Energy core: +50, beam recharged");
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

  if (elapsed < droneDrainUntil) dangerStatusNode.textContent = "Energy draining!";
  else if (alertLevel > 70) dangerStatusNode.textContent = level.alarmText;
  else if (alertLevel > 32) dangerStatusNode.textContent = "Patrol nearby";
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
  score += completedWave.bonus;
  scoreBreakdown.waveBonusScore += completedWave.bonus;
  waveTransitionActive = true;
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
      `${getActiveLevel().animalPlural.toUpperCase()}: 0 / ${nextWave.cowGoal}`,
      nextHint
    );
  }, 1350));
  waveTransitionTimers.push(window.setTimeout(() => {
    prepareWave(currentWaveIndex + 1);
    waveTransitionActive = false;
    messageNode.classList.add("hidden");
    messageNode.classList.remove("wave-message");
    updateHud(true, clock.elapsedTime);
  }, 2600));
}

function showWaveMessage(title, lineOne, lineTwo = "") {
  window.clearTimeout(flashMessage.timeout);
  messageNode.classList.add("wave-message");
  messageNode.classList.remove("hidden");
  messageNode.innerHTML = `<strong>${title}</strong><span>${lineOne}</span>${lineTwo ? `<small>${lineTwo}</small>` : ""}`;
}

function clearWaveTransitionTimers() {
  waveTransitionTimers.forEach((timer) => window.clearTimeout(timer));
  waveTransitionTimers = [];
  window.clearTimeout(flashMessage.timeout);
  messageNode.classList.remove("wave-message");
}

function finishMission(elapsed) {
  if (gameWon) return;
  clearWaveTransitionTimers();
  gameWon = true;
  missionEndTime = elapsed;
  takeoffUntil = elapsed + 4.2;
  const energyBonus = Math.round(beamEnergy) * 4;
  score += energyBonus;
  scoreBreakdown.energyBonusScore += energyBonus;
  scoreNode.textContent = score.toLocaleString("en-US");
  finalLevelNode.textContent = getActiveLevel().displayName;
  finalTimeNode.textContent = `Time: ${formatTime(missionEndTime - missionStartTime)}`;
  finalScoreNode.textContent = `Score: ${score.toLocaleString("en-US")}`;
  updateFinalBreakdown();
  endScreenNode.classList.remove("hidden");
  flashMessage("Mission complete. All targets collected.");
  playTakeoffSound();
  playBonusJingle();
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
  breakdownAnimalsNode.textContent = `${scoreBreakdown.animalScore.toLocaleString("en-US")} pts`;
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
  playSweep(340, 980, 0.34, "sine", 0.028);
  playTone(1320, 0.18, "triangle", 0.018, 0.16);
}

function playAlertSound(strength = 0.5, drainAmount = 0) {
  const amount = THREE.MathUtils.clamp(strength, 0.25, 1);
  const drainBoost = THREE.MathUtils.clamp(drainAmount * 2.2, 0, 0.35);
  const volume = amount + drainBoost;
  playTone(88, 0.15, "square", 0.075 * volume);
  playTone(132, 0.15, "square", 0.052 * volume, 0.16);
  playSweep(1180, 240, 0.28, "sawtooth", 0.062 * volume, 0.01);
  playSweep(430, 920, 0.2, "triangle", 0.036 * volume, 0.08);
  playNoiseBurst(0.18, 0.052 * volume, 0.03);
  if (amount > 0.58) {
    playTone(56, 0.2, "sawtooth", 0.058 * volume, 0.07);
    playNoiseBurst(0.12, 0.04 * volume, 0.19);
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

function flashMessage(text) {
  messageNode.classList.remove("wave-message");
  messageNode.classList.remove("hidden");
  messageNode.innerHTML = `<strong>${text}</strong><span>W/Up to thrust, A/D or arrows to turn, S/Down to brake, Space to beam.</span>`;
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
  renderer.setSize(window.innerWidth, window.innerHeight);
}
