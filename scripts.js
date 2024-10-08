// Utility Functions
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function validateEmail(email) {
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

function restrictToNumbers(input, allowDecimal = false) {
  let value = input.value;
  
  if (allowDecimal) {
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
  } else {
    value = value.replace(/[^0-9]/g, '');
  }
  
  input.value = value;
}

function formatNumber(input, allowDecimal = false) {
  let value = input.value;
  if (allowDecimal) {
    value = parseFloat(value);
    if (!isNaN(value)) {
      input.value = value.toFixed(2);
    }
  } else {
    value = parseInt(value);
    if (!isNaN(value)) {
      input.value = value;
    }
  }
}

function restrictToTitleCase(input) {
  input.value = toTitleCase(input.value);
}

// Feedback Functions
function showFeedback(input, isValid, message) {
  console.log(`Showing feedback for ${input.id}: isValid=${isValid}, message="${message}"`);
  const feedbackEl = input.nextElementSibling;
  if (!feedbackEl || !feedbackEl.classList.contains('feedback')) {
    const newFeedbackEl = document.createElement('div');
    newFeedbackEl.classList.add('feedback');
    input.parentNode.insertBefore(newFeedbackEl, input.nextSibling);
  }
  const feedbackDiv = input.nextElementSibling;
  feedbackDiv.textContent = message;
  feedbackDiv.className = 'feedback ' + (isValid ? 'valid' : 'invalid');
  input.classList.toggle('invalid-input', !isValid);
}

// Load JSON data
async function loadJSONData(filename) {
  try {
    const response = await fetch(`data/${filename}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

// Populate dropdowns
function populateDropdown(selectElement, data, valueKey, textKey) {
  selectElement.innerHTML = '<option value="">Select an option</option>';
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = item[textKey];
    selectElement.appendChild(option);
  });
}

// Show/hide element
function toggleElement(elementId, show) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = show ? 'block' : 'none';
  }
}

// Handle radio button changes
function handleRadioChange(name, elementToToggle) {
  const radioButtons = document.getElementsByName(name);
  radioButtons.forEach(radio => {
    radio.addEventListener('change', function() {
      const show = this.value === 'Yes';
      toggleElement(elementToToggle, show);
      if (show) {
        const element = document.getElementById(elementToToggle);
        if (element) {
          // Find the validation for this element
          const validation = inputValidations.find(v => v.id === elementToToggle);
          if (validation) {
            // Set up the validation event listener
            element.addEventListener('blur', function() {
              console.log(`Before format: ${this.value}`);
              if (typeof validation.format === 'function') {
                validation.format(this);
              }
              console.log(`After format: ${this.value}`);
              const isValid = validation.validate(this.value);
              console.log(`Validation result for ${elementToToggle}: ${isValid}`);
              showFeedback(this, isValid, isValid ? '' : validation.errorMsg);
            });
          }
        }
      } else {
        const element = document.getElementById(elementToToggle);
        if (element) {
          element.value = '';
          showFeedback(element, true, '');
        }
      }
    });
  });
}

// Main function
async function initializeForm() {
  try {
    // Load all JSON data
    const ulbData = await loadJSONData('ulb_rp_special_authority.json');
    const buildingTypeData = await loadJSONData('building_type.json');
    const buildingSubtypeData = await loadJSONData('building_subtype.json');
    const zoneData = await loadJSONData('zone.json');
    const usesData = await loadJSONData('uses.json');
    const citySpecificAreaData = await loadJSONData('city_specific_area.json');

    if (!ulbData || !buildingTypeData || !buildingSubtypeData || !zoneData || !usesData || !citySpecificAreaData) {
      throw new Error('Failed to load one or more required data files');
    }

    // Sort ULB/RP/Special Authority data alphabetically by talukaName
    const sortedUlbData = ulbData.ulb_rp_special_authority.sort((a, b) => 
      a.talukaName.localeCompare(b.talukaName)
    );

    // Populate ULB/RP/Special Authority dropdown with sorted data
    const ulbDropdown = document.getElementById('ulb_rp_special_authority');
    populateDropdown(ulbDropdown, sortedUlbData, 'id', 'talukaName');

    // Populate dropdowns from JSON
    populateDropdown(document.getElementById('zone'), zoneData.zone, 'id', 'name');
    populateDropdown(document.getElementById('building_type'), buildingTypeData.building_type, 'id', 'name');

    // Hide conditional elements initially
    toggleElement('incentive_fsi_rating', false);
    toggleElement('electrical_line_voltage', false);
    toggleElement('reservation_area_sqm', false);
    toggleElement('dp_rp_road_area_sqm', false);
    ['front', 'left', 'right', 'rear'].forEach(side => {
      toggleElement(`road_container_${side}`, false);
    });

    // Setup conditional elements
    handleRadioChange('incentive_fsi', 'incentive_fsi_rating');
    handleRadioChange('electrical_line', 'electrical_line_voltage');
    handleRadioChange('reservation_area_affected', 'reservation_area_sqm');
    handleRadioChange('dp_rp_road_affected', 'dp_rp_road_area_sqm');

    // Input validations
    const inputValidations = [
      { id: 'applicant_type', validate: (value) => value !== "", errorMsg: 'Please select an option' },
      { id: 'applicant_name', validate: (value) => value.trim().length > 0 && value.trim().length <= 100, format: restrictToTitleCase, errorMsg: 'Please enter a valid name (max 100 characters)' },
      { id: 'contact_no', validate: validatePhoneNumber, format: (input) => restrictToNumbers(input), errorMsg: 'Please enter a valid 10-digit Indian mobile number' },
      { id: 'email', validate: (value) => validateEmail(value) && value.length <= 100, format: (input) => { input.value = input.value.toLowerCase(); }, errorMsg: 'Please enter a valid email address (max 100 characters)' },
      { id: 'project_name', validate: (value) => value.trim().length > 0 && value.trim().length <= 100, format: restrictToTitleCase, errorMsg: 'Please enter a valid project name (max 100 characters)' },
      { id: 'site_address', validate: (value) => value.trim().length > 0 && value.trim().length <= 200, format: restrictToTitleCase, errorMsg: 'Please enter a valid site address (max 200 characters)' },
      { id: 'village_name', validate: (value) => value.trim().length > 0 && value.trim().length <= 50, format: restrictToTitleCase, errorMsg: 'Please enter a valid village/mouje name (max 50 characters)' },
      { id: 'reservation_area_sqm', validate: (value) => { const numValue = parseFloat(value.replace(/[^0-9.]/g, '').trim()); return !isNaN(numValue) && numValue > 0; }, format: (input) => { if (input.value) { input.value = parseFloat(input.value.replace(/[^0-9.]/g, '').trim()).toFixed(2); } }, errorMsg: 'Please enter a valid positive number' },
      { id: 'area_plot_site_sqm', validate: (value) => !isNaN(value) && value > 0 && value <= 999999.99, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999,999.99' },
      { id: 'area_plot_ownership_sqm', validate: (value) => !isNaN(value) && value > 0 && value <= 999999.99, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999,999.99' },
      { id: 'area_plot_measurement_sqm', validate: (value) => !isNaN(value) && value > 0 && value <= 999999.99, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999,999.99' },
      { id: 'pro_rata_fsi', validate: (value) => !isNaN(value) && value >= 0 && value <= 999.99, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid number between 0 and 999.99' },
      { id: 'dp_rp_road_area_sqm', validate: (value) => { const numValue = parseFloat(value.replace(/[^0-9.]/g, '').trim()); return !isNaN(numValue) && numValue > 0; }, format: (input) => { if (input.value) { input.value = parseFloat(input.value.replace(/[^0-9.]/g, '').trim()).toFixed(2); } }, errorMsg: 'Please enter a valid positive number' },
      { id: 'plot_width', validate: (value) => !isNaN(value) && value > 0 && value <= 999.99, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid number between 0.01 and 999.99' }
    ];


    // Define a function to set up validation for a single input
    function setupInputValidation(element, validation) {
      if (element) {
        const validateAndShowFeedback = function() {
          console.log(`Before format: ${this.value}`);
          if (typeof validation.format === 'function') {
            validation.format(this);
          }
          console.log(`After format: ${this.value}`);
          const isValid = validation.validate(this.value);
          console.log(`Validation result for ${validation.id}: ${isValid}`);
          showFeedback(this, isValid, isValid ? '' : validation.errorMsg);
        };

        if (element.tagName.toLowerCase() === 'select') {
          element.addEventListener('change', validateAndShowFeedback);
        } else {
          element.addEventListener('blur', validateAndShowFeedback);
        }
      }
    }

    // Use this function in the initial setup
    inputValidations.forEach((validation) => {
      const element = document.getElementById(validation.id);
      setupInputValidation(element, validation);
    });


    // File input validation
    ['dp_rp_part_plan', 'google_image'].forEach(id => {
      const fileInput = document.getElementById(id);
      fileInput.addEventListener('change', function() {
        const file = this.files[0];
        const fileSize = file.size / 1024 / 1024; // in MB
        const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
        let isValid = true;
        let errorMsg = '';

        if (fileSize > 5) {
          isValid = false;
          errorMsg = 'File size should not exceed 5MB';
        } else if (!allowedFormats.includes(file.type)) {
          isValid = false;
          errorMsg = 'Please upload an image file (JPEG, PNG, or GIF)';
        }

        showFeedback(this, isValid, errorMsg);
        if (!isValid) this.value = '';
      });
    });

    // Road Width inputs
    const roadWidthInputs = document.querySelectorAll('.road-width-input');
    roadWidthInputs.forEach(input => {
      input.addEventListener('input', function() {
        restrictToNumbers(this, true);
        const isValid = !isNaN(this.value) && parseFloat(this.value) > 0;
        showFeedback(this, isValid, isValid ? '' : 'Please enter a valid positive number');
      });
    });

    // Zone and Uses
    document.getElementById('zone').addEventListener('change', function() {
      const usesSelect = document.getElementById('uses');
      const selectedZone = this.value;
      const filteredUses = usesData.uses.filter(use => use.zoneId === parseInt(selectedZone));
      populateDropdown(usesSelect, filteredUses, 'id', 'name');
      usesSelect.disabled = false;
    });

    // ULB and City Specific Area
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    citySpecificAreaSelect.disabled = true;
    citySpecificAreaSelect.innerHTML = '<option value="">Select ULB/RP/Special Authority first</option>';

    document.getElementById('ulb_rp_special_authority').addEventListener('change', function() {
      const selectedUlbId = parseInt(this.value);
      const selectedUlb = ulbData.ulb_rp_special_authority.find(ulb => ulb.id === selectedUlbId);
      
      if (selectedUlb) {
        const filteredAreas = citySpecificAreaData.city_specific_area.filter(area => area.councilId === selectedUlb.councilId);
        
        if (filteredAreas.length > 0) {
          populateDropdown(citySpecificAreaSelect, filteredAreas, 'id', 'name');
          citySpecificAreaSelect.disabled = false;
        } else {
          citySpecificAreaSelect.innerHTML = '<option value="">No specific areas available for this ULB</option>';
          citySpecificAreaSelect.disabled = true;
        }
      } else {
        citySpecificAreaSelect.innerHTML = '<option value="">Select ULB/RP/Special Authority first</option>';
        citySpecificAreaSelect.disabled = true;
      }
    });

    // Building Type and Building Subtype
    document.getElementById('building_type').addEventListener('change', function() {
      const buildingSubtypeSelect = document.getElementById('building_subtype');
      const selectedBuildingType = this.value;
      const filteredBuildingSubtypes = buildingSubtypeData.building_subtype.filter(subtype => subtype.bldgtypeID === parseInt(selectedBuildingType));
      populateDropdown(buildingSubtypeSelect, filteredBuildingSubtypes, 'id', 'name');
      buildingSubtypeSelect.disabled = false;
    });

    // Plot Boundaries
    const sides = ['front', 'left', 'right', 'rear'];

    // Setup boundary listeners
    function setupBoundaryListeners() {
      sides.forEach(side => {
        const select = document.getElementById(`${side}_boundary_type`);
        const roadContainer = document.getElementById(`road_container_${side}`);
        const roadWidthInput = document.getElementById(`road_details_${side}_meters`);

        if (select) {
          select.addEventListener('change', function() {
            if (roadContainer) {
              toggleElement(`road_container_${side}`, this.value === 'Road');
            }

            // Enable/disable other selects based on front boundary
            if (side === 'front') {
              const isRoadSelected = this.value === 'Road';
              sides.slice(1).forEach(otherSide => {
                const otherSelect = document.getElementById(`${otherSide}_boundary_type`);
                if (otherSelect) {
                  otherSelect.disabled = !isRoadSelected;
                  if (!isRoadSelected) {
                    otherSelect.value = '';
                    toggleElement(`road_container_${otherSide}`, false);
                  }
                }
              });
            }
          });
        }

        // Road width input validation
        if (roadWidthInput) {
          roadWidthInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9.]/g, '');
          });

          roadWidthInput.addEventListener('blur', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value > 0) {
              this.value = value.toFixed(2);
              this.classList.remove('error');
            } else {
              this.classList.add('error');
            }
          });
        }
      });
    }

    // Initialize boundary selects
    function initializeBoundarySelects() {
      sides.slice(1).forEach(side => {
        const select = document.getElementById(`${side}_boundary_type`);
        if (select) {
          select.disabled = true;
        }
      });
    }

    // Setup plot boundary listeners and initialize selects
    setupBoundaryListeners();
    initializeBoundarySelects();

    // Form submission
    document.querySelector('form').addEventListener('submit', async function(e) {
      e.preventDefault();

      // Perform final validations
      let isValid = true;
      inputValidations.forEach(({ id, validate, errorMsg }) => {
        const input = document.getElementById(id);
        if (input && !validate(input.value)) {
          showFeedback(input, false, errorMsg);
          isValid = false;
        }
      });

      if (!isValid) {
        alert('Please correct the errors in the form before submitting.');
        return;
      }

      // If validation passes, submit the form
      const formData = new FormData(this);
      const jsonData = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzjc54YlcTtrNmovRdaa7BAie_BsDT6X-tFnDCjjedc2uky-cclNMYIyhc6zuDhXv3N/exec', {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify(jsonData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
          alert('Form submitted successfully!');
          this.reset();
          // Clear all feedback
          document.querySelectorAll('.feedback').forEach(el => el.textContent = '');
          document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
        } else {
          throw new Error(result.message || 'Unknown error occurred');
        }
      } catch (error) {
        console.error('Error:', error);
        alert(`An error occurred: ${error.message}. Please try again later.`);
      }
    });

  } catch (error) {
    console.error('Initialization error:', error);
    alert('An error occurred while initializing the form. Please try reloading the page.');
  }
}

// Call the initialization function when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeForm);

document.addEventListener("DOMContentLoaded", function() {
    const reservationAreaAffectedInputs = document.getElementsByName("reservation_area_affected");
    const reservationAreaSqmInputContainer = document.getElementById("reservation_area_sqm");
    const reservationAreaSqmInput = reservationAreaSqmInputContainer?.querySelector("input");

    const dpRpRoadAffectedInputs = document.getElementsByName("dp_rp_road_affected");
    const dpRpRoadAreaSqmInputContainer = document.getElementById("dp_rp_road_area_sqm");
    const dpRpRoadAreaSqmInput = dpRpRoadAreaSqmInputContainer?.querySelector("input");

    // Function to handle visibility and enabling of Reservation Area Affected input
    function handleReservationAreaChange() {
        const selectedValue = [...reservationAreaAffectedInputs].find(input => input.checked)?.value;
        if (selectedValue === "Yes") {
            reservationAreaSqmInput.disabled = false;
            reservationAreaSqmInputContainer.classList.remove("hidden");
        } else {
            reservationAreaSqmInput.disabled = true;
            reservationAreaSqmInputContainer.classList.add("hidden");
        }
    }

    // Function to handle visibility and enabling of DP/RP Road Affected input
    function handleDpRpRoadChange() {
        const selectedValue = [...dpRpRoadAffectedInputs].find(input => input.checked)?.value;
        if (selectedValue === "Yes") {
            dpRpRoadAreaSqmInput.disabled = false;
            dpRpRoadAreaSqmInputContainer.classList.remove("hidden");
        } else {
            dpRpRoadAreaSqmInput.disabled = true;
            dpRpRoadAreaSqmInputContainer.classList.add("hidden");
        }
    }

    // Attach event listeners to each radio button for Reservation Area Affected
    reservationAreaAffectedInputs.forEach(input => {
        input.addEventListener("change", handleReservationAreaChange);
    });

    // Attach event listeners to each radio button for DP/RP Road Affected
    dpRpRoadAffectedInputs.forEach(input => {
        input.addEventListener("change", handleDpRpRoadChange);
    });

    // Initialize the state of the fields on page load
    handleReservationAreaChange();
    handleDpRpRoadChange();
});
