from __future__ import annotations

import math
import random
import time
import uuid
from dataclasses import dataclass
from typing import Dict, List, Literal, Tuple

import numpy as np
import skfuzzy as fuzz
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import re
RoomType = Literal["Bedroom", "Living Room", "Kitchen", "Bathroom", "Dining Room", "Home Office"]
StyleChip = Literal["Cozy", "Minimal", "Modern", "Luxury", "Compact", "Bohemian", "Industrial", "Coastal"]
FurnitureType = Literal['sofa', 'bed', 'table', 'chair', 'wardrobe', 'tvUnit', 'plant', 'rug', 'floorLamp', 'sideTable', 'bookshelf', 'ottoman', 'dresser', 'kitchenCounter', 'kitchenIsland', 'stove', 'refrigerator', 'sink', 'dishwasher', 'wallCabinet', 'rangeHood', 'tallCabinet', 'microwave', 'barStool', 'toilet', 'shower', 'bathtub', 'vanity', 'towelRack', 'diningTable', 'diningChair', 'sideboard', 'desk', 'officeChair', 'wallArt', 'wallSconce', 'wallShelf', 'kitchenVent', 'bathroomCabinet', 'petBed', 'petBowls', 'catTree', 'scratchingPost', 'petToyBasket']

class OptimizeRequest(BaseModel):
    prompt: str = Field(min_length=4, max_length=600)
    explicitStyle: str = Field(default="", max_length=30)
    addPlants: bool = False
    addRugs: bool = False
    roomType: RoomType | None = None
    lengthM: float | None = Field(default=None,ge=2,le=15)
    widthM: float | None = Field(default=None,ge=2,le=15)
    budgetINR: float | None = Field(default=None,ge=20000,le=1000000)

class NLPExtracted(BaseModel):
    roomType: RoomType
    lengthM: float = Field(ge=2.0, le=15.0)
    widthM: float = Field(ge=2.0, le=15.0)
    budgetINR: float = Field(ge=20000.0, le=1_000_000.0)
    styles: List[StyleChip] = Field(default_factory=list, max_length=5)
    styleSliders: Dict[StyleChip, float] = Field(default_factory=lambda: {"Cozy": 0.5, "Minimal": 0.5, "Modern": 0.5, "Luxury": 0.5, "Compact": 0.5})

class EvolutionPoint(BaseModel):
    generation: int
    bestFitness: float
    avgFitness: float

class HistoryStepItem(BaseModel):
    widthM: float | None = None
    depthM: float | None = None
    groupId: str | None = None
    id: str
    type: FurnitureType
    x: float
    z: float
    y: float
    rotationY: float
    scale: float
    costINR: float

class HistoryStepMetrics(BaseModel):
    totalCostINR: float
    budgetINR: float
    budgetCompliancePct: float
    spaceUtilizationPct: float
    styleAlignmentPct: float
    clearanceScorePct: float
    comfortIndexPct: float
    fitness: float

class HistoryStep(BaseModel):
    doorWall: str | None = None
    generation: int
    items: List[HistoryStepItem]
    metrics: HistoryStepMetrics
    totalCostINR: float

class FurnitureItem(BaseModel):
    widthM: float | None = None
    depthM: float | None = None
    groupId: str | None = None
    id: str
    type: FurnitureType
    x: float
    z: float
    y: float
    rotationY: float
    scale: float
    costINR: float
class Metrics(BaseModel):
    totalCostINR: float
    budgetINR: float
    budgetCompliancePct: float
    spaceUtilizationPct: float
    styleAlignmentPct: float
    clearanceScorePct: float
    comfortIndexPct: float
    fitness: float

class RemovedItemInfo(BaseModel):
    type: str
    reason: str

class LayoutSolution(BaseModel):
    id: str
    rank: Literal[1, 2, 3]
    room: Dict[str, float | str]
    prompt: str
    selectedStyles: List[StyleChip]
    items: List[FurnitureItem]
    metrics: Metrics
    explanation: str
    removedItems: List[RemovedItemInfo] = Field(default_factory=list)

