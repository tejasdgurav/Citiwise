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
  const regex = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
  input.value = input.value.replace(regex, '');
  if (allowDecimal) {
    const parts = input.value.split('.');
    if (parts.length > 2) {
      input.value = parts[0] + '.' + parts.slice(1).join('');
    }
  }
}

function restrictToTitleCase(input) {
  input.value = toTitleCase(input.value);
}

// Feedback Functions
function showFeedback(input, isValid, message) {
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
      toggleElement(elementToToggle, this.value === 'Yes');
    });
  });
}

// Main function
document.addEventListener('DOMContentLoaded', async function() {
  // Load all JSON data
  const ulbData = await loadJSONData('ulb_rp_special_authority.json');
  const buildingTypeData = await loadJSONData('building_type.json');
  const buildingSubtypeData = await loadJSONData('building_subtype.json');
  const zoneData = await loadJSONData('zone.json');
  const usesData = await loadJSONData('uses.json');
  const citySpecificAreaData = await loadJSONData('city_specific_area.json');

  // Populate dropdowns from JSON
  populateDropdown(document.getElementById('ulb_rp_special_authority'), ulbData.ulb_rp_special_authority, 'id', 'talukaName');
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

  // Input formatting and validation
  const inputValidations = [
    { id: 'applicant_name', validate: (value) => value.trim().length > 0, format: restrictToTitleCase, errorMsg: 'Please enter a valid name' },
    { id: 'contact_no', validate: validatePhoneNumber, format: (input) => restrictToNumbers(input), errorMsg: 'Please enter a valid 10-digit Indian mobile number' },
    { id: 'email', validate: validateEmail, format: (input) => { input.value = input.value.toLowerCase(); }, errorMsg: 'Please enter a valid email address' },
    { id: 'project_name', validate: (value) => value.trim().length > 0, format: restrictToTitleCase, errorMsg: 'Please enter a valid project name' },
    { id: 'site_address', validate: (value) => value.trim().length > 0, format: restrictToTitleCase, errorMsg: 'Please enter a valid site address' },
    { id: 'village_name', validate: (value) => value.trim().length > 0, format: restrictToTitleCase, errorMsg: 'Please enter a valid village/mouje name' },
    { id: 'reservation_area_sqm', validate: (value) => !isNaN(value) && value >= 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid non-negative number' },
    { id: 'area_of_plot_as_per_site', validate: (value) => !isNaN(value) && value > 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'area_of_plot_as_per_ownership_document', validate: (value) => !isNaN(value) && value > 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'area_of_plot_as_per_measurement_sheet', validate: (value) => !isNaN(value) && value > 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'pro_rata_fsi', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'dp_rp_road_area_sqm', validate: (value) => !isNaN(value) && value >= 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid non-negative number' },
    { id: 'plot_width', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' }
  ];

  inputValidations.forEach(({ id, validate, format, errorMsg }) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', function() {
        format(this);
        const isValid = validate(this.value);
        showFeedback(this, isValid, isValid ? '' : errorMsg);
      });
      input.addEventListener('blur', function() {
        const isValid = validate(this.value);
        showFeedback(this, isValid, isValid ? '' : errorMsg);
      });
    }
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
  ['front', 'left', 'right', 'rear'].forEach(side => {
    document.getElementById(`${side}_boundary_type`).addEventListener('change', function() {
      toggleElement(`road_container_${side}`, this.value === 'Road');
    });
  });

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
      const response = await fetch('https://script.google.com/macros/s/AKfycbynB6fDE5eeREzi0X9Y1Ik110IIIptevHe9VZ_dFKYfXHAmeQcnyEJNcucQgxFfAwOS/exec', {
        method: 'POST',
        body: JSON.stringify(jsonData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.status === 'success') {
        alert('Form submitted successfully!');
        this.reset();
        // Clear all feedback
        document.querySelectorAll('.feedback').forEach(el => el.textContent = '');
        document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
      } else {
        alert('Error submitting form. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});