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
        ulbData = await response.json();
        console.log("Data loaded successfully:", ulbData);
        
        // Populate dropdowns
        populateDropdown('ulb_rp_special_authority', ulbData.ulb_rp_special_authority || [], 'talukaName');
        populateDropdown('special_scheme', ulbData.special_scheme || []);
        populateDropdown('type_of_development', ulbData.type_of_development || []);
        populateDropdown('type_of_proposal', ulbData.type_of_proposal || []);
        populateDropdown('type_of_plot_layout', ulbData.type_of_plot_layout || []);
        populateDropdown('zone', ulbData.zone || []);
        populateDropdown('plot_identification_type', ulbData.plot_identification_type || []);
        populateDropdown('height_of_building', ulbData.height_of_building || []);
        populateDropdown('building_type', ulbData.building_type || []);
        populateDropdown('incentive_fsi_rating', ulbData.incentive_fsi_rating || []);
        populateDropdown('electrical_line_voltage', ulbData.electrical_line_voltage || []);

        // Initialize form state
        initializeFormState();
        
        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateDropdown(id, options, textProperty = 'name') {
    const select = document.getElementById(id);
    if (!select) {
        console.error(`Dropdown with id '${id}' not found`);
        return;
    }
    select.innerHTML = `<option value="">Select ${id.replace(/_/g, ' ')}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id || option.value;
        optionElement.textContent = option[textProperty] || option.text || 'Unknown Option';
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options`);
}

function initializeFormState() {
    const conditionalFields = [
        'incentive_fsi_rating',
        'electrical_line_voltage',
        'reservation_area_sqm',
        'dp_rp_road_area_sqm'
    ];

    conditionalFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.closest('.form-group').classList.add('hidden');
        }
    });

    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const roadContainer = document.getElementById(`road_container_${boundary}`);
        if (roadContainer) {
            roadContainer.style.display = 'none';
        }
    });
}

function addEventListeners() {
    console.log("Adding event listeners");

    // ULB/RP/Special Authority change event
    const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
    if (ulbRpSpecialAuthority) {
        ulbRpSpecialAuthority.addEventListener('change', function(e) {
            updateCitySpecificAreas(e.target.value);
        });
    }

    // Special Scheme change event
    const specialScheme = document.getElementById('special_scheme');
    if (specialScheme) {
        specialScheme.addEventListener('change', function(e) {
            // Add any specific logic for special scheme selection
        });
    }

    // Type of Development change event
    const typeOfDevelopment = document.getElementById('type_of_development');
    if (typeOfDevelopment) {
        typeOfDevelopment.addEventListener('change', function(e) {
            // Add any specific logic for type of development selection
        });
    }

    // Incentive FSI change event
    document.querySelectorAll('input[name="incentive_fsi"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            toggleConditionalField('incentive_fsi_rating', e.target.value === 'Yes');
        });
    });

    // Type of Proposal change event
    const typeOfProposal = document.getElementById('type_of_proposal');
    if (typeOfProposal) {
        typeOfProposal.addEventListener('change', function(e) {
            // Add any specific logic for type of proposal selection
        });
    }

    // Electrical Line change event
    document.querySelectorAll('input[name="electrical_line"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            toggleConditionalField('electrical_line_voltage', e.target.value === 'Yes');
        });
    });

    // Reservation Area Affected change event
    document.querySelectorAll('input[name="reservation_area_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            toggleConditionalField('reservation_area_sqm', e.target.value === 'Yes');
        });
    });

    // DP/RP road affected change event
    document.querySelectorAll('input[name="dp_rp_road_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            toggleConditionalField('dp_rp_road_area_sqm', e.target.value === 'Yes');
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

    // Road type change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const roadTypeSelect = document.getElementById(`road_type_${boundary}`);
        if (roadTypeSelect) {
            roadTypeSelect.addEventListener('change', (e) => {
                const roadWidthInput = document.getElementById(`road_width_${boundary}`);
                if (roadWidthInput) {
                    roadWidthInput.style.display = e.target.value ? 'block' : 'none';
                }
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

    // Add input event listeners for sentence case conversion
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = toSentenceCase(this.value);
        });
    });

    // Initialize contact number handler
    initializeContactNumberHandler();

    // Form submission handler
    const form = document.getElementById('project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

function toggleConditionalField(fieldId, show) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.closest('.form-group').classList.toggle('hidden', !show);
    }
}

function toggleRoadDetails(boundary, show) {
    const roadContainer = document.getElementById(`road_container_${boundary}`);
    if (roadContainer) {
        roadContainer.style.display = show ? 'block' : 'none';
        if (show) {
            const roadTypeSelect = document.getElementById(`road_type_${boundary}`);
            const roadWidthInput = document.getElementById(`road_width_${boundary}`);
            if (roadTypeSelect) {
                roadTypeSelect.value = '';
                populateRoadTypes(roadTypeSelect);
            }
            if (roadWidthInput) {
                roadWidthInput.value = '';
                roadWidthInput.style.display = 'none';
            }
        }
    }
}

function populateRoadTypes(selectElement) {
    selectElement.innerHTML = '<option value="">Select Road Type</option>';
    const roadTypes = [
        'DP Road',
        'Other General Road',
        'Express Way',
        'National Highway - NH',
        'State Highway - SH',
        'Major District Road - MDR',
        'Other District Road',
        '15m Village Road'
    ];
    roadTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        selectElement.appendChild(option);
    });
}

