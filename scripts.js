// Global variables
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
        populateDropdown('type_of_proposal', data.type_of_proposal || []);
        populateDropdown('type_of_plot_layout', data.type_of_plot_layout || []);
        populateDropdown('zone', data.zone || []);
        populateDropdown('plot_identification_type', data.plot_identification_type || []);
        populateDropdown('height_of_building', data.height_of_building || []);
        populateDropdown('building_type', data.building_type || []);
        
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
        const boundarySelect = document.getElementById(boundary);
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
        incentiveFsiRating.classList.toggle('hidden', !show);
    }
}

function toggleElectricalLineVoltage(show) {
    const electricalLineVoltage = document.getElementById('electrical_line_voltage');
    if (electricalLineVoltage) {
        electricalLineVoltage.classList.toggle('hidden', !show);
    }
}

function toggleReservationAreaSqm(show) {
    const reservationAreaSqm = document.getElementById('reservation_area_sqm');
    if (reservationAreaSqm) {
        reservationAreaSqm.classList.toggle('hidden', !show);
    }
}

function toggleDpRpRoadAreaSqm(show) {
    const dpRpRoadAreaSqm = document.getElementById('dp_rp_road_area_sqm');
    if (dpRpRoadAreaSqm) {
        dpRpRoadAreaSqm.classList.toggle('hidden', !show);
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

    citySpecificAreaSelect.innerHTML = '<option value="">Select an option</option>';
    
    if (selectedCouncilId) {
        const filteredAreas = ulbData.city_specific_area.filter(area => area.councilId == selectedCouncilId);
        console.log("Filtered city-specific areas:", filteredAreas);
        
        filteredAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.name;
            citySpecificAreaSelect.appendChild(option);
        });
        
        citySpecificAreaSelect.disabled = filteredAreas.length === 0;
    } else {
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

    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    if (!validateForm(e.target)) {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return;
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    data.contact_no = formatContactNumber(data.contact_no);

    console.log("Form data being sent:", data);

    sendFormData(data)
        .then(() => {
            console.log("Form submitted successfully");
            alert('Form submitted successfully!');
            e.target.reset();
            resetDependentDropdowns();
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form. Please try again.');
        })
        .finally(() => {
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

    const emailInput = form.querySelector('#email');
    if (emailInput && !isValidEmail(emailInput.value)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return false;
    }

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