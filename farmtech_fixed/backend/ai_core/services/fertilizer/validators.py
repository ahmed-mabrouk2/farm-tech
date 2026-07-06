import os
import json

class InputValidator:
    """
    Validates input ranges and required fields. Never synthesizes data.
    Raises ValueError for missing or wildly invalid data.
    """
    def __init__(self, config_dir: str):
        with open(os.path.join(config_dir, "crop_calendar.json"), "r") as f:
            self.valid_crops = list(json.load(f).keys())
            
        with open(os.path.join(config_dir, "fertilizer_types.json"), "r") as f:
            self.valid_fertilizers = list(json.load(f).keys())

    def validate(self, field_data: dict) -> dict:
        # Check required keys
        req = ['crop', 'predicted_yield', 'soil_nitrogen', 'soil_soc', 'soil_ph', 
               'soil_cec', 'soil_clay', 'soil_moisture', 'fertility_index',
               'water_balance', 'water_availability', 'heat_stress', 'fertilizer_type',
               'plant_date', 'current_date']
               
        for r in req:
            if r not in field_data:
                raise ValueError(f"Missing required field: {r}")

        crop = str(field_data['crop']).lower()
        if crop not in self.valid_crops:
            raise ValueError(f"Crop '{crop}' is not supported. Valid: {self.valid_crops}")
            
        fert = field_data['fertilizer_type']
        if fert not in self.valid_fertilizers:
            raise ValueError(f"Fertilizer '{fert}' is not supported. Valid: {self.valid_fertilizers}")

        # Check bounds for critical fields
        bounds = {
            'predicted_yield': (0, 150),
            'soil_ph': (3, 10),
            'soil_soc': (0, 100), # Percentage
            'soil_nitrogen': (0, 5), # Percentage
            'fertility_index': (0, 1),
            'water_balance': (0, 1),
            'water_availability': (0, 1),
            'heat_stress': (0, 1)
        }
        
        for k, (min_v, max_v) in bounds.items():
            val = float(field_data[k])
            if not (min_v <= val <= max_v):
                raise ValueError(f"Value out of bounds for {k}: {val}. Must be between {min_v} and {max_v}")
                
        # Monthly indices bounds (-1 to 1) for Advanced mode
        for p in ['ndre', 'ndvi', 'evi']:
            for m in range(1, 13):
                key = f"{p}_m{m:02d}"
                if key in field_data:
                    val = float(field_data[key])
                    if not (-1.0 <= val <= 1.0):
                        raise ValueError(f"Index {key} out of bounds: {val}")
                        
        # Basic mode bounds
        for p in ['season_ndre_mean', 'season_ndvi_mean', 'season_evi_mean']:
            if p in field_data:
                val = float(field_data[p])
                if not (-1.0 <= val <= 1.0):
                    raise ValueError(f"Seasonal index {p} out of bounds: {val}")

        return field_data
