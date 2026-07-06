import json
import os

class GrowthStageEngine:
    """
    Determines the biological growth stage of a crop based on Days After Planting (DAP).
    """
    def __init__(self, config_dir: str):
        with open(os.path.join(config_dir, "crop_growth_stages.json"), "r") as f:
            self.stages = json.load(f)

    def determine_stage(self, field_data: dict) -> dict:
        dap = field_data.get('DAP')
        if dap is None:
            field_data['current_growth_stage'] = "Unknown (DAP not available)"
            return field_data

        crop = str(field_data.get('crop', '')).lower()
        crop_stages = self.stages.get(crop, self.stages.get('default'))
        
        current_stage = "Unknown"
        for stage_info in crop_stages:
            if stage_info['start_dap'] <= dap <= stage_info['end_dap']:
                current_stage = stage_info['stage']
                break
        
        # Handle cases where DAP exceeds defined stages
        if current_stage == "Unknown" and dap > crop_stages[-1]['end_dap']:
            current_stage = "Post-Maturation / Harvest"
            
        field_data['current_growth_stage'] = current_stage
        return field_data
