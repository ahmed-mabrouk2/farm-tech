import json
import os

class FertilizerRequirementEngine:
    """
    Calculates the required nitrogen in kg N/ha and converts it to specific fertilizer amounts.
    fertilizer_use_efficiency is loaded from config/fertilizer_engine_config.json.
    """
    def __init__(self, config_dir: str):
        with open(os.path.join(config_dir, "crop_n_coefficients.json"), "r") as f:
            raw = json.load(f)
            # Strip comment keys (keys starting with _)
            self.crop_n_coefficients = {k: v for k, v in raw.items() if not k.startswith("_")}

        with open(os.path.join(config_dir, "fertilizer_types.json"), "r") as f:
            self.fertilizer_types = json.load(f)

        with open(os.path.join(config_dir, "fertilizer_engine_config.json"), "r") as f:
            engine_cfg = json.load(f)
        self.fertilizer_use_efficiency = float(engine_cfg.get("fertilizer_use_efficiency", 0.60))

    def calculate_requirements(self, field_data: dict) -> dict:
        """
        additional_N_required = max(0, ((yield_gap * crop_N_coefficient) - soil_N_supply) / fertilizer_use_efficiency)
        All units: yield_gap in ton/ha, N in kg N/ha, fertilizer in kg/ha.
        """
        required = ['crop', 'yield_gap', 'soil_N_supply', 'fertilizer_type']
        for r in required:
            if r not in field_data:
                raise ValueError(f"Missing required field for fertilizer calculation: {r}")

        crop = str(field_data['crop']).lower()
        coef = self.crop_n_coefficients.get(crop, self.crop_n_coefficients.get("default", 15.0))
        field_data['crop_N_coefficient'] = coef

        n_needed_by_crop = float(field_data['yield_gap']) * coef

        add_n = (n_needed_by_crop - float(field_data['soil_N_supply'])) / self.fertilizer_use_efficiency
        field_data['additional_N_required'] = max(0.0, add_n)
        field_data['equivalent_nitrogen_kg_ha'] = field_data['additional_N_required']

        fert_type = field_data['fertilizer_type']
        fert_n_fraction = self.fertilizer_types.get(fert_type, 0.46)

        field_data['Selected Fertilizer'] = fert_type
        field_data['recommended_fertilizer_amount'] = (
            field_data['additional_N_required'] / fert_n_fraction
            if fert_n_fraction > 0 else 0.0
        )

        return field_data
