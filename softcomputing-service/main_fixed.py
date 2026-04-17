from __future__ import annotations

import math
import random
import time
import uuid
from dataclasses import dataclass
from typing import Dict, List, Literal, Tuple

import numpy as np
import skfuzzy as fuzz
from deap import algorithms, base, creator, tools
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import re
import spacy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: en_core_web_sm not found. Install with 'python -m spacy download en_core_web_sm'")
    nlp = None

RoomType = Literal["Bedroom", "Living Room"]
StyleChip = Literal["Cozy", "Minimal", "Modern", "Luxury", "Compact", "Bohemian", "Industrial", "Coastal"]
FurnitureType = Literal["sofa", "bed", "table", "chair", "wardrobe", "tvUnit", "plant", "floorLamp", "sideTable", "bookshelf"]

class OptimizeRequest(BaseModel):
    prompt: str = Field(min_length=4, max_length=600)

class NLPExtracted(BaseModel):
    roomType: RoomType
    lengthM: float = Field(ge=2.0, le=12.0)
    widthM: float = Field(ge=2.0, le=12.0)
    budgetINR: float = Field(ge=20000.0, le=1_000_000.0)
    styles: List[StyleChip] = Field(default_factory=list, max_length=5)
    styleSliders: Dict[StyleChip, float] = Field(default_factory=lambda: {"Cozy": 0.5, "Minimal": 0.5, "Modern": 0.5, "Luxury": 0.5, "Compact": 0.5})

class EvolutionPoint(BaseModel):
    generation: int
    bestFitness: float
    avgFitness: float

class FurnitureItem(BaseModel):
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

@dataclass(frozen=True)
class Spec:
    type: FurnitureType
    cost: float
    w: float
    d: float
    wall_bias: float

CATALOG: Dict[FurnitureType, Spec] = {
    "sofa": Spec("sofa", 48000.0, 2.10, 0.95, 0.75),
    "bed": Spec("bed", 52000.0, 2.10, 1.60, 0.90),
    "table": Spec("table", 18000.0, 1.00, 1.00, 0.10),
    "chair": Spec("chair", 12000.0, 0.50, 0.50, 0.25),
    "wardrobe": Spec("wardrobe", 35000.0, 1.40, 0.60, 0.95),
    "tvUnit": Spec("tvUnit", 22000.0, 1.60, 0.45, 0.95),
    "plant": Spec("plant", 4500.0, 0.50, 0.50, 0.15),
    "floorLamp": Spec("floorLamp", 6000.0, 0.40, 0.40, 0.60),
    "sideTable": Spec("sideTable", 4000.0, 0.45, 0.45, 0.40),
    "bookshelf": Spec("bookshelf", 15000.0, 1.20, 0.35, 0.95),
}

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

def choose_furniture(room_type: RoomType, density: float, styles: List[StyleChip] = None) -> List[FurnitureType]:
    """Style-aware furniture selection. Different styles produce different furniture sets."""
    styles = styles or []
    style_set = set(styles)
    
    if room_type == "Bedroom":
        base: List[FurnitureType] = ["bed", "wardrobe", "sideTable", "floorLamp"]
        # Style-conditional additions
        if "Minimal" not in style_set:
            base.append("tvUnit")
        if "Minimal" not in style_set and "Compact" not in style_set:
            base.append("table")
            base.append("chair")
        if any(s in style_set for s in ["Cozy", "Bohemian", "Coastal"]):
            base.append("plant")
        if any(s in style_set for s in ["Luxury", "Modern"]):
            base.append("plant")
        if "Bohemian" in style_set or "Cozy" in style_set:
            base.append("bookshelf")
    else:
        base = ["sofa", "tvUnit", "table", "floorLamp"]
        if "Minimal" not in style_set:
            base.append("wardrobe")
            base.append("sideTable")
        if "Compact" not in style_set:
            base.append("chair")
        if any(s in style_set for s in ["Cozy", "Bohemian", "Coastal"]):
            base.append("plant")
        if any(s in style_set for s in ["Luxury", "Modern", "Industrial"]):
            base.append("plant")
        if any(s in style_set for s in ["Bohemian", "Cozy", "Industrial"]):
            base.append("bookshelf")
    
    # Density-based extras
    chairs_count = 1 + (1 if density > 0.55 else 0) + (1 if density > 0.78 else 0)
    items: List[FurnitureType] = [t for t in base if t != "chair"] + ["chair"] * min(chairs_count, 2)
    if density > 0.55 and "plant" not in items:
        items.append("plant")
    if density > 0.72 and "bookshelf" not in items:
        items.append("bookshelf")
    return items

