// Utility Functions
function toSentenceCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
  const re = /^\d{10}$/;
  return re.test(phone);
}

function restrictToNumbers(input) {
  input.value = input.value.replace(/[^0-9]/g, '');
}

function restrictToSentenceCase(input) {
  input.value = toSentenceCase(input.value);
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

// Event Listeners
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

  // Applicant Name
  document.getElementById('applicant_name').addEventListener('input', function(e) {
    this.value = toSentenceCase(this.value);
  });

  // Contact Number
  document.getElementById('contact_no').addEventListener('input', function(e) {
    restrictToNumbers(this);
    if (this.value.length > 10) {
      this.value = this.value.slice(0, 10);
    }
  });

  // Email
  document.getElementById('email').addEventListener('blur', function(e) {
    if (!validateEmail(this.value)) {
      alert('Please enter a valid email address');
    }
  });

  // Project Name
  document.getElementById('project_name').addEventListener('input', function(e) {
    this.value = toSentenceCase(this.value);
  });

  // Site Address
  document.getElementById('site_address').addEventListener('input', function(e) {
    restrictToSentenceCase(this);
  });

  // DP/RP Part Plan
  document.getElementById('dp_rp_part_plan').addEventListener('change', function(e) {
    const file = this.files[0];
    const fileSize = file.size / 1024 / 1024; // in MB
    if (fileSize > 5) {
      alert('File size should not exceed 5MB');
      this.value = '';
    }
  });

  // Google Image
  document.getElementById('google_image').addEventListener('change', function(e) {
    const file = this.files[0];
    const fileSize = file.size / 1024 / 1024; // in MB
    if (fileSize > 5) {
      alert('File size should not exceed 5MB');
      this.value = '';
    }
  });

  // Zone and Uses
  document.getElementById('zone').addEventListener('change', function(e) {
    const usesSelect = document.getElementById('uses');
    const selectedZone = this.value;
    const filteredUses = usesData.uses.filter(use => use.zoneId === parseInt(selectedZone));
    populateDropdown(usesSelect, filteredUses, 'id', 'name');
    usesSelect.disabled = false;
  });

  // Initially disable the city specific area dropdown
  const citySpecificAreaSelect = document.getElementById('city_specific_area');
  citySpecificAreaSelect.disabled = true;
  citySpecificAreaSelect.innerHTML = '<option value="">Select ULB/RP/Special Authority first</option>';

  // ULB and City Specific Area
  document.getElementById('ulb_rp_special_authority').addEventListener('change', function(e) {
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    const selectedUlbId = parseInt(this.value);
    const selectedUlb = ulbData.ulb_rp_special_authority.find(ulb => ulb.id === selectedUlbId);
    
    console.log('Selected ULB:', selectedUlb); // Debug log

    if (selectedUlb) {
      const filteredAreas = citySpecificAreaData.city_specific_area.filter(area => area.councilId === selectedUlb.councilId);
      
      console.log('Filtered Areas:', filteredAreas); // Debug log

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
  document.getElementById('building_type').addEventListener('change', function(e) {
    const buildingSubtypeSelect = document.getElementById('building_subtype');
    const selectedBuildingType = this.value;
    const filteredBuildingSubtypes = buildingSubtypeData.building_subtype.filter(subtype => subtype.bldgtypeID === parseInt(selectedBuildingType));
    populateDropdown(buildingSubtypeSelect, filteredBuildingSubtypes, 'id', 'name');
    buildingSubtypeSelect.disabled = false;
  });

  // Plot Boundaries
  ['front', 'left', 'right', 'rear'].forEach(side => {
    document.getElementById(`${side}_boundary_type`).addEventListener('change', function(e) {
      toggleElement(`road_container_${side}`, this.value === 'Road');
    });
  });

  // Restrict numeric inputs (allow decimals)
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('input', function(e) {
    restrictToNumbers(this);
  });
});

function restrictToNumbers(input) {
  // Allow numbers and one decimal point
  const validValue = input.value.match(/^\d*\.?\d*$/);

  if (!validValue) {
    input.value = input.value.slice(0, -1); // Remove the last invalid character
  }
}


  // Form submission
  document.querySelector('form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Perform final validations
    const applicantName = document.getElementById('applicant_name').value;
    const contactNo = document.getElementById('contact_no').value;
    const email = document.getElementById('email').value;

    if (!applicantName || !contactNo || !email) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!validatePhoneNumber(contactNo)) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
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
      } else {
        alert('Error submitting form. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});