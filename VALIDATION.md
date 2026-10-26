# Validation performed

| Check | Result |
|---|---|
| TypeScript / production frontend build | Passed |
| ESLint | Passed without errors or warnings |
| Frontend regressions | **138 passed** |
| Python engine, packaged-server and launcher regressions | **101 passed** |
| Fresh Python 3.12 environment, runtime requirements only | Setup/import validation passed; pytest absent |
| Normal launcher over HTTP | Health, built frontend, blueprint and Kitchen/Bathroom/Dining/Office APIs passed |
| Entry-point syntax | Electron main/preload, Express and Mac shell syntax passed |
| ZIP CRC and packaged-file checks | Verified during packaging |

## Placement and direction

The room-planning matrix covers six room types, eight styles, seven dimension pairs (including compact 2x2 rooms) and four orientations: **1,344 arrangements**. It checks actual overridden dimensions, bounds, solid-object intersections, mounting heights, essential fixtures, wall attachment and inward facing directions.

Additional regressions verify connected kitchen modules, upper-cabinet supports, microwave placement, correct dining-chair forward rays, linked chair/table groups, distinct alternatives, explicit room/dimension/style/budget choices, honest catalog prices, missing optional-island explanations and the absence of living-room cupboards in bathrooms.

The generator keeps fixture heights intact. Compact rooms use sensible compact widths/depths or omit optional pieces instead of shrinking people-sized fixtures uniformly or nudging them into circulation space. Entrance geometry rotates with the complete arrangement.

## Living room / Companions release checks

New planner checks verify directly facing, centered TV/sofa axes, bounded viewing distances, coffee-table reach, inward-facing nearby chairs and rug alignment for eight styles, four orientations and three normal/large sizes. Tiny rooms verify an explicit TV omission. Existing hard placement tests across 1,344 arrangements still pass.

Renderer regressions check that each rug's rectangular base spans its whole footprint, modern accent seating faces forward, and the modern chaise extends forward at a conventional seat height. Actual Modern, Cozy and Luxury living-room meshes were inspected in the offscreen renderer.

Server-rendered UI checks cover visible Pets/Accessories/Aira tabs, absence of the old disclosure and plus buttons, portrait dimensions, Aira invitation placement above the preview, and illustrated look/height/removal controls. Server checks validate revision/cache headers and the actual delivered JavaScript contains the current Companions UI. Launcher tests cover occupied default ports and explicit port conflicts. The packaged ZIP was extracted into its versioned directory and launched with port 8000 deliberately occupied; it selected port 8001 and served the current revision, Companions JavaScript and corrected living-room API response. These are automated markup/scene/server checks; a live Mac browser interaction test was not available.

## Illustrated Aira release checks

The 2026.10.25.1 ZIP was extracted into its versioned folder and launched through its bundled Python entry point. HTTP checks served the current revision and compiled illustrated Companions controls, fetched the classic portraits, and generated a living-room layout. The retired character mesh, its thumbnail and the rejected atlas are absent from the archive. The complete source and prebuilt app were checked against the packaged SHA-256 manifest.

## Room personality and guest checks

New regressions cover bedroom study synonyms and actual desk/chair generation, explicit omission notes, four distinct kitchen configurations, three named alternatives, and affordable style-specific kitchen ranking. Existing 1,344-plan bounds/collision checks still cover all six rooms, eight styles and four orientations. Frontend API fixtures were refreshed from the current engine so pet navigation exercises current generated rooms.

Frontend checks cover room finish presets, lighting moods and different fixture geometry, complete preset undo/redo, manual finish overrides, saved lighting preferences, clipped bathroom/kitchen wall zones, guest add/move/remove/save/undo, malformed optional guest data, full-room failures, pet/guest separation, drag capture/cancellation, saved rotation, upright artwork at 32 azimuths and four elevations including overhead, three heights, directional wrap and boundary hysteresis, fixed illustrations, finite vertices/navigation bounds, and saved illustrated looks. Existing 44-asset/eight-style geometry and animal footprint/grounding checks continue to pass after the visual refinements.

Current kitchen, bathroom, dining and office meshes, wet-wall materials and ceiling fixtures were inspected with the offscreen renderer. The new schematic was rendered and visually checked. The eight independently generated transparent illustrations were visually inspected, then projected through the actual scene vertices/UVs in an internal software contact-sheet render. PNG alpha, full-figure bounds and each local asset endpoint were checked. The previous 3D character source and thumbnail are absent. The panel and scene use the same local illustrations. Native browser scrolling, touch gestures and character interaction were not end-to-end exercised in a GUI browser; event/geometry logic is covered by the automated checks. Native Mac/Windows GUI testing remains unavailable.

