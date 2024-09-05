// Load JSON data
let formData = {};

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    formData = data;
    populateFormFields();
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
    toggleLoadingIndicator(false); // Hide loading indicator even if there's an error
    alert('There was an error loading the form data. Please refresh the page and try again.');
  });

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

  // Hide loading indicator
  toggleLoadingIndicator(false);
  
  console.log('Form fields populated'); // Add this for debugging
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
  const incentiveFsiRadios = document.querySelectorAll('input[name="incentive_fsi"]');
  incentiveFsiRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const incentive_fsi_rating = document.getElementById('incentive_fsi_rating');
      incentive_fsi_rating.classList.toggle('hidden', this.value === 'No');
    });
  });

  // Electrical Line radio button change event
  const electricalLineRadios = document.querySelectorAll('input[name="electrical_line"]');
  electricalLineRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const electrical_line_voltage = document.getElementById('electrical_line_voltage');
      electrical_line_voltage.classList.toggle('hidden', this.value === 'No');
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
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
  }
  
  // Enable or disable the form
  const form = document.getElementById('udcprForm');
  if (form) {
    form.style.pointerEvents = show ? 'none' : 'auto';
    form.style.opacity = show ? '0.5' : '1';
  }
  
  console.log('Loading indicator toggled:', show); // Add this for debugging
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
  toggleLoadingIndicator(true);
  // The loading indicator will be hidden once the JSON data is loaded and the form is populated
});

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('udcprForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      console.log('Form submitted');
      
      const formData = new FormData(form);
      
      // Show loading indicator
      toggleLoadingIndicator(true);
      
      fetch(form.action, {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Change this from response.json() to response.text()
      })
      .then(data => {
        console.log('Success:', data);
        try {
          const jsonData = JSON.parse(data);
          alert('Form submitted successfully!');
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Form submitted, but there was an issue processing the response. Please check with the administrator.');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      })
      .finally(() => {
        // Hide loading indicator
        toggleLoadingIndicator(false);
      });
    });
  } else {
    console.error('Form element not found');
  }
});