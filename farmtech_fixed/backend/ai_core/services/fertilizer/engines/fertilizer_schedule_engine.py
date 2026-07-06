import json
import os
from datetime import datetime

class FertilizerScheduleEngine:
    """
    Calculates DAP (Days After Planting) if not already present, 
    and determines split applications based on schedule JSON.
    """
    def __init__(self, config_dir: str):
        with open(os.path.join(config_dir, "fertilizer_schedule.json"), "r") as f:
            self.schedule = json.load(f)

    def compute_dap(self, field_data: dict) -> dict:
        plant_date_str = field_data.get('plant_date')
        current_date_str = field_data.get('current_date')
        
        if not plant_date_str or not current_date_str:
            return field_data

        try:
            plant_date = datetime.strptime(plant_date_str, "%Y-%m-%d")
            current_date = datetime.strptime(current_date_str, "%Y-%m-%d")
            dap = (current_date - plant_date).days
            field_data['DAP'] = dap
        except Exception:
            pass
        return field_data

    def generate_schedule(self, field_data: dict) -> dict:
        if 'DAP' not in field_data:
            self.compute_dap(field_data)
            
        dap = field_data.get('DAP')
        if dap is None:
            field_data['schedule_summary'] = "Dates not provided or invalid for scheduling."
            return field_data

        crop = str(field_data.get('crop', '')).lower()
        total_fert = float(field_data.get('recommended_fertilizer_amount', 0))
        
        sched = self.schedule.get(crop, self.schedule.get("default"))
        
        past_apps = []
        current_app = None
        future_apps = []
        
        for app in sched['schedule']:
            app_amount = total_fert * app['pct']
            app_dap = app['dap']
            
            app_info = {
                "label": app['label'],
                "dap": app_dap,
                "amount_kg_ha": app_amount,
                "pct": app['pct'] * 100
            }
            
            if dap >= app_dap:
                if current_app is None or (dap - app_dap) < (dap - current_app['dap']):
                    if current_app:
                        past_apps.append(current_app)
                    current_app = app_info
                else:
                    past_apps.append(app_info)
            else:
                future_apps.append(app_info)

        field_data['past_applications'] = past_apps
        field_data['current_application'] = current_app
        field_data['future_applications'] = future_apps
        
        if current_app:
            next_app = future_apps[0] if future_apps else None
            rem = next_app['dap'] - dap if next_app else 0
            
            summary = (
                f"Fertilizer Stage: {current_app['label']} ({current_app['amount_kg_ha']:.1f} kg/ha). "
            )
            if next_app:
                summary += f"Next: {next_app['label']} in {rem} days ({next_app['amount_kg_ha']:.1f} kg/ha)."
        else:
            summary = "No active fertilizer applications for this DAP."
            
        field_data['schedule_summary'] = summary
        return field_data
