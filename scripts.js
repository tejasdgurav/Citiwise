// Global variables
let formData = {};
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
        populateDropdown('ulb_rp_special_authority', ulbData.ulb_rp_special_authority || []);
        populateDropdown('special_scheme', ulbData.special_scheme || []);
        populateDropdown('type_of_development', ulbData.type_of_development || []);
        populateDropdown('incentive_fsi_rating', ulbData.incentive_fsi_rating || []);
        populateDropdown('type_of_proposal', ulbData.type_of_proposal || []);
        populateDropdown('electrical_line_voltage', ulbData.electrical_line_voltage || []);
        populateDropdown('type_of_plot_layout', ulbData.type_of_plot_layout || []);
        populateDropdown('zone', ulbData.zone || []);
        populateDropdown('uses', ulbData.uses || []);
        populateDropdown('plot_identification_type', ulbData.plot_identification_type || []);
        populateDropdown('height_of_building', ulbData.height_of_building || []);
        populateDropdown('building_type', ulbData.building_type || []);
        populateDropdown('building_subtypes', ulbData.building_subtypes || []);

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
    const select = document.getElementById(id);
    if (!select) {
        console.error(`${id} select element not found`);
        return;
    }
    select.innerHTML = `<option value="">Select ${id.replace(/_/g, ' ')}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id || option.value;
        optionElement.textContent = option.name || option.label;
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
        const field = document.getElementById(fieldId);
        if (field) {
            field.closest('.form-group').classList.add('hidden');
        }
    });

    // Hide road containers
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const roadContainer = document.getElementById(`road_container_${boundary}`);
        if (roadContainer) {
            roadContainer.style.display = 'none';
        }
    });
}

// Add event listeners
function addEventListeners() {
    console.log("Adding event listeners");

    // ULB/RP/Special Authority change event
    const ulbRpSpecialAuthority = document.getElementById('ulb_rp_special_authority');
    if (ulbRpSpecialAuthority) {
        ulbRpSpecialAuthority.addEventListener('change', function(e) {
            // Implement any specific logic for ULB/RP/Special Authority change
        });
    }

    // Incentive FSI change event
    document.querySelectorAll('input[name="incentive_fsi"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const incentiveFsiRating = document.getElementById('incentive_fsi_rating');
            if (incentiveFsiRating) {
                incentiveFsiRating.closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
            }
        });
    });

    // Electrical Line change event
    document.querySelectorAll('input[name="electrical_line"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const electricalLineVoltage = document.getElementById('electrical_line_voltage');
            if (electricalLineVoltage) {
                electricalLineVoltage.closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
            }
        });
    });

    // Reservation Area Affected change event
    document.querySelectorAll('input[name="reservation_area_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const reservationAreaSqm = document.getElementById('reservation_area_sqm');
            if (reservationAreaSqm) {
                reservationAreaSqm.closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
            }
        });
    });

    // DP/RP road affected change event
    document.querySelectorAll('input[name="dp_rp_road_affected"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            const dpRpRoadAreaSqm = document.getElementById('dp_rp_road_area_sqm');
            if (dpRpRoadAreaSqm) {
                dpRpRoadAreaSqm.closest('.form-group').classList.toggle('hidden', e.target.value !== 'Yes');
            }
        });
    });

    // Plot boundaries change events
    ['front', 'left', 'right', 'rear'].forEach(boundary => {
        const boundarySelect = document.getElementById(`${boundary}`);
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

    // Form submission handler
    const form = document.getElementById('project-input-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// Convert text to sentence case
function toSentenceCase(text) {
    return text.replace(/(^\w|\.\s+\w)/g, match => match.toUpperCase());
}

// Contact Number Handler
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
            initializeFormState();
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
            alert(`Please fill out the ${field.name.replace(/_/g, ' ')} field.`);
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

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    loadData();
    initializeFileInputs();
});

// Function to handle file input changes
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

// Initialize file input handlers
function initializeFileInputs() {
    handleFileInputChange('dp_rp_part_plan');
    handleFileInputChange('google_image');
}

console.log("scripts.js file loaded");