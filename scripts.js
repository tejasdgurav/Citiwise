// Global variables
let formData = {};
let zones = [];
let uses = [];
let citySpecificAreas = [];
let buildingTypes = [];
let buildingSubtypes = {};

// Load data from JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // Populate global variables
        zones = data.zone;
        uses = data.uses;
        citySpecificAreas = data.city_specific_area;
        buildingTypes = data.building_type;
        buildingSubtypes = data.building_subtype;
        
        // Populate dropdowns
        populateDropdown('ulb_type', data.ulb_type);
        populateDropdown('zone', zones);
        populateDropdown('uses', uses);
        populateDropdown('city_specific_area', citySpecificAreas);
        populateDropdown('building_type', buildingTypes);
        
        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Populate dropdown function
function populateDropdown(id, options) {
    const select = document.getElementById(id);
    if (!select) return; // Skip if element doesn't exist
    select.innerHTML = '<option value="">Select an option</option>';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name;
        select.appendChild(optionElement);
    });
}

// Add event listeners
function addEventListeners() {
    // ULB Type change event
    document.getElementById('ulb_type').addEventListener('change', function(e) {
        const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
        ulbRpSpecialAuthority.innerHTML = '<option value="">Select an option</option>';
        
        const selectedUlbTypeId = e.target.value;
        const filteredAuthorities = data.ulb_rp_special_authority.filter(auth => auth.typeId == selectedUlbTypeId);
        
        filteredAuthorities.forEach(auth => {
            const option = document.createElement('option');
            option.value = auth.id;
            option.textContent = auth.name;
            ulbRpSpecialAuthority.appendChild(option);
        });
    });

    // Incentive FSI change event
    document.querySelectorAll('input[name="incentive_fsi"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const incentiveFsiRating = document.getElementById('incentive_fsi_rating');
            incentiveFsiRating.style.display = e.target.value === 'Yes' ? 'block' : 'none';
        });
    });

    // Electrical Line change event
    document.querySelectorAll('input[name="electrical_line"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const electricalLineVoltage = document.getElementById('electrical_line_voltage');
            electricalLineVoltage.style.display = e.target.value === 'Yes' ? 'block' : 'none';
        });
    });

    // Reservation Area Affected change event
    document.querySelectorAll('input[name="reservation_area_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const reservationAreaSqm = document.getElementById('reservation_area_sqm');
            reservationAreaSqm.style.display = e.target.value === 'Yes' ? 'block' : 'none';
        });
    });

    // CRZ change event
    document.querySelectorAll('input[name="crz"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const crzLocation = document.getElementById('crz_location');
            crzLocation.style.display = e.target.value === 'Yes' ? 'block' : 'none';
        });
    });

    // DP/RP road affected change event
    document.querySelectorAll('input[name="dp_rp_road_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const dpRpRoadAreaSqm = document.getElementById('dp_rp_road_area_sqm');
            dpRpRoadAreaSqm.style.display = e.target.value === 'Yes' ? 'block' : 'none';
        });
    });

    // Building type change event
    document.getElementById('building_type').addEventListener('change', function(e) {
        const buildingSubtype = document.getElementById('building_subtype');
        buildingSubtype.innerHTML = '<option value="">Select an option</option>';
        
        const selectedBuildingTypeId = e.target.value;
        const subtypes = buildingSubtypes[selectedBuildingTypeId] || [];
        
        subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype.id;
            option.textContent = subtype.name;
            buildingSubtype.appendChild(option);
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const boundarySelect = document.getElementById(`${boundary}_boundary`);
        if (boundarySelect) {
            boundarySelect.addEventListener('change', function(e) {
                const roadDetails = document.getElementById(`${boundary}-road-details`);
                if (roadDetails) {
                    roadDetails.style.display = e.target.value === 'Road' ? 'block' : 'none';
                }
            });
        }
    });

    // Form submission event
    document.getElementById('project-input-form').addEventListener('submit', handleSubmit);
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Show loading indicator
    document.querySelector('.loading-indicator').style.display = 'flex';
    
    // Collect form data
    const formElements = e.target.elements;
    for (let element of formElements) {
        if (element.name) {
            if (element.type === 'radio') {
                if (element.checked) {
                    formData[element.name] = element.value;
                }
            } else if (element.type === 'file') {
                formData[element.name] = element.files[0] ? element.files[0].name : '';
            } else {
                formData[element.name] = element.value;
            }
        }
    }
    
    // Validate form data
    if (!validateForm()) {
        // Hide loading indicator
        document.querySelector('.loading-indicator').style.display = 'none';
        return;
    }
    
    // Send data to Google Sheets
    try {
        await sendToGoogleSheets(formData);
        alert('Form submitted successfully!');
        e.target.reset();
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('An error occurred while submitting the form. Please try again.');
    }
    
    // Hide loading indicator
    document.querySelector('.loading-indicator').style.display = 'none';
}

// Validate form data
function validateForm() {
    // Add your validation logic here
    // For now, we'll just check if required fields are filled
    const requiredFields = document.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value) {
            alert(`Please fill out the ${field.name} field.`);
            return false;
        }
    }
    return true;
}

// Send data to Google Sheets
async function sendToGoogleSheets(data) {
    const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // Replace with your actual script URL
    const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    
    return response.json();
}

// Initialize the form
document.addEventListener('DOMContentLoaded', loadData);