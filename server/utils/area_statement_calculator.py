import mysql.connector
import logging

def calculate_area_statement(project_data):
    """
    Calculate area statement based on project data.
    
    :param project_data: Tuple containing project details
    :return: Dictionary of calculated area statement values or None if calculation fails
    """
    try:
        # Extract values with error handling and type conversion
        def safe_float(value, default=0):
            try:
                return float(value or default)
            except (ValueError, TypeError):
                return default

        # Extract specific indices from project_data tuple
        area_as_per_ownership_document = safe_float(project_data[30])  # area_plot_ownership_sqm
        area_as_per_tilr_or_city_survey_measurement_sheet = safe_float(project_data[31])  # area_plot_measurement_sqm
        area_as_per_demarcated_drawing_area = safe_float(project_data[29])  # area_plot_site_sqm
        deductions_a = safe_float(project_data[35])  # dp_rp_road_area_sqm
        deductions_b = safe_float(project_data[22])  # reservation_area_sqm
        plot_layout_type = str(project_data[20] or '')  # plot_layout_type

        # 1-3. Area columns
        # Use the most conservative (smallest) value
        area_of_plot = min(
            area_as_per_ownership_document, 
            area_as_per_tilr_or_city_survey_measurement_sheet, 
            area_as_per_demarcated_drawing_area
        )

        # 5-7. Deductions
        deductions = deductions_a + deductions_b

        # 8. Balance area of plot
        balance_area_of_plot = area_of_plot - deductions


        # 9-11. Amenity space calculations
        amenity_space_proposed_a = 0 if balance_area_of_plot < 20000 and plot_layout_type in ['Sanction Layout/Sub Layout', 'Gunthewari', 'Compounding Structure', 'Non-Sanctioned Layout', 'Raw Land', 'Area under CTS No. (K prat/Mojni Sheet)', 'CIDCO Approved Layout'] else None
        
        amenity_space_proposed_b = (
            0 if balance_area_of_plot > 20000 and plot_layout_type in ['Sanction Layout/Sub Layout', 'Gunthewari'] 
            else None
        )
        
        amenity_space_proposed_c = (
            0.05 * area_of_plot 
            if balance_area_of_plot > 20000 and plot_layout_type in ['Compounding Structure', 'Non-Sanctioned Layout', 'Raw Land', 'Area under CTS No. (K prat/Mojni Sheet)', 'CIDCO Approved Layout'] 
            else None
        )

        # Calculate total amenity space
        amenity_space_proposed = sum([
            value for value in [amenity_space_proposed_a, amenity_space_proposed_b, amenity_space_proposed_c] 
            if value is not None
        ])

        # 13. Net plot area
        net_plot_area = balance_area_of_plot - amenity_space_proposed

        # 14-17. Recreational open space calculations
        recreational_open_space_a = 0 if plot_layout_type == 'Sanction Layout/Sub Layout' else None
        
        recreational_open_space_b = (
            0.10 * area_of_plot 
            if net_plot_area > 4000 and plot_layout_type in ['Gunthewari', 'Compounding Structure', 'Non-Sanctioned Layout', 'Raw Land', 'Area under CTS No. (K prat/Mojni Sheet)', 'CIDCO Approved Layout'] 
            else None
        )
        
        recreational_open_space_c = (
            max(0.10 * area_of_plot, 200) 
            if net_plot_area < 4000 and plot_layout_type in ['Compounding Structure', 'Non-Sanctioned Layout', 'Raw Land', 'Area under CTS No. (K prat/Mojni Sheet)', 'CIDCO Approved Layout']
            else None
        )
        
        recreational_open_space_d = (
            0 if net_plot_area < 4000 and plot_layout_type == 'Gunthewari' 
            else None
        )

        # Calculate total recreational open space
        recreational_open_space = sum([
            value for value in [
                recreational_open_space_a, 
                recreational_open_space_b, 
                recreational_open_space_c, 
                recreational_open_space_d
            ] if value is not None
        ])

        # Prepare and return the calculated area statement
        area_statement = {
            'area_of_plot': area_of_plot,
            'area_as_per_ownership_document': area_as_per_ownership_document,
            'area_as_per_tilr_or_city_survey_measurement_sheet': area_as_per_tilr_or_city_survey_measurement_sheet,
            'area_as_per_demarcated_drawing_area': area_as_per_demarcated_drawing_area,
            'deductions': deductions,
            'deductions_a': deductions_a,
            'deductions_b': deductions_b,
            'balance_area_of_plot': balance_area_of_plot,
            'amenity_space_proposed': amenity_space_proposed,
            'amenity_space_proposed_a': amenity_space_proposed_a,
            'amenity_space_proposed_b': amenity_space_proposed_b,
            'amenity_space_proposed_c': amenity_space_proposed_c,
            'net_plot_area': net_plot_area,
            'recreational_open_space': recreational_open_space,
            'recreational_open_space_a': recreational_open_space_a,
            'recreational_open_space_b': recreational_open_space_b,
            'recreational_open_space_c': recreational_open_space_c,
            'recreational_open_space_d': recreational_open_space_d
        }

        return area_statement

    except Exception as e:
        # Log the error for debugging
        logging.error(f"Error in area statement calculation: {e}")
        return None
