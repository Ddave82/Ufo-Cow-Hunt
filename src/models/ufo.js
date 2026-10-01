import * as THREE from "three";
import { createModel } from "./library.js";

// The approved Blender hull, with the existing gameplay effect/animation contract.
export function createUfo() {
  const group = createModel("ufo");
  // Avoid fine-panel self-shadow acne on the moving hull; keep its ground
  // shadow and GTAO contact detail.
  group.traverse((part) => { if (part.isMesh) part.receiveShadow = false; });
  group.position.set(0, 12, 18);
  const finishes = { light: new THREE.MeshBasicMaterial({ color: 0x65ffe1 }) };
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.04, 5, 48, Math.PI * 1.65), finishes.light);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.65;
  const engineGlow = new THREE.PointLight(0x72fff0, 7.5, 28);
  engineGlow.position.y = -0.35;
  const boostGlow = new THREE.Mesh(new THREE.SphereGeometry(3.15, 24, 8), new THREE.MeshBasicMaterial({
    color: 0x8ffff1, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  boostGlow.scale.set(1.55, 0.18, 1.55);
  boostGlow.position.y = -0.02;
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.2, 12, 1, true), new THREE.MeshBasicMaterial({
    color: 0x86fff0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide
  }));
  trail.rotation.x = Math.PI;
  trail.position.y = -1.8;
  group.add(rim, engineGlow, boostGlow, trail);
  return { group, rim, trail, engineGlow, boostGlow };
}
