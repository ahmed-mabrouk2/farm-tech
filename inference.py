import os
import json
import traceback

from validators import InputValidator
from engines.season_mapper import SeasonMapper
from engines.soil_supply_engine import SoilSupplyEngine
from engines.nhi_engine import NutrientIndexEngine
from engines.fertilizer_engine import FertilizerRequirementEngine
from engines.crop_response_engine import CropResponseEngine
from engines.recommendation_engine import RecommendationEngine
from engines.growth_stage_engine import GrowthStageEngine
from engines.fertilizer_schedule_engine import FertilizerScheduleEngine
from engines.reporting import ReportingEngine

def get_config_dir():
    return os.path.join(os.path.dirname(__file__), "config")

def run_recommendation(field_data: dict) -> dict:
    """
    Orchestrates the entire recommendation pipeline for a single field input.
    """
    config_dir = get_config_dir()
    
    try:
        # Load target yields
        with open(os.path.join(config_dir, "crop_target_yield.json"), "r") as f:
            target_yields = json.load(f)
            
        # 1. Validation
        val = InputValidator(config_dir)
        data = val.validate(field_data.copy())
        
        # 2. Assign Yield Gap
        crop = str(data['crop']).lower()
        
        # Read from new nested schema
        crop_target = target_yields.get(crop, target_yields.get("default", {"target_yield_t_ha": 10.0}))
        target_t_ha = float(crop_target.get("target_yield_t_ha", 10.0))
        
        pred = float(data['predicted_yield'])
        gap = max(0.0, target_t_ha - pred)
        
        data['target_yield_t_ha'] = target_t_ha
        data['yield_gap'] = gap
        
        # 3. Seasonal Mapping
        sm = SeasonMapper(config_dir)
        data = sm.compute_seasonal_features(data)
        
        # 4. Soil Supply
        se = SoilSupplyEngine(config_dir)
        data = se.estimate_soil_supply(data)
        
        # 5. Nutrient Index (NHI)
        ne = NutrientIndexEngine(config_dir)
        data = ne.calculate_nhi(data)
        
        # 6. Fertilizer Requirements
        fe = FertilizerRequirementEngine(config_dir)
        data = fe.calculate_requirements(data)
        
        # 7. Crop Response
        cre = CropResponseEngine(config_dir)
        data = cre.attach_response_factor(data)
        
        # 8. Growth Stage
        fse_prep = FertilizerScheduleEngine(config_dir)
        data = fse_prep.compute_dap(data) # Compute DAP first
        
        gse = GrowthStageEngine(config_dir)
        data = gse.determine_stage(data)
        
        # 9. Recommendation Generation
        re = RecommendationEngine()
        data = re.generate_recommendations(data)
        
        # 10. Fertilizer Schedule
        data = fse_prep.generate_schedule(data)
        
        # 11. Reporting Layer (Visualization metrics only)
        reporting_engine = ReportingEngine()
        data = reporting_engine.compute_reporting_metrics(data)
        
        data['status'] = 'success'
        return data
        
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }
