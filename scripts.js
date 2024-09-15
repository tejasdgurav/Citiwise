// Global variables
let ulbData = {};

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

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
        populateDropdown('ulb_rp_special_authority', ulbData.ulb_rp_special_authority || []);
        populateDropdown('zone', ulbData.zone || []);
        populateDropdown('uses', ulbData.uses || []);
        populateDropdown('building_type', ulbData.building_type || []);
        
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
    const select = $(id);
    if (!select) {
        console.error(`${id} select element not found`);
        return;
    }
    select.innerHTML = `<option value="">Select ${id.replace(/_/g, ' ')}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name || option.districtName + " - " + option.talukaName;
        select.appendChild(optionElement);
    });
    console.log(`Populated ${id} dropdown with ${options.length} options`);
}

// Function to initialize form state
function initializeFormState() {
    // Hide conditional fields on page load
    const conditionalFields = [
        'incentive_fsi_rating',
        'electrical_line_voltage',
        'reservation_area_sqm',
        'dp_rp_road_area_sqm'
    ];

    conditionalFields.forEach(fieldId => {
        const field = $(`#${fieldId}`);
        if (field) {
            field.closest('.form-group').classList.add('hidden');
        }
    });

    // Hide road containers
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const roadContainer = $(`#road_container_${boundary}`);
        if (roadContainer) {
            roadContainer.style.display = 'none';
        }
    });
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");

    // Zone change event
    $('#zone').addEventListener('change', function(e) {
        handleZoneChange(e.target.value);
    });

    // Building type change event
    $('#building_type').addEventListener('change', function(e) {
        handleBuildingTypeChange(e.target.value);
    });

    // Incentive FSI change event
    $$('input[name="incentive_fsi"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            $('#incentive_fsi_rating').closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
        });
    });

    // Electrical Line change event
    $$('input[name="electrical_line"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            $('#electrical_line_voltage').closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
        });
    });

    // Reservation Area Affected change event
    $$('input[name="reservation_area_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            $('#reservation_area_sqm').closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
        });
    });

    // DP/RP road affected change event
    $$('input[name="dp_rp_road_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            $('#dp_rp_road_area_sqm').closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        $(`#${boundary}`).addEventListener('change', (e) => {
            $(`#road_container_${boundary}`).style.display = e.target.value === 'Road' ? 'block' : 'none';
        });
    });

    // Add input event listeners for sentence case conversion
    $$('input[type="text"], textarea').forEach(input => {
        input.addEventListener('input', function() {
            this.value = toSentenceCase(this.value);
        });
    });

    // Initialize contact number handler
    initializeContactNumberHandler();

    // Form submission handler
    $('#project-input-form').addEventListener('submit', handleSubmit);
}

// Handle Zone change
function handleZoneChange(selectedZoneId) {
    console.log("Zone changed:", selectedZoneId);
    
    const usesDropdown = $('#uses');
    usesDropdown.innerHTML = '<option value="">Select uses</option>';
    
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
        }
    }
    
    usesDropdown.disabled = !selectedZoneId;
}

// Handle Building Type change
function handleBuildingTypeChange(selectedBuildingTypeId) {
    console.log("Building Type changed:", selectedBuildingTypeId);
    
    const buildingSubtypeDropdown = $('#building_subtypes');
    buildingSubtypeDropdown.innerHTML = '<option value="">Select building subtype</option>';
    
    if (selectedBuildingTypeId && ulbData.building_subtype[selectedBuildingTypeId]) {
        ulbData.building_subtype[selectedBuildingTypeId].forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype.id;
            option.textContent = subtype.name;
            buildingSubtypeDropdown.appendChild(option);
        });
    }
    
    buildingSubtypeDropdown.disabled = !selectedBuildingTypeId;
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

function handleSubmit(e) {
    e.preventDefault();

    // Show loading indicator
    $('.loading-indicator').style.display = 'flex';

    // Validate form
    if (!validateForm(e.target)) {
        $('.loading-indicator').style.display = 'none';
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
            initializeFormState();
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form. Please try again.');
        })
        .finally(() => {
            $('.loading-indicator').style.display = 'none';
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

    // Validate email format
    const emailInput = $('#email');
    if (emailInput && !isValidEmail(emailInput.value)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return false;
    }

    // Validate contact number
    const contactInput = $('#contact_no');
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

// Function to handle file input changes
function handleFileInputChange(inputId) {
    const fileInput = $(`#${inputId}`);
    const fileNameDisplay = $(`#${inputId}_name`);
    
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