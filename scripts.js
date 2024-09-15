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
        
        // Populate dropdowns from JSON
        populateDropdownFromJSON('ulb_rp_special_authority', ulbData.ulb_rp_special_authority || [], 'talukaName');
        populateDropdownFromJSON('zone', ulbData.zone || []);
        // Uses will be populated when a zone is selected
        populateDropdownFromJSON('building_type', ulbData.building_type || []);
        // Building subtypes will be populated when a building type is selected
        // City specific areas will be populated when a ULB is selected

        // Initialize form state
        initializeFormState();
        
        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateDropdownFromJSON(id, options, textProperty = 'name') {
    const select = document.getElementById(id);
    if (!select) {
        console.error(`Dropdown with id '${id}' not found`);
        return;
    }
    select.innerHTML = `<option value="">Select ${id.replace(/_/g, ' ')}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id || option.value || option;
        optionElement.textContent = option[textProperty] || option.text || option;
        select.appendChild(optionElement);
    });
    console.log(`Populated dropdown '${id}' with ${options.length} options from JSON`);
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
    // Applicant Information
    addInputListener('applicant_name');
    addInputListener('contact_no');
    addInputListener('email');

    // Project Information
    addInputListener('project_name');
    addInputListener('site_address');
    addFileInputListener('dp_rp_part_plan');
    addFileInputListener('google_image');

    // ULB/RP/Special Authority
    addDropdownListener('ulb_rp_special_authority', updateCitySpecificAreas);

    // Special Scheme
    addDropdownListener('special_scheme');

    // Regularization
    addRadioListener('regularization');

    // Type of Development
    addDropdownListener('type_of_development');

    // Incentive FSI
    addRadioListener('incentive_fsi', () => toggleConditionalField('incentive_fsi_rating'));
    addDropdownListener('incentive_fsi_rating');

    // Type of Proposal
    addDropdownListener('type_of_proposal');

    // Hilly Site
    addRadioListener('hilly_site');

    // Flood Affected Area
    addRadioListener('flood_affected_area');

    // Location
    addRadioListener('location');

    // Electrical Line
    addRadioListener('electrical_line', () => toggleConditionalField('electrical_line_voltage'));
    addDropdownListener('electrical_line_voltage');

    // Type of Plot/Layout
    addDropdownListener('type_of_plot_layout');

    // Reservation Area Affected
    addRadioListener('reservation_area_affected', () => toggleConditionalField('reservation_area_sqm'));
    addInputListener('reservation_area_sqm');

    // CRZ Affected
    addRadioListener('crz_affected');

    // Zone and Uses
    addDropdownListener('zone', updateUses);
    addDropdownListener('uses');

    // Plot Identification
    addDropdownListener('plot_identification_type');
    addInputListener('plot_identification_number');
    addInputListener('village_name');

    // Plot Areas
    addInputListener('plot_area_site');
    addInputListener('plot_area_document');
    addInputListener('plot_area_measurement');

    // Pro Rata FSI
    addInputListener('pro_rata_fsi');

    // Class of Land
    addRadioListener('class_of_land');

    // DP/RP Road Affected
    addRadioListener('dp_rp_road_affected', () => toggleConditionalField('dp_rp_road_area_sqm'));
    addInputListener('dp_rp_road_area_sqm');

    // City Specific Area
    addDropdownListener('city_specific_area');

    // Height of Building
    addDropdownListener('height_of_building');

    // Redevelopment Proposal
    addRadioListener('redevelopment_proposal');

    // Plot Width
    addInputListener('plot_width');

    // Land in TOD
    addRadioListener('land_in_tod');

    // Building Type and Subtypes
    addDropdownListener('building_type', updateBuildingSubtypes);
    addDropdownListener('building_subtypes');

    // Plot Boundaries
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        addDropdownListener(`boundary_${boundary}`, (value) => toggleRoadDetails(boundary, value === 'Road'));
        addDropdownListener(`road_type_${boundary}`);
        addInputListener(`road_width_${boundary}`);
    });

    // Form submission
    const form = document.getElementById('project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

function addInputListener(id) {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', function() {
            if (input.type === 'text') {
                this.value = toSentenceCase(this.value);
            }
            console.log(`${id} value:`, this.value);
        });
    }
}

function addFileInputListener(id) {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : '';
            console.log(`${id} file selected:`, fileName);
        });
    }
}

function addDropdownListener(id, callback) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            console.log(`${id} selected:`, this.value);
            if (callback) callback(this.value);
        });
    }
}

function addRadioListener(name, callback) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log(`${name} selected:`, this.value);
            if (callback) callback(this.value);
        });
    });
}

function toggleConditionalField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const isVisible = field.closest('.form-group').classList.toggle('hidden');
        console.log(`${fieldId} visibility toggled:`, !isVisible);
    }
}

function toggleRoadDetails(boundary, show) {
    const roadContainer = document.getElementById(`road_container_${boundary}`);
    if (roadContainer) {
        roadContainer.style.display = show ? 'block' : 'none';
        console.log(`Road details for ${boundary} ${show ? 'shown' : 'hidden'}`);
    }
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
    console.log('City specific areas updated');
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
    console.log('Uses dropdown updated');
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
    console.log('Building subtypes updated');
}

function toSentenceCase(text) {
    return text.replace(/(^\w|\.\s+\w)/g, match => match.toUpperCase());
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

function initializeForm() {
    loadData().then(() => {
        console.log("Form initialized");
    }).catch(error => {
        console.error('Error initializing form:', error);
    });
}

document.addEventListener('DOMContentLoaded', initializeForm);

console.log("scripts.js file loaded");