## Audit regressions

The follow-up audit added twelve frontend regressions covering budget/dimension typing, locked linked chairs, independent duplicates, palette undo/redo, live pet positions through undo/redo, thin wall-fixture dimensions, old customization defaults, malformed individual saves and lists, quota failures without data loss, invalid-result rejection, safe session restoration and dialog keyboard isolation. Six Python regressions cover independent app factories, stable engine routes, missing-asset 404s and invalid/valid port bounds. Existing renderer, pet navigation, placement, export and API suites were retained.

Full/blocked storage is simulated by throwing browser storage exceptions. Tests verify that named saves remain byte-for-byte intact, room edits succeed in memory, the auto-save notice appears and successful persistence clears it. Keyboard isolation is tested at the event guard; live dialog focus behavior was not browser-tested. Electron main/preload syntax was checked after the startup/cleanup changes; native Electron process behavior was not GUI-tested.

## Renderer and editing

Measured Three.js scene bounds were checked for all **44 assets in eight styles: 352 combinations**. Tests cover floor grounding and mounting, color/tint resets, nine floors, twelve wall finishes, four tile patterns, transforms and wall constraints, quaternion yaw beyond 90/180 degrees, collision-aware sliding, lock/delete, duplication, undo/redo/reset, grouped dining movement, saved finishes, frontend response validation and rotated DXF dimensions.

For visual review, actual meshes from generated kitchens, bathrooms, dining rooms and home offices were rasterized with an offscreen software OpenGL renderer. This review led to clearer bathroom fixture/camera placement. It was a geometry/material review; it was not a screenshot of the browser UI. The architectural SVG was also rendered and inspected. Follow-up checks cover per-piece swaps, all-catalog variant coverage, saved tint/transform preservation, appearance-only edits of deliberately overlapping pieces, cutaway accessory visibility, actual chair backrest directions and seat heights, real geometry changes between options, and exact shell bounds for compact/rectangular rooms at four door orientations. New engine regressions verify editable room accessories and chimney/vent/art/light prompt recognition.

## Pet companion regressions

Tests cover both animal meshes, grounded paws and navigation footprints; walking/resting animation; pointer capture, drag commit, cancellation and release; live-position saves; furniture reset preserving companions; metadata and furniture preservation; undo/removal; four-pet limits; malformed optional records and old saves; floor-drop projection and payload validation; per-pet stay, pause and call commands; accessory sniff/rest visits; relocated pets after furniture changes; four crossing companions; and obstacle-free movement in all six actual generated room layouts. Routing tests include rotated furniture, blocked paths, disconnected areas, wall-mounted items and rugs. The simulation checks continuous segment clearance and dynamic pet separation, not only destination positions.

The cat, pug and a furnished room with pet accessories were also reviewed using actual Three.js meshes in the offscreen renderer. Headless R3F event tests exercise the pointer handlers; native HTML drag-and-drop was checked through its payload/projection/placement logic, rather than in a live browser.

## Startup and remaining limits

A new isolated environment installed only the runtime requirements, including the explicit `packaging` requirement. The launcher verified engine imports, then a normal launch served the built app and generated the three redesigned rooms over HTTP. Cache regressions check missing imports even when setup has an existing completion stamp.

These checks ran in the available Linux environment. Native macOS/Windows GUI sessions and the Windows Electron installer were not executed. Browser pointer dragging and PDF downloads were not end-to-end exercised in a live browser; their supporting state, scene and export logic is covered as described above. Graphics behavior can vary by browser/GPU. These results are evidence of the tested behavior, not a guarantee against every possible prompt or device issue.

Vite emits a bundle-size advisory for the 3D app. The scene runner emits a Three.js Clock deprecation notice, and the Python test client emits a Starlette deprecation notice. They did not fail the checks. Scene-only tests lack browser storage; save/load behavior is tested separately with storage available.

## Reproduce

From `frontend/`: `npm ci`, `npm run lint`, `npm test`, `npm run build`.

From the root, activate a Python 3.12 environment, install `requirements-test.txt`, then run:

```sh
python -m pytest softcomputing-service/tests tests -q
```

The ZIP includes production `frontend/dist`. Virtual environments, node_modules, internal review renders and caches are excluded. JavaScript lockfiles, pinned Python requirements, local fonts, blueprint, model source and the shared catalog are included.

