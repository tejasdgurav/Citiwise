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

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
  // Load all JSON data
  const ulbData = await loadJSONData('ulb_rp_special_authority.json');
  const buildingTypeData = await loadJSONData('building_type.json');
  const buildingSubtypeData = await loadJSONData('building_subtype.json');
  const zoneData = await loadJSONData('zone.json');
  const usesData = await loadJSONData('uses.json');
  const citySpecificAreaData = await loadJSONData('city_specific_area.json');

  // Populate dropdowns
  populateDropdown(document.getElementById('ulb_rp_special_authority'), ulbData.ulb_rp_special_authority, 'id', 'councilName');
  populateDropdown(document.getElementById('zone'), zoneData.zone, 'id', 'name');
  populateDropdown(document.getElementById('building_type'), buildingTypeData.building_type, 'id', 'name');

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

  // Special Scheme
  const specialSchemeOptions = [
    "Pradhan Mantri Awas Yojna",
    "Affordable Housing Scheme",
    "Integrated Information Technology Township",
    "Integrated Logistic Park",
    "Tourism and Hospitality Services",
    "Industrial Township under Aerospace and Defence Manufacturing Policy"
  ];
  populateDropdown(document.getElementById('special_scheme'), specialSchemeOptions.map((name, id) => ({ id, name })), 'id', 'name');

  // Incentive FSI
  document.getElementById('incentive_fsi').addEventListener('change', function(e) {
    const incentiveFsiRating = document.getElementById('incentive_fsi_rating');
    if (this.value === 'Yes') {
      incentiveFsiRating.style.display = 'block';
    } else {
      incentiveFsiRating.style.display = 'none';
    }
  });

  // Electrical Line
  document.getElementById('electrical_line').addEventListener('change', function(e) {
    const electricalLineVoltage = document.getElementById('electrical_line_voltage');
    if (this.value === 'Yes') {
      electricalLineVoltage.style.display = 'block';
    } else {
      electricalLineVoltage.style.display = 'none';
    }
  });

  // Reservation Area Affected
  document.getElementById('reservation_area_affected').addEventListener('change', function(e) {
    const reservationAreaSqm = document.getElementById('reservation_area_sqm');
    if (this.value === 'Yes') {
      reservationAreaSqm.style.display = 'block';
    } else {
      reservationAreaSqm.style.display = 'none';
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

  // ULB and City Specific Area
  document.getElementById('ulb_rp_special_authority').addEventListener('change', function(e) {
    const citySpecificAreaSelect = document.getElementById('city_specific_area');
    const selectedUlb = this.value;
    const filteredAreas = citySpecificAreaData.city_specific_area.filter(area => area.councilId === parseInt(selectedUlb));
    populateDropdown(citySpecificAreaSelect, filteredAreas, 'id', 'name');
    citySpecificAreaSelect.disabled = false;
  });

  // Type of Proposal and Building Type
  document.getElementById('type_of_proposal').addEventListener('change', function(e) {
    const buildingTypeSelect = document.getElementById('building_type');
    const selectedProposal = this.value;
    const filteredBuildingTypes = buildingTypeData.building_type.filter(type => type.proposalId === parseInt(selectedProposal));
    populateDropdown(buildingTypeSelect, filteredBuildingTypes, 'id', 'name');
    buildingTypeSelect.disabled = false;
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
      const roadDetails = document.getElementById(`road_container_${side}`);
      if (this.value === 'Road') {
        roadDetails.style.display = 'block';
      } else {
        roadDetails.style.display = 'none';
      }
    });
  });

  // Restrict numeric inputs
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', function(e) {
      restrictToNumbers(this);
    });
  });

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
      const response = await fetch('https://script.google.com/macros/s/AKfycbySdR0qSjRk7xSirHoDki9Cb64D7gUwD9LomQ9M2GU4C57DZ8-MLekLb2NDAIsFUXCr/exec', {
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