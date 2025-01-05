import mysql.connector

# Function to connect to the database
def connect_to_database():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="MySQL@123",
        database="citiwise_test"
    )

# Function to fetch  fsi_Group from the database
def fetch_required_ids(ulb_rp_special_authority):
    try:
        connection = connect_to_database()
        cursor = connection.cursor(dictionary=True)
        
        # Query fsi_Group
        fsigroup_query = """
        SELECT strBasicFSIGroup AS fsi_Group
        FROM tblmaster_council
        WHERE strTalukaNm = %s
        """
        
        cursor.execute(fsigroup_query, (ulb_rp_special_authority,))
        fsigroup_result = cursor.fetchone()


        # Return fsi_group value directly
        return fsigroup_result['fsi_Group'] if fsigroup_result else None

    except mysql.connector.Error as e:
        print(f"Error fetching required IDs: {e}")
        return None
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
