import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";

// GTAO's normal override otherwise turns even zero-opacity engine glows into
// solid occluders. Their animated silhouettes cause dark flashes on the hull.
export class StableGTAOPass extends GTAOPass {
  overrideVisibility() {
    super.overrideVisibility();
    this.scene.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.every((material) => material.transparent || !material.depthWrite)) {
        object.visible = false;
      }
    });
  }
}
