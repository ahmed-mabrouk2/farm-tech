import json
import os
import numpy as np

class NutrientIndexEngine:
    """
    Builds a weighted Nitrogen Health Index (NHI) from seasonal satellite features and soil data.
    """
    def __init__(self, config_dir: str):
        with open(os.path.join(config_dir, "nhi_weights.json"), "r") as f:
            self.weights = json.load(f)
        with open(os.path.join(config_dir, "nhi_thresholds.json"), "r") as f:
            self.thresholds = json.load(f)

    def calculate_nhi(self, field_data: dict) -> dict:
        """
        Computes NHI and nitrogen_status.
        """
        # Define normalization bounds for features
        bounds = {
            'season_ndre_mean': (0, 0.8),
            'season_ndvi_mean': (0, 0.9),
            'season_evi_mean': (0, 0.8),
            'soil_nitrogen': (0, 0.2),
            'fertility_index': (0, 1.0),
            'soil_soc': (0, 2.5),
            'soil_moisture': (0, 0.4),
            'water_balance': (0, 1.0),
            'water_availability': (0, 1.0),
            'heat_stress': (0, 1.0)
        }

        nhi_raw = 0.0
        for feat, weight in self.weights.items():
            if feat not in field_data:
                raise ValueError(f"Missing required feature for NHI: {feat}")
            
            val = float(field_data[feat])
            min_v, max_v = bounds.get(feat, (0, 1.0))
            
            # Scale to 0-1
            scaled_val = np.clip((val - min_v) / (max_v - min_v + 1e-9), 0, 1)
            
            # Heat stress is inverted (high stress = bad)
            if feat == 'heat_stress':
                scaled_val = 1.0 - scaled_val
                
            nhi_raw += scaled_val * weight

        nhi = nhi_raw * 100.0
        field_data['NHI'] = nhi

        # Classification
        bins = self.thresholds['bins']
        labels = self.thresholds['labels']
        
        status = labels[-1]
        for i in range(len(bins)-1):
            if nhi <= bins[i+1]:
                status = labels[i]
                break
                
        field_data['nitrogen_status'] = status
        
        return field_data
