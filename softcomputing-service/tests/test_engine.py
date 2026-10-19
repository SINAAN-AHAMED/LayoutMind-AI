import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure softcomputing-service directory is in sys.path
service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if service_dir not in sys.path:
    sys.path.insert(0, service_dir)

from main_fixed import app, parse_prompt, fuzzy_profile, style_inputs, CATALOG

client = TestClient(app)

def test_health_endpoint():
    """Verify health check returns status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

def test_parse_prompt_bedroom():
    """Verify NLP parses a bedroom prompt with dimensions and budget."""
    prompt = "Create a modern cozy bedroom 5x4 meters with king bed, wardrobe and side table under 80000"
    extracted, items = parse_prompt(prompt)

    assert extracted.roomType == "Bedroom"
    assert extracted.lengthM == 5.0
    assert extracted.widthM == 4.0
    assert extracted.budgetINR == 80000.0
    assert "bed" in items
    assert "wardrobe" in items
    assert "Modern" in extracted.styles or "Cozy" in extracted.styles

def test_parse_prompt_living_room():
    """Verify NLP parses living room with sofa and tv unit."""
    prompt = "Spacious living room 7 by 6 m with sofa, tv unit and coffee table"
    extracted, items = parse_prompt(prompt)

    assert extracted.roomType == "Living Room"
    assert extracted.lengthM == 7.0
    assert extracted.widthM == 6.0
    assert "sofa" in items
    assert "tvUnit" in items

def test_fuzzy_profile_bounds():
    """Verify fuzzy inference outputs normalized metrics between 0 and 1."""
    inputs = style_inputs(["Cozy", "Modern"], {"Cozy": 0.8, "Modern": 0.7, "Minimal": 0.2, "Luxury": 0.3, "Compact": 0.4})
    profile = fuzzy_profile(inputs)

    assert "openness_score" in profile
    assert "furniture_density" in profile
    assert "budget_sensitivity" in profile
    assert "color_tone" in profile

    for k, v in profile.items():
        assert 0.0 <= v <= 1.0, f"Profile metric {k} out of bounds: {v}"

def test_optimize_endpoint_execution():
    """Verify /optimize returns valid layout solutions, evolution, and history steps."""
    payload = {
        "prompt": "Cozy minimal bedroom 4.5x4 with bed, side table and rug under 60000"
    }
    response = client.post("/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "solutions" in data
    assert len(data["solutions"]) > 0
    sol = data["solutions"][0]
    assert len(sol["items"]) > 0

    # Verify history steps exist
    assert "history_steps" in data
    assert len(data["history_steps"]) > 0

    # Verify evolution metrics
    assert "evolution" in data
    assert len(data["evolution"]) > 0

    # Verify furniture bounds stay within room dimensions
    half_w = float(sol["room"]["widthM"]) / 2.0
    half_l = float(sol["room"]["lengthM"]) / 2.0

    for item in sol["items"]:
        # x and z should be comfortably inside the walls
        assert -half_w <= item["x"] <= half_w, f"Item {item['type']} x={item['x']} outside room width"
        assert -half_l <= item["z"] <= half_l, f"Item {item['type']} z={item['z']} outside room length"
        assert item["costINR"] > 0
