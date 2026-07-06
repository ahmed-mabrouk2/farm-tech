import json
import os

class CropResponseEngine:
    """
    Defines crop-specific response factors to nitrogen addition based on biological principles.
    """
    def __init__(self, config_dir: str):
        with open(os.path.join(config_dir, "crop_response_factors.json"), "r") as f:
            self.crop_response_factors = json.load(f)

    def attach_response_factor(self, field_data: dict) -> dict:
        crop = str(field_data.get('crop', '')).lower()
        factor = self.crop_response_factors.get(crop, self.crop_response_factors.get("default", 0.5))
        field_data['crop_response_factor'] = factor
        return field_data
