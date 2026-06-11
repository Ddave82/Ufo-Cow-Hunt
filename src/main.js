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
const energyFillNode = document.querySelector("#energy-fill");
const energyLabelNode = document.querySelector("#energy-label");
const messageNode = document.querySelector("#message");
const endScreenNode = document.querySelector("#end-screen");
const finalTimeNode = document.querySelector("#final-time");
const finalScoreNode = document.querySelector("#final-score");
const startScreenNode = document.querySelector("#start-screen");
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
const restartButtonNode = document.querySelector("#restart-button");

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
const waterBodies = [
  { x: -39, z: -35, rx: 22, rz: 10.5 },
  { x: 42, z: -57, rx: 12.5, rz: 7.2 }
];
const keys = new Set();
const collectibles = [];
const powerups = [];
const hazards = [];
const waterSurfaces = [];
const waterRipples = [];

let score = 0;
let combo = 1;
let lastCollectTime = -Infinity;
let firstMove = false;
let beamActive = false;
let beamLatchUntil = 0;
let abductingTarget = null;
let bonusCollected = false;
let beamEnergy = 100;
let alertLevel = 0;
let gameWon = false;
let gameStarted = false;
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

const terrain = createTerrain();
scene.add(terrain);

addNightSky();
addLights();
addLandscapeDetails();

const ufo = createUfo();
scene.add(ufo.group);

const beam = createBeam();
ufo.group.add(beam);

spawnCollectibles();
spawnPowerups();
spawnHazards();
updateHud(true);

window.addEventListener("resize", onResize);
window.addEventListener("pointerdown", initAudio, { once: true });
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", (event) => {
  keys.delete(normalizeKey(event));
});
startButtonNode.addEventListener("click", startGame);
restartButtonNode.addEventListener("click", () => window.location.reload());
settingsToggleNode.addEventListener("click", () => {
  openSettings();
});
settingsCloseNode.addEventListener("click", () => {
  closeSettings();
});
mainMenuButtonNode.addEventListener("click", returnToMainMenu);
startVolumeNode.addEventListener("input", () => setVolume(startVolumeNode.value, true));
settingsVolumeNode.addEventListener("input", () => setVolume(settingsVolumeNode.value, true));
startMusicVolumeNode.addEventListener("input", () => setMusicVolume(startMusicVolumeNode.value));
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
    flashMessage(soundMuted ? "Sound aus" : "Sound an");
  }

  if (key === "Escape" && !event.repeat) {
    toggleSettings();
    return;
  }

  if (!gameStarted) {
    if ((key === "Space" || key === "Enter") && !event.repeat) {
      event.preventDefault();
      startGame();
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
  gameStarted = true;
  firstMove = true;
  missionStartTime = clock.elapsedTime;
  startScreenNode.classList.add("hidden");
  settingsPanelNode.classList.add("hidden");
  messageNode.classList.add("hidden");
  initAudio();
  clock.getDelta();
  flashMessage("Mission gestartet");
}

function returnToMainMenu() {
  gameStarted = false;
  gameWon = false;
  firstMove = false;
  beamActive = false;
  beamLatchUntil = 0;
  abductingTarget = null;
  bonusCollected = false;
  score = 0;
  combo = 1;
  lastCollectTime = -Infinity;
  beamEnergy = 100;
  alertLevel = 0;
  missionStartTime = 0;
  missionEndTime = 0;
  takeoffUntil = 0;
  lastHudUpdate = 0;
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

  collectibles.forEach((item) => {
    item.userData.collected = false;
    item.visible = true;
    item.position.y = item.userData.baseY;
    item.rotation.z = 0;
  });

  powerups.forEach((item) => {
    item.userData.collected = false;
    item.visible = true;
    item.position.y = item.userData.baseY;
  });

  startScreenNode.classList.remove("hidden");
  settingsPanelNode.classList.add("hidden");
  endScreenNode.classList.add("hidden");
  messageNode.classList.add("hidden");
  updateHud(true, clock.elapsedTime);
  clock.getDelta();
}

function setVolume(value, preview = false) {
  effectsVolume = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
  const label = `${Math.round(effectsVolume * 100)}%`;
  const sliderValue = String(Math.round(effectsVolume * 100));

  startVolumeNode.value = sliderValue;
  settingsVolumeNode.value = sliderValue;
  startVolumeValueNode.textContent = label;
  settingsVolumeValueNode.textContent = label;
  updateEffectsVolume();
  if (preview) playBeamPreviewSound();
}

function setMusicVolume(value) {
  musicVolume = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
  const label = `${Math.round(musicVolume * 100)}%`;
  const sliderValue = String(Math.round(musicVolume * 100));

  startMusicVolumeNode.value = sliderValue;
  settingsMusicVolumeNode.value = sliderValue;
  startMusicVolumeValueNode.textContent = label;
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
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.02
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function terrainHeight(x, z) {
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

function ridgeAmount(x, z) {
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
  return Math.max(
    pastureAmount(x, z) * 0.62,
    softRectAmount(x, z, 54, 43, 31, 26),
    softRectAmount(x, z, -55, 57, 36, 25) * 0.75,
    1 - distanceToSegment(x, z, -76, 59, 56, 42) / 9.5,
    1 - distanceToSegment(x, z, 10, 31, 57, 43) / 8.5
  );
}

function pathAmount(x, z) {
  return Math.max(
    0,
    1 - distanceToSegment(x, z, -78, 60, -38, 40) / 5.4,
    1 - distanceToSegment(x, z, -38, 40, 12, 30) / 4.2,
    1 - distanceToSegment(x, z, 12, 30, 54, 43) / 4.8,
    1 - distanceToSegment(x, z, 12, 30, 30, -18) / 3.8
  );
}

function pastureAmount(x, z) {
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
    scene.add(shore);

    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 72), waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(body.x, terrainHeight(body.x, body.z) + 0.1, body.z);
    water.scale.set(body.rx, body.rz, 1);
    water.receiveShadow = true;
    water.name = `moonlit-pond-${index}`;
    water.userData = { waveOffset: index * 0.8 + body.x * 0.03 };
    waterSurfaces.push(water);
    scene.add(water);

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
      scene.add(ring);
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
  scene.add(reedMesh, pebbleMesh);
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
    patch.scale.set(4.8 + (i % 5) * 1.1, 2.2 + (i % 4) * 0.9, 1);
    scene.add(patch);
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

  scene.add(group);
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
  addFieldRows();
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
      skipWater: true
    });
  });

  scene.add(group);
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
  scene.add(group);
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
    scene.add(group);
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
    [-30, 48, 0.4],
    [-34, 44, -0.4],
    [28, -16, 0.25]
  ].forEach(([x, z, rotation], index) => {
    const spot = findDryObjectSpot(x, z, 3.6, 270 + index);
    const bale = new THREE.Mesh(geometry, material);
    bale.rotation.z = Math.PI / 2;
    bale.rotation.y = rotation;
    bale.position.set(spot.x, terrainHeight(spot.x, spot.z) + 0.72, spot.z);
    bale.castShadow = true;
    bale.receiveShadow = true;
    scene.add(bale);
  });
}