class OptimizeResponse(BaseModel):
    requestId: str
    generatedAtISO: str
    evolution: List[EvolutionPoint]
    solutions: List[LayoutSolution]
    history_steps: List[HistoryStep] = Field(default_factory=list)

@dataclass(frozen=True)
class Spec:
    type: FurnitureType
    cost: float
    w: float
    d: float
    wall_bias: float

from room_planner import CATALOG as CATALOG_DATA, make_plan, dimensions, bounds, intersects, kitchen_family
CATALOG: Dict[FurnitureType, Spec] = {t:Spec(t,s['costINR'],s['targetSizeM']['x'],s['targetSizeM']['z'],.9 if s['wallAnchored'] else .2) for t,s in CATALOG_DATA.items()}

def clamp(x: float, lo: float, hi: float) -> float:
    return float(max(lo, min(hi, x)))

def style_inputs(styles: List[StyleChip], sliders: Dict[StyleChip, float]) -> Dict[str, float]:
    def safe_float(v, default=0.5):
        try:
            return float(v) if v != '' else default
        except (ValueError, TypeError):
            return default
    raw = {k: clamp(safe_float(sliders.get(k, 0.5)), 0.0, 1.0) for k in ["Cozy", "Minimal", "Modern", "Luxury", "Compact"]}
    chosen = set(styles)
    for k in raw:
        if k in chosen:
            raw[k] = clamp(0.55 + 0.45 * raw[k], 0.0, 1.0)
        else:
            raw[k] = clamp(0.15 + 0.35 * raw[k], 0.0, 1.0)
    warmth = raw["Cozy"]
    minimalism = raw["Minimal"]
    luxury = raw["Luxury"]
    compactness = raw["Compact"]
    openness = clamp(0.7 * (1.0 - compactness) + 0.3 * minimalism, 0.0, 1.0)
    modern = raw["Modern"]
    minimalism = clamp(0.75 * minimalism + 0.25 * modern, 0.0, 1.0)
    openness = clamp(0.75 * openness + 0.25 * modern, 0.0, 1.0)
    return {
        "warmth": warmth,
        "minimalism": minimalism,
        "openness": openness,
        "luxury": luxury,
        "compactness": compactness,
    }