## 2026.10.25.1 validation

Added regressions verify that camera distance, elevation and azimuth never pitch/roll Aira, including close-up and degenerate overhead positions. Both outfits keep the selected illustrated look; switching changes bounds/UVs and textures. The Eva outfit survives saved-result validation and undo/redo; older records default to Classic. Panel markup exposes the outfit selector and correct outfit preview.

The new architectural SVG was rasterized and visually inspected for connected circulation, door swings, genuine window openings, contained furniture and room-specific fixtures. The homepage and kitchen workspace were reviewed in source and static markup. The workspace selector is inside the normal-flow header and the toolbar is in a separate remaining-height grid row; the height flyout is outside the toolbar clip. GEN contrast uses explicit ivory/forest colours and inset geometry. A live browser interaction/responsive screenshot test could not be completed in this environment, and native Mac/Windows GUI testing remains unavailable.

All 16 local illustrations were encoded as lossless WebP. Every alpha value and visible RGB pixel was compared with the original PNG; values are identical. HTTP tests cover both outfit sets, their content types, lossless alpha, dimensions and bounds. Source image payload fell from 27.6 MB to 11.0 MB. Discarded long-hair suit images are excluded.

The final 2026.10.25.1 ZIP was extracted into its versioned directory and launched with the bundled Python entry point. HTTP checks verified the current homepage and workspace CSS/JavaScript, all sixteen local lossless outfit images, the four blueprint doors/window groups, current revision/no-cache headers, Kitchen generation and a Bedroom study-table request. ZIP CRC and every packaged SHA-256 manifest entry passed.

## 2026.10.25.2 validation

Six added frontend regressions cover room/style door defaults, nine distinct door meshes, ground/opening bounds at low and normal heights, privacy materials/locks, door controls, save/validation/undo/redo and luminance contrast with hysteresis. The supplied dark screenshot’s title region was sampled internally and selected a white heading. All nine actual door meshes were rasterized and visually inspected in an offscreen renderer. The revised foyer/separate-kitchen SVG was rasterized and visually inspected. Existing room shell bounds and placement/navigation tests remain in the suite.

The rendered-backdrop probe is throttled to one tiny sample per 300 ms, performs no work when no heading is mounted, and falls back to the wall/style colour if canvas readback is unavailable. A live browser camera-orbit test remains unavailable in this environment; screenshot classification, geometry and saved-data behaviour are covered by automated checks.

The 2026.10.25.2 archive was extracted and launched through its bundled entry point. HTTP checks verified the new revision, door labels/settings, adaptive-title CSS, both companion outfit sets, all foyer/kitchen blueprint groups, and room generation. ZIP CRC and every manifest hash passed.

## 2026.10.25.3 camera movement

The full frontend suite passes **144 tests**, including six camera regressions. Actual Three.js OrbitControls are used to verify that Up/Down translates the eye and focus equally across 48 view configurations, preserves direction/orbit distance/zoom, respects disabled controls, rejects invalid values, and restores room-facing and top views for compact/normal/large rooms at all four door orientations. A headless R3F integration mounts the camera rig, exercises its live ref, verifies that ordinary rerenders retain a panned view, switches top view, and checks ref cleanup. Panel event checks cover Up/Down, Orbit/Pan, reset, view switching and close; mouse/touch bindings retain wheel/pinch zoom and right-drag panning.

The full Python suite passes **101 tests** after building the current app. The delivered-JavaScript regression now also checks the new camera entry, up/down controls and reset action. Frontend lint and the production build pass. Existing furniture editor/geometry and blueprint files were compared byte-for-byte with the supplied archive and are unchanged; camera navigation does not alter layout objects, dimensions, saved content or undo history.

The camera flyout uses the existing grid row beneath the wrapping header, with a constrained mobile width and internal scrolling. Native macOS/Windows and live browser mouse/touch/responsive behaviour were not GUI-tested in this environment; input bindings, real orbit maths, scene integration and production delivery are covered by the checks above. Existing Vite bundle-size and dependency deprecation advisories remain non-fatal.

The full ZIP was extracted to its 2026.10.25.3 folder and launched using the bundled Python entry point. HTTP checks served the current revision, camera controls and CSS, existing door options, all sixteen Aira outfit assets, the foyer/kitchen blueprint and a generated kitchen. ZIP CRC and every SHA-256 manifest entry passed. Development dependencies, test temporary directories and internal review artifacts are excluded.
