import mysql.connector
import logging

class FSICalculator:
    def __init__(self, db_config):
        """
        Initialize the FSI Calculator with database connection details
        
        :param db_config: Dictionary containing database connection parameters
        """
        self.db_config = db_config
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def _connect_to_database(self):
        """
        Establish a database connection
        
        :return: MySQL database connection
        """
        try:
            connection = mysql.connector.connect(**self.db_config)
            return connection
        except mysql.connector.Error as e:
            self.logger.error(f"Database connection error: {e}")
            return None

    def _get_max_road_width(self, project_details):
        """
        Calculate the maximum road width from available road details
        
        :param project_details: Dictionary of project details
        :return: Maximum road width
        """
        road_widths = [
            project_details.get('road_details_front_meters', 0),
            project_details.get('road_details_left_meters', 0),
            project_details.get('road_details_right_meters', 0),
            project_details.get('road_details_rear_meters', 0)
        ]
        return max(float(width) if width and width != '' else 0 for width in road_widths)

    def _determine_ulb_type(self, council_id):
        """
        Determine ULB Type based on council ID
        
        :param council_id: Council ID
        :return: ULB Type string
        """
        mmr_councils = [418, 1011, 383, 419, 1013] # For Pune,Nagpur, Nashik, Municipal Corporations in MMR (refer table dcr_permisible_fsi_council_group)

        mmad_councils = [178, 365, 366, 367, 369, 370, 371, 372, 373, 374, 375, 376, 377, 
                        378, 381, 382, 407, 443, 1009, 1010, 1014, 1015, 1016, 1017]
        
        council_id = int(council_id) if isinstance(council_id, str) else council_id
        
        if council_id in mmr_councils:
            return 'MMR'
        elif council_id in mmad_councils:
            return 'MMAD'
        elif council_id == 383:  # Special case for Nagpur Municipal Corporation
            return 'NMNMC'
        else:
            return 'ALL'

    def _check_city_specific_non_residential(self, cursor, project_details):
        """
        Rule 1: Check city specific area for non-residential proposals
        """
        non_residential_types = ['Commercial', 'Mixed', 'Educational', 'Group Housing', 'Institutional']
        
        if (project_details.get('city_specific_area_areaCode') and 
            project_details.get('type_of_proposal') in non_residential_types):
            
            query = """
            SELECT basic_fsi_Other as basic_fsi, Remark as remark_fsi 
            FROM dcr_setback_specificarea_restriction 
            WHERE strAreaCode = %s 
            AND %s BETWEEN CAST(strMinPlotArea AS DECIMAL) AND CAST(strMinPlotArea2 AS DECIMAL)
            """
            cursor.execute(query, (
                project_details.get('city_specific_area_areaCode'),
                project_details.get('area_plot_site_sqm')
            ))
            return cursor.fetchone()
        return None

    def _check_city_specific_residential(self, cursor, project_details):
        """
        Rule 2: Check city specific area for residential proposals
        """
        if (project_details.get('city_specific_area_areaCode') and 
            project_details.get('type_of_proposal') == 'Residential'):
            
            query = """
            SELECT basic_fsi_res as basic_fsi, Remark as remark_fsi 
            FROM dcr_setback_specificarea_restriction 
            WHERE strAreaCode = %s 
            AND %s BETWEEN CAST(strMinPlotArea AS DECIMAL) AND CAST(strMinPlotArea2 AS DECIMAL)
            """
            cursor.execute(query, (
                project_details.get('city_specific_area_areaCode'),
                project_details.get('area_plot_site_sqm')
            ))
            return cursor.fetchone()
        return None

    def _check_crz_specific(self, cursor, project_details):
        """
        Rule 3: Check CRZ specific restrictions
        """
        crz_councils = [183, 191, 407]
        council_id = int(project_details.get('council_id')) if isinstance(project_details.get('council_id'), str) else project_details.get('council_id')
        
        if (project_details.get('crz_status') == 'Yes' and 
            council_id in crz_councils):
            
            query = """
            SELECT basic_fsi, Remark as remark_fsi 
            FROM crz_specificarea_restriction 
            WHERE Councilid = %s 
            AND strLocationType = %s 
            AND tpzud_zone_id = %s
            """
            cursor.execute(query, (
                council_id,
                project_details.get('location'),
                project_details.get('zone_id')
            ))
            return cursor.fetchone()
        return None

    def _check_nagpur_tod(self, cursor, project_details, road_width):
        """
        Rule 4: Check Nagpur TOD
        """
        if (project_details.get('crz_status') == 'No' and 
            project_details.get('tod') == 'Yes' and 
            project_details.get('city_specific_area') is None and 
            str(project_details.get('council_id')) == '383'):
            
            query = """
            SELECT basicFSI as basic_fsi, FSI_Payment_Premium as premium_fsi, 
                   Max_permissible_TDR_loading as tdr
            FROM Dcr_tod_fsi_permissible
            WHERE %s BETWEEN CAST(strRoadWidth_Range1 AS DECIMAL) AND CAST(strRoadWidth_Range2 AS DECIMAL)
            AND %s BETWEEN CAST(strPlotArea_Range1 AS DECIMAL) AND CAST(strPlotArea_Range2 AS DECIMAL)
            """
            cursor.execute(query, (road_width, project_details.get('area_plot_site_sqm')))
            return cursor.fetchone()
        return None

    def _check_pcmc_tod(self, cursor, project_details, road_width):
        """
        Rules 5 & 6: Check PCMC TOD cases
        """
        pcmc_councils = ['443', '1014']
        valid_layout_types = ['Sanction Layout/Sub Layout', 'Compounding Structure', 
                            'Non-Sanctioned Layout', 'Raw Land', 
                            'Area under CTS No. (K prat/Mojni Sheet)', 'CIDCO Approved Layout']
        
        if (project_details.get('crz_status') == 'No' and 
            project_details.get('tod') == 'Yes' and 
            project_details.get('city_specific_area') is None and 
            str(project_details.get('council_id')) in pcmc_councils and
            project_details.get('plot_layout_type') in valid_layout_types):
            
            table = ('dcr_normal_fsi_permissible' 
                    if project_details.get('location') == 'Congested' 
                    else 'dcr_normal_fsi_permissible_nonconjusted')
            
            query = f"""
            SELECT basicFSI as basic_fsi, FSI_Payment_Premium as premium_fsi, 
                   Max_permissible_TDR_loading as tdr
            FROM {table}
            WHERE %s BETWEEN CAST(strRoadWidth_Range1 AS DECIMAL) AND CAST(strRoadWidth_Range2 AS DECIMAL)
            AND ULBType = 'PCMC'
            """
            cursor.execute(query, (road_width,))
            return cursor.fetchone()
        return None

    def _check_pcmc_gunthewari_tod(self, cursor, project_details, road_width):
        """
        Rule 7: Check PCMC Gunthewari TOD
        """
        pcmc_councils = ['443', '1014']
        
        if (project_details.get('crz_status') == 'No' and 
            project_details.get('tod') == 'Yes' and 
            project_details.get('city_specific_area') is None and 
            str(project_details.get('council_id')) in pcmc_councils and
            project_details.get('plot_layout_type') == 'Gunthewari'):
            
            query = """
            SELECT basicFSI as basic_fsi, FSI_Payment_Premium as premium_fsi, 
                   Max_permissible_TDR_loading as tdr
            FROM dcr_gunthewari_fsi_permissible
            WHERE %s BETWEEN CAST(strRoadWidth_Range1 AS DECIMAL) AND CAST(strRoadWidth_Range2 AS DECIMAL)
            AND TypeOfConjustedArea = %s
            AND ULBType = 'PCMC'
            """
            cursor.execute(query, (road_width, project_details.get('location')))
            return cursor.fetchone()
        return None

    def _check_gunthewari_non_tod(self, cursor, project_details, road_width, ulb_type):
        """
        Rule 8: Check Gunthewari non-TOD
        """
        valid_proposals = ['Residential', 'Commercial', 'Mixed', 'Educational', 
                         'Group Housing', 'Institutional']
        
        if (project_details.get('crz_status') == 'No' and 
            project_details.get('tod') == 'No' and 
            project_details.get('city_specific_area') is '' and 
            project_details.get('plot_layout_type') == 'Gunthewari' and
            project_details.get('type_of_proposal') in valid_proposals):
            
            query = """
            SELECT basicFSI as basic_fsi, FSI_Payment_Premium as premium_fsi, 
                   Max_permissible_TDR_loading as tdr
            FROM dcr_gunthewari_fsi_permissible
            WHERE %s BETWEEN CAST(strRoadWidth_Range1 AS DECIMAL) AND CAST(strRoadWidth_Range2 AS DECIMAL)
            AND TypeOfConjustedArea = %s
            AND ULBType = %s
            """
            cursor.execute(query, (road_width, project_details.get('location'), ulb_type))
            return cursor.fetchone()
        return None

    def _check_industrial(self, cursor, project_details, road_width):
        """
        Rule 9: Check Industrial cases
        """
        industrial_zones = ['Industrial Zone', 'Service Industries - (I-1)', 
                          'General Industries - (I-2)', 'Special Industries (I-3)']
        
        if (project_details.get('crz_status') == 'No' and 
            project_details.get('tod') == 'No' and 
            project_details.get('city_specific_area') is None and 
            (project_details.get('type_of_proposal') == 'Industrial' or 
             project_details.get('zone') in industrial_zones)):
            
            query = """
            SELECT basicFSI as basic_fsi, FSI_Payment_Premium as premium_fsi
            FROM dcr_normal_fsi_permissible_industrial
            WHERE %s BETWEEN CAST(strRoadWidth_Range1 AS DECIMAL) AND CAST(strRoadWidth_Range2 AS DECIMAL)
            AND %s BETWEEN CAST(strPlotSizeRange1 AS DECIMAL) AND CAST(strPlotSizeRange2 AS DECIMAL)
            AND SpecialFlag = 'N'
            """
            cursor.execute(query, (road_width, project_details.get('area_plot_site_sqm')))
            result = cursor.fetchone()
            
            if result:
                result['remark_fsi'] = (
                    f"Special building (above 24m height): Basic FSI and Premium FSI remain same, "
                )
            return result
        return None

    def _check_normal_cases(self, cursor, project_details, road_width, ulb_type):
        """
        Rules 10 & 11: Check normal cases (congested and non-congested)
        """
        valid_layout_types = ['Sanction Layout/Sub Layout', 'Compounding Structure', 
                            'Non-Sanctioned Layout', 'Raw Land', 
                            'Area under CTS No. (K prat/Mojni Sheet)', 'CIDCO Approved Layout']
        valid_proposals = ['Residential', 'Commercial', 'Mixed', 'Educational', 
                         'Group Housing', 'Institutional']
        
        if (project_details.get('crz_status') == 'No' and 
            project_details.get('tod') == 'No' and 
            project_details.get('city_specific_area') is None and 
            project_details.get('plot_layout_type') in valid_layout_types and
            project_details.get('type_of_proposal') in valid_proposals):
            
            table = ('dcr_normal_fsi_permissible' 
                    if project_details.get('location') == 'Congested' 
                    else 'dcr_normal_fsi_permissible_nonconjusted')
            
            query = f"""
            SELECT basicFSI as basic_fsi, FSI_Payment_Premium as premium_fsi, 
                   Max_permissible_TDR_loading as tdr
            FROM {table}
            WHERE %s BETWEEN CAST(strRoadWidth_Range1 AS DECIMAL) AND CAST(strRoadWidth_Range2 AS DECIMAL)
            AND ULBType = %s
            """
            cursor.execute(query, (road_width, ulb_type))
            return cursor.fetchone()
        return None


    def calculate_fsi(self, project_details):
        """
        Main method to calculate FSI based on multiple rules
        
        :param project_details: Dictionary containing project details
        :return: Dictionary with FSI calculation results
        """
        try:
            connection = self._connect_to_database()
            if not connection:
                return self._error_result("Database connection failed")

            cursor = connection.cursor(dictionary=True)
            road_width = self._get_max_road_width(project_details)
            ulb_type = self._determine_ulb_type(project_details.get('council_id'))

            # Rule 1 & 2: City Specific Area
            result = self._check_city_specific_non_residential(cursor, project_details)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': 0,
                    'tdr': 0,
                    'remarks_fsi': result['remark_fsi']
                }

            result = self._check_city_specific_residential(cursor, project_details)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': 0,
                    'tdr': 0,
                    'remarks_fsi': result['remark_fsi']
                }

            # Rule 3: CRZ Status
            result = self._check_crz_specific(cursor, project_details)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': 0,
                    'tdr': 0,
                    'remarks_fsi': result['remark_fsi']
                }

            # Rule 4: Nagpur TOD
            result = self._check_nagpur_tod(cursor, project_details, road_width)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': result['premium_fsi'],
                    'tdr': result['tdr'],
                    'remarks_fsi': 'NA'
                }

            # Rules 5 & 6: PCMC TOD
            result = self._check_pcmc_tod(cursor, project_details, road_width)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': result['premium_fsi'],
                    'tdr': result['tdr'],
                    'remarks_fsi': 'NA'
                }

            # Rule 7: PCMC Gunthewari TOD
            result = self._check_pcmc_gunthewari_tod(cursor, project_details, road_width)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': result['premium_fsi'],
                    'tdr': result['tdr'],
                    'remarks_fsi': 'NA'
                }

            # Rule 8: Gunthewari Non-TOD
            result = self._check_gunthewari_non_tod(cursor, project_details, road_width, ulb_type)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': result['premium_fsi'],
                    'tdr': result['tdr'],
                    'remarks_fsi': 'NA'
                }

            # Rule 9: Industrial
            result = self._check_industrial(cursor, project_details, road_width)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': result['premium_fsi'],
                    'tdr': None,
                    'remarks_fsi': result['remark_fsi']
                }

            # Rules 10 & 11: Normal Cases
            result = self._check_normal_cases(cursor, project_details, road_width, ulb_type)
            if result:
                return {
                    'basic_fsi': result['basic_fsi'],
                    'premium_fsi': result['premium_fsi'],
                    'tdr': result['tdr'],
                    'remarks_fsi': 'NA'
                }

            return self._error_result("No matching FSI calculation rule found")

        except Exception as e:
            self.logger.error(f"Error calculating FSI: {str(e)}")
            return self._error_result(f"Error calculating FSI: {str(e)}")

        finally:
            if 'connection' in locals() and connection:
                connection.close()

    def _error_result(self, message):
        """
        Helper method to return error results
        
        :param message: Error message
        :return: Dictionary with error information
        """
        return {
            'basic_fsi': None,
            'premium_fsi': None,
            'tdr': None,
            'remarks_fsi': message,
            'error': True
        }