class ReportingEngine:
    """
    Reporting Layer. Computes production metrics strictly for visualization.
    These metrics never participate in scientific calculations.
    """
    def __init__(self):
        pass

    def compute_reporting_metrics(self, field_data: dict) -> dict:
        harvarea = field_data.get('harvarea', 0)
        
        predicted_yield = field_data.get('predicted_yield', 0)
        target_yield_t_ha = field_data.get('target_yield_t_ha', 0)
        
        if harvarea > 0:
            predicted_production = predicted_yield * harvarea
            target_production = target_yield_t_ha * harvarea
            production_gap = max(0.0, target_production - predicted_production)
            
            field_data['reporting'] = {
                "predicted_production_ton": predicted_production,
                "target_production_ton": target_production,
                "production_gap_ton": production_gap
            }
        else:
            field_data['reporting'] = {
                "predicted_production_ton": 0.0,
                "target_production_ton": 0.0,
                "production_gap_ton": 0.0,
                "message": "Harvest area (harvarea) not provided or zero."
            }
            
        return field_data
