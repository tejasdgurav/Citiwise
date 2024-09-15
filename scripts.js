// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Load JSON data
let jsonData;

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    jsonData = data;
    populateDropdowns();
  })
  .catch(error => console.error('Error loading JSON data:', error));

// Populate dropdowns
function populateDropdowns() {
  // ULB/RP/Special Authority
  const ulbSelect = $('select[name="ulb_rp_special_authority"]');
  jsonData.ulb_rp_special_authority.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.districtName} - ${item.talukaName} (${item.name})`;
    ulbSelect.appendChild(option);
  });

  // Zones
  const zoneSelect = $('select[name="zone"]');
  jsonData.zone.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone.id;
    option.textContent = zone.name;
    zoneSelect.appendChild(option);
  });

  // Uses
  const usesSelect = $('select[name="uses"]');
  jsonData.uses.forEach(use => {
    const option = document.createElement('option');
    option.value = use.id;
    option.textContent = use.name;
    usesSelect.appendChild(option);
  });

  // Building type
  const buildingTypeSelect = $('select[name="building_type"]');
  jsonData.building_type.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    buildingTypeSelect.appendChild(option);
  });

  // Building subtype (will be populated based on building type selection)
}

// Form validation
function validateForm() {
  let isValid = true;

  // Validate required fields
  $$('input[required], select[required]').forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('invalid');
    } else {
      field.classList.remove('invalid');
    }
  });

  // Validate email
  const emailField = $('input[name="email"]');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailField.value && !emailRegex.test(emailField.value)) {
    isValid = false;
    emailField.classList.add('invalid');
  } else {
    emailField.classList.remove('invalid');
  }

  // Validate phone number
  const phoneField = $('input[name="contact_no"]');
  const phoneRegex = /^[0-9]{10}$/;
  if (phoneField.value && !phoneRegex.test(phoneField.value)) {
    isValid = false;
    phoneField.classList.add('invalid');
  } else {
    phoneField.classList.remove('invalid');
  }

  return isValid;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Sentence case restriction for text inputs
  $$('input[type="text"]').forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.replace(/[^a-zA-Z0-9\s]/g, '');
      this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1).toLowerCase();
    });
  });

  // Phone number restriction
  $('input[name="contact_no"]').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
  });

  // Incentive FSI conditional field
  $('input[name="incentive_fsi"]').forEach(radio => {
    radio.addEventListener('change', function() {
      $('#incentive_fsi_rating').style.display = this.value === 'Yes' ? 'block' : 'none';
    });
  });

  // Electrical line conditional field
  $('input[name="electrical_line"]').forEach(radio => {
    radio.addEventListener('change', function() {
      $('#electrical_line_voltage').style.display = this.value === 'Yes' ? 'block' : 'none';
    });
  });

  // Reservation area affected conditional field
  $('input[name="reservation_area_affected"]').forEach(radio => {
    radio.addEventListener('change', function() {
      $('#reservation_area_sqm').style.display = this.value === 'Yes' ? 'block' : 'none';
    });
  });

  // DP/RP road affected conditional field
  $('input[name="dp_rp_road_affected"]').forEach(radio => {
    radio.addEventListener('change', function() {
      $('#dp_rp_road_area_sqm').style.display = this.value === 'Yes' ? 'block' : 'none';
    });
  });

  // Building type and subtype relationship
  $('select[name="building_type"]').addEventListener('change', function() {
    const subtypeSelect = $('select[name="building_subtype"]');
    subtypeSelect.innerHTML = '<option value="">Select a subtype</option>';
    
    if (this.value && jsonData.building_subtype[this.value]) {
      jsonData.building_subtype[this.value].forEach(subtype => {
        const option = document.createElement('option');
        option.value = subtype.id;
        option.textContent = subtype.name;
        subtypeSelect.appendChild(option);
      });
      subtypeSelect.disabled = false;
    } else {
      subtypeSelect.disabled = true;
    }
  });

  // Plot boundaries
  ['front', 'left', 'right', 'rear'].forEach(side => {
    $(`select[name="${side}_boundary"]`).addEventListener('change', function() {
      const roadContainer = $(`#road_container_${side}`);
      roadContainer.style.display = this.value === 'Road' ? 'block' : 'none';
    });
  });

  // Form submission
  $('form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (validateForm()) {
      $('.loading-indicator').style.display = 'flex';
      // Here you would typically send the form data to your backend
      // For demonstration, we'll just simulate a delay
      setTimeout(() => {
        $('.loading-indicator').style.display = 'none';
        alert('Form submitted successfully!');
      }, 2000);
    } else {
      alert('Please fill in all required fields correctly.');
    }
  });
});