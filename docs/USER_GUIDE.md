# LayoutMind — Spatial Studio

A rebuilt LayoutMind studio with room-aware layouts, detailed kitchen and bathroom fixtures, aligned dining seating, a direct furniture editor and a matching ivory / forest / brass interface.

The ZIP contains the complete source, **ready-built frontend**, local fonts and imagery, shared asset catalog, Python service, tests and launch scripts. No API key is required.

## Run on Mac

Install Python **3.12** from python.org or, if you use Homebrew, `brew install python@3.12`. Extract the ZIP, open Terminal in the **LayoutMind-Studio-2026.10.25.3** folder and run:

```sh
python3.12 start.py
```

You can also run `bash run.command` from the project folder. The script finds an installed Python 3.12 or newer.

## Run on Windows

Install Python **3.12** with the Python launcher. Extract the ZIP, open PowerShell or Command Prompt in the **LayoutMind-Studio-2026.10.25.3** folder and run:

```powershell
py -3.12 start.py
```

Alternatively, double-click **run.bat**. If you installed Python without the `py` launcher, use `python start.py` with Python 3.12 selected.

## First launch

The launcher creates an isolated `.venv`, installs the Python requirements, checks that the engine imports successfully and opens **http://127.0.0.1:8000**. First setup needs an internet connection. Keep the terminal open while using the app; stop it with **Ctrl+C**.

The prebuilt browser app needs **no Node installation or frontend build**. Furniture, fonts, textures and the architectural blueprint are local. The 3D workspace requires a browser with WebGL/hardware acceleration.

If an older copy is still using port 8000, the launcher automatically selects a free port from 8001–8010 and opens that address. The terminal and Companions footer show revision **2026.10.25.3**. You can also choose an explicit port:

```sh
python3.12 start.py --port 8001
```

On Windows, substitute `py -3.12` for `python3.12`. The launcher does not terminate other applications. `--no-browser` starts the server without opening a tab; `--setup-only` installs and verifies dependencies without starting a server.

## Living room update

Generate a fresh living room to use the corrected facing TV/sofa layout, nearby coffee table and grouped seating. Previously saved or edited designs retain their positions. The new release extracts into its own **LayoutMind-Studio-2026.10.25.3** folder; run the launcher from that folder.

## Create a room

Open **Studio**, choose a room type and aesthetic direction, and optionally set exact dimensions and budget. The six room types are Living Room, Bedroom, Kitchen, Bathroom, Dining Room and Home Office. Eight styles are available: Modern, Luxury, Minimal, Cozy, Compact, Bohemian, Industrial and Coastal. Explicit room/dimension choices take precedence over the prompt.

Describe measurements in meters or feet. Budgets support INR amounts, `80k` and `2 lakh`. For example:

- `Luxury kitchen 5x4m with an island under 3 lakh`
- `Modern bathroom 3x3m with a bathtub and walk-in shower`
- `Minimal dining room 4x4m`
- `Cozy bedroom 4x4m with a study table and task chair`

New rooms start with room-aware finishes: bathroom tile/stone wet walls, kitchen backsplashes and practical floors, softer bedroom walls, and warmer timber or panelled living/dining interiors. Styles affect furniture geometry, finishes, furnishing choices and visible light fixtures. Luxury salon sofas differ from modern sectionals; desks, seating, cabinetry and lamps remain individually editable through Edit and Swap.

Kitchens have **Single-wall, L-shaped, Galley and Island** configurations when dimensions allow. Three alternatives appear by name in the workspace selector. An affordable configuration suited to the chosen style is preferred; compact rooms may have fewer feasible configurations. Explicit island requests are retained where circulation allows. Bedroom study-table/desk requests take priority over optional storage, with an explanation if a requested desk or chair cannot fit.

Under **Surfaces**, turn **Room-aware style defaults** on to restore the selected room/style's materials. Choosing a floor or wall material switches to manual finishes. Under Fixtures, **Lighting mood** offers Auto, Warm, Neutral and Cool. Named saves retain these preferences. Per-piece finish styles and tints remain independent of the room style.

Kitchen layouts use a connected appliance/cabinet run with a sink, prep worktop, cooker/oven and fridge. Where space permits, they include a dishwasher, upper cabinets, extractor, microwave, island and counter seating. Bathroom fixtures stay at walls, with a shower, toilet and basin/vanity; bathtubs fit where space permits. Dining chairs face the table and retain that relationship when the set is moved.

The generator evaluates complete room arrangements with hard bounds, entry space and fixture relationships. It does not randomly nudge individual fixtures into the middle of a room. Four planning studies produce three alternatives; the history shows those actual studies.

## Move the camera

Open **View** at the top of the workspace toolbar:

- **Up / Down** raises or lowers the camera and its focus together by **25 cm**, keeping the viewing angle and zoom distance.
- **Pan** lets you drag the view freely with the primary mouse button or one finger. Switch to **Orbit** to rotate again.
- **Reset view** returns to the room-facing starting view. **Top view / 3D view** switches the viewing angle.
- In Orbit mode, right-drag pans. On a touchscreen, two fingers pan and pinch to zoom; the mouse wheel zooms as before.

These are camera controls. They do not move furniture, change room dimensions or create layout undo entries. The separate **Height** tool still changes ceiling height.

## Edit the layout

Click **Edit** in the workspace toolbar, then select a piece in the scene or inspector.

- Drag the horizontal arrows to move and the rotation ring to turn. Snapping uses **5 cm / 5°** and can be disabled.
- Set exact X/Z coordinates, width, depth, size, rotation, finish style and tint. Wall/surface-mounted items also have a mounting-height field.
- Use **Arrow keys** to nudge 5 cm, or **Shift + Arrow** for 20 cm. **R** turns 15°, **Delete** removes, and **Escape** deselects.
- Add any of **44** furniture or fixture types. Duplicate, lock, unlock and delete are available. Room-relevant catalog entries appear first.
- Undo with **Ctrl/Cmd+Z**, redo with **Ctrl/Cmd+Shift+Z**, or reset the edited layout.
- Collision protection supports sliding along a blocked direction. Disable it when you deliberately want objects to overlap. Rugs and supported surface/wall objects use appropriate vertical layers.
- The dining table's **Move and rotate chairs with the table** option keeps the set together; turn it off for individual arrangements.
- Unlock linked chairs before moving the whole set. Duplicates are independent pieces. Undo/redo restores a room palette and its colours together.
- Switch to top view or orbit the room. The small gold direction marker shows an edited object's front. The initial camera follows the arrangement so fixture fronts are presented clearly.

Automatic wall cutaway reveals the interior as the camera moves. Choose **All walls** when you want to see the complete enclosure. Mounted accessories follow their supporting wall’s visibility so they do not appear to float in a cutaway. Select a mounted piece in the editor to reveal and adjust it, or use All walls. Floor-standing fixtures remain visible.

If browser storage is full or blocked, editing continues in memory and an auto-save notice appears. Keep the tab open until saving works again. Existing named layouts are retained when a new save fails; older saves are never removed automatically to make room.

## Swap furniture and add decorations

Click **Swap** in the workspace toolbar, select any individual piece, then choose a variation. Bathroom, kitchen, dining and office assets all have alternatives. Repeated chairs appear separately, so you can change one seat without changing the others. Swaps preserve position, rotation, dimensions and custom tint, and participate in undo and named saves. Locked pieces must be unlocked first.

The newer models include slab, shaker and fluted cabinet fronts; gas and induction ranges; French-door and single-door fridges; chimney, canopy and cylindrical extractors; oval pedestal tables; spindle, curved upholstered and steel-frame dining chairs; round and rectangular vanity mirrors; concealed cisterns; framed showers; and office task chairs. Prices are estimates for the selected variation, with the existing footprint retained.

Under **Edit → Add furniture or fixtures**, add framed art, wall sconces, decorated shelves, kitchen ventilation grilles or bathroom mirror cabinets. Appropriate rooms include accessories automatically where free wall space exists. Their positions, mounting heights, tint and design can be edited, and they can be removed like furniture. Kitchen plans include an extractor over the cooker and a high wall vent. Wallpaper is under **Surfaces → Walls**.

The room shell and shadow receiver fit the specified width and length. The oversized base, pale perimeter strips and coplanar shadow surface were removed or corrected. Tile grout is intentional and its colour and module size remain editable.

## Add a pet

Click **Companions** in the workspace toolbar. The **Companions** toolbar opens visible **Pets**, **Accessories** and **Aira** tabs.

The portrait cards use a small **Invite** action and support dragging onto the floor. Softer proportions, warm materials and readable silhouettes draw broad inspiration from cosy life-simulation games, using original models and artwork.

- Drag a **chubby ginger cat** or **fawn pug** card onto the room floor, or use its Add button. Each room can have up to four companions.
- Pets wander through reachable floor space, turn smoothly, avoid rotated furniture and each other, and pause to sniff or rest near their accessories. Their walking, blinking, breathing, tails and resting poses are animated.
- Drag an existing pet to reposition it. Select a pet and click clear floor to call it over; the pet follows a route to that spot. A pet told to stay will stay again after arriving.
- Rename a pet, change its collar colour, choose **Stay here / Let roam**, pause all roaming, or remove it. Undo/redo covers pet additions, changes, moves and removal.
- Add a bolster bed, feeding station, cat tree, sisal scratching post or toy basket from **Companions → Accessories**. Cards support drag-and-drop and Add buttons. Accessories open in the existing furniture editor for position, colour, size, rotation, deletion and swap variations; their estimates are included in the layout budget.