def fuzzy_profile(inp: Dict[str, float]) -> Dict[str, float]:
    x = np.linspace(0, 1, 101)
    def tri(a, b, c):
        return fuzz.trimf(x, [a, b, c])
    warmth = inp["warmth"]
    minimalism = inp["minimalism"]
    openness = inp["openness"]
    luxury = inp["luxury"]
    compactness = inp["compactness"]
    warm_low, warm_med, warm_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    min_low, min_med, min_high = tri(0, 0, 0.5), tri(0.2, 0.5, 0.8), tri(0.55, 1, 1)
    open_low, open_med, open_high = tri(0, 0, 0.5), tri(0.2, 0.55, 0.9), tri(0.6, 1, 1)
    lux_low, lux_med, lux_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    comp_low, comp_med, comp_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    dens_low, dens_med, dens_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    tone_cool, tone_neutral, tone_warm = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    open_out_low, open_out_med, open_out_high = tri(0, 0, 0.5), tri(0.2, 0.55, 0.9), tri(0.6, 1, 1)
    bud_low, bud_med, bud_high = tri(0, 0, 0.5), tri(0.2, 0.55, 0.9), tri(0.6, 1, 1)
    def interp(mf, v):
        return float(fuzz.interp_membership(x, mf, v))
    dens_agg = np.zeros_like(x)
    tone_agg = np.zeros_like(x)
    open_agg = np.zeros_like(x)
    bud_agg = np.zeros_like(x)
    r1 = min(interp(comp_high, compactness), interp(open_low, openness))
    dens_agg = np.fmax(dens_agg, np.fmin(r1, dens_high))
    r2 = min(interp(comp_med, compactness), interp(open_med, openness))
    dens_agg = np.fmax(dens_agg, np.fmin(r2, dens_med))
    r3 = min(interp(comp_low, compactness), interp(open_high, openness), interp(min_high, minimalism))
    dens_agg = np.fmax(dens_agg, np.fmin(r3, dens_low))
    r4 = min(interp(lux_high, luxury), interp(min_low, minimalism))
    dens_agg = np.fmax(dens_agg, np.fmin(r4, dens_med))
    r5 = min(interp(warm_high, warmth), interp(lux_med, luxury))
    tone_agg = np.fmax(tone_agg, np.fmin(r5, tone_warm))
    r6 = min(interp(min_high, minimalism), interp(warm_low, warmth))
    tone_agg = np.fmax(tone_agg, np.fmin(r6, tone_cool))
    r7 = min(interp(warm_med, warmth), interp(min_med, minimalism))
    tone_agg = np.fmax(tone_agg, np.fmin(r7, tone_neutral))
    r8 = min(interp(open_high, openness), interp(comp_low, compactness))
    open_agg = np.fmax(open_agg, np.fmin(r8, open_out_high))
    r9 = min(interp(open_med, openness), interp(comp_med, compactness))
    open_agg = np.fmax(open_agg, np.fmin(r9, open_out_med))
    r10 = min(interp(open_low, openness), interp(comp_high, compactness))
    open_agg = np.fmax(open_agg, np.fmin(r10, open_out_low))
    r11 = min(interp(lux_high, luxury), interp(comp_high, compactness))
    bud_agg = np.fmax(bud_agg, np.fmin(r11, bud_high))
    r12 = min(interp(min_high, minimalism), interp(lux_low, luxury))
    bud_agg = np.fmax(bud_agg, np.fmin(r12, bud_med))
    r13 = min(interp(lux_low, luxury), interp(comp_low, compactness), interp(open_high, openness))
    bud_agg = np.fmax(bud_agg, np.fmin(r13, bud_low))
    def safe_defuzz(agg: np.ndarray) -> float:
        if np.allclose(agg, 0.0):
            return 0.5
        return float(fuzz.defuzz(x, agg, "centroid"))
    dens = safe_defuzz(dens_agg)
    tone = safe_defuzz(tone_agg)
    open_out = safe_defuzz(open_agg)
    bud = safe_defuzz(bud_agg)
    return {
        "furniture_density": clamp(dens, 0.0, 1.0),
        "color_tone": clamp(tone, 0.0, 1.0),
        "openness_score": clamp(open_out, 0.0, 1.0),
        "budget_sensitivity": clamp(bud, 0.0, 1.0),
    }

def choose_furniture(room_type: RoomType,density: float,styles=None):
    return [t for t,s in CATALOG_DATA.items() if s['room']==room_type]

def rect_dims(spec: Spec, rot: float, scale: float) -> Tuple[float, float]:
    c, sn = abs(math.cos(rot)), abs(math.sin(rot))
    return (spec.w*c + spec.d*sn)*scale, (spec.w*sn + spec.d*c)*scale

def overlap_area(a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]) -> float:
    ax1, az1, ax2, az2 = a
    bx1, bz1, bx2, bz2 = b
    ix = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    iz = max(0.0, min(az2, bz2) - max(az1, bz1))
    return ix * iz

def separation(a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]) -> float:
    ax1, az1, ax2, az2 = a
    bx1, bz1, bx2, bz2 = b
    dx = max(0.0, max(bx1 - ax2, ax1 - bx2))
    dz = max(0.0, max(bz1 - az2, az1 - bz2))
    if dx == 0.0 and dz == 0.0:
        return 0.0
    return math.hypot(dx, dz)

def make_rect(x: float, z: float, w: float, d: float) -> Tuple[float, float, float, float]:
    return (x - w / 2.0, z - d / 2.0, x + w / 2.0, z + d / 2.0)

def wall_hug_score(x: float, z: float, room_w: float, room_l: float) -> float:
    half_w = room_w / 2.0
    half_l = room_l / 2.0
    dist = min(half_w - abs(x), half_l - abs(z))
    max_dist = min(half_w, half_l)
    return 1.0 - clamp(dist / max_dist, 0.0, 1.0)

