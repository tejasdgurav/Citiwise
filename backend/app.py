from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
import mysql.connector
import os
import logging
import uuid
from dotenv import load_dotenv
from backend.calculators.fsi_calculator import FSICalculator
from backend.calculators.area_statement_calculator import calculate_area_statement
from backend.utils.required_ids import fetch_required_ids

# Load environment variables
load_dotenv()

app = Flask(__name__, 
    template_folder='../frontend/templates',
    static_folder='../frontend/static'
)
app.config.update(
    SECRET_KEY=os.getenv('SECRET_KEY'),
    UPLOAD_FOLDER=os.getenv('UPLOAD_FOLDER'),
    MAX_CONTENT_LENGTH=int(os.getenv('MAX_CONTENT_LENGTH')),
)

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG)

# Database configuration from environment variables
DB_CONFIG = {
    "host": os.getenv('DB_HOST'),
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASSWORD'),
    "database": os.getenv('DB_NAME')
}

# Initialize FSICalculator
fsi_calculator = FSICalculator(DB_CONFIG)

@app.route('/')
def health_check():
    """Health check endpoint to confirm the service is running."""
    return jsonify({"status": "Citiwise API is running"}), 200


def get_float_value(value):
    """Helper function to convert values to float"""
    try:
        return float(value) if value else 0.0
    except (ValueError, TypeError):
        return 0.0


# Function to connect to the database
def connect_to_database():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as e:
        app.logger.error(f"Error connecting to the database: {e}")
        flash(f"Database connection error: {e}")
        return None