function addFieldRows() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x4b3a21,
    roughness: 0.96
  });
  for (let i = 0; i < 7; i += 1) {
    const x = -64 + i * 3.8;
    const z = 58;
    if (!isDryObjectSpot(x, z, 6.5)) continue;
    const row = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 28), material);
    row.rotation.y = -0.24;
    row.position.set(x, terrainHeight(x, z) + 0.08, z);
    row.receiveShadow = true;
    scene.add(row);
  }
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
    scene.add(stone);
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
  scene.add(clumps);
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
  scene.add(trunkMesh, crownMesh);
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
  scene.add(rockMesh);
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
    scene.add(circle);
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
    scene.add(cloud);
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
  scene.add(fireflies);
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
    eye.position.set(x, 0.8, -0.3);
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

function spawnCollectibles() {
  const cowSpots = [
    [18, 22],
    [25, 29],
    [13, 33],
    [31, 18],
    [-47, 45],
    [-55, 35],
    [-40, 34],
    [-48, 24],
    [42, -30],
    [53, -36],
    [34, -42],
    [57, -24],
    [-6, 55],
    [4, 48]
  ];

  cowSpots.forEach(([x, z], index) => {
    const cow = createCow(index);
    const safeSpot = findDrySpot(x, z, index);
    addCollectible(cow, "cow", safeSpot.x, safeSpot.z, 100);
  });

  const bonusSpot = [[-66, 28], [36, 52], [63, -20], [-24, 60]][Math.floor(Math.random() * 4)];
  const human = createBonusHuman();
  const safeBonusSpot = findDrySpot(bonusSpot[0], bonusSpot[1], 99);
  addCollectible(human, "bonus", safeBonusSpot.x, safeBonusSpot.z, 750);
}

