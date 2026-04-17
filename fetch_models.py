import os
import urllib.request

MODELS_DIR = os.path.join("frontend", "public", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# URL to a guaranteed valid binary GLB from the official Khronos glTF sample repository
VALID_GLB_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb"

furniture_types = ["sofa", "bed", "table", "chair", "wardrobe", "tvUnit"]

def create_glbs():
    print("Downloading valid GLB buffers...")
    for f in furniture_types:
        out_path = os.path.join(MODELS_DIR, f"{f}.glb")
        try:
            urllib.request.urlretrieve(VALID_GLB_URL, out_path)
            print(f"[OK] Downloaded {out_path}")
        except Exception as e:
            print(f"[ERROR] Failed to download {f}: {e}")

    # Create dataset.json
    dataset_path = os.path.join(MODELS_DIR, "dataset.json")
    dataset_json = """[
  {
    "type": "sofa",
    "modelUrl": "/models/sofa.glb",
    "dimensions": {"width": 2.10, "height": 0.8, "depth": 0.95},
    "styleTags": ["cozy", "modern", "luxury"]
  },
  {
    "type": "bed",
    "modelUrl": "/models/bed.glb",
    "dimensions": {"width": 2.10, "height": 0.6, "depth": 1.60},
    "styleTags": ["cozy", "minimal"]
  },
  {
    "type": "table",
    "modelUrl": "/models/table.glb",
    "dimensions": {"width": 1.00, "height": 0.45, "depth": 1.00},
    "styleTags": ["modern", "compact"]
  },
  {
    "type": "chair",
    "modelUrl": "/models/chair.glb",
    "dimensions": {"width": 0.85, "height": 0.9, "depth": 0.85},
    "styleTags": ["minimal", "luxury"]
  },
  {
    "type": "wardrobe",
    "modelUrl": "/models/wardrobe.glb",
    "dimensions": {"width": 1.40, "height": 2.2, "depth": 0.60},
    "styleTags": ["luxury", "modern"]
  },
  {
    "type": "tvUnit",
    "modelUrl": "/models/tvUnit.glb",
    "dimensions": {"width": 1.60, "height": 0.5, "depth": 0.45},
    "styleTags": ["modern", "minimal"]
  }
]"""
    with open(dataset_path, "w") as file:
        file.write(dataset_json)
    print(f"[OK] Created dataset.json at {dataset_path}")

if __name__ == "__main__":
    create_glbs()
