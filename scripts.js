// Global variables
let formData = {};
let zones = [];
let uses = [];
let citySpecificAreas = [];
let buildingTypes = [];
let buildingSubtypes = {};
let ulbData = {}; // Store all ULB data

// Load data from JSON
async function loadData() {
    try {
        console.log("Fetching data from data.json");
        const response = await fetch('/Citiwise/data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log("Data loaded successfully:", data);
        
        // Populate global variables
        zones = data.zone || [];
        uses = data.uses || [];
        citySpecificAreas = data.city_specific_area || [];
        buildingTypes = data.building_type || [];
        buildingSubtypes = data.building_subtype || {};
        ulbData = data; // Store all data for later use
        
        console.log("Global variables populated");
        
        // Populate dropdowns
        populateDropdown('ulb_type', data.ulb_type || []);
        populateDropdown('zone', zones);
        populateDropdown('building_type', buildingTypes);
        
        // Initialize dependent dropdowns
        initializeDependentDropdowns();
        
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
        optionElement.value = option.id;
        
        if (id === 'city_specific_area') {
            optionElement.textContent = option.citySpecificArea || 'Unknown Area';
        } else {
            optionElement.textContent = option.name || 'Unknown Option';
        }
        
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options`);
}

// Initialize dependent dropdowns
function initializeDependentDropdowns() {
    const dependentDropdowns = ['ulb_rp_special_authority', 'uses', 'building_subtype', 'city_specific_area'];
    dependentDropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.innerHTML = ''; // Remove all options
            dropdown.disabled = true;
        }
    });
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");
    
    // ULB Type change event
    const ulbTypeSelect = document.getElementById('ulb_type');
    if (ulbTypeSelect) {
        ulbTypeSelect.addEventListener('change', function(e) {
            handleUlbTypeChange(e.target.value);
        });
    }

    // ULB/RP/Special Authority change event
    const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
    if (ulbRpSpecialAuthority) {
        ulbRpSpecialAuthority.addEventListener('change', function(e) {
            updateCitySpecificAreas(e.target.value);
        });
    }

    // Zone change event
    const zoneSelect = document.getElementById('zone');
    if (zoneSelect) {
        zoneSelect.addEventListener('change', function(e) {
            handleZoneChange(e.target.value);
        });
    }

    // Building type change event
    const buildingTypeSelect = document.getElementById('building_type');
    if (buildingTypeSelect) {
        buildingTypeSelect.addEventListener('change', function(e) {
            handleBuildingTypeChange(e.target.value);
        });
    }

    // Incentive FSI change event
    document.querySelectorAll('input[name="incentive_fsi"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const incentiveFsiRating = document.getElementById('incentive_fsi_rating');
            if (incentiveFsiRating) {
                incentiveFsiRating.style.display = e.target.value === 'Yes' ? 'block' : 'none';
            }
        });
    });

    // Electrical Line change event
    document.querySelectorAll('input[name="electrical_line"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const electricalLineVoltage = document.getElementById('electrical_line_voltage');
            if (electricalLineVoltage) {
                electricalLineVoltage.style.display = e.target.value === 'Yes' ? 'block' : 'none';
            }
        });
    });

    // Reservation Area Affected change event
    document.querySelectorAll('input[name="reservation_area_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const reservationAreaSqm = document.getElementById('reservation_area_sqm');
            if (reservationAreaSqm) {
                reservationAreaSqm.style.display = e.target.value === 'Yes' ? 'block' : 'none';
            }
        });
    });

    // CRZ change event
    document.querySelectorAll('input[name="crz_status"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const crzLocation = document.getElementById('crz_location');
            if (crzLocation) {
                crzLocation.style.display = 'none'; // Always hide CRZ location
            }
        });
    });

    // DP/RP road affected change event
    document.querySelectorAll('input[name="dp_rp_road_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const dpRpRoadAreaSqm = document.getElementById('dp_rp_road_area_sqm');
            if (dpRpRoadAreaSqm) {
                dpRpRoadAreaSqm.style.display = e.target.value === 'Yes' ? 'block' : 'none';
            }
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const boundarySelect = document.getElementById(`${boundary}_boundary_type`);
        if (boundarySelect) {
            boundarySelect.addEventListener('change', (e) => {
                const roadContainer = document.getElementById(`road_container_${boundary}`);
                if (roadContainer) {
                    roadContainer.style.display = e.target.value === 'Road' ? 'block' : 'none';
                }
            });
        }
    });

    // Add input event listeners for sentence case conversion
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = toSentenceCase(this.value);
        });
    });

    // Initialize contact number handler
    initializeContactNumberHandler();
}

// Handle ULB Type change
function handleUlbTypeChange(selectedUlbTypeId) {
    console.log("ULB Type changed:", selectedUlbTypeId);
    
    const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
    if (!ulbRpSpecialAuthority) {
        console.error("ULB/RP/Special Authority select element not found");
        return;
    }
    
    // Clear existing options
    ulbRpSpecialAuthority.innerHTML = '';
    
    if (selectedUlbTypeId) {
        // Add "Select an option" only when a ULB Type is selected
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select an option";
        ulbRpSpecialAuthority.appendChild(defaultOption);

        const filteredAuthorities = ulbData.ulb_rp_special_authority.filter(auth => auth.typeId == selectedUlbTypeId);
        console.log("Filtered authorities:", filteredAuthorities);
        
        filteredAuthorities.forEach(auth => {
            const option = document.createElement('option');
            option.value = auth.id;
            option.textContent = auth.name;
            ulbRpSpecialAuthority.appendChild(option);
        });
        
        // Enable the dropdown
        ulbRpSpecialAuthority.disabled = false;
    } else {
        // If no ULB Type is selected, disable the dropdown
        ulbRpSpecialAuthority.disabled = true;
    }
    
    // Clear and disable city-specific area dropdown when ULB type changes
    updateCitySpecificAreas(null);
    
    console.log("ULB/RP/Special Authority options updated");
}

// Update City Specific Areas based on selected ULB/RP/Special Authority
function updateCitySpecificAreas(selectedCouncilId) {
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    if (!citySpecificAreaSelect) {
        console.error("City Specific Area select element not found");
        return;
    }

    // Clear existing options
    citySpecificAreaSelect.innerHTML = '';
    
    if (selectedCouncilId) {
        // Filter city-specific areas based on the selected councilId
        const filteredAreas = citySpecificAreas.filter(area => area.councilId == selectedCouncilId);
        console.log("Filtered city-specific areas:", filteredAreas);
        
        // Populate the dropdown with filtered areas
        populateDropdown('city_specific_area', filteredAreas);
        
        // Enable the dropdown if there are matching areas, otherwise disable it
        citySpecificAreaSelect.disabled = filteredAreas.length === 0;
    } else {
        // If no council is selected, disable the dropdown
        citySpecificAreaSelect.disabled = true;
    }
    
    console.log("City Specific Area options updated");
}

// Handle Zone change
function handleZoneChange(selectedZoneId) {
    console.log("Zone changed:", selectedZoneId);
    
    const usesDropdown = document.getElementById('uses');
    if (!usesDropdown) {
        console.error("Uses select element not found");
        return;
    }
    
    // Clear existing options
    usesDropdown.innerHTML = '';
    
    if (selectedZoneId) {
        // Add "Select an option" only when a Zone is selected
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select an option";
        usesDropdown.appendChild(defaultOption);

        const selectedZone = zones.find(zone => zone.id == selectedZoneId);
        if (selectedZone && selectedZone.allowedUses) {
            const filteredUses = uses.filter(use => selectedZone.allowedUses.includes(use.id));
            console.log("Filtered uses:", filteredUses);
            
            filteredUses.forEach(use => {
                const option = document.createElement('option');
                option.value = use.id;
                option.textContent = use.name;
                usesDropdown.appendChild(option);
            });
            
            // Enable the dropdown
            usesDropdown.disabled = false;
        } else {
            console.error("Selected zone or allowed uses not found");
            usesDropdown.disabled = true;
        }
    } else {
        // If no Zone is selected, disable the dropdown
        usesDropdown.disabled = true;
    }
    
    console.log("Uses options updated");
}

// Handle Building Type change
function handleBuildingTypeChange(selectedBuildingTypeId) {
    console.log("Building Type changed:", selectedBuildingTypeId);
    
    const buildingSubtypeDropdown = document.getElementById('building_subtype');
    if (!buildingSubtypeDropdown) {
        console.error("Building subtype select element not found");
        return;
    }
    
    // Clear existing options
    buildingSubtypeDropdown.innerHTML = '';
    
    if (selectedBuildingTypeId) {
        // Add "Select an option" only when a building type is selected
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select an option";
        buildingSubtypeDropdown.appendChild(defaultOption);

        const subtypes = buildingSubtypes[selectedBuildingTypeId] || [];
        console.log("Building subtypes:", subtypes);
        
        subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype.id;
            option.textContent = subtype.name;
            buildingSubtypeDropdown.appendChild(option);
        });
        
        // Enable the dropdown
        buildingSubtypeDropdown.disabled = false;
    } else {
        // If no Building Type is selected, disable the dropdown
        buildingSubtypeDropdown.disabled = true;
    }
    
    console.log("Building subtype options updated");
}

// Convert text to sentence case
function toSentenceCase(text) {
    return text.replace(/(^\w|\.\s+\w)/g, match => match.toUpperCase());
}

// Contact Number Handler
function initializeContactNumberHandler() {
    const contactInput = document.getElementById('contact_no');
    const form = document.getElementById('project-input-form');

    if (contactInput && form) {
        // Input event listener for formatting
        contactInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });

        // Form submission handler
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error("Contact input or form not found");
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
            initializeDependentDropdowns();
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
        const response = await fetch('https://script.google.com/macros/s/AKfycbzR_aruON8iw79udtjByurnY1l9KM6eHcM-1_7BuD52JZJaQrGmnUD3OzVM1d-V36nU/exec', {
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

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
});

console.log("scripts.js file loaded");