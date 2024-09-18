// Utility Functions
const Utilities = {
  toSentenceCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },

  validateEmail(email) {
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return re.test(String(email).toLowerCase());
  },

  validatePhoneNumber(phone) {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
  },

  restrictToNumbers(input, allowDecimal = false) {
    input.value = input.value.replace(allowDecimal ? /[^\d.]/g : /\D/g, '');
    if (allowDecimal) {
      const parts = input.value.split('.');
      if (parts.length > 2) {
        input.value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
  },

  formatToSentenceCase(input) {
    input.value = this.toSentenceCase(input.value);
  },

  formatCapitalizeWords(input) {
    input.value = input.value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
};

// Feedback Module
const Feedback = {
  show(input, isValid, message) {
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
};

// Data Loading Module
const DataLoader = {
  async loadJSON(filename) {
    try {
      const response = await fetch(`data/${filename}`);
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return null;
    }
  }
};

// UI Control Module
const UIControl = {
  populateDropdown(selectElement, data, valueKey, textKey) {
    selectElement.innerHTML = '<option value="">Select an option</option>';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueKey];
      option.textContent = item[textKey];
      selectElement.appendChild(option);
    });
  },

  toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  },

  handleRadioChange(name, elementToToggle) {
    const radioButtons = document.getElementsByName(name);
    radioButtons.forEach(radio => {
      radio.addEventListener('change', function() {
        UIControl.toggleElement(elementToToggle, this.value === 'Yes');
      });
    });
  }
};

// Form Validation Module
const FormValidation = {
  inputValidations: [
    { id: 'applicant_name', validate: (value) => value.trim().length > 0, format: Utilities.formatToSentenceCase, errorMsg: 'Please enter a valid name' },
    { id: 'contact_no', validate: Utilities.validatePhoneNumber, format: (input) => Utilities.restrictToNumbers(input), errorMsg: 'Please enter a valid 10-digit Indian mobile number' },
    { id: 'email', validate: Utilities.validateEmail, format: (input) => { input.value = input.value.toLowerCase(); }, errorMsg: 'Please enter a valid email address' },
    { id: 'project_name', validate: (value) => value.trim().length > 0, format: Utilities.formatToSentenceCase, errorMsg: 'Please enter a valid project name' },
    { id: 'site_address', validate: (value) => value.trim().length > 0, format: Utilities.formatToSentenceCase, errorMsg: 'Please enter a valid site address' },
    { id: 'village_mouje_name', validate: (value) => value.trim().length > 0, format: Utilities.formatCapitalizeWords, errorMsg: 'Please enter a valid village/mouje name' },
    { id: 'reservation_area_sqm', validate: (value) => !isNaN(value) && parseFloat(value) >= 0, format: (input) => Utilities.restrictToNumbers(input), errorMsg: 'Please enter a valid non-negative number' },
    { id: 'area_of_plot_as_per_site', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => Utilities.restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'area_of_plot_as_per_ownership_document', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => Utilities.restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'area_of_plot_as_per_measurement_sheet', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => Utilities.restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number' },
    { id: 'pro_rata_fsi', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => Utilities.restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number (e.g., 1.5, 2, etc.)' },
    { id: 'dp_rp_road_area_sqm', validate: (value) => !isNaN(value) && parseFloat(value) >= 0, format: (input) => Utilities.restrictToNumbers(input, true), errorMsg: 'Please enter a valid non-negative number' },
    { id: 'plot_width', validate: (value) => !isNaN(value) && parseFloat(value) > 0, format: (input) => Utilities.restrictToNumbers(input, true), errorMsg: 'Please enter a valid positive number (e.g., 10.5, 30.2, etc.)' }
  ],

  setupInputValidations() {
    this.inputValidations.forEach(({ id, validate, format, errorMsg }) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', function() {
          format(this);
          const isValid = validate(this.value);
          Feedback.show(this, isValid, isValid ? '' : errorMsg);
        });
        input.addEventListener('blur', function() {
          const isValid = validate(this.value);
          Feedback.show(this, isValid, isValid ? '' : errorMsg);
        });
      }
    });
  },

  setupFileInputValidations() {
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

        Feedback.show(this, isValid, errorMsg);
        if (!isValid) this.value = '';
      });
    });
  },

  setupRoadWidthInputs() {
    const roadWidthInputs = document.querySelectorAll('.road-width-input');
    roadWidthInputs.forEach(input => {
      input.addEventListener('input', function() {
        Utilities.restrictToNumbers(this, true);
        const isValid = !isNaN(this.value) && parseFloat(this.value) > 0;
        Feedback.show(this, isValid, isValid ? '' : 'Please enter a valid positive number');
      });
    });
  }
};

