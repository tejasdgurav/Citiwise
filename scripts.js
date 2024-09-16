// Global variables
let ulbData = {};

// Utility functions
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Load data from JSON files
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
            fetch('data/ulb_rp_special_authority.json').then(res => res.json()),
            fetch('data/city_specific_area.json').then(res => res.json()),
            fetch('data/zone.json').then(res => res.json()),
            fetch('data/uses.json').then(res => res.json()),
            fetch('data/building_type.json').then(res => res.json()),
            fetch('data/building_subtype.json').then(res => res.json())
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
        
        // Populate dropdowns from JSON
        populateDropdown('ulb_rp_special_authority', ulbData.ulb_rp_special_authority);
        populateDropdown('city_specific_area', ulbData.city_specific_area);
        populateDropdown('zone', ulbData.zone);
        populateDropdown('uses', ulbData.uses);
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
    const select = $('#' + id);
    if (!select) {
        console.error(`${id} select element not found`);
        return;
    }
    select.innerHTML = `<option value="">Select ${id.replace(/_/g, ' ')}</option>`;
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

    const zoneSelect = $('#zone');
    if (zoneSelect) {
        zoneSelect.addEventListener('change', e => handleZoneChange(e.target.value));
    }

    const buildingTypeSelect = $('#building_type');
    if (buildingTypeSelect) {
        buildingTypeSelect.addEventListener('change', e => handleBuildingTypeChange(e.target.value));
    }

    // Radio button event listeners
    const radioGroups = ['incentive_fsi', 'electrical_line', 'reservation_area_affected', 'dp_rp_road_affected'];
    radioGroups.forEach(group => {
        $$(`input[name="${group}"]`).forEach(radio => {
            radio.addEventListener('change', e => toggleConditionalField(group, e.target.value));
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const boundarySelect = $(`#${boundary}`);
        if (boundarySelect) {
            boundarySelect.addEventListener('change', e => {
                const roadContainer = $(`#road_container_${boundary}`);
                if (roadContainer) {
                    roadContainer.style.display = e.target.value === 'Road' ? 'block' : 'none';
                }
            });
        }
    });

    // Text input event listeners for sentence case conversion
    $$('input[type="text"], textarea').forEach(input => {
        input.addEventListener('input', e => {
            e.target.value = toSentenceCase(e.target.value);
        });
    });

    initializeContactNumberHandler();
    
    const form = $('#project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error("Form with id 'project-input-form' not found");
    }
}

// Handle Zone change
function handleZoneChange(selectedZoneId) {
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
function handleBuildingTypeChange(selectedBuildingTypeId) {
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

// Convert text to sentence case
function toSentenceCase(text) {
    return text.replace(/(^\w|\.\s+\w)/g, match => match.toUpperCase());
}

// Contact Number Handler
function initializeContactNumberHandler() {
    const contactInput = $('#contact_no');
    if (contactInput) {
        contactInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    const loadingIndicator = $('.loading-indicator');
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
            initializeFormState();
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

// Validate form
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            alert(`Please fill out the ${field.name.replace(/_/g, ' ')} field.`);
            field.focus();
            return false;
        }
    }

    const emailInput = $('#email');
    if (emailInput && !isValidEmail(emailInput.value)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return false;
    }

    const contactInput = $('#contact_no');
    if (contactInput && contactInput.value.length !== 10) {
        alert('Please enter a valid 10-digit contact number.');
        contactInput.focus();
        return false;
    }

    return true;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Format contact number
function formatContactNumber(number) {
    return number.length === 10 ? `+91${number}` : number;
}

// Send form data to server
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

// Handle file input changes
function handleFileInputChange(inputId) {
    const fileInput = $('#' + inputId);
    const fileNameDisplay = $('#' + inputId + '_name');
    
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function(e) {
            fileNameDisplay.textContent = this.files && this.files.length > 0 ? this.files[0].name : '';
        });
    }
}

// Initialize file input handlers
function initializeFileInputs() {
    handleFileInputChange('dp_rp_part_plan');
    handleFileInputChange('google_image');
}

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
    initializeFileInputs();
});

console.log("scripts.js file loaded");