def compute_metrics(
    genome: List[float],
    items: List[FurnitureType],
    room_w: float,
    room_l: float,
    budget_inr: float,
    profile: Dict[str, float],
    clearance_m: float,
    furn_req: List[FurnitureType] = None,
) -> Tuple[Dict[str, float], List[Dict]]:
    rects = []
    total_cost = 0.0
    total_area = 0.0
    boundary_viol = 0.0
    overlap = 0.0
    clearance_bad = 0.0

    # decode genome: per item [x, z, rot, scale]
    decoded = []
    for i, t in enumerate(items):
        spec = CATALOG[t]
        x = genome[i * 4 + 0]
        z = genome[i * 4 + 1]
        rot = genome[i * 4 + 2]
        scale = genome[i * 4 + 3]
        w, d = rect_dims(spec, rot, scale)
        r = make_rect(x, z, w, d)
        rects.append(r)
        total_cost += spec.cost
        total_area += 0 if t == "rug" else w * d
        decoded.append({"type": t, "x": x, "z": z, "rot": rot, "scale": scale, "w": w, "d": d})

        # boundary with small wall padding
        pad = 0.05
        if r[0] < -room_w / 2 + pad:
            boundary_viol += (-room_w / 2 + pad) - r[0]
        if r[2] > room_w / 2 - pad:
            boundary_viol += r[2] - (room_w / 2 - pad)
        if r[1] < -room_l / 2 + pad:
            boundary_viol += (-room_l / 2 + pad) - r[1]
        if r[3] > room_l / 2 - pad:
            boundary_viol += r[3] - (room_l / 2 - pad)

    for i in range(len(rects)):
        for j in range(i + 1, len(rects)):
            if items[i] == "rug" or items[j] == "rug":
                continue
            o = overlap_area(rects[i], rects[j])
            overlap += o
            gap = separation(rects[i], rects[j])
            if gap < clearance_m:
                clearance_bad += (clearance_m - gap)

    room_area = room_w * room_l
    utilization = clamp((total_area / room_area) * 100.0, 0.0, 100.0)

    # budget compliance
    if total_cost <= budget_inr:
        budget_compliance = 100.0
        budget_over = 0.0
    else:
        budget_over = total_cost - budget_inr
        budget_compliance = clamp((budget_inr / total_cost) * 100.0, 0.0, 100.0)

    # clearance score: based on average violations; more violation => lower score
    clearance_norm = clearance_bad / max(1.0, len(rects) * (len(rects) - 1) / 2.0)
    clearance_score = clamp(100.0 * math.exp(-2.2 * clearance_norm), 0.0, 100.0)

    # comfort index: mix openness preference with clearance
    comfort = clamp(0.55 * clearance_score + 45.0 * profile["openness_score"], 0.0, 100.0)

    # Prompt match score
    if furn_req:
        req_types = set(furn_req)
        present_types = set(item["type"] for item in decoded)
        match_pct = clamp(100.0 * len(req_types & present_types) / max(len(req_types), 1), 0.0, 100.0)
    else:
        match_pct = 100.0

    # style alignment: compare realized density + wall-hug with fuzzy expectations
    realized_density = clamp(total_area / room_area, 0.0, 1.0)
    density_target = clamp(0.55 * profile["furniture_density"] + 0.15, 0.12, 0.78)
    density_alignment = math.exp(-((realized_density - density_target) ** 2) / 0.025)

    # wall hugging for wall-biased furniture
    wh = 0.0
    wh_w = 1e-6
    for d in decoded:
        b = CATALOG[d["type"]].wall_bias
        wh += b * wall_hug_score(d["x"], d["z"], room_w, room_l)
        wh_w += b
    wh = wh / wh_w
    # if openness is high, penalize too much wall-hugging (should breathe)
    desired_wh = clamp(0.85 - 0.55 * profile["openness_score"], 0.25, 0.9)
    wh_alignment = math.exp(-((wh - desired_wh) ** 2) / 0.03)

    style_alignment = clamp(100.0 * (0.65 * density_alignment + 0.35 * wh_alignment), 0.0, 100.0)

    # Weighted fitness (higher is better); penalties are subtracted after scaling.
    boundary_pen = 22.0 * boundary_viol
    overlap_pen = 260.0 * overlap
    clearance_pen = 28.0 * clearance_bad
    budget_pen = (budget_over / max(1.0, budget_inr)) * (110.0 + 160.0 * profile["budget_sensitivity"])

    fitness = (
        0.25 * style_alignment
        + 0.20 * utilization
        + 0.20 * clearance_score
        + 0.20 * budget_compliance
        + 0.15 * match_pct
        - boundary_pen
        - overlap_pen
        - clearance_pen
        - budget_pen
    )

    metrics = {
        "totalCostINR": float(total_cost),
        "budgetINR": float(budget_inr),
        "budgetCompliancePct": float(budget_compliance),
        "spaceUtilizationPct": float(utilization),
        "styleAlignmentPct": float(style_alignment),
        "clearanceScorePct": float(clearance_score),
        "comfortIndexPct": float(comfort),
        "fitness": float(fitness / 100.0),  # normalized-ish for UI
    }
    return metrics, decoded

