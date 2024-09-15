// Global variables
let formData = {};
let ulbData = {};

// Load data from JSON
async function loadData() {
    try {
        console.log("Fetching data from data.json");
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log("Data loaded successfully:", data);
        
        // Store all data for later use
        ulbData = data;
        
        console.log("Global variables populated");
        
        // Populate initial dropdowns
        populateDropdown('ulb_rp_special_authority', data.ulb_rp_special_authority || []);
        populateDropdown('special_scheme', data.special_scheme || []);
        populateDropdown('type_of_development', data.type_of_development || []);
        populateDropdown('incentive_fsi_rating', data.incentive_fsi_rating || []);
        populateDropdown('type_of_proposal', data.type_of_proposal || []);
        populateDropdown('electrical_line_voltage', data.electrical_line_voltage || []);
        populateDropdown('type_of_plot_layout', data.type_of_plot_layout || []);
        populateDropdown('zone', data.zone || []);
        populateDropdown('uses', data.uses || []);
        populateDropdown('plot_identification_type', data.plot_identification_type || []);
        populateDropdown('height_of_building', data.height_of_building || []);
        populateDropdown('building_type', data.building_type || []);
        populateDropdown('building_subtypes', data.building_subtypes || []);
        
        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Populate dropdown function
function populateDropdown(id, options) {
    const select = document.getElementById(id);
    if (!select) {
        console.error(`Dropdown with id '${id}' not found`);
        return;
    }
    select.innerHTML = '<option value="">Select an option</option>';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id || option.value;
        optionElement.textContent = option.name || option.text;
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options`);
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");
    
    // ULB/RP/Special Authority change event
    const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
    if (ulbRpSpecialAuthority) {
        ulbRpSpecialAuthority.addEventListener('change', function(e) {
            updateCitySpecificAreas(e.target.value);
        });
    }

    // Incentive FSI change event
    const incentiveFsiInputs = document.querySelectorAll('input[name="incentive_fsi"]');
    incentiveFsiInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            toggleIncentiveFsiRating(e.target.value === 'Yes');
        });
    });

    // Electrical Line change event
    const electricalLineInputs = document.querySelectorAll('input[name="electrical_line"]');
    electricalLineInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            toggleElectricalLineVoltage(e.target.value === 'Yes');
        });
    });

    // Reservation Area Affected change event
    const reservationAreaInputs = document.querySelectorAll('input[name="reservation_area_affected"]');
    reservationAreaInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            toggleReservationAreaSqm(e.target.value === 'Yes');
        });
    });

    // DP/RP road affected change event
    const dpRpRoadInputs = document.querySelectorAll('input[name="dp_rp_road_affected"]');
    dpRpRoadInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            toggleDpRpRoadAreaSqm(e.target.value === 'Yes');
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const boundarySelect = document.getElementById(`${boundary}`);
        if (boundarySelect) {
            boundarySelect.addEventListener('change', (e) => {
                toggleRoadDetails(boundary, e.target.value === 'Road');
            });
        }
    });

    // Zone change event
    const zoneSelect = document.getElementById('zone');
    if (zoneSelect) {
        zoneSelect.addEventListener('change', function(e) {
            updateUses(e.target.value);
        });
    }

    // Building type change event
    const buildingTypeSelect = document.getElementById('building_type');
    if (buildingTypeSelect) {
        buildingTypeSelect.addEventListener('change', function(e) {
            updateBuildingSubtypes(e.target.value);
        });
    }

    // Form submission
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Initialize contact number handler
    initializeContactNumberHandler();
}

function toggleIncentiveFsiRating(show) {
    const incentiveFsiRating = document.getElementById('incentive_fsi_rating');
    if (incentiveFsiRating) {
        incentiveFsiRating.closest('.form-group').style.display = show ? 'block' : 'none';
    }
}

function toggleElectricalLineVoltage(show) {
    const electricalLineVoltage = document.getElementById('electrical_line_voltage');
    if (electricalLineVoltage) {
        electricalLineVoltage.closest('.form-group').style.display = show ? 'block' : 'none';
    }
}

function toggleReservationAreaSqm(show) {
    const reservationAreaSqm = document.getElementById('reservation_area_sqm');
    if (reservationAreaSqm) {
        reservationAreaSqm.closest('.form-group').style.display = show ? 'block' : 'none';
    }
}

function toggleDpRpRoadAreaSqm(show) {
    const dpRpRoadAreaSqm = document.getElementById('dp_rp_road_area_sqm');
    if (dpRpRoadAreaSqm) {
        dpRpRoadAreaSqm.closest('.form-group').style.display = show ? 'block' : 'none';
    }
}

function toggleRoadDetails(boundary, show) {
    const roadContainer = document.getElementById(`road_container_${boundary}`);
    if (roadContainer) {
        roadContainer.style.display = show ? 'block' : 'none';
    }
}

function updateCitySpecificAreas(selectedCouncilId) {
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    if (!citySpecificAreaSelect) {
        console.error("City Specific Area select element not found");
        return;
    }

    // Clear existing options
    citySpecificAreaSelect.innerHTML = '<option value="">Select an option</option>';
    
    if (selectedCouncilId) {
        // Filter city-specific areas based on the selected councilId
        const filteredAreas = ulbData.city_specific_area.filter(area => area.councilId == selectedCouncilId);
        console.log("Filtered city-specific areas:", filteredAreas);
        
        // Populate the dropdown with filtered areas
        filteredAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.name;
            citySpecificAreaSelect.appendChild(option);
        });
        
        // Enable the dropdown if there are matching areas, otherwise disable it
        citySpecificAreaSelect.disabled = filteredAreas.length === 0;
    } else {
        // If no council is selected, disable the dropdown
        citySpecificAreaSelect.disabled = true;
    }
    
    console.log("City Specific Area options updated");
}

function updateUses(selectedZoneId) {
    const usesDropdown = document.getElementById('uses');
    if (!usesDropdown) {
        console.error("Uses select element not found");
        return;
    }

    // Clear existing options
    usesDropdown.innerHTML = '<option value="">Select an option</option>';

    if (selectedZoneId) {
        const selectedZone = ulbData.zone.find(zone => zone.id == selectedZoneId);
        if (selectedZone && selectedZone.allowedUses) {
            const filteredUses = ulbData.uses.filter(use => selectedZone.allowedUses.includes(use.id));
            console.log("Filtered uses:", filteredUses);
            
            filteredUses.forEach(use => {
                const option = document.createElement('option');
                option.value = use.id;
                option.textContent = use.name;
                usesDropdown.appendChild(option);
            });
            
            usesDropdown.disabled = false;
        } else {
            console.error("Selected zone or allowed uses not found");
            usesDropdown.disabled = true;
        }
    } else {
        usesDropdown.disabled = true;
    }
    
    console.log("Uses options updated");
}

function updateBuildingSubtypes(selectedBuildingTypeId) {
    const buildingSubtypesDropdown = document.getElementById('building_subtypes');
    if (!buildingSubtypesDropdown) {
        console.error("Building subtypes select element not found");
        return;
    }

    // Clear existing options
    buildingSubtypesDropdown.innerHTML = '<option value="">Select an option</option>';

    if (selectedBuildingTypeId) {
        const subtypes = ulbData.building_subtypes[selectedBuildingTypeId] || [];
        console.log("Building subtypes:", subtypes);
        
        subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype.id;
            option.textContent = subtype.name;
            buildingSubtypesDropdown.appendChild(option);
        });
        
        buildingSubtypesDropdown.disabled = false;
    } else {
        buildingSubtypesDropdown.disabled = true;
    }
    
    console.log("Building subtype options updated");
}

function initializeContactNumberHandler() {
    const contactInput = document.getElementById('contact_no');
    if (contactInput) {
        contactInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    } else {
        console.error("Contact input not found");
    }
}

function handleSubmit(e) {
    e.preventDefault();

    // Show loading indicator
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    // Validate form
    if (!validateForm(e.target)) {
        // Hide loading indicator if validation fails
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return;
    }

    // Collect form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Ensure contact number is in correct format
    data.contact_no = formatContactNumber(data.contact_no);

    console.log("Form data being sent:", data);

    // Send data to Google Apps Script Web App
    sendFormData(data)
        .then(() => {
            console.log("Form submitted successfully");
            alert('Form submitted successfully!');
            e.target.reset();
            // Reset dependent dropdowns
            resetDependentDropdowns();
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form. Please try again.');
        })
        .finally(() => {
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        });
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            alert(`Please fill out the ${field.name} field.`);
            field.focus();
            return false;
        }
    }

    // Validate email format
    const emailInput = form.querySelector('#email');
    if (emailInput && !isValidEmail(emailInput.value)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return false;
    }

    // Validate contact number
    const contactInput = form.querySelector('#contact_no');
    if (contactInput && contactInput.value.length !== 10) {
        alert('Please enter a valid 10-digit contact number.');
        contactInput.focus();
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatContactNumber(number) {
    // Ensure the number is 10 digits and add the +91 prefix
    return number.length === 10 ? `+91${number}` : number;
}

async function sendFormData(data) {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzHYR4sQRFcnosnXhMuGcQYTPOU0_EsdHPMj6eMkGbkLy0o2DMYeiEwfHNE8bJQgWEl/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return response;
    } catch (error) {
        throw new Error('Failed to submit form: ' + error.message);
    }
}

function resetDependentDropdowns() {
    const dependentDropdowns = [
        'city_specific_area',
        'uses',
        'building_subtypes'
    ];

    dependentDropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select an option</option>';
            dropdown.disabled = true;
        }
    });
}

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
});

console.log("scripts.js file loaded");