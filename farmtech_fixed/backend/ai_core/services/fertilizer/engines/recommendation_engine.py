import numpy as np

class RecommendationEngine:
    """
    Combines all engine outputs into final recommendation and expected yield gain.
    Generates natural language explanation.
    """
    def generate_recommendations(self, field_data: dict) -> dict:
        """
        expected_gain_t_ha = yield_gap * response_factor * crop_response_factor
        """
        nhi_norm = float(field_data['NHI']) / 100.0
        soil_n_norm = np.clip(float(field_data['soil_N_supply']) / 150.0, 0, 1)
        
        # Assume 50th percentile if spatial yields aren't available for ranking here
        yield_gap_percentile = 0.5 
        
        inv_nhi = 1.0 - nhi_norm
        inv_soil_n = 1.0 - soil_n_norm
        
        response_factor = (inv_nhi * 0.4) + (inv_soil_n * 0.3) + (yield_gap_percentile * 0.3)
        response_factor = np.clip(response_factor, 0.1, 1.0)
        field_data['response_factor'] = response_factor

        expected_gain = float(field_data['yield_gap']) * response_factor * float(field_data['crop_response_factor'])
        expected_gain = np.clip(expected_gain, 0.0, float(field_data['yield_gap']))
        
        field_data['expected_gain_t_ha'] = expected_gain
        
        base_yield = max(float(field_data['predicted_yield']), 0.1)
        field_data['expected_gain_percent'] = (expected_gain / base_yield) * 100.0

        # Generate explanation
        crop = str(field_data['crop']).capitalize()
        status = field_data.get('nitrogen_status', 'Unknown')
        fert = field_data.get('Selected Fertilizer', 'Unknown')
        amt = field_data.get('recommended_fertilizer_amount', 0)
        equiv = field_data.get('equivalent_nitrogen_kg_ha', 0)
        stage = field_data.get('current_growth_stage', 'Unknown')
        
        explanation = (
            f"The field is currently in the {stage} stage, experiencing a {status} nitrogen status (NHI: {field_data.get('NHI',0):.1f}/100). "
            f"The soil naturally supplies {field_data.get('soil_N_supply',0):.1f} kg N/ha based on properties like organic carbon and pH. "
            f"To close the yield gap of {field_data.get('yield_gap',0):.2f} t/ha, the {crop} crop requires an additional Equivalent Nitrogen of {equiv:.1f} kg N/ha. "
            f"This translates to an application of {amt:.1f} kg/ha of {fert}. "
            f"Following this recommendation is expected to yield an additional {expected_gain:.2f} t/ha ({field_data.get('expected_gain_percent',0):.1f}% increase)."
        )
        field_data['agronomic_explanation'] = explanation

        return field_data