def build_explanation(metrics: Dict[str, float], profile: Dict[str, float]) -> str:
    parts = []
    parts.append(
        f"Estimated layout scores: clearance {metrics['clearanceScorePct']:.0f}% and budget compliance {metrics['budgetCompliancePct']:.0f}%."
    )
    parts.append(
        f"Style alignment {metrics['styleAlignmentPct']:.0f}% reflects the fuzzy profile: openness {profile['openness_score']:.2f}, density {profile['furniture_density']:.2f}, budget sensitivity {profile['budget_sensitivity']:.2f}."
    )
    parts.append(
        f"Space utilization {metrics['spaceUtilizationPct']:.0f}% uses catalog footprints. Clearance is scored against a 0.8m target; verify circulation in the final design."
    )
    return " ".join(parts)

def parse_prompt(prompt: str) -> tuple[NLPExtracted, List[FurnitureType]]:
    """
    Deterministic room, dimensions, budget and furniture parser.
    Defaults for missing.
    """
    extracted = {
        "roomType": "Living Room",
        "lengthM": 7.0,
        "widthM": 6.0,
        "budgetINR": 145000.0,
        "styles": [],
        "styleSliders": {"Cozy": 0.5, "Minimal": 0.5, "Modern": 0.5, "Luxury": 0.5, "Compact": 0.5}
    }

    prompt_lower = prompt.lower()

    # Room type
    if re.search(r'kitchen', prompt_lower):
        extracted["roomType"] = "Kitchen"
    elif re.search(r'bathroom|washroom|bath room', prompt_lower):
        extracted["roomType"] = "Bathroom"
    elif re.search(r'dining', prompt_lower):
        extracted["roomType"] = "Dining Room"
    elif re.search(r'office|study room', prompt_lower):
        extracted["roomType"] = "Home Office"
    elif re.search(r'(bed ?room|sleep)', prompt_lower):
        extracted["roomType"] = "Bedroom"
    elif re.search(r'(living|lounge|hall)', prompt_lower):
        extracted["roomType"] = "Living Room"

    # Matches '4x5', '4 x 5 m', '4m x 5m', '4 by 5', '4.5 by 3.5', '5m x 6m', '7 meter by 6 meter'
    dim_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:m(?:eters?|etres?)?|ft|feet|foot)?\s*(?:[xX×]|by)\s*(\d+(?:\.\d+)?)\s*(?:m(?:eters?|etres?)?|ft|feet|foot)?', prompt_lower)
    if dim_match:
        try:
            v1 = float(dim_match.group(1))
            v2 = float(dim_match.group(2))
            if re.search(r"(?:ft|feet|foot)\b", dim_match.group(0)):
                v1 *= 0.3048
                v2 *= 0.3048
            # Clamp to allowed range
            extracted["lengthM"] = max(2.0, min(15.0, v1))
            extracted["widthM"] = max(2.0, min(15.0, v2))
        except (ValueError, TypeError):
            pass  # Keep defaults

    # Budget — parse in priority order:
    # 1. Lakh notation: "2 lakh", "1.5 lakhs", "under 2 lakh" (Indian system)
    # 2. Symbol/keyword + number: "₹4,50,000", "rs 150000", "budget 200000"
    lakh_match = re.search(r'(?:under|budget|rs|₹|inr|of|=|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*lakh', prompt_lower)
    if lakh_match:
        try:
            val = float(lakh_match.group(1)) * 100_000
            extracted["budgetINR"] = max(20_000.0, min(1_000_000.0, val))
        except (ValueError, TypeError):
            pass
    else:
        budget_match = re.search(r'(?:under|budget|\brs\b|₹|inr)\s*([\d,\.]+)\s*(k)?', prompt_lower)
        if budget_match:
            budget_str = budget_match.group(1).replace(',', '').strip('.')
            if budget_str:
                try:
                    val = float(budget_str) * (1000 if budget_match.group(2) else 1)
                    extracted["budgetINR"] = max(20_000.0, min(1_000_000.0, val))
                except (ValueError, TypeError):
                    pass  # Keep default budget

    # Furniture (keywords)
    furn_keywords = {
        'sofa': ['sofa', 'couch', 'settee'],
        'bed': ['bed'],
        'table': ['table', 'coffee table'],
        'chair': ['chair', 'seat'],
        'wardrobe': ['wardrobe', 'closet', 'cupboard', 'almirah'],
        'tvUnit': ['tv', 'television', 'tv unit', 'tv stand'],
        'plant': ['plant', 'indoor plant', 'greenery'],
        'floorLamp': ['floor lamp', 'standing lamp', 'lamp stand'],
        'sideTable': ['side table', 'nightstand', 'bedside', 'bedside table', 'end table'],
        'bookshelf': ['bookshelf', 'bookcase', 'shelving unit', 'book shelf'],
        'rug': ['rug', 'carpet', 'area rug', 'floor rug'],
    }
    furn_keywords.update({
        'ottoman': ['ottoman', 'pouf'], 'dresser': ['dresser'],
        'kitchenCounter': ['kitchen counter', 'countertop', 'counter', 'cabinet'], 'sink': ['sink'],
        'stove': ['stove', 'oven', 'cooktop'], 'refrigerator': ['fridge', 'refrigerator'],
        'toilet': ['toilet', 'wc'], 'bathtub': ['bathtub', 'bath tub', 'tub'],
        'shower': ['shower'], 'vanity': ['vanity', 'wash basin'],
        'kitchenIsland': ['kitchen island','island'], 'dishwasher':['dishwasher'],
        'wallCabinet':['wall cabinet','upper cabinet'], 'rangeHood':['range hood','extractor','chimney'],
        'tallCabinet':['pantry','tall cabinet'], 'microwave':['microwave'],
        'diningTable':['dining table'], 'diningChair':['dining chair'],
        'sideboard':['sideboard'], 'desk':['desk','writing desk','study table','study desk','computer table','work table','workstation'], 'barStool':['bar stool'],
        'towelRack':['towel rack','towel rail'],
        'officeChair':['office chair','task chair'], 'wallArt':['painting','wall art','art print'],
        'wallSconce':['wall light','sconce'], 'wallShelf':['wall shelf','display shelf'],
        'kitchenVent':['air hole','ventilation','vent grille','air vent'],
        'bathroomCabinet':['mirror cabinet','bathroom cabinet'],
    })
    furn_req: List[FurnitureType] = []
    remaining = prompt_lower
    aliases = sorted(((key, furn) for furn, keys in furn_keywords.items() for key in keys), key=lambda x: -len(x[0]))
    for key, furn in aliases:
        pattern = r'\b' + re.escape(key).replace(r'\ ', r'\s+') + r's?\b'
        for match in list(re.finditer(pattern, remaining)):
            prefix = remaining[max(0, match.start()-20):match.start()]
            if not re.search(r'(?:no|without|exclude)\s+(?:(?:a|any)\s+)?$', prefix) and furn not in furn_req:
                furn_req.append(furn)
        remaining = re.sub(pattern, lambda m: ' '*len(m.group()), remaining)

    # Styles
    style_keywords = {
        "Modern": ["modern"],
        "Minimal": ["minimal", "simple"],
        "Cozy": ["cozy", "warm"],
        "Luxury": ["luxury", "luxurious"],
        "Compact": ["compact", "small"],
        "Bohemian": ["boho", "bohemian"],
        "Industrial": ["industrial", "factory"],
        "Coastal": ["coastal", "beach", "ocean"]
    }
    for style, keys in style_keywords.items():
        if any(k in prompt_lower for k in keys):
            extracted["styles"].append(style)

    # Preference for openness
    if re.search(r'(spacious|open|airy)', prompt_lower):
        extracted["styleSliders"]["Compact"] = 0.2  # low compact = high open
    elif re.search(r'(compact|tight)', prompt_lower):
        extracted["styleSliders"]["Compact"] = 0.8

    extracted["styles"] = extracted["styles"][:5] or ["Modern"]
    return NLPExtracted(**extracted), furn_req

