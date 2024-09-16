// Global variables
let ulbData = {};

// Utility functions
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Load data from JSON file
async function loadData() {
    try {
        console.log("Fetching data from JSON file");
        const basePath = 'https://raw.githubusercontent.com/tejasdgurav/Citiwise/main/';
        
        const response = await fetch(`${basePath}data.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        ulbData = data;

        console.log("Data loaded successfully. Detailed structure:");
        Object.keys(ulbData).forEach(key => {
            console.log(`${key}:`, JSON.stringify(ulbData[key]).slice(0, 200) + "...");
        });
        
        // Populate dropdowns
        populateDropdown('ulb_rp_special_authority', ulbData.ulb_rp_special_authority);
        populateDropdown('city_specific_area', ulbData.city_specific_area);
        populateDropdown('zone', ulbData.zone);
        populateDropdown('building_type', ulbData.building_type);
        
        // Initialize form state
        initializeFormState();
        
        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Function to populate dropdowns
function populateDropdown(id, options) {
    console.log(`Populating ${id} dropdown. Options:`, options);
    const select = $('#' + id);
    if (!select) {
        console.error(`${id} select element not found`);
        return;
    }
    select.innerHTML = `<option value="">Select ${id.replace(/_/g, ' ')}</option>`;
    
    if (Array.isArray(options)) {
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            if (id === 'ulb_rp_special_authority') {
                optionElement.textContent = `${option.districtName} - ${option.talukaName}`;
            } else {
                optionElement.textContent = option.name || option.citySpecificArea;
            }
            select.appendChild(optionElement);
        });
        console.log(`Populated ${id} dropdown with ${options.length} options`);
    } else {
        console.error(`Data for ${id} is not an array:`, options);
    }
}

// Function to initialize form state
function initializeFormState() {
    const conditionalFields = [
        'incentive_fsi_rating',
        'electrical_line_voltage',
        'reservation_area_sqm',
        'dp_rp_road_area_sqm'
    ];

    conditionalFields.forEach(fieldId => {
        const field = $('#' + fieldId);
        if (field) {
            field.closest('.form-group').classList.add('hidden');
        }
    });

    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const roadContainer = $('#road_container_' + boundary);
        if (roadContainer) {
            roadContainer.style.display = 'none';
        }
    });
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");

    $('#zone').addEventListener('change', handleZoneChange);
    $('#building_type').addEventListener('change', handleBuildingTypeChange);

    // Radio button event listeners
    const radioGroups = ['incentive_fsi', 'electrical_line', 'reservation_area_affected', 'dp_rp_road_affected'];
    radioGroups.forEach(group => {
        $$(`input[name="${group}"]`).forEach(radio => {
            radio.addEventListener('change', e => toggleConditionalField(group, e.target.value));
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const select = $(`#${boundary}`);
        if (select) {
            select.addEventListener('change', e => handleBoundaryChange(boundary, e.target.value));
        }
    });

    // Form submission
    const form = $('#project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error("Form with id 'project-input-form' not found");
    }
}

// Handle Zone change
function handleZoneChange(e) {
    const selectedZoneId = e.target.value;
    console.log("Zone changed:", selectedZoneId);
    const usesDropdown = $('#uses');
    if (!usesDropdown) {
        console.error("Uses dropdown not found");
        return;
    }
    usesDropdown.innerHTML = '<option value="">Select uses</option>';
    
    if (selectedZoneId) {
        const selectedZone = ulbData.zone.find(zone => zone.id == selectedZoneId);
        if (selectedZone && selectedZone.allowedUses) {
            const filteredUses = ulbData.uses.filter(use => selectedZone.allowedUses.includes(use.id));
            filteredUses.forEach(use => {
                const option = document.createElement('option');
                option.value = use.id;
                option.textContent = use.name;
                usesDropdown.appendChild(option);
            });
        }
    }
    usesDropdown.disabled = !selectedZoneId;
}

// Handle Building Type change
function handleBuildingTypeChange(e) {
    const selectedBuildingTypeId = e.target.value;
    console.log("Building Type changed:", selectedBuildingTypeId);
    const buildingSubtypeDropdown = $('#building_subtypes');
    if (!buildingSubtypeDropdown) {
        console.error("Building subtype dropdown not found");
        return;
    }
    buildingSubtypeDropdown.innerHTML = '<option value="">Select building subtype</option>';
    
    if (selectedBuildingTypeId) {
        const filteredSubtypes = ulbData.building_subtype.filter(subtype => subtype.bldgtypeID == selectedBuildingTypeId);
        filteredSubtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype.id;
            option.textContent = subtype.name;
            buildingSubtypeDropdown.appendChild(option);
        });
    }
    buildingSubtypeDropdown.disabled = !selectedBuildingTypeId;
}

// Toggle conditional fields
function toggleConditionalField(group, value) {
    const fieldMap = {
        'incentive_fsi': 'incentive_fsi_rating',
        'electrical_line': 'electrical_line_voltage',
        'reservation_area_affected': 'reservation_area_sqm',
        'dp_rp_road_affected': 'dp_rp_road_area_sqm'
    };
    const field = $('#' + fieldMap[group]);
    if (field) {
        field.closest('.form-group').classList.toggle('hidden', value !== 'Yes');
    }
}

// Handle boundary change
function handleBoundaryChange(boundary, value) {
    const roadContainer = $(`#road_container_${boundary}`);
    if (roadContainer) {
        roadContainer.style.display = value === 'Road' ? 'block' : 'none';
    }
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    console.log("Form submitted");
    // Add your form submission logic here
}

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
});

console.log("scripts.js file loaded");