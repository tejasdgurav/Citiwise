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

// Get form data
function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      // For file inputs, just store the file name
      data[key] = value.name;
    } else {
      data[key] = value;
    }
  }
  return data;
}

// Load data from JSON
async function loadData() {
    try {
        console.log("Fetching data from JSON files");
        const [
            ulbRpSpecialAuthority,
            citySpecificArea,
            zone,
            uses,
            buildingType,
            buildingSubtype
        ] = await Promise.all([
            fetch('/Citiwise/data/ulb_rp_special_authority.json').then(res => res.json()),
            fetch('/Citiwise/data/city_specific_area.json').then(res => res.json()),
            fetch('/Citiwise/data/zone.json').then(res => res.json()),
            fetch('/Citiwise/data/uses.json').then(res => res.json()),
            fetch('/Citiwise/data/building_type.json').then(res => res.json()),
            fetch('/Citiwise/data/building_subtype.json').then(res => res.json())
        ]);
        
        ulbData = {
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
        
        console.log("Global variables populated");
        
        // Populate dropdowns
        populateDropdown('ulb_rp_special_authority', ulbData.ulb_rp_special_authority);
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
    const select = $('#' + id);
    if (!select) {
        console.error(`Dropdown with id '${id}' not found`);
        return;
    }
    select.innerHTML = '<option value="">Select an option</option>';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        
        if (id === 'ulb_rp_special_authority') {
            optionElement.textContent = `${option.districtName} - ${option.talukaName}`;
        } else if (id === 'city_specific_area') {
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
    const dependentDropdowns = ['uses', 'building_subtype', 'city_specific_area'];
    dependentDropdowns.forEach(id => {
        const dropdown = $('#' + id);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select an option</option>';
            dropdown.disabled = true;
        }
    });
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");
    
    // ULB/RP/Special Authority change event
    $('#ulb_rp_special_authority').addEventListener('change', e => updateCitySpecificAreas(e.target.value));

    // Zone change event
    $('#zone').addEventListener('change', e => handleZoneChange(e.target.value));

    // Building type change event
    $('#building_type').addEventListener('change', e => handleBuildingTypeChange(e.target.value));

    // Conditional field events
    const conditionalFields = [
        { name: 'incentive_fsi', targetId: 'incentive_fsi_rating' },
        { name: 'electrical_line', targetId: 'electrical_line_voltage' },
        { name: 'reservation_area_affected', targetId: 'reservation_area_sqm' },
        { name: 'crz_status', targetId: 'crz_location' },
        { name: 'dp_rp_road_affected', targetId: 'dp_rp_road_area_sqm' }
    ];

    conditionalFields.forEach(field => {
        $$(`input[name="${field.name}"]`).forEach(radio => {
            radio.addEventListener('change', e => toggleConditionalField(field.targetId, e.target.value === 'Yes'));
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        $(`#${boundary}_boundary_type`).addEventListener('change', e => {
            $(`#road_container_${boundary}`).style.display = e.target.value === 'Road' ? 'block' : 'none';
        });
    });

    // Form submission event
    $('#project-input-form').addEventListener('submit', handleSubmit);
}

// Update City Specific Areas based on selected ULB/RP/Special Authority
function updateCitySpecificAreas(selectedCouncilId) {
    const citySpecificAreaSelect = $('#city_specific_area');
    citySpecificAreaSelect.innerHTML = '<option value="">Select an option</option>';
    
    if (selectedCouncilId) {
        const filteredAreas = citySpecificAreas.filter(area => area.councilId == selectedCouncilId);
        console.log("Filtered city-specific areas:", filteredAreas);
        
        populateDropdown('city_specific_area', filteredAreas);
        citySpecificAreaSelect.disabled = filteredAreas.length === 0;
    } else {
        citySpecificAreaSelect.disabled = true;
    }
    
    console.log("City Specific Area options updated");
}

// Handle Zone change
function handleZoneChange(selectedZoneId) {
    console.log("Zone changed:", selectedZoneId);
    
    const usesDropdown = $('#uses');
    usesDropdown.innerHTML = '<option value="">Select an option</option>';
    
    if (selectedZoneId) {
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

// Handle Building Type change
function handleBuildingTypeChange(selectedBuildingTypeId) {
    console.log("Building Type changed:", selectedBuildingTypeId);
    
    const buildingSubtypeDropdown = $('#building_subtype');
    buildingSubtypeDropdown.innerHTML = '<option value="">Select an option</option>';
    
    if (selectedBuildingTypeId) {
        const subtypes = buildingSubtypes[selectedBuildingTypeId] || [];
        console.log("Building subtypes:", subtypes);
        
        subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype.id;
            option.textContent = subtype.name;
            buildingSubtypeDropdown.appendChild(option);
        });
        
        buildingSubtypeDropdown.disabled = false;
    } else {
        buildingSubtypeDropdown.disabled = true;
    }
    
    console.log("Building subtype options updated");
}

// Toggle conditional fields
function toggleConditionalField(fieldId, show) {
    const field = $('#' + fieldId);
    if (field) {
        field.style.display = show ? 'block' : 'none';
    }
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  $('.loading-indicator').style.display = 'flex';
  
  const form = e.target;
  const formData = getFormData(form);
  
  console.log("Form data being sent:", formData);
  
  if (!validateForm(form)) {
    $('.loading-indicator').style.display = 'none';
    return;
  }
  
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzHYR4sQRFcnosnXhMuGcQYTPOU0_EsdHPMj6eMkGbkLy0o2DMYeiEwfHNE8bJQgWEl/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    console.log("Form submitted successfully");
    alert('Form submitted successfully!');
    form.reset();
    
    initializeDependentDropdowns();
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('An error occurred while submitting the form. Please try again.');
  }
  
  $('.loading-indicator').style.display = 'none';
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
  return true;
}

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
});

console.log("scripts.js file loaded");