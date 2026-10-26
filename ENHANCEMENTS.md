# Implemented changes

## Living room and Companions correction — 2026.10.25.1

- Replaced independent sofa/TV wall searches with one centered viewing axis and a close seating group. The TV faces the sofa, coffee-table reach stays practical, and chairs face the coffee table. Large rooms retain a floating seating group instead of stretching the viewing distance across the room. Very small rooms explain a TV omission instead of moving it to an unrelated wall.
- Corrected rug-border dimensions that formed long cross-shaped strips. Rebuilt the modern sectional with a forward-facing chaise and normal seat height, added upholstered modern lounge chairs, and softened the blue TV screen glow.
- Renamed the toolbar to **Companions**. **Pets**, **Accessories** and **Aira** are visible tabs. Aira's invitation appears above her preview, independently of the pet list or inspector.
- Replaced the large pet add-buttons with compact, clickable portrait cards and small Invite labels. There are no plus icons in pet invitations or accessory add controls. Artwork SVG sizing is restricted to portraits.
- Added a visible studio revision, matching server version endpoint and uncached entry page. If the default port is occupied, the launcher opens this copy on a free port instead of leaving users at the old server address. Explicitly requested busy ports still report an error.
- The release extracts to its own versioned folder to distinguish it from older copies. Existing saved/edited layouts are retained; generating a new living room applies the corrected planner.

## Room personality update

- Added practical room/style surface presets, bathroom stone/tile wet zones, kitchen subway backsplashes and continuous wall texture coordinates. The wall panels remain clipped to doors and the exact room footprint.
- Added visible style-specific ceiling fixtures: a brass globe chandelier, slim linear lighting, a lantern or an industrial cage. Room task lighting and selectable Warm/Neutral/Cool moods complement Auto styling.
- Gave Luxury its own tailored salon sofa geometry and refined forest/ivory/brass colours. Cozy/Bohemian living plans can use ottomans; Minimal/Compact bedrooms avoid optional dressers. Existing furniture design variations and individual styling remain editable.
- Added actual single-wall, L-shaped, galley and island kitchen configurations, labelled in the alternative selector. Style and affordability inform the first alternative without altering measured scores.
- Recognized study table, study desk, computer table and workstation requests. Bedroom study space is placed before optional storage, with correctly oriented task seating when it fits and explicit omissions when it does not.
- Replaced the planning graphic with a minimal, text-free architectural plan and removed its marketing overlays/statistics.
- Simplified pet invitations to quiet portrait cards; softened animal expressions and warm colours. Original life-simulation-inspired furniture/animal designs remain separate from the guest artwork.
- Restored native wheel/touch scrolling, removed duplicate landing navigation and parallax lag, reset scroll position on route changes, added reduced-motion-aware anchor navigation and improved narrow-screen layout.
- Aira now uses eight original 2D JRPG-style illustrations under Companions → Aira, continuously facing the viewer with automatic directional views or a chosen look. Height, dragging, removal, saves, undo and pet avoidance remain; the former 3D character is removed.

## Project audit fixes

- Numeric room and budget fields now accept normal intermediate typing, with limits applied on blur and generation.
- Linked dining movement respects locked chairs. Duplicated tables and chairs are independent of the original set.
- Palette undo/redo restores the associated wall, floor, cabinet and worktop colours together with the room style. Geometry-only undo preserves subsequent surface edits.
- Undo/redo snapshots capture a roaming pet's current position rather than restoring stale coordinates.
- Width/depth controls support thin wall art and lighting at their actual catalog dimensions.
- Saved layouts are validated individually. One damaged entry no longer hides valid saves, and malformed saved lists cannot be silently overwritten. Storage limits no longer discard older layouts automatically.
- Session persistence handles blocked/full storage without interrupting editing and displays a compact warning only when auto-save fails. Restored data is validated and cannot overwrite store actions.
- Older saved customizations receive default optional finishes instead of inheriting colours from another layout.
- Save, cost, suggestion and swap dialogs block underlying furniture/pet keyboard actions. Save/cost/suggestion dialogs now support Escape dismissal.
- Each local server instance owns its routes. Repeated app creation no longer mutates the engine's global app or appends duplicate static mounts.
- Invalid ports fail before dependency setup. Optional Electron startup checks actual engine imports and the Python version, skips the readiness wait when no runtime is found, drains health responses and safely cleans up owned child processes.

## Room and editor features

- Replaced generic anchors/collision nudges with semantic room plans, preserving wall attachment, a reserved entrance, connected kitchen modules and chair/table relationships.
- Shared one 44-item asset catalog between the Python engine, collision code, renderer and exports, including explicit widths/depths and mounting heights.
- Added detailed refrigerator doors, cooker burners and oven, dishwasher, sink and mixer, upper/pantry cabinets, extractor, microwave, island and stools.
- Rebuilt bathroom geometry: bowl and open toilet seat, tank and flush button, recessed basins, mixer taps, vanity/mirror, glass shower and rain head, tub and towel rail.
- Added dining tables/place settings, correctly oriented dining chairs, sideboards and linked dining-set movement.
- Improved direct manipulation with full quaternion yaw, collision-aware sliding, exact coordinates/dimensions, mounting heights, snapping, keyboard nudges, removal, duplication, tint, locking, undo/redo and reset.
- Added automatic wall cutaways and arrangement-aware camera positioning; removed generic unpriced decoration from the room shell.
- Replaced the studio image with a locally bundled architectural schematic using the existing ivory/forest/brass palette.
- Added consistent room/style selection, room palettes, floor/wall colors, tile size, grout, four tile patterns, cabinet/worktop colors and hardware finishes.
- Kept edited data canonical so named saves, cost totals, PDF and DXF reflect what is displayed. Retained honest catalog estimates and removed automatic fake discounts.
- Added a prebuilt browser app and isolated Python launch/setup for Mac and Windows. Runtime imports are checked before trusting setup, and `packaging` is an explicit dependency.
- Included automated placement, renderer, editor, API-boundary, export, startup and dependency-cache regressions. Detailed results are in VALIDATION.md.

