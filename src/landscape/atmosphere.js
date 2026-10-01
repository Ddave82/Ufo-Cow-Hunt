import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Deterministic decoration: mission reloads keep the same landscape.
const noise = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

export function createNaturalBoundary(level, halfWorld, heightAt) {
  const ice = level === "ice";
  const pieces = [];
  const color = new THREE.Color();
  for (let side = 0; side < 4; side++) {
    for (let cluster = 0; cluster < 9; cluster++) {
      const seed = side * 37 + cluster * 7;
      const along = -halfWorld + 10 + cluster * (halfWorld * 2 - 20) / 8 + noise(seed) * 5;
      const edge = halfWorld - 1.5 + noise(seed + 2) * 2;
      const cx = side < 2 ? along : (side === 2 ? -edge : edge);
      const cz = side < 2 ? (side === 0 ? -edge : edge) : along;
      for (let part = 0; part < 3; part++) {
        const n = seed + part * 13;
        const x = cx + (noise(n + 3) - 0.5) * 7;
        const z = cz + (noise(n + 4) - 0.5) * 7;
        const h = (ice ? 2.8 : 2.2) + noise(n + 5) * (ice ? 4 : 3.2);
        const radius = 2.6 + noise(n + 6) * 3.8;
        const geometry = new THREE.CylinderGeometry(ice ? 0.08 : radius * 0.56, radius, h, 5, 2).toNonIndexed();
        const positions = geometry.attributes.position;
        const colors = [];
        const rotation = noise(n + 7) * Math.PI * 2;
        for (let i = 0; i < positions.count; i++) {
          const px = positions.getX(i), py = positions.getY(i), pz = positions.getZ(i);
          const top = py / h + 0.5;
          const skew = top * (noise(n + 9) - 0.5) * 2.5;
          const wx = x + Math.cos(rotation) * px - Math.sin(rotation) * pz + skew;
          const wz = z + (Math.sin(rotation) * px + Math.cos(rotation) * pz) * (ice ? 0.7 : 0.85);
          const ground = heightAt(THREE.MathUtils.clamp(wx, -halfWorld, halfWorld), THREE.MathUtils.clamp(wz, -halfWorld, halfWorld));
          positions.setXYZ(i, wx, ground + top * h - 0.5, wz);
          if (ice) color.setHex(top > 0.55 ? 0xd8eff5 : 0x5da9bf);
          else color.setHex(top > 0.7 ? 0xdab174 : top > 0.3 ? 0xb5824e : 0x94613d);
          color.multiplyScalar(0.9 + noise(n + 10) * 0.15);
          colors.push(color.r, color.g, color.b);
        }
        geometry.deleteAttribute("uv");
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        pieces.push(geometry);
      }
    }
  }
  const geometry = mergeGeometries(pieces);
  pieces.forEach(piece => piece.dispose());
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: ice ? 0.7 : 0.96, flatShading: true }));
  mesh.name = `${level}-natural-boundary`;
  mesh.receiveShadow = true;
  // Low silhouettes along the outer edge do not need another shadow-map draw.
  return mesh;
}

export function createAtmosphere(level, heightAt, reducedMotion = false) {
  const ice = level === "ice", farm = level === "farm";
  const count = farm ? 64 : ice ? 200 : 100;
  const positions = [], phases = [];
  for (let i = 0; i < count; i++) {
    const x = noise(i * 3) * 156 - 78, z = noise(i * 3 + 1) * 156 - 78;
    positions.push(x, heightAt(x, z) + (farm ? 1 : 2) + noise(i * 3 + 2) * (farm ? 2 : 9), z);
    phases.push(noise(i + 501) * Math.PI * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, tint: { value: new THREE.Color(farm ? 0xd7ec91 : ice ? 0xd5f4ff : 0xeac18a) }, size: { value: farm ? 0.11 : ice ? 0.12 : 0.2 }, opacity: { value: farm ? 0.65 : ice ? 0.48 : 0.18 } },
    vertexShader: `attribute float phase; uniform float time; uniform float size; varying float fade;
      void main() {
        vec3 p = position;
        p.x += sin(time * 0.27 + phase) * ${farm ? "0.7" : "3.5"};
        p.z += cos(time * 0.21 + phase) * 1.4;
        p.y += sin(time * 0.42 + phase) * ${farm ? "0.4" : "1.6"};
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(size * 600.0 / max(1.0, -mv.z), 1.0, 5.0);
        fade = (0.55 + 0.45 * sin(time * 0.8 + phase)) * (1.0 - smoothstep(30.0, 150.0, -mv.z));
      }`,
    fragmentShader: `uniform vec3 tint; uniform float opacity; varying float fade;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        if (r > 1.0) discard;
        gl_FragColor = vec4(tint, (1.0 - r) * opacity * fade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  points.name = `${level}-ambient-motes`;
  points.frustumCulled = false;
  points.userData.update = (elapsed) => { material.uniforms.time.value = reducedMotion ? 0 : elapsed; };
  return points;
}

export function createMeadowFlowers(heightAt, allowed) {
  const matrices = [], palette = [];
  const dummy = new THREE.Object3D();
  for (let cluster = 0; cluster < 22; cluster++) {
    const cx = noise(cluster * 11) * 132 - 66, cz = noise(cluster * 11 + 1) * 132 - 66;
    if (!allowed(cx, cz)) continue;
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = 0.4 + noise(cluster * 9 + i) * 2;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      dummy.position.set(x, heightAt(x, z) + 0.21, z);
      dummy.rotation.set(0.2, a, 0.15);
      dummy.scale.set(0.13, 0.07, 0.13);
      dummy.updateMatrix(); matrices.push(dummy.matrix.clone());
      palette.push(cluster % 3 === 0 ? 0xe7c778 : cluster % 3 === 1 ? 0xa9bce2 : 0xe2ddba);
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), matrices.length);
  matrices.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); mesh.setColorAt(i, new THREE.Color(palette[i])); });
  mesh.name = "meadow-wildflowers";
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}
