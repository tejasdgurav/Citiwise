// Utility Functions
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
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
    value = parseInt(value, 10);
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
  console.log(
    `Showing feedback for ${input.id}: isValid=${isValid}, message="${message}"`
  );
  let feedbackEl = input.nextElementSibling;
  if (!feedbackEl || !feedbackEl.classList.contains('feedback')) {
    feedbackEl = document.createElement('div');
    feedbackEl.classList.add('feedback');
    input.parentNode.insertBefore(feedbackEl, input.nextSibling);
  }
  feedbackEl.textContent = message;
  feedbackEl.className = 'feedback ' + (isValid ? 'valid' : 'invalid');
  input.classList.toggle('invalid-input', !isValid);
}

// Load JSON data
async function loadJSONData(filename) {
  try {
    const response = await fetch(`static/data/${filename}`);
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
function populateDropdown(
  selectElement,
  data,
  valueKey,
  textKey,
  idKey = null,
  councilIdKey = null
) {
  selectElement.innerHTML = '<option value="">Select an option</option>';
  data.forEach((item) => {
    const option = document.createElement('option');

    if (selectElement.id === 'zone') {
      option.value = item[textKey]; // Use 'name' as value
      option.setAttribute('data-zone-id', item.id); // Set zone_id
      option.setAttribute('data-landuser-id', item.landuserId); // Set landuserId
    } else if (selectElement.id === 'building_type') {
      option.value = item[valueKey]; // Use 'id' as value
      // **Newly Added Attributes for building_type**
      option.setAttribute('data-name', item.name);
      option.setAttribute('data-proposal-id', item.proposalId);
    } 
    // **Newly Added Handling for building_subtype**
    else if (selectElement.id === 'building_subtype') {
      option.value = item[valueKey]; // Use 'id' as value
      option.setAttribute('data-name', item.name);
      option.setAttribute('data-bldgtypeID', item.bldgtypeID);
    } else {
      option.value = item[valueKey]; // Use 'id' for other dropdowns
    }

    option.textContent = item[textKey]; // Display 'name'

    if (idKey && councilIdKey) {
      option.setAttribute('data-taluka-id', item[idKey]);
      option.setAttribute('data-council-id', item[councilIdKey]);
    }

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

// Main function
async function initializeForm() {
  try {
    console.log('Initializing form...');
    // Load all JSON data
    const [
      ulbData,
      buildingTypeData,
      buildingSubtypeData,
      zoneData,
      usesData,
      citySpecificAreaData,
    ] = await Promise.all([
      loadJSONData('ulb_rp_special_authority.json'),
      loadJSONData('building_type.json'),
      loadJSONData('building_subtype.json'),
      loadJSONData('zone.json'),
      loadJSONData('uses.json'),
      loadJSONData('city_specific_area.json'),
    ]);

    if (
      !ulbData ||
      !buildingTypeData ||
      !buildingSubtypeData ||
      !zoneData ||
      !usesData ||
      !citySpecificAreaData
    ) {
      throw new Error('Failed to load one or more required data files');
    }

    console.log('JSON data loaded successfully.');

    // Sort ULB/RP/Special Authority data alphabetically by talukaName
    const sortedUlbData = ulbData.ulb_rp_special_authority.sort((a, b) =>
      a.talukaName.localeCompare(b.talukaName)
    );

    // Populate ULB/RP/Special Authority dropdown with sorted data
    populateDropdown(
      document.getElementById('ulb_rp_special_authority'),
      sortedUlbData,
      'talukaName',
      'talukaName',
      'id',
      'councilId'
    );

    // Populate dropdowns from JSON
    populateDropdown(
      document.getElementById('zone'),
      zoneData.zone,
      'id',
      'name'
    );
    populateDropdown(
      document.getElementById('building_type'),
      buildingTypeData.building_type,
      'id',
      'name'
    );

    // **Populate building_subtype dropdown initially as disabled**
    const buildingSubtypeSelect = document.getElementById('building_subtype');
    buildingSubtypeSelect.innerHTML = '<option value="">Select Building Type first</option>';
    buildingSubtypeSelect.disabled = true;

    // Hide conditional elements initially
    toggleElement('incentive_fsi_rating', false);
    toggleElement('electrical_line_voltage', false);
    toggleElement('reservation_area_sqm', false);
    toggleElement('dp_rp_road_area_sqm', false);
    ['front', 'left', 'right', 'rear'].forEach((side) => {
      toggleElement(`road_container_${side}`, false);
    });

    // Input validations
    const inputValidations = [
      {
        id: 'applicant_type',
        validate: (value) => value !== '',
        errorMsg: 'Please select an option',
      },
      {
        id: 'applicant_name',
        validate: (value) =>
          value.trim().length > 0 && value.trim().length <= 100,
        format: restrictToTitleCase,
        errorMsg: 'Please enter a valid name (max 100 characters)',
      },
      {
        id: 'contact_no',
        validate: validatePhoneNumber,
        format: (input) => restrictToNumbers(input),
        errorMsg: 'Please enter a valid 10-digit Indian mobile number',
      },
      {
        id: 'email',
        validate: (value) => validateEmail(value) && value.length <= 100,
        format: (input) => {
          input.value = input.value.toLowerCase();
        },
        errorMsg: 'Please enter a valid email address (max 100 characters)',
      },
      {
        id: 'project_name',
        validate: (value) =>
          value.trim().length > 0 && value.trim().length <= 100,
        format: restrictToTitleCase,
        errorMsg: 'Please enter a valid project name (max 100 characters)',
      },
      {
        id: 'site_address',
        validate: (value) =>
          value.trim().length > 0 && value.trim().length <= 200,
        format: restrictToTitleCase,
        errorMsg: 'Please enter a valid site address (max 200 characters)',
      },
      {
        id: 'village_name',
        validate: (value) =>
          value.trim().length > 0 && value.trim().length <= 50,
        format: restrictToTitleCase,
        errorMsg:
          'Please enter a valid village/mouje name (max 50 characters)',
      },
      {
        id: 'reservation_area_sqm',
        validate: (value) => {
          if (!value || value.trim() === '') return true;
          const numValue = parseFloat(value);
          return !isNaN(numValue) && numValue > 0;
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid positive number for Reservation Area Affected',
      },
      {
        id: 'dp_rp_road_area_sqm',
        validate: (value) => {
          if (!value || value.trim() === '') return true;
          const numValue = parseFloat(value);
          return !isNaN(numValue) && numValue > 0;
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid positive number for DP/RP Road Area Affected',
      },
      {
        id: 'area_plot_site_sqm',
        validate: (value) => {
          const numValue = parseFloat(value);
          return (
            !isNaN(numValue) &&
            numValue > 0 &&
            numValue <= 999999.99
          );
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid number between 0.01 and 999,999.99',
      },
      {
        id: 'area_plot_ownership_sqm',
        validate: (value) => {
          const numValue = parseFloat(value);
          return (
            !isNaN(numValue) &&
            numValue > 0 &&
            numValue <= 999999.99
          );
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid number between 0.01 and 999,999.99',
      },
      {
        id: 'area_plot_measurement_sqm',
        validate: (value) => {
          const numValue = parseFloat(value);
          return (
            !isNaN(numValue) &&
            numValue > 0 &&
            numValue <= 999999.99
          );
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid number between 0.01 and 999,999.99',
      },
      {
        id: 'pro_rata_fsi',
        validate: (value) => {
          if (!value || value.trim() === '') return true;
          const numValue = parseFloat(value);
          return (
            !isNaN(numValue) &&
            numValue >= 0 &&
            numValue <= 999.99
          );
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid number between 0 and 999.99',
      },
      {
        id: 'plot_width',
        validate: (value) => {
          const numValue = parseFloat(value);
          return (
            !isNaN(numValue) &&
            numValue > 0 &&
            numValue <= 999.99
          );
        },
        format: (input) => formatNumber(input, true),
        errorMsg:
          'Please enter a valid number between 0.01 and 999.99',
      },
    ];

    // Handle radio button changes
    function handleRadioChange(name, elementToToggle) {
      const radioButtons = document.getElementsByName(name);
      radioButtons.forEach((radio) => {
        radio.addEventListener('change', function () {
          const show = this.value === 'Yes';
          toggleElement(elementToToggle, show);
          const element = document.getElementById(elementToToggle);
          if (element) {
            const inputField = element.querySelector(
              'input, select, textarea'
            );
            if (inputField) {
              inputField.disabled = !show;
              if (show) {
                // Find the validation for this element
                const validation = inputValidations.find(
                  (v) => v.id === inputField.id
                );
                if (validation) {
                  // Set up the validation event listener if not already attached
                  if (!inputField.dataset.listenerAttached) {
                    inputField.addEventListener(
                      'blur',
                      function () {
                        if (
                          typeof validation.format === 'function'
                        ) {
                          validation.format(this);
                        }
                        const isValid = validation.validate(
                          this.value
                        );
                        showFeedback(
                          this,
                          isValid,
                          isValid ? '' : validation.errorMsg
                        );
                      }
                    );
                    inputField.dataset.listenerAttached = 'true';
                  }
                }
              } else {
                inputField.value = '';
                showFeedback(inputField, true, '');
              }
            }
          }
        });
      });
    }

    // Setup conditional elements
    handleRadioChange(
      'incentive_fsi',
      'incentive_fsi_rating'
    );
    handleRadioChange(
      'electrical_line',
      'electrical_line_voltage'
    );
    handleRadioChange(
      'reservation_area_affected',
      'reservation_area_sqm'
    );
    handleRadioChange(
      'dp_rp_road_affected',
      'dp_rp_road_area_sqm'
    );

    // Define a function to set up validation for a single input
    function setupInputValidation(element, validation) {
      if (element) {
        const validateAndShowFeedback = function () {
          if (typeof validation.format === 'function') {
            validation.format(this);
          }
          const isValid = validation.validate(this.value);
          showFeedback(
            this,
            isValid,
            isValid ? '' : validation.errorMsg
          );
        };

        if (element.tagName.toLowerCase() === 'select') {
          element.addEventListener(
            'change',
            validateAndShowFeedback
          );
        } else {
          element.addEventListener(
            'blur',
            validateAndShowFeedback
          );
        }
      }
    }

    // Use this function in the initial setup
    inputValidations.forEach((validation) => {
      const element = document.getElementById(validation.id);
      setupInputValidation(element, validation);
    });

    // File input validation
    ['dp_rp_part_plan', 'google_image'].forEach((id) => {
      const fileInput = document.getElementById(id);
      if (fileInput) {
        fileInput.addEventListener('change', function () {
          const file = this.files[0];
          if (file) {
            const fileSize = file.size / 1024 / 1024; // in MB
            const allowedFormats = [
              'image/jpeg',
              'image/png',
              'image/gif',
            ];
            let isValid = true;
            let errorMsg = '';

            if (fileSize > 5) {
              isValid = false;
              errorMsg = 'File size should not exceed 5MB';
            } else if (!allowedFormats.includes(file.type)) {
              isValid = false;
              errorMsg =
                'Please upload an image file (JPEG, PNG, or GIF)';
            }

            showFeedback(this, isValid, errorMsg);
            if (!isValid) this.value = '';
          }
        });
      }
    });

    // Road Width inputs
    const roadWidthInputs = document.querySelectorAll(
      '.road-width-input'
    );
    roadWidthInputs.forEach((input) => {
      input.addEventListener('input', function () {
        restrictToNumbers(this, true);
      });

      input.addEventListener('blur', function () {
        const value = parseFloat(this.value);
        if (!isNaN(value) && value > 0) {
          this.value = value.toFixed(2);
          this.classList.remove('invalid-input');
          showFeedback(this, true, '');
        } else {
          this.classList.add('invalid-input');
          showFeedback(
            this,
            false,
            'Please enter a valid positive number'
          );
        }
      });
    });

    // Zone and Uses
    const zoneSelect = document.getElementById('zone');
    if (zoneSelect) {
      zoneSelect.addEventListener('change', function () {
        const usesSelect = document.getElementById('uses');

        // Get the selected zone ID from the selected option's data attribute
        const selectedZoneId = this.options[this.selectedIndex].getAttribute('data-zone-id');

        // If no zone is selected, reset and disable the uses dropdown
        if (!selectedZoneId) {
          usesSelect.innerHTML = '<option value="">Select Zone first</option>';
          usesSelect.disabled = true;
          return;
        }

        // Filter the uses based on the selected zone ID
        const filteredUses = usesData.uses.filter(
          (use) => use.zoneId === parseInt(selectedZoneId, 10) // Ensure proper matching of zoneId
        );

        // Populate the uses dropdown with the filtered uses data
        populateDropdown(usesSelect, filteredUses, 'id', 'name');

        // Enable the uses dropdown
        usesSelect.disabled = false;
      });
    }

    // ULB and City Specific Area
    const citySpecificAreaSelect = document.getElementById(
      'city_specific_area'
    );
    citySpecificAreaSelect.disabled = true;
    citySpecificAreaSelect.innerHTML =
      '<option value="">Select ULB/RP/Special Authority first</option>';

    const ulbDropdown = document.getElementById('ulb_rp_special_authority');
    if (ulbDropdown) {
      ulbDropdown.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        const selectedTalukaName = selectedOption.textContent;
        const selectedUlb = ulbData.ulb_rp_special_authority.find(
          (ulb) => ulb.talukaName === selectedTalukaName
        );

        if (selectedUlb) {
          // Extract councilName
          const councilName = selectedUlb.councilName || ''; // Ensure it exists

          // Populate the hidden field for councilName (ulb_type)
          const councilNameInput = document.getElementById('ulb_type');
          if (councilNameInput) {
            councilNameInput.value = councilName;
          }

          // Update city-specific areas dropdown
          const filteredAreas = citySpecificAreaData.city_specific_area.filter(
            (area) => area.councilId === selectedUlb.councilId
          );
          if (filteredAreas.length > 0) {
            // Clear existing options
            citySpecificAreaSelect.innerHTML = '<option value="">Select City Specific Area</option>';

            // Populate with filtered areas and set data attributes
            filteredAreas.forEach((area) => {
              const option = document.createElement('option');
              option.value = area.id;
              option.textContent = area.name;
              option.setAttribute('data-area-code', area.areaCode);
              option.setAttribute('data-council-id', area.councilId);
              citySpecificAreaSelect.appendChild(option);
            });

            citySpecificAreaSelect.disabled = false;
          } else {
            citySpecificAreaSelect.innerHTML =
              '<option value="">No specific areas available for this ULB</option>';
            citySpecificAreaSelect.disabled = true;
          }
        } else {
          citySpecificAreaSelect.innerHTML =
            '<option value="">Select ULB/RP/Special Authority first</option>';
          citySpecificAreaSelect.disabled = true;
        }
      });
    }

    // Building Type and Building Subtype
    const buildingTypeSelect = document.getElementById('building_type');
    if (buildingTypeSelect) {
      buildingTypeSelect.addEventListener('change', function () {
        const buildingSubtypeSelect = document.getElementById(
          'building_subtype'
        );
        const selectedBuildingType = this.value;
        if (!selectedBuildingType) {
          buildingSubtypeSelect.innerHTML =
            '<option value="">Select Building Type first</option>';
          buildingSubtypeSelect.disabled = true;
          return;
        }
        const filteredBuildingSubtypes =
          buildingSubtypeData.building_subtype.filter(
            (subtype) =>
              subtype.bldgtypeID === parseInt(selectedBuildingType, 10)
          );
        populateDropdown(
          buildingSubtypeSelect,
          filteredBuildingSubtypes,
          'id',
          'name'
        );
        buildingSubtypeSelect.disabled = false;
      });
    }

    // Plot Boundaries
    const sides = ['front', 'left', 'right', 'rear'];

    // Setup boundary listeners
    function setupBoundaryListeners() {
      sides.forEach((side) => {
        const select = document.getElementById(
          `${side}_boundary_type`
        );
        const roadContainer = document.getElementById(
          `road_container_${side}`
        );
        const roadWidthInput = document.getElementById(
          `road_details_${side}_meters`
        );

        if (select) {
          select.addEventListener('change', function () {
            const isRoad = this.value === 'Road';
            toggleElement(`road_container_${side}`, isRoad);

            // Enable/disable other selects based on front boundary
            if (side === 'front') {
              const isRoadSelected = isRoad;
              sides.slice(1).forEach((otherSide) => {
                const otherSelect = document.getElementById(
                  `${otherSide}_boundary_type`
                );
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
          roadWidthInput.addEventListener('input', function () {
            restrictToNumbers(this, true);
          });

          roadWidthInput.addEventListener('blur', function () {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value > 0) {
              this.value = value.toFixed(2);
              this.classList.remove('invalid-input');
              showFeedback(this, true, '');
            } else {
              this.classList.add('invalid-input');
              showFeedback(
                this,
                false,
                'Please enter a valid positive number'
              );
            }
          });
        }
      });
    }

    // Initialize boundary selects
    function initializeBoundarySelects() {
      sides.slice(1).forEach((side) => {
        const select = document.getElementById(
          `${side}_boundary_type`
        );
        if (select) {
          select.disabled = true;
          select.value = '';
        }
      });
    }

    // Setup plot boundary listeners and initialize selects
    setupBoundaryListeners();
    initializeBoundarySelects();

    // Form submission
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent default form submission

        console.log('Form submission initiated.');

        // Perform final validations
        let isValid = true;
        inputValidations.forEach(({ id, validate, errorMsg }) => {
          const input = document.getElementById(id);
          if (input && typeof validate === 'function') {
            if (!validate(input.value)) {
              showFeedback(input, false, errorMsg);
              isValid = false;
            } else {
              showFeedback(input, true, '');
            }
          }
        });

        if (!isValid) {
          alert('Please correct the errors in the form before submitting.');
          console.warn('Form validation failed.');
          return;
        }

        // Prepare FormData
        const formData = new FormData(this);

        // Extract taluka_id and council_id from selected dropdown option
        const selectedOption = ulbDropdown.options[ulbDropdown.selectedIndex];
        const talukaId = selectedOption.getAttribute('data-taluka-id');
        const councilId = selectedOption.getAttribute('data-council-id');

        // Log these values for debugging
        console.log('Selected talukaId:', talukaId);
        console.log('Selected councilId:', councilId);

        // Append taluka_id and council_id to FormData
        formData.append('taluka_id', talukaId || '');
        formData.append('council_id', councilId || '');

        // Capture zone_id, zone_name, and zone_landuser_id from selected zone
        const zoneSelect = document.getElementById('zone');
        const selectedZone = zoneSelect.options[zoneSelect.selectedIndex];
        const zoneId = selectedZone.getAttribute('data-zone-id'); // zone_id
        const zoneName = selectedZone.value; // zone (name)
        const zoneLanduserId = selectedZone.getAttribute('data-landuser-id'); // zone_landuser_id

        // Append zone_id, zone_name, and zone_landuser_id to FormData
        formData.append('zone_id', zoneId || ''); // Capture zone_id from data attribute
        formData.append('zone', zoneName || '');  // This should store the zone name in the 'zone' column
        formData.append('zone_landuser_id', zoneLanduserId || ''); // Capture the correct landuser_id

        // Ensure ulb_type is included in FormData
        const ulbTypeInput = document.getElementById('ulb_type');
        const ulbTypeValue = ulbTypeInput ? ulbTypeInput.value : '';
        formData.append('ulb_type', ulbTypeValue);

        // **Newly Added Section: Capture Uses Details**
        const usesSelect = document.getElementById('uses');
        const selectedUsesOption = usesSelect.options[usesSelect.selectedIndex];
        const usesId = selectedUsesOption.value;
        const usesName = selectedUsesOption.textContent;
        const usesZoneId = zoneId; // Same as zone_id

        // Append uses details to FormData
        formData.append('uses_id', usesId || '');
        formData.append('uses_name', usesName || '');
        formData.append('uses_zone_id', usesZoneId || '');

        // **Newly Added Section: Capture City Specific Area Details**
        const citySpecificAreaSelect = document.getElementById('city_specific_area');
        const selectedCityAreaOption = citySpecificAreaSelect.options[citySpecificAreaSelect.selectedIndex];
        const citySpecificAreaId = selectedCityAreaOption.value;
        const citySpecificAreaName = selectedCityAreaOption.textContent;
        const citySpecificAreaAreaCode = selectedCityAreaOption.getAttribute('data-area-code');
        const citySpecificAreaCouncilId = selectedCityAreaOption.getAttribute('data-council-id');

        // Append city_specific_area details to FormData
        formData.append('city_specific_area_id', citySpecificAreaId || '');
        formData.append('city_specific_area_name', citySpecificAreaName || '');
        formData.append('city_specific_area_areaCode', citySpecificAreaAreaCode || '');
        formData.append('city_specific_area_councilId', citySpecificAreaCouncilId || '');

        // **Newly Added Section: Capture Building Type Details**
        const buildingTypeSelectElement = document.getElementById('building_type');
        const selectedBuildingTypeOption = buildingTypeSelectElement.options[buildingTypeSelectElement.selectedIndex];
        const buildingTypeId = selectedBuildingTypeOption.value;
        const buildingTypeName = selectedBuildingTypeOption.getAttribute('data-name');
        const buildingTypeProposalId = selectedBuildingTypeOption.getAttribute('data-proposal-id');

        // Append building_type details to FormData
        formData.append('building_type_id', buildingTypeId || '');
        formData.append('building_type_name', buildingTypeName || '');
        formData.append('building_type_proposalId', buildingTypeProposalId || '');

        // **Newly Added Section: Capture Building Subtype Details**
        const buildingSubtypeSelectElement = document.getElementById('building_subtype');
        const selectedBuildingSubtypeOption = buildingSubtypeSelectElement.options[buildingSubtypeSelectElement.selectedIndex];
        const buildingSubtypeId = selectedBuildingSubtypeOption.value;
        const buildingSubtypeName = selectedBuildingSubtypeOption.getAttribute('data-name');
        const buildingSubtypeBldgtypeID = selectedBuildingSubtypeOption.getAttribute('data-bldgtypeID');

        // Append building_subtype details to FormData
        formData.append('building_subtype_id', buildingSubtypeId || '');
        formData.append('building_subtype_name', buildingSubtypeName || '');
        formData.append('building_subtype_bldgtypeID', buildingSubtypeBldgtypeID || '');

        // Log the entire form data for verification
        const formEntries = {};
        formData.forEach((value, key) => {
          formEntries[key] = value;
        });
        console.log('Form Data:', formEntries);

        try {
          // Submit form data via a POST request to the Google Apps Script endpoint
          const response = await fetch(
            'http://127.0.0.1:5000/submit',
            {
              method: 'POST',
              mode: 'cors', // Enable CORS for cross-origin requests
              credentials: 'omit', // No cookies/credentials
              body: formData, // Pass FormData object
            }
          );

          // Check if the response is successful
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const result = await response.json();

          // Handle the success case
          if (result.status === 'success') {
            alert('Form submitted successfully!');
            this.reset(); // Reset the form fields
            document.querySelectorAll('.feedback').forEach((el) => {
              el.textContent = '';
              el.className = 'feedback';
            });
            document.querySelectorAll('.invalid-input').forEach((el) =>
              el.classList.remove('invalid-input')
            );
            initializeForm(); // Reset form state
            console.log('Form submitted and reset successfully.');
          } else {
            // Handle any errors returned from the server
            throw new Error(result.message || 'Unknown error occurred');
          }
        } catch (error) {
          // Log and show an error message to the user
          console.error('Error:', error);
          alert(`An error occurred: ${error.message}. Please try again later.`);
        }
      });
    } else {
      console.error('Form element not found.');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeForm);