function updateCitySpecificAreas(selectedCouncilId) {
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    if (!citySpecificAreaSelect) return;

    citySpecificAreaSelect.innerHTML = '<option value="">Select city specific area</option>';
    
    if (selectedCouncilId) {
        const filteredAreas = ulbData.city_specific_area.filter(area => area.councilId == selectedCouncilId);
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
}

function updateUses(selectedZoneId) {
    const usesDropdown = document.getElementById('uses');
    if (!usesDropdown) return;

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
            usesDropdown.disabled = false;
        } else {
            usesDropdown.disabled = true;
        }
    } else {
        usesDropdown.disabled = true;
    }
}

function updateBuildingSubtypes(selectedBuildingTypeId) {
    const buildingSubtypesDropdown = document.getElementById('building_subtypes');
    if (!buildingSubtypesDropdown) return;

    buildingSubtypesDropdown.innerHTML = '<option value="">Select building subtype</option>';

    if (selectedBuildingTypeId) {
        const subtypes = ulbData.building_subtypes[selectedBuildingTypeId] || [];
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
}

function toSentenceCase(text) {
    return text.replace(/(^\w|\.\s+\w)/g, match => match.toUpperCase());
}

function initializeContactNumberHandler() {
    const contactInput = document.getElementById('contact_no');
    if (contactInput) {
        contactInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }
}

function handleSubmit(e) {
    e.preventDefault();

    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'flex';

    if (!validateForm(e.target)) {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
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
            initializeFormState();
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form. Please try again.');
        })
        .finally(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            alert(`Please fill out the ${field.name.replace(/_/g, ' ')} field.`);
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

function handleFileInputChange(inputId) {
    const fileInput = document.getElementById(inputId);
    const fileNameDisplay = document.getElementById(`${inputId}_name`);
    
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = '';
            }
        });
    }
}

function initializeFileInputs() {
    handleFileInputChange('dp_rp_part_plan');
    handleFileInputChange('google_image');
}

// Function to handle changes in the "Is the site hilly and has gradients more than 1:5?" radio buttons
function handleHillySiteChange() {
    const hillySiteRadios = document.querySelectorAll('input[name="hilly_site"]');
    hillySiteRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for hilly site selection
            console.log('Hilly site selection:', e.target.value);
        });
    });
}

// Function to handle changes in the "Flood Affected Area" radio buttons
function handleFloodAffectedAreaChange() {
    const floodAreaRadios = document.querySelectorAll('input[name="flood_affected_area"]');
    floodAreaRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for flood affected area selection
            console.log('Flood affected area selection:', e.target.value);
        });
    });
}

// Function to handle changes in the "Location" radio buttons
function handleLocationChange() {
    const locationRadios = document.querySelectorAll('input[name="location"]');
    locationRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for location selection
            console.log('Location selection:', e.target.value);
        });
    });
}

// Function to handle changes in the "Is the plot land affected by CRZ?" radio buttons
function handleCRZAffectedChange() {
    const crzAffectedRadios = document.querySelectorAll('input[name="crz_affected"]');
    crzAffectedRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for CRZ affected selection
            console.log('CRZ affected selection:', e.target.value);
        });
    });
}

// Function to handle changes in the "Class of Land" radio buttons
function handleClassOfLandChange() {
    const classOfLandRadios = document.querySelectorAll('input[name="class_of_land"]');
    classOfLandRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for class of land selection
            console.log('Class of land selection:', e.target.value);
        });
    });
}

// Function to handle changes in the "Is it a redevelopment proposal?" radio buttons
function handleRedevelopmentProposalChange() {
    const redevelopmentRadios = document.querySelectorAll('input[name="redevelopment_proposal"]');
    redevelopmentRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for redevelopment proposal selection
            console.log('Redevelopment proposal selection:', e.target.value);
        });
    });
}

// Function to handle changes in the "Is your land in TOD?" radio buttons
function handleTODChange() {
    const todRadios = document.querySelectorAll('input[name="land_in_tod"]');
    todRadios.forEach(radio => {
        radio.addEventListener('change', function(e) {
            // Add any specific logic for TOD selection
            console.log('TOD selection:', e.target.value);
        });
    });
}

// Function to initialize all radio button change handlers
function initializeRadioButtonHandlers() {
    handleHillySiteChange();
    handleFloodAffectedAreaChange();
    handleLocationChange();
    handleCRZAffectedChange();
    handleClassOfLandChange();
    handleRedevelopmentProposalChange();
    handleTODChange();
}

// Function to handle changes in the Plot Identification Type dropdown
function handlePlotIdentificationTypeChange() {
    const plotIdentificationTypeSelect = document.getElementById('plot_identification_type');
    if (plotIdentificationTypeSelect) {
        plotIdentificationTypeSelect.addEventListener('change', function(e) {
            // Add any specific logic for plot identification type selection
            console.log('Plot identification type selection:', e.target.value);
        });
    }
}

// Function to initialize numeric input validation
function initializeNumericInputs() {
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            if (e.target.value < 0) {
                e.target.value = 0;
            }
        });
    });
}

// Main initialization function
function initializeForm() {
    loadData();
    initializeFileInputs();
    initializeRadioButtonHandlers();
    handlePlotIdentificationTypeChange();
    initializeNumericInputs();
}

// Initialize the form when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeForm);

console.log("scripts.js file loaded");