// Form Submission Module
const FormSubmission = {
  async submitForm(formData) {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbynB6fDE5eeREzi0X9Y1Ik110IIIptevHe9VZ_dFKYfXHAmeQcnyEJNcucQgxFfAwOS/exec', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.status === 'success') {
        alert('Form submitted successfully!');
        return true;
      } else {
        alert('Error submitting form. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
      return false;
    }
  }
};

// Main Application
const App = {
  async init() {
    // Load all JSON data
    const ulbData = await DataLoader.loadJSON('ulb_rp_special_authority.json');
    const buildingTypeData = await DataLoader.loadJSON('building_type.json');
    const buildingSubtypeData = await DataLoader.loadJSON('building_subtype.json');
    const zoneData = await DataLoader.loadJSON('zone.json');
    const usesData = await DataLoader.loadJSON('uses.json');
    const citySpecificAreaData = await DataLoader.loadJSON('city_specific_area.json');

    // Populate dropdowns from JSON
    UIControl.populateDropdown(document.getElementById('ulb_rp_special_authority'), ulbData.ulb_rp_special_authority, 'id', 'talukaName');
    UIControl.populateDropdown(document.getElementById('zone'), zoneData.zone, 'id', 'name');
    UIControl.populateDropdown(document.getElementById('building_type'), buildingTypeData.building_type, 'id', 'name');

    // Hide conditional elements initially
    UIControl.toggleElement('incentive_fsi_rating', false);
    UIControl.toggleElement('electrical_line_voltage', false);
    UIControl.toggleElement('reservation_area_sqm', false);
    UIControl.toggleElement('dp_rp_road_area_sqm', false);
    ['front', 'left', 'right', 'rear'].forEach(side => {
      UIControl.toggleElement(`road_container_${side}`, false);
    });

    // Setup conditional elements
    UIControl.handleRadioChange('incentive_fsi', 'incentive_fsi_rating');
    UIControl.handleRadioChange('electrical_line', 'electrical_line_voltage');
    UIControl.handleRadioChange('reservation_area_affected', 'reservation_area_sqm');
    UIControl.handleRadioChange('dp_rp_road_affected', 'dp_rp_road_area_sqm');

    // Setup input validations
    FormValidation.setupInputValidations();
    FormValidation.setupFileInputValidations();
    FormValidation.setupRoadWidthInputs();

    // Setup dynamic dropdowns
    this.setupDynamicDropdowns(usesData, citySpecificAreaData, buildingSubtypeData);

    // Setup form submission
    this.setupFormSubmission();
  },

  setupDynamicDropdowns(usesData, citySpecificAreaData, buildingSubtypeData) {
    // Zone and Uses
    document.getElementById('zone').addEventListener('change', function() {
      const usesSelect = document.getElementById('uses');
      const selectedZone = this.value;
      const filteredUses = usesData.uses.filter(use => use.zoneId === parseInt(selectedZone));
      UIControl.populateDropdown(usesSelect, filteredUses, 'id', 'name');
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
          UIControl.populateDropdown(citySpecificAreaSelect, filteredAreas, 'id', 'name');
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
      UIControl.populateDropdown(buildingSubtypeSelect, filteredBuildingSubtypes, 'id', 'name');
      buildingSubtypeSelect.disabled = false;
    });

    // Plot Boundaries
    ['front', 'left', 'right', 'rear'].forEach(side => {
      document.getElementById(`${side}_boundary_type`).addEventListener('change', function() {
        UIControl.toggleElement(`road_container_${side}`, this.value === 'Road');
      });
    });
  },


  setupFormSubmission() {
    document.querySelector('form').addEventListener('submit', async function(e) {
      e.preventDefault();

      // Perform final validations
      let isValid = true;
      FormValidation.inputValidations.forEach(({ id, validate, errorMsg }) => {
        const input = document.getElementById(id);
        if (input && !validate(input.value)) {
          Feedback.show(input, false, errorMsg);
          isValid = false;
        }
      });

      if (!isValid) {
        alert('Please correct the errors in the form before submitting.');
        return;
      }

      // If validation passes, submit the form
      const formData = new FormData(this);
      const submitSuccess = await FormSubmission.submitForm(formData);

      if (submitSuccess) {
        this.reset();
        // Clear all feedback
        document.querySelectorAll('.feedback').forEach(el => el.textContent = '');
        document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
      }
    });
  }
};

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => App.init());