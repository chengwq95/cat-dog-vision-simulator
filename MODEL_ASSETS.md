# GLB Model Replacements — Sources, Licence and QA

This branch introduces **actual independently authored GLB meshes** as the visible models in the scene. The original procedurally created meshes remain as a safety fallback, because the game still relies on their collision volumes, animation state and scripted interactions. When a GLB loads successfully, its matching old visible meshes are hidden.

## Asset inventory

| Role | New GLB | Source and licence | Notes |
| --- | --- | --- | --- |
| Animated Shiba Inu | `models/shiba-animated.glb` | Quaternius Ultimate Animated Animals (CC0), mirrored at https://github.com/lhns/steam-frame-nix/tree/main/modules/pet/models/shiba | 1 skin; Idle, Walk, Gallop and other animation clips; 851 KB |
| Ginger cat | `https://cdn.3dassets.dev/assets/20538/v1/model.glb` | https://3dassets.dev/assets/companion-animals-and-pet-home-cat-standing-f166d717 (CC0) | Standing cat, **not rigged**; simple root bob only; does not yet meet a full animated high-detail requirement |
| Saloon cars | `https://cdn.3dassets.dev/assets/32490/v1/model.glb` | https://3dassets.dev/assets/car-park-and-road-vehicle-fleet-saloon-ad831b1f (CC0) | Approx. 30k triangles; reused for the three cars |
| Road motorcycle | `https://cdn.3dassets.dev/assets/18683/v1/model.glb` | https://3dassets.dev/assets/transport-collection-hd-road-motorcycle-f23b671a (CC0) | Generic road motorcycle, **not a precise Malaysian kapcai** |
| Three-seat sofa | `https://cdn.3dassets.dev/assets/38778/v1/model.glb` | https://3dassets.dev/assets/bedroom-and-living-room-furniture-sofa-three-seat-6be9b44b (CC0) | Existing red/green/blue/yellow coloured loose cushions remain for the vision comparison |
| Double bed | `models/bed-double.glb` | KayKit Furniture Bits, CC0, https://github.com/Papyszoo/CC0-Public-Domain-Models/tree/main/packs/kaykit-furniture-bits | Stylized model, not photorealistic |
| Dining chair ×4 | `models/dining-chair.glb` | KayKit Furniture Bits (CC0, source above) | Four clones, distinct from table fallback |
| Coffee table | `models/coffee-table.glb` | KayKit Furniture Bits (CC0, source above) | Original interaction surfaces retained |
| Dining table | `models/dining-table.glb` | KayKit Furniture Bits (CC0, source above) | Original collision volumes retained |

**Licence:** All imported assets are documented as Creative Commons Zero (CC0 1.0). The original game's MIT-licensed code remains MIT. CC0 source attribution is included for traceability even though it is not required.

## How to run

Serve the repository over HTTP/HTTPS, e.g. GitHub Pages. Three.js r128 and `GLTFLoader` load from external CDNs; locally committed models are served from `/models`. Run `?legacyModels=1` to disable replacements for a regression comparison.

Open developer tools and inspect:

```js
window.__cat.modelStatus
window.__cat.petGLBActors
```

The `loaded`, `failed`, and `pending` arrays indicate which models replaced their procedural predecessor. A loaded model stays in the existing world scene and passes through the existing pet-vision render pipeline. Each failure keeps the old mesh visible.

## Behaviour preserved in the code

- Original physics bounds, jumping surfaces, pet switching, per-frame movement and interaction state are left intact.
- Import transforms resize each asset to the legacy collision envelope; this can distort an originally proportionate mesh. These placements must be visually checked.
- Shiba animation clips are selected between Idle, Walk and Gallop, with a short cross-fade. Old character transforms remain to drive the original interaction logic.
- Car and motorbike render meshes are replaced; collision structures remain unchanged.
- The legacy sofa mesh is hidden on success but the four coloured cushions remain to demonstrate dichromatic vision.
- No attempt is made to claim the static cat plays a true four-legged gait animation.

## Unverified / required acceptance testing

**Do not merge into the live production branch without real browser QA.** Syntax validation cannot prove visual fit, correct handedness, animation skinning, high-fidelity appearance or acceptable runtime FPS.

1. Confirm `modelStatus.failed.length===0` with a normal browser and a served HTTPS build.
2. Confirm the cat and Shiba are correctly facing +Z when walking and do not hover or intersect floors.
3. Validate Shiba idle/walk/gallop and dog/cat switching (Q), first/third person, and CCTV views.
4. Confirm sofa cushions remain correctly placed relative to the imported sofa; compare cat, dog and human vision.
5. Confirm the 4 chairs and dining table align, the bed supports napping, and the coffee table interaction positions still match.
6. Walk around and onto the parked car (where permitted) and around the motorcycle. Verify no added collision/physics regression.
7. Validate performance on low-end and mobile devices, especially during model downloads, animation and high-resolution shadow rendering.
8. Replace the standing static cat with a genuinely rigged high-resolution cat and use a kapcai-accurate motorcycle before calling the entire visual overhaul production-complete.

## Architecture note

The code uses `THREE.GLTFLoader` from the matching r128 release, asynchronous loading, source-specific dimensions, and opt-in legacy fallback. Future work should move assets into local versioned files to remove CDN dependencies and perform model rig/material compatibility tests in a browser CI workflow.
