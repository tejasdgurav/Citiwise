// Global variables
let formData = {};
let zones = [];
let uses = [];
let citySpecificAreas = [];
let buildingTypes = [];
let buildingSubtypes = {};
let ulbData = {}; // Store all ULB data

// Utility functions
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Load data from JSON files
async function loadData() {
    try {
        console.log("Fetching data from JSON files");
        const [
            ulbType,
            ulbRpSpecialAuthority,
            citySpecificArea,
            zone,
            uses,
            buildingType,
            buildingSubtype
        ] = await Promise.all([
            fetch('data/ulb_type.json').then(res => res.json()),
            fetch('data/ulb_rp_special_authority.json').then(res => res.json()),
            fetch('data/city_specific_area.json').then(res => res.json()),
            fetch('data/zone.json').then(res => res.json()),
            fetch('data/uses.json').then(res => res.json()),
            fetch('data/building_type.json').then(res => res.json()),
            fetch('data/building_subtype.json').then(res => res.json())
        ]);

        ulbData = {
            ulb_type: ulbType,
            ulb_rp_special_authority: ulbRpSpecialAuthority,
            city_specific_area: citySpecificArea,
            zone: zone,
            uses: uses,
            building_type: buildingType,
            building_subtype: buildingSubtype
        };

        console.log("Data loaded successfully:", ulbData);
        
        // Populate global variables
        zones = ulbData.zone || [];
        uses = ulbData.uses || [];
        citySpecificAreas = ulbData.city_specific_area || [];
        buildingTypes = ulbData.building_type || [];
        buildingSubtypes = ulbData.building_subtype || {};
        
        console.log("Global variables populated:");
        console.log("Zones:", zones.length);
        console.log("Uses:", uses.length);
        console.log("City Specific Areas:", citySpecificAreas.length);
        console.log("Building Types:", buildingTypes.length);
        console.log("Building Subtypes:", Object.keys(buildingSubtypes).length);
        console.log("ULB Types:", ulbData.ulb_type.length);
        console.log("ULB/RP/Special Authorities:", ulbData.ulb_rp_special_authority.length);
        
        // Populate dropdowns
        populateDropdown('ulb_type', ulbData.ulb_type);
        populateDropdown('zone', zones);
        populateDropdown('uses', uses);
        populateDropdown('city_specific_area', citySpecificAreas);
        populateDropdown('building_type', buildingTypes);
        
        // Disable ULB/RP/Special Authority dropdown initially
        const ulbRpSpecialAuthority = $('#ulb_rp_special_authority');
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
    const select = $('#' + id);
    if (!select) {
        console.error(`Dropdown with id '${id}' not found`);
        return;
    }
    select.innerHTML = '<option value="">Select an option</option>';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name || `${option.districtName} - ${option.talukaName}`;
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options`);
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");
    
    // ULB Type change event
    const ulbTypeSelect = $('#ulb_type');
    if (ulbTypeSelect) {
        ulbTypeSelect.addEventListener('change', handleUlbTypeChange);
    }

    // Conditional field events
    const conditionalFields = [
        { name: 'incentive_fsi', targetId: 'incentive_fsi_rating' },
        { name: 'electrical_line', targetId: 'electrical_line_voltage' },
        { name: 'reservation_area_affected', targetId: 'reservation_area_sqm' },
        { name: 'crz', targetId: 'crz_location' },
        { name: 'dp_rp_road_affected', targetId: 'dp_rp_road_area_sqm' }
    ];

    conditionalFields.forEach(field => {
        $$(`input[name="${field.name}"]`).forEach(radio => {
            radio.addEventListener('change', e => toggleConditionalField(field.targetId, e.target.value === 'Yes'));
        });
    });

    // Building type change event
    const buildingTypeSelect = $('#building_type');
    if (buildingTypeSelect) {
        buildingTypeSelect.addEventListener('change', handleBuildingTypeChange);
    }

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const boundarySelect = $(`#${boundary}_boundary`);
        if (boundarySelect) {
            boundarySelect.addEventListener('change', e => handleBoundaryChange(boundary, e.target.value));
        }
    });

    // Form submission event
    const form = $('#project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error("Form element not found");
    }
}

// Handle ULB Type change
function handleUlbTypeChange(e) {
    console.log("ULB Type changed:", e.target.value);
    
    const ulbRpSpecialAuthority = $('#ulb_rp_special_authority');
    if (!ulbRpSpecialAuthority) {
        console.error("ULB/RP/Special Authority select element not found");
        return;
    }
    
    const selectedUlbTypeId = e.target.value;
    
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
}

// Toggle conditional fields
function toggleConditionalField(fieldId, show) {
    const field = $('#' + fieldId);
    if (field) {
        field.style.display = show ? 'block' : 'none';
    }
}

// Handle Building Type change
function handleBuildingTypeChange(e) {
    const buildingSubtype = $('#building_subtype');
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
}

// Handle boundary change
function handleBoundaryChange(boundary, value) {
    const roadDetails = $(`#${boundary}-road-details`);
    if (roadDetails) {
        roadDetails.style.display = value === 'Road' ? 'block' : 'none';
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Show loading indicator
    const loadingIndicator = $('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
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
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return;
    }
    
    // Send data to Google Sheets
    try {
        await sendToGoogleSheets(formData);
        alert('Form submitted successfully!');
        e.target.reset();
        
        // Reset ULB/RP/Special Authority dropdown
        const ulbRpSpecialAuthority = $('#ulb_rp_special_authority');
        if (ulbRpSpecialAuthority) {
            ulbRpSpecialAuthority.innerHTML = '<option value="">Select an option</option>';
            ulbRpSpecialAuthority.disabled = true;
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
    // Add your validation logic here
    // For now, we'll just check if required fields are filled
    const requiredFields = $$('[required]');
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
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzHYR4sQRFcnosnXhMuGcQYTPOU0_EsdHPMj6eMkGbkLy0o2DMYeiEwfHNE8bJQgWEl/exec'; // Replace with your actual script URL
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
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
});

// Add this line at the end of the file to check if the script is loaded
console.log("scripts.js file loaded");