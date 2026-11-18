# Cat & Dog Vision Simulator — V3 playable room (alpha)

> **Status:** First playable technical vertical slice. **NOT** a photorealism-approved release, and **NOT** yet live at the production URL.
> Created independently from \`main\`, not from rejected PR #2 or the deleted V2 model lab.
> This branch does not alter the current GitHub Pages game.

## Why this revision exists

The user wants **realistic visuals and free-roam gameplay equally**. This iteration does not make inflated “ultra-HD” claims based on triangle counts. It first wires free-roam 3D movement and a hybrid PBR/postprocessing pipeline, then enforces an asset acceptance gate. Several current test props remain relatively low polygon and thus **do not qualify as final high-fidelity furniture**.

### Built in \`v3/index.html\` + \`v3/game.js\`

- Independent 3D living-room prototype using Three.js r161, PBR standard/physical materials, physically inspired day/night light, PCF soft shadows, ACES tonemapping, and screen-space vision postprocessing.
- Freely walk with W/A/S/D and shift-run. Jump with Space. Mouse drag/pointer lock turns first-person view. Collision and room boundaries are enforced separately from the imported models.
- Human, cat and dog eye-height perspectives, with simulation-oriented (not scientifically exact) color and clarity filtering for cats and dogs.
- Human/animal split-view comparison, night lighting toggle, optional smooth mode, performance meter and HUD controls.
- Proper external \`.glb\` GLTFLoader path and visible failure count. No fake mesh substitutes for failed furniture downloads.
- The cat third-person camera is a **static reference** only; it is explicitly labelled as unrigged/unapproved. No fabricated animation is used.
- The dog mode is currently **first-person only** because a sufficiently realistic *animated Shiba Inu* has not been licensed and validated. Do not substitute a Labrador, low-poly Shiba, or random canine and claim it is finished.
- Keyboard and basic mobile controls. Browser visual QA remains pending.

### Test / provisional furniture

The following are CC0 self-contained GLBs, publicly documented as CORS-enabled by 3DAssets.dev. They are test furniture, *not accepted photoreal models*:

| Role | Model | URL | Source |
| --- | --- | --- | --- |
| Sofa | Three-seat sofa | https://cdn.3dassets.dev/assets/38778/v1/model.glb | https://3dassets.dev/assets/bedroom-and-living-room-furniture-sofa-three-seat-6be9b44b |
| Coffee table | Rectangular coffee table | https://cdn.3dassets.dev/assets/38790/v1/model.glb | https://3dassets.dev/assets/bedroom-and-living-room-furniture-coffee-table-rect-2efbd4f9 |
| Chair | Upholstered dining chair | https://cdn.3dassets.dev/assets/38785/v1/model.glb | https://3dassets.dev/assets/bedroom-and-living-room-furniture-dining-chair-upholst-7ec33345 |
| Lamp | Arc floor lamp | https://cdn.3dassets.dev/assets/38797/v1/model.glb | https://3dassets.dev/assets/bedroom-and-living-room-furniture-floor-lamp-arc-7aa27d3a |
| Dining table | 6-seat table | https://cdn.3dassets.dev/assets/38791/v1/model.glb | https://3dassets.dev/assets/bedroom-and-living-room-furniture-dining-table-6seat-02f48ab1 |
| Cat camera reference | Ginger domestic shorthair | https://cdn.3dassets.dev/assets/28155/v1/model.glb | https://3dassets.dev/packs/pets-and-companions-hd |

Source website reports CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/). Geometry counts and licensing must still be independently rechecked during final art approval.

**Quality note:** The test sofa is ~3,140 triangles, the coffee table ~448 and the chair ~1,248. This is intentionally **not** presented as an ultra-high-detail furnishing set. Actual production props should be licensed from professional model libraries such as Poly Haven (https://polyhaven.com/models), where assets have photo-derived PBR materials, and validated at the gameplay camera distance. Paid/marketplace character models also require proof of purchase and applicable redistribution rights.

## Hard blockers for final V3

- **Cat:** believable ginger tabby anatomy, sufficiently detailed coat/skin, UV/PBR maps, proper skinned skeleton, and true idle/walk/run/jump animations, verified at eye height. Static current GLB does not pass.
- **Dog:** recognizable Shiba Inu breed and realistic rigged idle/walk/run/jump clips. There is no approved animal mesh yet.
- **Props:** replace provisional GLBs with **artist-quality** PBR furniture, check topology and texture quality up close and at 2m gameplay distance; verify normal/roughness/material maps, not just polygon counts.
- **Room:** upgrade shell surface textures and daylight via baked GI/light probes and an HDR environment after performance budget is known.
- **Vision:** academic reference calibration for feline/canine spectra, depth-dependent acuity and night behavior; current shader is an approximate artistic simulation.
- **QA:** actual real browser screenshot, successful GLB/CORS loads, time-to-interactive, stable 30–60 fps on desktop and a reasonable mobile fallback.
- **Delivery:** publish a separate safe V3 preview after QA, with no changes to \`main\` until explicitly approved.

## Local run (for a developer)

Requires an HTTP static server because JavaScript imports and GLB network access do not work reliably from \`file://\`.

From repository root, run \`python3 -m http.server 8080\`, then open \`http://localhost:8080/v3/\`. Third-party model/ESM hosts require network access.

Current branch path: \`v3/index.html\`. The existing live page at \`https://chengwq95.github.io/cat-dog-vision-simulator/\` remains the previously published game.

## Internal QA implemented

- \`game.js\` parsed by JavaScript syntax compilation with ES module import lines removed for validation.
- Branch file existence was checked through the connected GitHub API.
- **Not done:** rendered browser verification and frame-time measurement. Do not claim either has passed.