def rect_dims(spec: Spec, rot: float, scale: float) -> Tuple[float, float]:
    r = rot % (math.pi * 2)
    k = (r / (math.pi / 2.0)) % 2.0
    swap = abs(k - 1.0) < 0.35
    w, d = (spec.d, spec.w) if swap else (spec.w, spec.d)
    return w * scale, d * scale

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
        total_area += w * d
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
        f"Selected for strong constraint satisfaction: clearance {metrics['clearanceScorePct']:.0f}% and budget compliance {metrics['budgetCompliancePct']:.0f}%."
    )
    parts.append(
        f"Style alignment {metrics['styleAlignmentPct']:.0f}% reflects the fuzzy profile: openness {profile['openness_score']:.2f}, density {profile['furniture_density']:.2f}, budget sensitivity {profile['budget_sensitivity']:.2f}."
    )
    parts.append(
        f"Space utilization {metrics['spaceUtilizationPct']:.0f}% balances circulation (≥0.8m) with practical furniture placement."
    )
    return " ".join(parts)

def parse_prompt(prompt: str) -> tuple[NLPExtracted, List[FurnitureType]]:
    """
    NLP parser using spaCy + regex/keywords.
    Defaults for missing.
    """
    extracted = {
        "roomType": "Living Room",
        "lengthM": 5.0,
        "widthM": 4.0,
        "budgetINR": 145000.0,
        "styles": [],
        "styleSliders": {"Cozy": 0.5, "Minimal": 0.5, "Modern": 0.5, "Luxury": 0.5, "Compact": 0.5}
    }

    prompt_lower = prompt.lower()
    doc = nlp(prompt_lower) if nlp else None

    # Room type
    if re.search(r'(bed ?room|sleep)', prompt_lower):
        extracted["roomType"] = "Bedroom"
    elif re.search(r'(living|lounge|hall)', prompt_lower):
        extracted["roomType"] = "Living Room"

    # Matches '4x5', '4 x 5 m', '4m x 5m', '4 by 5', '4.5 by 3.5', '5m x 6m'
    dim_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:m|meters?)?\s*(?:[xX×]|by)\s*(\d+(?:\.\d+)?)\s*(?:m|meters?)?', prompt_lower)
    if dim_match:
        try:
            extracted["lengthM"] = float(dim_match.group(1))
            extracted["widthM"] = float(dim_match.group(2))
        except (ValueError, TypeError):
            pass  # Keep defaults

    # Budget — use word boundary \b before 'rs' to avoid matching inside 'meters'
    budget_match = re.search(r'(?:under|budget|\brs\b|₹)\s*([\d,]+(?:\.\d+)?)', prompt_lower)
    if budget_match:
        budget_str = budget_match.group(1).replace(',', '')
        if budget_str:
            try:
                extracted["budgetINR"] = float(budget_str)
            except (ValueError, TypeError):
                pass  # Keep default budget

    # Furniture (keywords)
    furn_keywords = {
        'sofa': ['sofa', 'couch', 'settee'],
        'bed': ['bed'],
        'table': ['table', 'desk', 'study table', 'coffee table', 'dining table'],
        'chair': ['chair', 'seat'],
        'wardrobe': ['wardrobe', 'closet', 'cupboard', 'almirah'],
        'tvUnit': ['tv', 'television', 'tv unit', 'tv stand'],
        'plant': ['plant', 'indoor plant', 'greenery'],
        'floorLamp': ['floor lamp', 'standing lamp', 'lamp stand'],
        'sideTable': ['side table', 'nightstand', 'bedside', 'bedside table', 'end table'],
        'bookshelf': ['bookshelf', 'bookcase', 'shelving unit', 'book shelf']
    }
    furn_req: List[FurnitureType] = []
    for furn, keys in furn_keywords.items():
        if any(re.search(r'\b' + k + r'\b', prompt_lower) for k in keys):
            furn_req.append(furn)

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

    return NLPExtracted(**extracted), furn_req

