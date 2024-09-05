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
        populateDropdown('uses', uses);
        populateDropdown('city_specific_area', citySpecificAreas);
        populateDropdown('building_type', buildingTypes);
        
        // Disable ULB/RP/Special Authority dropdown initially
        const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
        if (ulbRpSpecialAuthority) {
            ulbRpSpecialAuthority.disabled = true;
        }
        
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
        optionElement.textContent = option.name;
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options`);
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");
    
    // ULB Type change event
    const ulbTypeSelect = document.getElementById('ulb_type');
    if (ulbTypeSelect) {
        ulbTypeSelect.addEventListener('change', function(e) {
            console.log("ULB Type changed:", e.target.value);
            
            const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
            if (!ulbRpSpecialAuthority) {
                console.error("ULB/RP/Special Authority select element not found");
                return;
            }
            
            const selectedUlbTypeId = e.target.value;
            if (!ulbData.ulb_rp_special_authority) {
                console.error("ulb_rp_special_authority data not found in ulbData");
                return;
            }
            
            // Clear existing options
            ulbRpSpecialAuthority.innerHTML = '<option value="">Select an option</option>';
            
            if (selectedUlbTypeId) {
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
            
            console.log("ULB/RP/Special Authority options updated");
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
                crzLocation.style.display = e.target.value === 'Yes' ? 'block' : 'none';
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

    // Building type change event
    const buildingTypeSelect = document.getElementById('building_type');
    if (buildingTypeSelect) {
        buildingTypeSelect.addEventListener('change', function(e) {
            const buildingSubtype = document.getElementById('building_subtype');
            if (!buildingSubtype) {
                console.error("Building subtype select element not found");
                return;
            }
            
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
    }

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
    const form = document.getElementById('project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error("Form element not found");
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Show loading indicator
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    // Collect form data
    formData = {};
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
    
    console.log("Form data being sent:", formData);
    
    // Validate form data
    if (!validateForm()) {
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return;
    }
    
    // Send data to Google Sheets
    try {
        const result = await sendToGoogleSheets(formData);
        console.log("Response from Google Sheets:", result);
        if (result.result === 'success') {
            alert('Form submitted successfully!');
            e.target.reset();
            
            // Reset ULB/RP/Special Authority dropdown
            const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
            if (ulbRpSpecialAuthority) {
                ulbRpSpecialAuthority.innerHTML = '<option value="">Select an option</option>';
                ulbRpSpecialAuthority.disabled = true;
            }
        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('An error occurred while submitting the form. Please try again.');
    }
    
    // Hide loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}


// Validate form data
function validateForm() {
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
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxV9FCXTJNFUAD0S3UpSDH3rBRPaYblB4KmutYSjD21zVfKbDsfNMqMi1PBrq7fRwdM/exec';
    try {
        const formData = new URLSearchParams(data);
        const response = await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });
        console.log('Full response:', response);
        return { result: 'success' };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
});

console.log("scripts.js file loaded");