The pet panel and furniture editor stay separate. Roaming pauses during furniture editing and pet dragging, then routes update to the new arrangement. Companions belong to individual layouts; named saves include their names, collars, stay/roam settings and current positions. Automatic session restore keeps their placed positions. Pets are shown in the editable final layout; generated planning-history studies remain unchanged.

Everything runs locally with the existing browser launcher. The character meshes, animations, portraits and route planning are bundled with the project.

## Colors, walls and tiles

Click **Surfaces** in the toolbar:

- **Floor:** nine materials, custom color, grout color, tile-module size, and Square / Subway / Herringbone / Hexagon patterns.
- **Walls:** twelve wall finishes, custom colors and swatches, tile options and wall cutaway controls.
- **Fixtures:** eight room palettes, cabinet and worktop colors, plus Auto / Brass / Chrome / Black / Copper hardware finishes. Auto follows the selected aesthetic.
- **CAD:** export the edited plan to DXF, including actual width/depth, scale, rotation and a separate wall-fixture layer. Units are centimeters.

The toolbar also provides ceiling height, named local saves, cost details, furniture variants and PDF export. Named saves retain furniture edits, mounted positions, colors, patterns, materials and hardware choices. Saves are local to the browser/profile and URL origin; changing ports uses a different storage origin.

Prices are catalog planning estimates, not live quotes. Over-budget designs show their actual total instead of invented discounts. Edited footprints and costs update; style/planning scores remain reference estimates. Very small rooms may need compact worktop/table widths or omit optional pieces; omissions are explained. Layouts do not model construction services or certify building-code compliance.

## Develop or rebuild

For source development, use Node.js **22.12+** and Python **3.12**.

```sh
# From the root:
python3.12 start.py --setup-only

# Start the engine after activating .venv:
python -m uvicorn main_fixed:app --app-dir softcomputing-service --host 127.0.0.1 --port 8000
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` directly to the Python engine. Rebuild the production frontend with `npm run build`. The optional Express proxy remains in `backend/`; the normal launcher does not require it.

The engine and renderer share **softcomputing-service/catalog.json** as the source of asset dimensions, mount heights and estimates. Local +Z is every asset's forward direction. Layout semantics live in **room_planner.py**; detailed utility-room models live in **RoomSpecificFurniture.tsx**.

## Tests

```sh
cd frontend
npm ci
npm run lint
npm test
npm run build
```

From the root with `.venv` activated:

```sh
python -m pip install -r requirements-test.txt
python -m pytest softcomputing-service/tests tests -q
```

See **VALIDATION.md** for the checks actually performed and their limits. The source includes Electron development/build scripts for Windows; installed Electron bundles still need an external Python environment. Native Windows/macOS desktop execution has not been certified here. The included browser launcher is the primary cross-platform entry point.

Original author attribution and LICENSE are retained. Font licenses are included in `licenses/`.

## Optional room guest

Open **Companions → Aira**, then choose **Invite Aira** above her preview. She uses original adult JRPG-inspired **2D illustrations**, matching the earlier concept artwork. Eight directional illustrations change automatically as you orbit; the artwork turns horizontally to face you and stays upright as you orbit or zoom. The Look selector keeps a favourite illustration. The Outfit selector offers Classic and a crimson Eva-inspired pilot suit with compact shoulder-length hair; each has eight views. Drag her to move, adjust her height, or remove her here. Movement, outfit, look, removal and height changes support undo and named saves; existing guest saves load into the illustrated version. Pets avoid her floor footprint. She stays where placed. The previous 3D character geometry and thumbnail have been removed.

Artwork provenance and its generation prompt are in ASSET_NOTES.md.

## Doors and workspace readability

Open **Surfaces → Doors** for nine designs: Flush, Shaker, Raised panels, Vertical flutes, Frosted glass, Clear glass, Steel & glass, French pair and Ventilated. The automatic choice follows the room and style. Choose a door colour and hardware finish independently, or return to automatic styling. Door changes support undo/redo and named saves. Orbit to face the doorway to inspect it; automatic cutaway hides the wall nearest the camera.

The room heading and surrounding labels use white on dark rendered backgrounds and dark text on bright backgrounds. Colour follows camera changes and shadows, with a small transition band to prevent flicker. White controls retain dark labels.

The planning illustration now has a dedicated foyer opening into the living room, a separate kitchen farther along the hall, and separate bedroom/bathroom doors. The illustration URL includes the build revision to prevent an older cached diagram from appearing.