def metrics_for_plan(items,width,length,budget,profile):
    cost=sum(CATALOG_DATA[it['type']]['costINR'] for it in items)
    floor=[it for it in items if it['y']<.1 and it['type']!='rug']
    area=sum(dimensions(it)[0]*dimensions(it)[1] for it in floor)
    # Check usable approach points for fixtures. Adjacent kitchen modules are a run,
    # not aisle obstacles. Chairs are intentionally grouped around a table.
    service={'toilet','vanity','shower','sink','stove','refrigerator','dishwasher','kitchenCounter','wardrobe','desk'}
    tested=0;clear=0
    for it in floor:
        if it['type'] not in service:continue
        tested+=1
        distance=dimensions(it)[1]/2+.35
        x=it['x']+math.sin(it['rot'])*distance;z=it['z']+math.cos(it['rot'])*distance
        usable=abs(x)<width/2-.04 and abs(z)<length/2-.04
        for other in floor:
            if other is it:continue
            hx,hz=bounds(other)
            if abs(x-other['x'])<hx+.07 and abs(z-other['z'])<hz+.07:usable=False
        clear+=int(usable)
    clearance=100*clear/max(1,tested) if tested else 100.
    compliance=100. if cost<=budget else 100*budget/cost
    utilization=min(100,100*area/(width*length))
    style_score=100. # All rendered catalog variants use the selected finish palette.
    comfort=.75*clearance+25*profile['openness_score']
    fitness=(.45*clearance+.25*compliance+.20*style_score+.10*comfort)/100
    return dict(totalCostINR=cost,budgetINR=budget,budgetCompliancePct=compliance,
                spaceUtilizationPct=utilization,styleAlignmentPct=style_score,
                clearanceScorePct=clearance,comfortIndexPct=comfort,fitness=fitness)