The old generic optimizer could separate individual fixtures after anchoring them. The new generator evaluates complete constrained arrangements rather than claiming an unconstrained evolutionary result. UI wording now describes planning studies and reference scores accordingly.

## Follow-up checklist

| Request | Current implementation |
|---|---|
| Furniture varieties | Alternatives for all 44 catalog types; new utility-room models have visible structural variations. |
| Bathroom, office, kitchen and dining swaps | Complete alternatives, individual selection and saved/undoable changes. The menu no longer hides repeated furniture behind a type deduplication. |
| Dining chairs | Curved upholstered, spindle wood and steel-frame models; conventional seat height, connected back supports, inward-facing plans and linked table transforms. |
| Select and remove furniture | Preserved canvas/inspector selection, Delete button/key, locks, undo and canonical saves. |
| Kitchen extraction / air holes | Preserved over-hob extraction; added editable high wall ventilation grille/fan. |
| More details and decorations | Added decorated shelves, mirror/towel storage, framed art, wall lights and an office task chair; retained detailed appliances, utensils, place settings and bathroom fittings. |
| Furniture colours | Preserved individual tint/reset, cabinet/worktop colours and hardware finishes. |
| Wall decoration | Wallpaper plus editable framed art, wall lighting and display shelves. Mounted items follow wall cutaways. |
| Panels beyond room dimensions | Exact shell footprint, inward door hardware and a bounded shadow receiver; tested compact and rectangular rooms with all four door orientations. |
| White lines | Removed pale cap/skirting strips and artificial white tile-edge highlights; separated floor and contact-shadow surfaces to avoid depth fighting. Grout remains user-controlled. |

Existing working editor, surface controls, room/style selection, blueprint and launcher were retained. The new Swap dialog follows the ivory, forest and brass visual system.

## Lightweight pet companions

- Added a Companions control opening a compact, responsive panel matching the ivory, forest and brass interface.
- Added original chubby ginger-cat and fawn-pug meshes with animated walks, blinking, breathing, tails and relaxed resting poses.
- Implemented circular clearance against rotated furniture, floor/height-aware obstacles, bounded grid routing with corner checks, path smoothing, reachable goals, dynamic pet separation, replanning and accessory visits.
- Added native card drag-and-drop, click-to-add, captured pointer dragging with one undo entry, cancellation and camera-control release, floor-click call commands, per-pet stay/roam, pause-all, names, collar colours and removal.
- Added five pet furniture types and swap variations through the shared catalog, existing editor, estimates, saves and exports.
- Stored companion metadata with each layout and captured live positions on named saves without writing persisted state on every animation frame. Old furniture-only saves remain compatible.
- Kept generated history separate from user-added companions, retained the existing launch commands and added no runtime dependencies.

## 2026.10.25.1

- Aira stays upright during zoom/orbit, with stable horizontal facing near overhead views.
- Added an Eva-inspired crimson pilot suit with compact shoulder-length hair, eight illustrated views, a saved outfit selector, undo/redo and a matching preview. Classic artwork remains visually unchanged.
- Both sets of artwork use lossless WebP; decoded visible pixels and every alpha value were compared against the source PNGs. This lowers download and texture-loading overhead without changing the art.
- Replaced the planning illustration with a coherent one-bedroom plan: a central entrance hall, separate bedroom and bathroom, open living/kitchen, true wall openings, door swings and contained fixtures.
- Rebuilt the homepage with editorial photography, refined serif hierarchy, generous spacing, six room links, a clear process and a forest closing panel. Mobile styles and reduced motion are included.
- Header, layout selector and toolbar now occupy separate flow/grid rows. The toolbar scrolls within its remaining space. The height flyout sits outside its scroll clipping.
- The GEN history control has explicit ivory-on-forest contrast, an inset hit area, fixed icon dimensions and accessible labels.

## 2026.10.25.2

- Removed the room title’s fixed black colour and pale halo. A small throttled sample of the actual WebGL backdrop selects white/dark text as the camera, finishes and shadows change; room colour supplies a first-frame/fallback choice. Metadata labels follow the same tone while white controls remain readable.
- Added nine distinct door meshes with room/style defaults, colour and hardware overrides, privacy details and fitting within the existing opening. Surfaces → Doors exposes automatic and manual choices, saved per layout with undo/redo.
- Reworked the blueprint into separate kitchen/living rooms and a central foyer. The front door opens into the foyer; the adjacent wide opening leads to the living room. The kitchen has a separate door at the far end of the hall. Fixtures attach to appropriate walls, and arrival circulation stays clear. The blueprint asset is revisioned in its URL.

## Camera movement — 2026.10.25.3

- Added a quiet **View** toolbar entry with camera Up/Down buttons, an explicit Pan drag mode, Top/3D view and Reset view.
- Vertical commands translate the camera and orbit focus equally in world Y, preserving viewing direction and distance. Pending orbit/pan inertia is settled before exact commands.
- Primary mouse/one-finger dragging pans in Pan mode. Right-drag and two-finger pan/pinch remain available; Orbit mode retains room rotation and wheel zoom.
- Camera commands respect disabled orbit controls during scene manipulation. The flyout uses the existing header-aware grid row and closes competing editing/surface/height panels when opened.
- Object editing and its existing fixture mounting-height controls are unchanged.
