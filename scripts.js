// Global variables
let formData = {};
let zones = [];
let uses = [];
let citySpecificAreas = [];
let buildingTypes = [];
let buildingSubtypes = {};
let ulbData = {}; // Store all ULB data

// Add this function at the beginning of your script
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
        populateDropdown('city_specific_area', citySpecificAreas);
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
        optionElement.textContent = option.name;
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options`);
}

// Initialize dependent dropdowns
function initializeDependentDropdowns() {
    const dependentDropdowns = ['ulb_rp_special_authority', 'uses', 'building_subtype'];
    dependentDropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.innerHTML = ''; // Remove all options, including "Select an option"
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

    // Form submission event
    const form = document.getElementById('project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error("Form element not found");
    }
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
    
    console.log("ULB/RP/Special Authority options updated");
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

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  // Show loading indicator
  const loadingIndicator = document.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
  
  // Collect form data
  const form = e.target;
  const formData = getFormData(form);
  
  console.log("Form data being sent:", formData);
  
  // Validate form data
  if (!validateForm(form)) {
    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    return;
  }
  
  // Send data to Google Apps Script Web App
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzR_aruON8iw79udtjByurnY1l9KM6eHcM-1_7BuD52JZJaQrGmnUD3OzVM1d-V36nU/exec', {
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
    
    // Reset dependent dropdowns
    initializeDependentDropdowns();
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('An error occurred while submitting the form. Please try again.');
  }
  
  // Hide loading indicator
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
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