def optimize(req: OptimizeRequest) -> OptimizeResponse:
    extracted,requested=parse_prompt(req.prompt)
    if req.roomType:extracted.roomType=req.roomType
    if req.widthM is not None:extracted.widthM=req.widthM
    if req.lengthM is not None:extracted.lengthM=req.lengthM
    if req.budgetINR is not None:extracted.budgetINR=req.budgetINR
    valid=['Cozy','Minimal','Modern','Luxury','Compact','Bohemian','Industrial','Coastal']
    if req.explicitStyle in valid:
        extracted.styles=[req.explicitStyle]+[style for style in extracted.styles if style!=req.explicitStyle][:4]
    style=extracted.styles[0] if extracted.styles else 'Modern'
    profile=fuzzy_profile(style_inputs(extracted.styles,extracted.styleSliders))
    plants=req.addPlants and not re.search(r'(?:no|without|exclude)\s+(?:any\s+)?plants?\b',req.prompt.lower())
    rugs=req.addRugs and not re.search(r'(?:no|without|exclude)\s+(?:any\s+)?rugs?\b',req.prompt.lower())
    width,length,budget=float(extracted.widthM),float(extracted.lengthM),float(extracted.budgetINR)
    candidates=[];history=[];evolution=[];scores=[]
    for variant in range(4):
        items,omitted,door=make_plan(width,length,extracted.roomType,style,requested,plants,rugs,variant)
        metrics=metrics_for_plan(items,width,length,budget,profile)
        converted=[]
        for index,item in enumerate(items):
            converted.append(FurnitureItem(id=f"{item['type']}-{index}",type=item['type'],x=item['x'],z=item['z'],y=item['y'],rotationY=item['rot'],scale=item['scale'],
                widthM=item.get('widthM'),depthM=item.get('depthM'),groupId=item.get('groupId'),costINR=CATALOG_DATA[item['type']]['costINR']))
        explanation=(f"{style} {extracted.roomType.lower()}: room-aware planning keeps wall fixtures backed by a wall, reserves an entrance and turns seating toward its table. "
            "Kitchen appliances form a connected worktop run; upper cabinets have explicit mounting heights. " if extracted.roomType=='Kitchen' else
            f"{style} {extracted.roomType.lower()}: room-aware planning keeps fixtures at walls, preserves a central entrance and maintains furniture relationships. ")
        if extracted.roomType=='Kitchen':explanation+=f"Configuration: {kitchen_family(items)}. "
        explanation+='Costs are catalog estimates. Approach scores are planning aids, not a building-code assessment.'
        sol=LayoutSolution(id=str(uuid.uuid4()),rank=1,room={'type':extracted.roomType,'widthM':width,'lengthM':length,'doorWall':door,**({'layoutKind':kitchen_family(items)} if extracted.roomType=='Kitchen' else {})},prompt=req.prompt,selectedStyles=extracted.styles or ['Modern'],
            items=converted,metrics=Metrics(**metrics),explanation=explanation,removedItems=[RemovedItemInfo(**item) for item in omitted])
        candidates.append(sol);scores.append(metrics['fitness'])
        history.append(HistoryStep(generation=variant+1,doorWall=door,items=[HistoryStepItem(**item.model_dump()) for item in converted],metrics=HistoryStepMetrics(**metrics),totalCostINR=metrics['totalCostINR']))
        evolution.append(EvolutionPoint(generation=variant+1,bestFitness=max(scores),avgFitness=sum(scores)/len(scores)))
    preferred_kitchen={'Luxury':'Island','Modern':'L-shaped','Minimal':'Single-wall','Compact':'Single-wall','Cozy':'L-shaped','Bohemian':'Island','Industrial':'Galley','Coastal':'L-shaped'}
    # Prefer a style's practical configuration when it fits the budget. Keep
    # the measured scores intact rather than inflating them for this ordering.
    candidates.sort(key=lambda sol:(int(extracted.roomType=='Kitchen' and sol.room.get('layoutKind')==preferred_kitchen[style] and sol.metrics.budgetCompliancePct>=100),sol.metrics.fitness,len(sol.items)),reverse=True)
    solutions=candidates[:3]
    for index,solution in enumerate(solutions):solution.rank=index+1
    # Keep each history study's door orientation with its items.
    return OptimizeResponse(requestId=str(uuid.uuid4()),generatedAtISO=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),solutions=solutions,evolution=evolution,history_steps=history)

app=FastAPI(title='LayoutMind Spatial Studio',version='2.0.0')
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_methods=['*'],allow_headers=['*'])
@app.get('/health')
def health():return {'ok':True}
@app.post('/optimize',response_model=OptimizeResponse)
def optimize_endpoint(req:OptimizeRequest):return optimize(req)
