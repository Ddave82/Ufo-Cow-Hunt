import * as THREE from "three";

// Broad, world-space marks remain attached to the terrain. Pixel derivatives
// fade fine bands before they become subpixel stripes in the distance.
export function createTerrainMaterial(level) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: level === "ice" ? 0.84 : 0.96,
    metalness: 0,
    emissive: level === "desert" ? 0x6a4514 : level === "ice" ? 0x102a3a : 0x000000,
    emissiveIntensity: level === "desert" ? 0.16 : level === "ice" ? 0.1 : 0
  });
  material.name = `terrain-${level}-filtered`;
  material.customProgramCacheKey = () => `terrain-surface-v1-${level}`;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTerrainPosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTerrainPosition;');
    const pattern = level === "desert" ? `
      float phase = p.x * 1.9 + p.y * 0.65 + sin(p.y * 0.16) * 2.4;
      float resolved = 1.0 - smoothstep(0.35, 1.3, fwidth(phase));
      float bands = sin(phase) * resolved;
      float patches = 0.5 + 0.5 * sin(p.x * 0.08 + sin(p.y * 0.11));
      diffuseColor.rgb *= 1.0 + bands * 0.025 * patches;
    ` : level === "ice" ? `
      float phase = p.x * 0.65 - p.y * 0.48 + sin(p.y * 0.11) * 2.0;
      float resolved = 1.0 - smoothstep(0.3, 1.2, fwidth(phase));
      diffuseColor.rgb *= 1.0 + sin(phase) * resolved * 0.018;
    ` : `
      float patches = sin(p.x * 0.14 + sin(p.y * 0.08)) * sin(p.y * 0.12);
      diffuseColor.rgb *= 1.0 + patches * 0.035;
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ vec2 p = vTerrainPosition.xz;\n' + pattern + '\n}');
  };
  return material;
}

// Sparse, readable details, not a field of subpixel gravel. One instanced draw.
export function createGroundDetails(level, heightAt, allowed) {
  const matrices = [], colors = [];
  const dummy = new THREE.Object3D();
  const ice = level === "ice";
  const palette = ice ? [0xb4d9e4, 0xdcebf0, 0x84b6c9] : [0xbc956a, 0xdbb889, 0xa77c51];
  for (let cluster = 0; cluster < 24; cluster++) {
    const x = ((cluster * 53) % 140) - 70;
    const z = ((cluster * 37 + 17) % 140) - 70;
    for (let i = 0; i < 4; i++) {
      const angle = cluster * 0.8 + i * 2.4;
      const px = x + Math.cos(angle) * (0.7 + i * 0.55);
      const pz = z + Math.sin(angle) * (0.7 + i * 0.55);
      if (!allowed(px, pz)) continue;
      const size = 0.3 + ((cluster + i * 3) % 5) * 0.1;
      dummy.position.set(px, heightAt(px, pz) + size * 0.13, pz);
      dummy.rotation.set(0, angle, 0.12);
      dummy.scale.set(size * 1.2, size * (ice ? 0.42 : 0.38), size * 0.85);
      dummy.updateMatrix(); matrices.push(dummy.matrix.clone()); colors.push(palette[(cluster + i) % 3]);
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.94, flatShading: true }), matrices.length);
  matrices.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); mesh.setColorAt(i, new THREE.Color(colors[i])); });
  mesh.name = `${level}-ground-details`;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}