# Helper function to insert data into the database
def insert_project_details_basic(data):
    connection = None
    try:
        connection = connect_to_database()
        if connection is None:
            flash("Failed to connect to the database.")
            return None
            
        cursor = connection.cursor()

        # SQL Insert Query
        insert_query = """
        INSERT INTO project_details_test2 (
            applicant_type, applicant_name, contact_no, email, project_name, site_address, dp_rp_part_plan, 
            google_image, ulb_rp_special_authority, special_scheme, regularization, type_of_development, 
            incentive_fsi, incentive_fsi_rating, type_of_proposal, hilly_site, flood_affected_area, location, 
            electrical_line, electrical_line_voltage, plot_layout_type, reservation_area_affected, 
            reservation_area_sqm, crz_status, zone, uses_id, survey_type, survey_number, village_name, 
            area_plot_site_sqm, area_plot_ownership_sqm, area_plot_measurement_sqm, pro_rata_fsi, class_of_land, 
            dp_rp_road_affected, dp_rp_road_area_sqm, city_specific_area_id, building_height, redevelopment_proposal, 
            plot_width, tod, building_type_id, building_subtype_id, front_boundary_type, road_details_front, 
            road_details_front_meters, left_boundary_type, road_details_left, road_details_left_meters, 
            right_boundary_type, road_details_right, road_details_right_meters, rear_boundary_type, 
            road_details_rear, road_details_rear_meters, ulb_type, council_id, taluka_id, crz_location, zone_id, 
            zone_landuser_id, uses_name, uses_zone_id, city_specific_area_name, city_specific_area_areaCode, 
            city_specific_area_councilId, building_type_name, building_type_proposalId, building_subtype_name, 
            building_subtype_bldgtypeID) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
            
        cursor.execute(insert_query, data)
        connection.commit()
        app.logger.info("Inserted project details successfully.")

        project_id = cursor.lastrowid  # Capture the inserted project ID for later use
        return project_id

    except mysql.connector.Error as e:
        app.logger.error(f"Error inserting project details: {e}")
        flash(f"Error inserting project details: {e}")
        return None
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# Helper function to update project details with fetched IDs
def update_project_details_with_ids(project_id, fsi_group):
    connection = None
    try:
        connection = connect_to_database()
        if connection is None:
            flash("Failed to connect to the database.")
            return False

        cursor = connection.cursor()

        # SQL Update Query
        update_query = """
        UPDATE project_details_test2 
        SET fsi_group = %s 
        WHERE id = %s
        """
        cursor.execute(update_query, (fsi_group, project_id))
        connection.commit()
        return True

    except mysql.connector.Error as e:
        app.logger.error(f"Error updating project details with required IDs: {e}")
        flash(f"Error updating project details with required IDs: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# Helper function to update area statement in the database
def update_area_statement(project_id, area_statement):
    connection = None
    try:
        connection = connect_to_database()
        if connection is None:
            flash("Failed to connect to the database.")
            return False

        cursor = connection.cursor()

        # Update the project details with calculated area statement
        update_query = """
        UPDATE project_details_test2 
        SET 
            area_of_plot = %s,
            area_as_per_ownership_document = %s,
            area_as_per_tilr_or_city_survey_measurement_sheet = %s,
            area_as_per_demarcated_drawing_area = %s,
            deductions = %s,
            deductions_a = %s,
            deductions_b = %s,
            balance_area_of_plot = %s,
            amenity_space_proposed = %s,
            amenity_space_proposed_a = %s,
            amenity_space_proposed_b = %s,
            amenity_space_proposed_c = %s,
            net_plot_area = %s,
            recreational_open_space = %s,
            recreational_open_space_a = %s,
            recreational_open_space_b = %s,
            recreational_open_space_c = %s,
            recreational_open_space_d = %s
        WHERE id = %s
        """
        
        cursor.execute(update_query, (
            area_statement.get('area_of_plot'),
            area_statement.get('area_as_per_ownership_document'),
            area_statement.get('area_as_per_tilr_or_city_survey_measurement_sheet'),
            area_statement.get('area_as_per_demarcated_drawing_area'),
            area_statement.get('deductions'),
            area_statement.get('deductions_a'),
            area_statement.get('deductions_b'),
            area_statement.get('balance_area_of_plot'),
            area_statement.get('amenity_space_proposed'),
            area_statement.get('amenity_space_proposed_a'),
            area_statement.get('amenity_space_proposed_b'),
            area_statement.get('amenity_space_proposed_c'),
            area_statement.get('net_plot_area'),
            area_statement.get('recreational_open_space'),
            area_statement.get('recreational_open_space_a'),
            area_statement.get('recreational_open_space_b'),
            area_statement.get('recreational_open_space_c'),
            area_statement.get('recreational_open_space_d'),
            project_id
        ))
        connection.commit()
        app.logger.info(f"Area statement updated for project ID {project_id}")
        return True

    except mysql.connector.Error as e:
        app.logger.error(f"Error updating area statement: {e}")
        flash(f"Error updating area statement: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# Helper function to update FSI details in the database
def update_fsi_details(project_id, fsi_results):
    connection = None
    try:
        connection = connect_to_database()
        if connection is None:
            app.logger.error("Failed to connect to database in update_fsi_details")
            flash("Failed to connect to the database.")
            return False

        cursor = connection.cursor()
        app.logger.info(f"Updating FSI details for project {project_id}: {fsi_results}")


        # SQL Update Query for FSI details
        update_query = """
        UPDATE project_details_test2 
        SET 
            basic_fsi = %s,
            premium_fsi = %s,
            tdr = %s,
            remarks_fsi = %s
        WHERE id = %s
        """
        
        values = (
            float(fsi_results.get('basic_fsi', 0)) if fsi_results.get('basic_fsi') is not None else None,
            float(fsi_results.get('premium_fsi', 0)) if fsi_results.get('premium_fsi') is not None else None,
            float(fsi_results.get('tdr', 0)) if fsi_results.get('tdr') is not None else None,
            str(fsi_results.get('remarks_fsi', 'NA')),
            project_id
        )
        
        cursor.execute(update_query, values)
        connection.commit()
        
        # Verify the update
        cursor.execute("SELECT basic_fsi, premium_fsi, tdr FROM project_details_test2 WHERE id = %s", (project_id,))
        result = cursor.fetchone()
        app.logger.info(f"Verification after FSI update: {result}")
        
        return True

    except mysql.connector.Error as e:
        app.logger.error(f"Database error in update_fsi_details: {e}")
        flash(f"Error updating FSI details: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


# Function to handle file uploads
def handle_file_upload(file, folder):
    if file and file.filename:
        if file.content_type in ['image/jpeg', 'image/png', 'application/pdf']:
            unique_filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join(folder, unique_filename)
            file.save(file_path)
            return file_path
        else:
            flash("Invalid file type.")
            return None
    return None


# Route for rendering the form and handling form submissions
@app.route('/submit', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
        
            # Capture basic form inputs
            applicant_type = request.form.get('applicant_type')
            applicant_name = request.form.get('applicant_name')
            contact_no = request.form.get('contact_no')
            email = request.form.get('email')
            project_name = request.form.get('project_name')
            site_address = request.form.get('site_address')

            # Set upload folder (ensure this folder exists)
            upload_folder = 'uploads'
            os.makedirs(upload_folder, exist_ok=True)

            # Handle file uploads
            dp_rp_part_plan_path = handle_file_upload(request.files.get('dp_rp_part_plan'), upload_folder)
            google_image_path = handle_file_upload(request.files.get('google_image'), upload_folder)

            # Assign paths to data tuple, default to None if not uploaded
            dp_rp_part_plan = dp_rp_part_plan_path if dp_rp_part_plan_path else None
            google_image = google_image_path if google_image_path else None
            
            
            ulb_rp_special_authority = request.form.get('ulb_rp_special_authority')
            special_scheme = request.form.get('special_scheme')
            regularization = request.form.get('regularization')
            type_of_development = request.form.get('type_of_development')
            incentive_fsi = request.form.get('incentive_fsi')
            incentive_fsi_rating = request.form.get('incentive_fsi_rating') 
            type_of_proposal = request.form.get('type_of_proposal')
            hilly_site = request.form.get('hilly_site')
            flood_affected_area = request.form.get('flood_affected_area')
            location = request.form.get('location')
            electrical_line = request.form.get('electrical_line')
            electrical_line_voltage = request.form.get('electrical_line_voltage') 
            plot_layout_type = request.form.get('plot_layout_type')
            reservation_area_affected = request.form.get('reservation_area_affected')
            reservation_area_sqm = request.form.get('reservation_area_sqm') 
            crz_status = request.form.get('crz_status')
            zone = request.form.get('zone')
            uses_id = request.form.get('uses_id')
            survey_type = request.form.get('survey_type')
            survey_number = request.form.get('survey_number')
            village_name = request.form.get('village_name')
            area_plot_site_sqm = request.form.get('area_plot_site_sqm')
            area_plot_ownership_sqm = request.form.get('area_plot_ownership_sqm')
            area_plot_measurement_sqm = request.form.get('area_plot_measurement_sqm')
            pro_rata_fsi = request.form.get('pro_rata_fsi')
            class_of_land = request.form.get('class_of_land')
            dp_rp_road_affected = request.form.get('dp_rp_road_affected')
            dp_rp_road_area_sqm = request.form.get('dp_rp_road_area_sqm') 
            city_specific_area_id = request.form.get('city_specific_area_id') 
            building_height = request.form.get('building_height')
            redevelopment_proposal = request.form.get('redevelopment_proposal')
            plot_width = request.form.get('plot_width')
            tod = request.form.get('tod')
            building_type_id = request.form.get('building_type_id')
            building_subtype_id = request.form.get('building_subtype_id')
            front_boundary_type = request.form.get('front_boundary_type')
            road_details_front = request.form.get('road_details_front')
            road_details_front_meters = request.form.get('road_details_front_meters') 
            left_boundary_type = request.form.get('left_boundary_type')
            road_details_left = request.form.get('road_details_left')
            road_details_left_meters = request.form.get('road_details_left_meters') 
            if road_details_left_meters == '': 
                road_details_left_meters = None
 
            right_boundary_type = request.form.get('right_boundary_type')
            road_details_right = request.form.get('road_details_right')
            road_details_right_meters = request.form.get('road_details_right_meters')
            if road_details_right_meters == '': 
                road_details_right_meters = None
            rear_boundary_type = request.form.get('rear_boundary_type')
            road_details_rear = request.form.get('road_details_rear')
            road_details_rear_meters = request.form.get('road_details_rear_meters')
            if road_details_rear_meters == '': 
                road_details_rear_meters = None
            ulb_type = request.form.get('ulb_type')
            council_id = request.form.get('council_id')
            taluka_id = request.form.get('taluka_id')
            crz_location = request.form.get('crz_location')
            zone_id = request.form.get('zone_id')
            zone_landuser_id = request.form.get('zone_landuser_id')
            uses_name = request.form.get('uses_name')
            uses_zone_id = request.form.get('uses_zone_id')
            city_specific_area_name = request.form.get('city_specific_area_name')
            city_specific_area_areaCode = request.form.get('city_specific_area_areaCode')
            city_specific_area_councilId = request.form.get('city_specific_area_councilId')
            building_type_name = request.form.get('building_type_name')
            building_type_proposalId = request.form.get('building_type_proposalId')
            building_subtype_name = request.form.get('building_subtype_name')
            building_subtype_bldgtypeID = request.form.get('building_subtype_bldgtypeID')


            required_fields = {
                'applicant_type': applicant_type,
                'applicant_name': applicant_name,
                'contact_no': contact_no,
                'email': email,
                'project_name': project_name,
                'site_address': site_address,
                'ulb_rp_special_authority': ulb_rp_special_authority,
                'regularization': regularization,
                'type_of_development': type_of_development,
                'incentive_fsi': incentive_fsi,
                'type_of_proposal': type_of_proposal,
                'hilly_site': hilly_site,
                'flood_affected_area': flood_affected_area,
                'location': location,
                'electrical_line': electrical_line,
                'plot_layout_type': plot_layout_type,
                'reservation_area_affected': reservation_area_affected,
                'crz_status': crz_status,
                'zone': zone,
                'uses_id': uses_id,
                'survey_type': survey_type,
                'survey_number': survey_number,
                'village_name': village_name,
                'area_plot_site_sqm': area_plot_site_sqm,
                'area_plot_ownership_sqm': area_plot_ownership_sqm,
                'area_plot_measurement_sqm': area_plot_measurement_sqm,
                'class_of_land': class_of_land,
                'dp_rp_road_affected': dp_rp_road_affected,
                'redevelopment_proposal': redevelopment_proposal,
                'plot_width': plot_width,
                'tod': tod,
                'building_type_id': building_type_id,
                'building_subtype_id': building_subtype_id,
            }

             # Validate required fields
            missing_fields = [field for field, value in required_fields.items() if not value]
            if missing_fields:
                flash(f"Missing required fields: {', '.join(missing_fields)}")
                return redirect(url_for('index'))

            # Data tuple to pass to insert_project_details_test2 function
            data = (applicant_type, applicant_name, contact_no, email, project_name, site_address, dp_rp_part_plan,
                    google_image, ulb_rp_special_authority, special_scheme, regularization, type_of_development,
                    incentive_fsi, incentive_fsi_rating, type_of_proposal, hilly_site, flood_affected_area, location,
                    electrical_line, electrical_line_voltage, plot_layout_type, reservation_area_affected, 
                    reservation_area_sqm, crz_status, zone, uses_id, survey_type, survey_number, village_name, 
                    area_plot_site_sqm, area_plot_ownership_sqm, area_plot_measurement_sqm, pro_rata_fsi, class_of_land, 
                    dp_rp_road_affected, dp_rp_road_area_sqm, city_specific_area_id, building_height, redevelopment_proposal, 
                    plot_width, tod, building_type_id, building_subtype_id, front_boundary_type, road_details_front, 
                    road_details_front_meters, left_boundary_type, road_details_left, road_details_left_meters, 
                    right_boundary_type, road_details_right, road_details_right_meters, rear_boundary_type, 
                    road_details_rear, road_details_rear_meters, ulb_type, council_id, taluka_id, crz_location, zone_id, 
                    zone_landuser_id, uses_name, uses_zone_id, city_specific_area_name, city_specific_area_areaCode, 
                    city_specific_area_councilId, building_type_name, building_type_proposalId, building_subtype_name, 
                    building_subtype_bldgtypeID)
            

            # Create a project_details dictionary for FSI calculation
            project_details = {
                'council_id': int(council_id) if council_id else None,
                'city_specific_area': city_specific_area_id,
                'city_specific_area_areaCode': city_specific_area_areaCode,
                'type_of_proposal': type_of_proposal,
                'crz_status': crz_status,
                'tod': tod,
                'location': location,
                'plot_layout_type': plot_layout_type,
                'area_plot_site_sqm': get_float_value(area_plot_site_sqm),
                'zone': zone,
                'zone_id': zone_id,
                'road_details_front_meters': get_float_value(road_details_front_meters),
                'road_details_left_meters': get_float_value(road_details_left_meters),
                'road_details_right_meters': get_float_value(road_details_right_meters),
                'road_details_rear_meters': get_float_value(road_details_rear_meters)
            }

            # Insert basic project details into database
            project_id = insert_project_details_basic(data)
            if not project_id:
                flash("Failed to insert basic project details")
                return redirect(url_for('index'))
                
            # After the data is inserted, fetch `fsi_group` using the `ulb_rp_special_autho    
            if project_id:
                fsi_group = fetch_required_ids(ulb_rp_special_authority)

                if fsi_group:
                    update_project_details_with_ids(project_id, fsi_group)
                    app.logger.info(f"Successfully updated fsi_group: {fsi_group} for project ID {project_id}")
                else:
                    flash(f"Failed to calculate fsi_group.")

            if project_id:
                # Perform area statement calculations
                area_statement = calculate_area_statement(data)
                
                if area_statement:
                    update_area_statement(project_id, area_statement)
                    flash("Project details and area statement updated successfully.")
                else:
                    flash("Failed to calculate area statement.")
            

            try:
                app.logger.info(f"Calculating FSI with project details: {project_details}")
                fsi_results = fsi_calculator.calculate_fsi(project_details)
                
                if fsi_results:
                    app.logger.info(f"FSI calculation results: {fsi_results}")
                    
                    if not fsi_results.get('error'):
                        if update_fsi_details(project_id, fsi_results):
                            app.logger.info(f"FSI calculation successful for project ID {project_id}")
                            flash("FSI calculation completed successfully")
                        else:
                            flash("Failed to update FSI details in database")
                    else:
                        flash(f"FSI calculation failed: {fsi_results.get('remarks_fsi')}")
                else:
                    flash("No FSI results returned from calculator")
                    
            except Exception as e:
                app.logger.error(f"Error during FSI calculation: {e}")
                flash(f"Error during FSI calculation: {str(e)}")

            return redirect(url_for('index'))        
                
        except Exception as e:
            app.logger.error(f"Error during form submission: {e}")
            return jsonify({"success": False, "message": str(e)}), 500

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
