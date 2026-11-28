# Household character models

The two playable owners use the MakeHuman Community's HM08 base body, skin weights and facial shape targets distributed with MPFB. The base mesh credits Data Collection AB, Joel Palmius and Jonas Hauquier. These source assets are available under CC0 1.0. [MPFB source at the revision used](https://github.com/makehumancommunity/mpfb2/tree/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a) · [Source license](CC0-1.0.md)

The MakeHuman CC0 system asset pack supplied the following meshes and texture bases. [System asset pack and credits](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)

| Part | Source assets |
| --- | --- |
| Skin | `young_asian_male`, `young_asian_female` |
| Hair and brows | `short03`, `long01`, `eyebrow003`, `eyebrow010` |
| Eyes | `high-poly`, `brown_eye.png` |
| Clothing | `male_casualsuit03`, `female_elegantsuit01` |

The two Japanese characters were fitted to the simulator's existing player controls. The male owner wears a plain indigo shirt and a cotton apron. The female owner's blue dress has a custom small-flower print across the sleeves, bodice and flared skirt. Her waist-length hair has a separate lock over one shoulder, and its ends follow the upper body when she bows. The woven apron, wire glasses, waist binding, buttons, earrings and slippers were made for the game.

## Editing the models

`household-models.js` contains one self-contained glTF 2.0 binary with two 17-joint skeletons and their textures. Each owner has separate wrist and eye joints. The facial morphs combine MPFB's eyelid, mouth-corner, mouth-elevation and eye-slit targets into a blink and a smile. Loading the model as a script also supports opening the game from a local folder. To extract the GLB from the repository root, run the following in Node.js.

```js
const fs = require('node:fs')
const script = fs.readFileSync('assets/household-models.js', 'utf8')
const payload = script.match(/let householdModelGLB = '([^']+)'/)[1]
fs.writeFileSync('household.glb', Buffer.from(payload, 'base64'))
```

Open the result in a glTF tool that supports `EXT_meshopt_compression`. The top-level skeletons are named `man` and `woman`. The `housemate` extra on each mesh node identifies its skeleton.

## Runtime libraries

- Three.js r128 `GLTFLoader.js`, distributed under the MIT license. [Source](https://github.com/mrdoob/three.js/blob/r128/examples/js/loaders/GLTFLoader.js) · [License](vendor/THREE-LICENSE.txt)
- meshoptimizer 0.22 `meshopt_decoder.js` by Arseny Kapoulkine, distributed under the MIT license. [Source](https://github.com/zeux/meshoptimizer/tree/v0.22) · [License](vendor/MESHOPT-LICENSE.md)
