import json
import os
import numpy as np

class SoilSupplyEngine:
    """
    Estimates the nitrogen contribution from the soil using physical/chemical properties.
    """
    def __init__(self, config_dir: str):
        weights_path = os.path.join(config_dir, "soil_supply_weights.json")
        with open(weights_path, "r") as f:
            self.weights = json.load(f)

    def estimate_soil_supply(self, field_data: dict) -> dict:
        """
        Calculates soil_N_supply, soil_supply_class, and soil_fertility_score.
        """
        required = ['soil_nitrogen', 'soil_soc', 'soil_cec', 'soil_clay', 'soil_ph', 'soil_moisture', 'fertility_index']
        for r in required:
            if r not in field_data:
                raise ValueError(f"Missing required soil property: {r}")

        # Normalization assuming typical 95th percentiles (simplified for dictionary input)
        # Ideally, normalizations would be based on historical data distribution.
        # For the standalone engine, we use robust fixed upper bounds for normalization.
        norm_soc = np.clip(float(field_data['soil_soc']) / 2.5, 0, 1) # Assuming 2.5% is very high
        norm_n = np.clip(float(field_data['soil_nitrogen']) / 0.2, 0, 1) # Assuming 0.2% is very high
        
        # pH penalty: distance from 7.0
        ph = float(field_data['soil_ph'])
        ph_penalty = np.clip(1.0 - (abs(ph - 7.0) * 0.2), 0.2, 1.0)
        
        norm_moisture = np.clip(float(field_data['soil_moisture']) / 0.4, 0, 1) # VWC up to 0.4
        norm_fi = np.clip(float(field_data['fertility_index']), 0, 1) # Assuming already 0-1

        w = self.weights
        score = (
            (norm_n * w.get('soil_nitrogen', 0.3)) + 
            (norm_soc * w.get('soil_soc', 0.3)) + 
            (norm_fi * w.get('fertility_index', 0.2)) + 
            (ph_penalty * w.get('ph_penalty', 0.1)) + 
            (norm_moisture * w.get('soil_moisture', 0.1))
        )
        
        fertility_score = score * 100.0
        field_data['soil_fertility_score'] = fertility_score

        # Map to realistic N supply range [20, 150] kg N / ha
        min_supply = 20.0
        max_supply = 150.0
        field_data['soil_N_supply'] = min_supply + (score * (max_supply - min_supply))

        # Classify
        if fertility_score <= 20: cls = "Very Low"
        elif fertility_score <= 40: cls = "Low"
        elif fertility_score <= 60: cls = "Medium"
        elif fertility_score <= 80: cls = "High"
        else: cls = "Excellent"
        
        field_data['soil_supply_class'] = cls

        return field_data
