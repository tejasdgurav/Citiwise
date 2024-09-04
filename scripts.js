// Load JSON data
let formData = {};

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    formData = data;
    populateFormFields();
  })
  .catch(error => console.error('Error loading JSON data:', error));

function populateFormFields() {
  // Populate ULB Type
  populateSelect('ulbType', formData.ulbTypes);

  // Populate Zones
  populateSelect('zone', formData.zones);

  // Populate Uses
  populateSelect('uses', formData.uses);

  // Populate City Specific Area
  populateSelect('citySpecificArea', formData.citySpecificAreas);

  // Populate Building Type
  populateSelect('buildingType', formData.buildingTypes);

  // Set up event listeners
  setupEventListeners();
}

function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Select an option</option>';
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.id;
    optionElement.textContent = option.name;
    select.appendChild(optionElement);
  });
}

function setupEventListeners() {
  // ULB Type change event
  document.getElementById('ulbType').addEventListener('change', function() {
    const ulbSelect = document.getElementById('ulb');
    ulbSelect.innerHTML = '<option value="">Select ULB/RP/Special Authority</option>';
    
    const selectedUlbTypeId = this.value;
    const filteredUlbs = formData.ulbs.filter(ulb => ulb.typeId == selectedUlbTypeId);
    
    filteredUlbs.forEach(ulb => {
      const option = document.createElement('option');
      option.value = ulb.id;
      option.textContent = ulb.name;
      ulbSelect.appendChild(option);
    });
  });

  // Building Type change event
  document.getElementById('buildingType').addEventListener('change', function() {
    const subtypeSelect = document.getElementById('buildingSubtype');
    subtypeSelect.innerHTML = '<option value="">Select a subtype</option>';
    
    const selectedBuildingTypeId = this.value;
    const subtypes = formData.buildingSubtypes[selectedBuildingTypeId] || [];
    
    subtypes.forEach(subtype => {
      const option = document.createElement('option');
      option.value = subtype.id;
      option.textContent = subtype.name;
      subtypeSelect.appendChild(option);
    });
  });

  // Incentive FSI radio button change event
  const incentiveFsiRadios = document.querySelectorAll('input[name="incentiveFsi"]');
  incentiveFsiRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const incentiveFsiDetails = document.getElementById('incentiveFsiDetails');
      incentiveFsiDetails.classList.toggle('hidden', this.value === 'No');
    });
  });

  // Electrical Line radio button change event
  const electricalLineRadios = document.querySelectorAll('input[name="electricalLine"]');
  electricalLineRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const electricLineDetails = document.getElementById('electricLineDetails');
      electricLineDetails.classList.toggle('hidden', this.value === 'No');
    });
  });

  // Reservation Area Affected radio button change event
  const reservationAreaRadios = document.querySelectorAll('input[name="reservationAreaAffected"]');
  reservationAreaRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const reservationAreaDetails = document.getElementById('reservationAreaAffectedDetails');
      reservationAreaDetails.classList.toggle('hidden', this.value === 'No');
    });
  });

  // CRZ Affected radio button change event
  const crzAffectedRadios = document.querySelectorAll('input[name="crzAffected"]');
  crzAffectedRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const crzAffectedDetails = document.getElementById('crzAffectedDetails');
      crzAffectedDetails.classList.toggle('hidden', this.value === 'No');
    });
  });

  // DP/RP Road Affected radio button change event
  const dpRpRoadAffectedRadios = document.querySelectorAll('input[name="dpRpRoadAffected"]');
  dpRpRoadAffectedRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const dpRpRoadAffectedDetails = document.getElementById('dpRpRoadAffectedDetails');
      dpRpRoadAffectedDetails.classList.toggle('hidden', this.value === 'No');
    });
  });

  // Plot Boundaries change events
  const boundaryTypes = ['front', 'left', 'right', 'rear'];
  boundaryTypes.forEach(type => {
    const select = document.getElementById(`${type}Boundary`);
    const roadDetails = document.getElementById(`${type}-road-details`);
    
    select.addEventListener('change', function() {
      roadDetails.style.display = this.value === 'Road' ? 'block' : 'none';
    });
  });
}

// Form submission handler
document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Perform form validation here
  if (validateForm()) {
    // If form is valid, you can submit the data or perform further actions
    console.log('Form submitted successfully');
    // You can add an AJAX call here to submit the form data to a server
  } else {
    console.log('Form validation failed');
  }
});

function validateForm() {
  // Add your form validation logic here
  // Return true if the form is valid, false otherwise
  // This is a basic example, you should add more comprehensive validation
  
  const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('invalid');
    } else {
      field.classList.remove('invalid');
    }
  });

  return isValid;
}

// Helper function to show/hide loading indicator
function toggleLoadingIndicator(show) {
  const loadingIndicator = document.querySelector('.loading-indicator');
  if (show) {
    loadingIndicator.style.display = 'flex';
  } else {
    loadingIndicator.style.display = 'none';
  }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
  toggleLoadingIndicator(true);
  // The loading indicator will be hidden once the JSON data is loaded and the form is populated
});

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('udcprForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('Form submitted');
    
    const formData = new FormData(form);
    
    fetch(form.action, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      alert('Form submitted successfully!');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    });
  });
});