function addCollectible(group, type, x, z, points) {
  group.position.set(x, terrainHeight(x, z), z);
  group.rotation.y = Math.atan2(x, z) + Math.PI * 0.5;
  group.userData = {
    type,
    points,
    collected: false,
    wobble: Math.random() * Math.PI * 2,
    baseY: group.position.y
  };
  collectibles.push(group);
  scene.add(group);
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

function spawnPowerups() {
  [
    [-62, 60],
    [50, 36],
    [69, -41],
    [-22, -59],
    [34, 6]
  ].forEach(([x, z], index) => {
    const safeSpot = findDrySpot(x, z, index + 120);
    const powerup = createEnergyCore();
    powerup.position.set(safeSpot.x, terrainHeight(safeSpot.x, safeSpot.z) + 1.15, safeSpot.z);
    powerup.userData = { collected: false, baseY: powerup.position.y };
    powerups.push(powerup);
    scene.add(powerup);
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

  return sampleOffsets.every(([offsetX, offsetZ]) => {
    const sampleX = x + offsetX;
    const sampleZ = z + offsetZ;
    return !isWater(sampleX, sampleZ, 10) && terrainHeight(sampleX, sampleZ) > -0.72;
  });
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
  [
    [24, 28, 17, 0.9],
    [48, -34, 19, -0.82],
    [-50, 35, 16, 1.05]
  ].forEach(([x, z, radius, speed], index) => {
    const hazard = createPatrolDrone(index);
    hazard.userData = {
      ...hazard.userData,
      center: new THREE.Vector3(x, 0, z),
      radius,
      speed,
      angle: index * 2.1,
      warningRadius: 8.2
    };
    hazards.push(hazard);
    scene.add(hazard);
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
    updateBeamSound(false);
    updatePowerups(delta, elapsed, false);
    updateHazards(delta, elapsed, false);
    if (gameWon) updateTakeoff(delta, elapsed);
    ufoState.velocity.multiplyScalar(Math.pow(gameWon ? 0.02 : 0.12, delta));
    ufo.rim.rotation.z += delta * 1.4;
  }

  updateCollectibles(elapsed);
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
  beamActive = wantsBeam && hasBeamPower;
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
  const ufoPos = ufo.group.position;
  let best = null;
  let bestDistance = Infinity;

  for (const item of collectibles) {
    if (item.userData.collected) continue;
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

  if (target.userData.type === "bonus") bonusCollected = true;
  playCollectSound(target.userData.type === "bonus");
  flashMessage(
    target.userData.type === "bonus"
      ? `Bonus eingesammelt: +${points}`
      : `Kuh eingesammelt: +${points}`
  );
  updateHud(true, now);
}

function updateCollectibles(elapsed) {
  collectibles.forEach((item, index) => {
    if (item.userData.collected || item === abductingTarget) return;
    item.position.y = item.userData.baseY + Math.sin(elapsed * 1.7 + item.userData.wobble) * 0.06;
    if (item.userData.type === "bonus") {
      item.rotation.y += 0.017;
      item.rotation.z = Math.sin(elapsed * 4.2) * 0.18;
    } else {
      item.rotation.y += Math.sin(elapsed * 0.8 + index) * 0.0015;
    }
  });
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
      beamEnergy = Math.min(100, beamEnergy + 42);
      alertLevel = Math.max(0, alertLevel - 18);
      playPowerupSound();
      flashMessage("Energiekern: +50, Beam aufgeladen");
      updateHud(true, elapsed);
    }
  }
}

function updateHazards(delta, elapsed, active = true) {
  let detected = false;

  for (const hazard of hazards) {
    const data = hazard.userData;
    data.angle += delta * data.speed;
    const x = data.center.x + Math.cos(data.angle) * data.radius;
    const z = data.center.z + Math.sin(data.angle) * data.radius;
    hazard.position.set(x, terrainHeight(x, z) + 7 + Math.sin(elapsed * 2 + data.radius) * 0.35, z);
    hazard.rotation.y = data.angle + Math.PI;
    if (data.scan) data.scan.scale.setScalar(0.92 + Math.sin(elapsed * 8 + data.radius) * 0.06);
    if (data.rotors) {
      for (const rotor of data.rotors) rotor.rotation.z += delta * 24;
    }

    const distance = horizontalDistance(hazard.position, ufo.group.position);
    if (active && distance < data.warningRadius) {
      detected = true;
      alertLevel = Math.min(100, alertLevel + delta * (beamActive ? 31 : 21));
      beamEnergy = Math.max(0, beamEnergy - delta * 7.5);
    }
  }

  if (active && !detected) {
    alertLevel = Math.max(0, alertLevel - delta * 11);
  }

  if (active && detected && elapsed - lastAlertSound > 1.4) {
    lastAlertSound = elapsed;
    playAlertSound();
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

  tempVector2.copy(ufoState.heading).multiplyScalar(12);
  tempVector2.y = -2.5;
  camera.lookAt(tempVector2.add(ufo.group.position));
}

function updateAudio() {
  if (!audio) return;
  const now = audio.ctx.currentTime;
  const speed = ufoState.velocity.length();
  audio.engineOsc.frequency.setTargetAtTime(48 + speed * 4.2, now, 0.1);
  audio.engineSubOsc.frequency.setTargetAtTime(24 + speed * 1.45, now, 0.12);
  audio.engineGain.gain.setTargetAtTime(0.038 + speed * 0.0048, now, 0.12);
  audio.engineSubGain.gain.setTargetAtTime(0.023 + speed * 0.0021, now, 0.14);
  updateBeamSound(beamActive);
}

function updateHud(force = false, elapsed = clock.elapsedTime) {
  if (!force && elapsed - lastHudUpdate < 0.12) return;
  lastHudUpdate = elapsed;

  scoreNode.textContent = score.toLocaleString("de-DE");
  comboNode.textContent = `Combo x${combo}`;

  const cowsLeft = collectibles.filter(
    (item) => item.userData.type === "cow" && !item.userData.collected
  ).length;
  targetCountNode.textContent = cowsLeft === 1 ? "1 Kuh uebrig" : `${cowsLeft} Kuehe uebrig`;
  bonusStatusNode.textContent = bonusCollected ? "Bonus gefunden" : "Seltener Bonus: +750";

  if (alertLevel > 70) dangerStatusNode.textContent = "Farmalarm!";
  else if (alertLevel > 32) dangerStatusNode.textContent = "Patrouille nah";
  else dangerStatusNode.textContent = "Nacht ruhig";

  const energyPercent = Math.round(beamEnergy);
  energyFillNode.style.transform = `scaleX(${beamEnergy / 100})`;
  energyLabelNode.textContent = `${energyPercent}%`;

  if (!gameWon && countRemainingMissionItems() === 0) {
    finishMission(elapsed);
  }
}

function countRemainingMissionItems() {
  const remainingCollectibles = collectibles.filter((item) => !item.userData.collected).length;
  const remainingPowerups = powerups.filter((item) => !item.userData.collected).length;
  return remainingCollectibles + remainingPowerups;
}

function finishMission(elapsed) {
  gameWon = true;
  missionEndTime = elapsed;
  takeoffUntil = elapsed + 4.2;
  score += Math.round(beamEnergy) * 4;
  scoreNode.textContent = score.toLocaleString("de-DE");
  finalTimeNode.textContent = `Zeit: ${formatTime(missionEndTime - missionStartTime)}`;
  finalScoreNode.textContent = `Punkte: ${score.toLocaleString("de-DE")}`;
  endScreenNode.classList.remove("hidden");
  flashMessage("Mission abgeschlossen. Alle Ziele eingesammelt.");
  playTakeoffSound();
  playBonusJingle();
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
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

  drawMapDots(collectibles, (item) => {
    if (item.userData.collected) return null;
    if (item.userData.type === "bonus") {
      const near = horizontalDistance(item.position, ufo.group.position) < 42;
      return near ? "#ff77dd" : "rgba(255, 119, 221, 0.28)";
    }
    return "#fff1a5";
  }, size, scale, 2.4);

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
  engineGain.gain.value = 0.038;
  const engineSubGain = ctx.createGain();
  engineSubGain.gain.value = 0.023;
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

function playAlertSound() {
  playTone(118, 0.08, "triangle", 0.026);
  playTone(164, 0.1, "sine", 0.018, 0.08);
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
  messageNode.classList.remove("hidden");
  messageNode.innerHTML = `<strong>${text}</strong><span>W/Pfeil hoch gibt Schub, A/D oder Pfeile drehen, S bremst, Leertaste beamt.</span>`;
  window.clearTimeout(flashMessage.timeout);
  flashMessage.timeout = window.setTimeout(() => {
    if (firstMove) messageNode.classList.add("hidden");
  }, 1900);
}

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
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