def optimize(req: OptimizeRequest) -> OptimizeResponse:
    # Parse prompt to extracted params
    extracted, furn_req_local = parse_prompt(req.prompt)

    # Seed for repeatability per request
    request_id = str(uuid.uuid4())
    seed = int(uuid.UUID(request_id)) % (2**32 - 1)
    rnd = random.Random(seed)

    inp = style_inputs(extracted.styles, extracted.styleSliders)
    profile = fuzzy_profile(inp)
    
    # If user explicitly requested furniture, use ONLY what they asked for.
    # Only fall back to generic items if user didn't mention any furniture.
    if furn_req_local:
        items = list(set(furn_req_local))
    else:
        generic_items = choose_furniture(extracted.roomType, profile["furniture_density"], extracted.styles)
        items = list(set(generic_items))

    room_w = float(extracted.widthM)
    room_l = float(extracted.lengthM)
    room_area = room_w * room_l
    clearance_m = 0.80

    # ========== SMART CAPACITY FILTER ==========
    # Each furniture type has a footprint area. Sum them up and compare to room area.
    # If total footprint > 40% of room area, start removing non-essential items.
    FOOTPRINT = {
        "bed": 1.9 * 2.1, "sofa": 2.0 * 0.85, "table": 1.2 * 0.8,
        "chair": 0.5 * 0.5, "wardrobe": 1.5 * 0.65, "tvUnit": 1.8 * 0.45,
        "plant": 0.5 * 0.5, "floorLamp": 0.4 * 0.4, "sideTable": 0.45 * 0.45,
        "bookshelf": 1.2 * 0.35,
    }
    # Priority: lower number = more essential (never remove)
    PRIORITY = {
        "bed": 0, "sofa": 0, "tvUnit": 1, "wardrobe": 1,
        "table": 2, "chair": 3, "sideTable": 4,
        "floorLamp": 5, "plant": 6, "bookshelf": 7,
    }
    MAX_FILL_RATIO = 0.40  # furniture should not cover more than 40% of the floor

    removed_items_info: List[RemovedItemInfo] = []
    total_footprint = sum(FOOTPRINT.get(t, 0.3) for t in items)

    if total_footprint > room_area * MAX_FILL_RATIO:
        # Sort items by priority (highest number = least essential, remove first)
        # Use a stable list of (priority, index, type) to remove from the back
        scored = sorted(enumerate(items), key=lambda x: -PRIORITY.get(x[1], 10))
        indices_to_remove = []
        current_fp = total_footprint
        for orig_idx, item_type in scored:
            if current_fp <= room_area * MAX_FILL_RATIO:
                break
            # Never remove priority 0 items
            if PRIORITY.get(item_type, 10) <= 0:
                continue
            fp = FOOTPRINT.get(item_type, 0.3)
            current_fp -= fp
            indices_to_remove.append(orig_idx)
            removed_items_info.append(RemovedItemInfo(
                type=item_type,
                reason=f"Room too small ({room_w}×{room_l}m = {room_area:.1f}m²). Removing {item_type} (footprint {fp:.2f}m²) to prevent overcrowding."
            ))
        # Remove in reverse index order to preserve indices
        for idx in sorted(indices_to_remove, reverse=True):
            items.pop(idx)

    # DEAP setup
    creator_name = f"FitnessMax_{request_id[:8]}"
    if not hasattr(creator, "FitnessMax"):
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    if not hasattr(creator, "Individual"):
        creator.create("Individual", list, fitness=creator.FitnessMax)

    toolbox = base.Toolbox()

    def rand_pos(max_w: float, max_l: float, wallish: float) -> Tuple[float, float]:
        # mix between center-biased and wall-biased sampling
        half_w = max_w / 2.0
        half_l = max_l / 2.0
        if rnd.random() < wallish:
            # near wall
            side = rnd.choice(["left", "right", "front", "back"])
            if side in ("left", "right"):
                x = (half_w - 0.25) * (1 if side == "right" else -1)
                z = rnd.uniform(-half_l + 0.4, half_l - 0.4)
            else:
                z = (half_l - 0.25) * (1 if side == "front" else -1)
                x = rnd.uniform(-half_w + 0.4, half_w - 0.4)
        else:
            x = rnd.uniform(-half_w + 0.6, half_w - 0.6)
            z = rnd.uniform(-half_l + 0.6, half_l - 0.6)
        return x, z

    def init_individual():
        genes: List[float] = []
        for t in items:
            spec = CATALOG[t]
            x, z = rand_pos(room_w, room_l, spec.wall_bias * 0.8)
            rot = rnd.choice([0.0, math.pi / 2.0, math.pi, 3 * math.pi / 2.0]) + rnd.uniform(-0.12, 0.12)
            scale = rnd.uniform(0.90, 1.10)
            genes.extend([x, z, rot, scale])
        return creator.Individual(genes)

    toolbox.register("individual", init_individual)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)

    # Ensure fitness returns tuple!
    def evaluate_deap(genome: List[float]) -> tuple:
        met, _ = compute_metrics(genome, items, room_w, room_l, float(extracted.budgetINR), profile, clearance_m, furn_req_local)
        return (met["fitness"],)

    toolbox.register("evaluate", evaluate_deap)
    toolbox.register("select", tools.selTournament, tournsize=3)

    def mate(a, b):
        # Blend positions/scales, swap rotations
        for i in range(0, len(a), 4):
            if rnd.random() < 0.55:
                a[i], b[i] = b[i], a[i]
            if rnd.random() < 0.55:
                a[i + 1], b[i + 1] = b[i + 1], a[i + 1]
            if rnd.random() < 0.35:
                a[i + 2], b[i + 2] = b[i + 2], a[i + 2]
            if rnd.random() < 0.45:
                alpha = 0.35
                x = a[i + 3]
                y = b[i + 3]
                lo = min(x, y) - alpha * abs(x - y)
                hi = max(x, y) + alpha * abs(x - y)
                a[i + 3] = rnd.uniform(lo, hi)
                b[i + 3] = rnd.uniform(lo, hi)
        return a, b

    toolbox.register("mate", mate)

    def mutate(individual):
        half_w = room_w / 2.0
        half_l = room_l / 2.0
        for i, t in enumerate(items):
            base = i * 4
            spec = CATALOG[t]
            if rnd.random() < 0.35:
                individual[base + 0] += rnd.gauss(0, 0.28)
            if rnd.random() < 0.35:
                individual[base + 1] += rnd.gauss(0, 0.28)
            if rnd.random() < 0.22:
                individual[base + 2] += rnd.gauss(0, 0.22)
            if rnd.random() < 0.25:
                individual[base + 3] += rnd.gauss(0, 0.05)

            individual[base + 0] = clamp(individual[base + 0], -half_w + 0.4, half_w - 0.4)
            individual[base + 1] = clamp(individual[base + 1], -half_l + 0.4, half_l - 0.4)
            individual[base + 2] = float(individual[base + 2] % (2 * math.pi))
            individual[base + 3] = clamp(individual[base + 3], 0.85, 1.20)

            # encourage wall bias items to drift toward walls
            if rnd.random() < 0.18 and spec.wall_bias > 0.8:
                toward = rnd.choice(["x", "z"])
                if toward == "x":
                    individual[base + 0] = (half_w - 0.25) * (1 if rnd.random() > 0.5 else -1)
                else:
                    individual[base + 1] = (half_l - 0.25) * (1 if rnd.random() > 0.5 else -1)
        return (individual,)

    toolbox.register("mutate", mutate)

    pop = toolbox.population(n=84)
    hof = tools.HallOfFame(8)
    stats = tools.Statistics(lambda ind: ind.fitness.values[0])
    stats.register("avg", np.mean)
    stats.register("max", np.max)

    evolution: List[EvolutionPoint] = []

    # Evaluate initial pop
    invalid = [i for i in pop if not i.fitness.valid]
    fits = list(map(toolbox.evaluate, invalid))
    for ind, fit in zip(invalid, fits):
        ind.fitness.values = fit

    ngen = 40
    cxpb = 0.55
    mutpb = 0.40

    for gen in range(ngen):
        pop = algorithms.varAnd(pop, toolbox, cxpb=cxpb, mutpb=mutpb)
        invalid = [i for i in pop if not i.fitness.valid]
        fits = list(map(toolbox.evaluate, invalid))
        for ind, fit in zip(invalid, fits):
            ind.fitness.values = fit
        hof.update(pop)

        record = stats.compile(pop)
        evolution.append(
            EvolutionPoint(generation=gen, bestFitness=float(record["max"]), avgFitness=float(record["avg"]))
        )

        pop = toolbox.select(pop, k=len(pop))

    top_inds = tools.selBest(list(hof), k=3)
    solutions: List[LayoutSolution] = []

    def relational_furniture_snap(decoded_items: List[Dict]) -> List[Dict]:
        """
        Dimension-aware deterministic placement engine.
        Uses actual 3D mesh dimensions to compute exact positions so nothing
        clips through walls or overlaps. Places furniture like a real interior designer.
        
        Coordinate system:
          - Center of room = (0, 0)
          - Back wall at z = -halfL,  Front wall at z = +halfL
          - Left wall at x = -halfW,  Right wall at x = +halfW
          
        Actual 3D mesh footprints (width x depth from FurnitureInstance.tsx):
          bed:      1.9 x 2.1  (frame), headboard at z_local = -0.9
          wardrobe: 1.5 x 0.65
          tvUnit:   1.8 x 0.45 (console only)
          sofa:     2.0 x 0.85 (with armrests ~2.25)
          table:    1.2 x 0.8
          chair:    ~0.5 x 0.5
        """
        items_dict = {i: item for i, item in enumerate(decoded_items)}
        halfW = room_w / 2.0
        halfL = room_l / 2.0
        
        def find_first(target_type):
            for i, it in items_dict.items():
                if it["type"] == target_type:
                    return it
            return None
        
        def find_all(target_type):
            return [it for it in items_dict.values() if it["type"] == target_type]

        is_bedroom = extracted.roomType == "Bedroom"
        WALL_GAP = 0.20  # Generous gap from wall to prevent mesh clipping outside room

        if is_bedroom:
            # ========== BEDROOM LAYOUT ==========
            # Back wall (z = -halfL): Bed, headboard flush against wall
            # Front wall (z = +halfL): TV unit, facing the bed
            # Right wall (x = +halfW): Wardrobe, flush against wall
            # Left wall (x = -halfW): Table + Chair (study corner)
            
            bed = find_first("bed")
            if bed:
                # Bed mesh: 1.9w x 2.1d. Headboard at z_local=-0.9 from center.
                # To flush headboard against back wall:
                #   bed_center_z + (-0.9 - 0.075) = -halfL  =>  bed_center_z = -halfL + 0.975
                # But the bed body extends +1.05 from center forward.
                # So the front of the bed is at: bed_center_z + 1.05
                bed_depth = 2.1
                bed_center_z = -halfL + (bed_depth / 2.0) + WALL_GAP
                bed["x"] = 0
                bed["z"] = bed_center_z
                bed["rot"] = 0  # Headboard at negative Z (towards back wall)

            tv = find_first("tvUnit")
            if tv:
                # TV console: 1.8w x 0.45d. Flush against front wall, facing bed.
                tv_depth = 0.45
                tv["x"] = 0
                tv["z"] = halfL - (tv_depth / 2.0) - WALL_GAP
                tv["rot"] = math.pi  # Face towards back wall (towards the bed)

            wardrobe = find_first("wardrobe")
            if wardrobe:
                # Wardrobe body is 0.65d but mirror panels protrude +0.36 from center.
                # When rotated -90deg, protrusion extends in +X direction.
                # Use 0.85m effective depth to keep everything inside.
                wd_depth = 0.85
                wardrobe["x"] = halfW - (wd_depth / 2.0) - WALL_GAP
                wardrobe["z"] = 0
                wardrobe["rot"] = -math.pi / 2  # Doors face left (inward)

            table = find_first("table")
            if table:
                # Study table: 1.2w x 0.8d.  Push against left wall.
                t_width = 1.2
                t_depth = 0.8
                table["x"] = -halfW + (t_depth / 2.0) + WALL_GAP
                table["z"] = -halfL * 0.15  # Slightly off center towards back
                table["rot"] = math.pi / 2  # Long side along left wall

            chairs = find_all("chair")
            if table and chairs:
                # Place chair in front of table (towards room center), not overlapping bed
                for ci, chair in enumerate(chairs):
                    chair["x"] = table["x"]  # Same X as table (along left wall)
                    # Use table depth to offset chair
                    t_depth = 0.8
                    chair["z"] = table["z"] + (t_depth / 2.0) + 0.5 + ci * 0.6 
                    chair["rot"] = math.pi  # Face towards the table
            elif chairs:
                # No table — put chairs near left wall mid-room
                for ci, chair in enumerate(chairs):
                    chair["x"] = -halfW + 0.5
                    chair["z"] = ci * 0.8
                    chair["rot"] = math.pi / 2

            sideTable = find_first("sideTable")
            if sideTable and bed:
                # Side table next to the bed (beside the headboard, offset from center)
                bed_w = 1.9
                sideTable["x"] = bed["x"] + (bed_w / 2.0) + 0.35  # Right of bed
                sideTable["z"] = bed["z"] - 0.5
                sideTable["rot"] = 0
                # Clamp to room
                if sideTable["x"] > halfW - 0.3:
                    sideTable["x"] = bed["x"] - (bed_w / 2.0) - 0.35  # Put left instead

            floorLamps = find_all("floorLamp")
            for fli, fl in enumerate(floorLamps):
                # Corner lamps - one near bed, one near study
                if fli == 0:
                    fl["x"] = halfW - 0.3
                    fl["z"] = -halfL + 0.3
                    fl["rot"] = 0
                else:
                    fl["x"] = -halfW + 0.3
                    fl["z"] = halfL - 0.3
                    fl["rot"] = 0

            plants = find_all("plant")
            for pi, pl in enumerate(plants):
                if pi == 0:
                    # Corner plant near front-right, well inside room
                    pl["x"] = halfW - 0.7
                    pl["z"] = halfL - 0.7
                    pl["rot"] = 0
                else:
                    pl["x"] = -halfW + 0.7
                    pl["z"] = -halfL + 0.7
                    pl["rot"] = 0

        else:
            # ========== LIVING ROOM LAYOUT ==========
            # Strategy: TV on back wall, Sofa facing it from middle,
            # Table between sofa and front wall, Chairs beside table,
            # Wardrobe on right wall, Bookshelf on left wall (far from sofa),
            # Floor lamp in a free corner, Plants in far corners.

            tv = find_first("tvUnit")
            if tv:
                tv_depth = 0.45
                tv["x"] = 0
                tv["z"] = -halfL + (tv_depth / 2.0) + WALL_GAP
                tv["rot"] = 0

            sofa = find_first("sofa")
            if sofa:
                sofa_depth = 1.0  # Account for L-sectional depth
                viewing_dist = min(2.0, room_l * 0.38)
                sofa["x"] = -0.3  # Slightly left to avoid center crowding from L-arm
                sofa["z"] = -halfL + viewing_dist + (sofa_depth / 2.0)
                sofa["rot"] = math.pi  # Face TV

            table = find_first("table")
            if table:
                # Coffee table in front of the sofa with generous gap
                sofa_front_z = (sofa["z"] + 0.55) if sofa else 0
                table["x"] = 0
                table["z"] = sofa_front_z + 0.75 + 0.4  # 75cm gap + table half-depth
                table["rot"] = 0

            chairs = find_all("chair")
            if chairs:
                if table:
                    n = len(chairs)
                    for ci, chair in enumerate(chairs):
                        # Place chairs to the SIDE of the table, not in front
                        side = 1 if ci % 2 == 0 else -1
                        chair["x"] = table["x"] + side * (0.6 + 0.3 * (ci // 2))
                        chair["z"] = table["z"]
                        chair["rot"] = -side * math.pi / 2  # Face inward towards table
                else:
                    for ci, chair in enumerate(chairs):
                        chair["x"] = -halfW + 0.5 + ci * 0.8
                        chair["z"] = halfL - 0.5
                        chair["rot"] = math.pi

            wardrobe = find_first("wardrobe")
            if wardrobe:
                # Wardrobe flush against right wall, towards front
                wd_depth = 0.85  # Account for protruding mirror panels
                wardrobe["x"] = halfW - (wd_depth / 2.0) - WALL_GAP
                wardrobe["z"] = halfL * 0.5  # Near front-right
                wardrobe["rot"] = -math.pi / 2

            # Living room decorative items: SPREAD to different corners/walls
            sideTable = find_first("sideTable")
            if sideTable and sofa:
                # Side table at the OPPOSITE end from L-arm (left side of sofa)
                sideTable["x"] = sofa["x"] - 1.5
                sideTable["z"] = sofa["z"] - 0.2
                sideTable["rot"] = 0
                # Clamp to room
                if sideTable["x"] < -halfW + 0.4:
                    sideTable["x"] = -halfW + 0.4

            floorLamps = find_all("floorLamp")
            for fli, fl in enumerate(floorLamps):
                if fli == 0:
                    # Floor lamp in FRONT-LEFT corner (far from sofa cluster)
                    fl["x"] = -halfW + 0.35
                    fl["z"] = halfL - 0.35
                    fl["rot"] = 0
                else:
                    # Second lamp in BACK-RIGHT corner
                    fl["x"] = halfW - 0.35
                    fl["z"] = -halfL + 0.35
                    fl["rot"] = 0

            plants = find_all("plant")
            for pi, pl in enumerate(plants):
                if pi == 0:
                    # Front-right corner
                    pl["x"] = halfW - 0.4
                    pl["z"] = halfL - 0.4
                    pl["rot"] = 0
                else:
                    # Back-left corner
                    pl["x"] = -halfW + 0.4
                    pl["z"] = -halfL + 0.4
                    pl["rot"] = 0

        # ========== UNIVERSAL: Bookshelf fallback ==========
        for it in items_dict.values():
            if it["type"] == "bookshelf":
                bs_depth = 0.35
                # Place bookshelf on LEFT wall, towards FRONT (away from sofa area)
                it["x"] = -halfW + (bs_depth / 2.0) + WALL_GAP
                it["z"] = halfL * 0.5  # Front half of left wall
                it["rot"] = math.pi / 2

        # ========== FINAL SAFETY CLAMP & COLLISION RESOLUTION ==========
        DIMS = {
            "bed":       (1.9, 2.1),
            "sofa":      (3.5, 1.6),   # L-sectional actual footprint
            "table":     (1.2, 0.8),
            "chair":     (0.55, 0.55),
            "wardrobe":  (1.6, 0.7),    # Slightly oversized for safety
            "tvUnit":    (1.8, 0.45),
            "bookshelf": (1.2, 0.35),
            "plant":     (0.5, 0.5),
            "floorLamp": (0.4, 0.4),
            "sideTable": (0.45, 0.45),
        }

        # Priority: higher = anchored in place, lower = gets nudged
        PRIORITY = {
            "bed": 10, "sofa": 9, "tvUnit": 8, "wardrobe": 7,
            "table": 6, "bookshelf": 5, "chair": 4,
            "sideTable": 3, "floorLamp": 2, "plant": 1,
        }

        def get_dims_rotated(item):
            fw, fd = DIMS.get(item["type"], (0.5, 0.5))
            if 0.3 * math.pi < abs(item["rot"]) % math.pi < 0.7 * math.pi:
                fw, fd = fd, fw
            return fw, fd

        def items_collide(a, b, gap=0.25):
            fwa, fda = get_dims_rotated(a)
            fwb, fdb = get_dims_rotated(b)
            dx = abs(a["x"] - b["x"])
            dz = abs(a["z"] - b["z"])
            return dx < (fwa + fwb) / 2.0 + gap and dz < (fda + fdb) / 2.0 + gap

        def clamp_item(item):
            fw, fd = get_dims_rotated(item)
            hw, hd = fw / 2.0, fd / 2.0
            margin = WALL_GAP + 0.08  # Extra 8cm safety margin
            item["x"] = max(-halfW + hw + margin, min(halfW - hw - margin, item["x"]))
            item["z"] = max(-halfL + hd + margin, min(halfL - hd - margin, item["z"]))

        # Smart capacity filter: remove excess small items if room is crowded
        total_footprint = sum(
            DIMS.get(it["type"], (0.5, 0.5))[0] * DIMS.get(it["type"], (0.5, 0.5))[1]
            for it in items_dict.values()
        )
        room_area = room_w * room_l
        if total_footprint > room_area * 0.42:
            # Remove lowest-priority items until under 40%
            sorted_items = sorted(items_dict.items(), key=lambda kv: PRIORITY.get(kv[1]["type"], 0))
            while total_footprint > room_area * 0.40 and sorted_items:
                key, removed = sorted_items.pop(0)
                if PRIORITY.get(removed["type"], 0) <= 3:  # Only remove small items
                    fw_r, fd_r = DIMS.get(removed["type"], (0.5, 0.5))
                    total_footprint -= fw_r * fd_r
                    del items_dict[key]

        # Sort items by priority (high priority stays, low priority moves)
        priority_sorted = sorted(items_dict.values(), key=lambda it: PRIORITY.get(it["type"], 0), reverse=True)

        GAP = 0.25  # 25cm clearance gap

        # Iterative collision resolution (max 12 iterations)
        for iteration in range(12):
            any_collision = False
            for i in range(len(priority_sorted)):
                it1 = priority_sorted[i]
                fw1, fd1 = get_dims_rotated(it1)

                for j in range(i + 1, len(priority_sorted)):
                    it2 = priority_sorted[j]
                    fw2, fd2 = get_dims_rotated(it2)

                    dx = abs(it1["x"] - it2["x"])
                    dz = abs(it1["z"] - it2["z"])
                    min_dist_x = (fw1 + fw2) / 2.0 + GAP
                    min_dist_z = (fd1 + fd2) / 2.0 + GAP

                    if dx < min_dist_x and dz < min_dist_z:
                        any_collision = True
                        pen_x = min_dist_x - dx
                        pen_z = min_dist_z - dz

                        # Always move the lower-priority item (it2, since sorted)
                        if pen_x < pen_z:
                            nudge = pen_x + 0.12
                            if it2["x"] > it1["x"]: it2["x"] += nudge
                            else: it2["x"] -= nudge
                        else:
                            nudge = pen_z + 0.12
                            if it2["z"] > it1["z"]: it2["z"] += nudge
                            else: it2["z"] -= nudge

            # Clamp after each iteration
            for it in items_dict.values():
                clamp_item(it)

            if not any_collision:
                break  # No more collisions, we're done

        return list(items_dict.values())

    for idx, ind in enumerate(top_inds):
        metrics, decoded = compute_metrics(ind, items, room_w, room_l, float(extracted.budgetINR), profile, clearance_m, furn_req_local)
        decoded = relational_furniture_snap(decoded)
        sol_items: List[FurnitureItem] = []
        for j, d in enumerate(decoded):
            t = d["type"]
            sol_items.append(
                FurnitureItem(
                    id=f"{t}-{j}",
                    type=t,
                    x=float(d["x"]),
                    z=float(d["z"]),
                    y=0.0,
                    rotationY=float(d["rot"]),
                    scale=float(d["scale"]),
                    costINR=float(CATALOG[t].cost),
                )
            )

        solutions.append(
            LayoutSolution(
                id=str(uuid.uuid4()),
                rank=1 if idx == 0 else (2 if idx == 1 else 3),
                room={"lengthM": float(extracted.lengthM), "widthM": float(extracted.widthM), "type": extracted.roomType},
                prompt=req.prompt,
                selectedStyles=extracted.styles,
                items=sol_items,
                metrics=Metrics(**metrics),
                explanation=build_explanation(metrics, profile),
                removedItems=removed_items_info,
            )
        )

    # Sort by computed fitness descending (safety)
    solutions.sort(key=lambda s: s.metrics.fitness, reverse=True)
    for i, s in enumerate(solutions):
        s.rank = 1 if i == 0 else (2 if i == 1 else 3)  # type: ignore[misc]

    return OptimizeResponse(
        requestId=request_id,
        generatedAtISO=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        evolution=evolution,
        solutions=solutions,
    )

app = FastAPI(title="LayoutMind X Soft Computing Engine", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/optimize", response_model=OptimizeResponse)
def optimize_endpoint(req: OptimizeRequest):
    try:
        return optimize(req)
    except Exception as exc:  # pragma: no cover - safety net
        # Log full traceback to server console for debugging
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))

