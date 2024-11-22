console.log("MCQ script is running");

let currentQuestionIndex = 0; // Track the currently displayed question
let mcqData = null; // Store the entire MCQ data globally
let selectedTitleData = null; // Store questions for the selected title
let selectedOptions = {}; // Record selected options for all questions

// Load titles and MCQs from JSON file
async function loadTitles() {
  try {
    const response = await fetch("/data/mcqs.json");
    const data = await response.json();

    mcqData = data.titles; // Extract the 'titles' array from the JSON
    console.log("Loaded mcqData:", mcqData); // Debug log for mcqData

    renderTitleSelection(mcqData);

    document.getElementById("mcq-container").style.display = "none";
    document.getElementById("nav-container").style.display = "none";
  } catch (error) {
    console.error("Error loading MCQ titles:", error);
    document.getElementById("mcq-container").innerHTML =
      "<p>Failed to load MCQ titles. Please try again later.</p>";
  }
}


// Render the dropdown menu for title selection
function renderTitleSelection(titles) {
  const titleSelect = document.getElementById("title-select");

  // Populate titles in dropdown
  titles.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index; // Use index to reference data
    option.innerText = item.title;
    titleSelect.appendChild(option);
  });
}

// Handle title selection from the dropdown
function handleTitleSelection() {
  const titleSelect = document.getElementById("title-select");
  const selectedIndex = titleSelect.value;

  // Store selected title's questions and reset question index
  selectedTitleData = mcqData[selectedIndex];
  currentQuestionIndex = 0;
  selectedOptions = {}; // Reset selected options for the new title

  // Show the MCQ container and render the first question
  document.getElementById("mcq-container").style.display = "block";
  document.getElementById("nav-container").style.display = "flex";
  renderMCQ(currentQuestionIndex);
  renderNavigation(selectedTitleData.questions);
}

// Render a single question based on the index
function renderMCQ(index) {
  const mcqContainer = document.getElementById("mcq-container");
  const mcq = selectedTitleData.questions[index];

  // Generate options with labels (A, B, C, D)
  const optionsHTML = mcq.options
    .map((option) => {
      const isSelected = selectedOptions[index] === option.label ? "selected" : "";
      return `
        <label class="mcq-option">
          <span class="circle ${isSelected}" onclick="selectOption(${index}, '${option.label}')">${option.label}</span>
          <span class="option-text">${option.text}</span>
          <input type="radio" name="mcq-${index}" value="${option.label}" class="hidden-radio" ${
        isSelected ? "checked" : ""
      } />
        </label>`;
    })
    .join("");

  // Populate the question and options
  mcqContainer.innerHTML = `
    <h3>${mcq.question}</h3>
    <div class="mcq-options">
      ${optionsHTML}
    </div>
    <div class="controls">
      <button class="submit-btn" onclick="submitAnswer(${index}, '${mcq.correct_option}')">Submit</button>
    </div>
  `;

  // Highlight the active navigation button
  highlightActiveNavigation(index);
}

// Handle option selection
function selectOption(questionIndex, selectedLabel) {
  // Record the selected option
  selectedOptions[questionIndex] = selectedLabel;

  // Remove 'selected' class from all options in the current question
  document
    .querySelectorAll(`input[name="mcq-${questionIndex}"]`)
    .forEach((input) => {
      const parentLabel = input.closest(".mcq-option");
      const circleElement = parentLabel.querySelector(".circle");
      circleElement.classList.remove("selected");
    });

  // Add 'selected' class to the clicked option
  const selectedOption = document.querySelector(
    `input[name="mcq-${questionIndex}"][value="${selectedLabel}"]`
  );
  if (selectedOption) {
    const parentLabel = selectedOption.closest(".mcq-option");
    const circleElement = parentLabel.querySelector(".circle");
    circleElement.classList.add("selected");
  }

  // Check the radio input for the selected option
  selectedOption.checked = true;
}

// Submit the selected answer and validate it
function submitAnswer(questionIndex, correctOption) {
  const selectedOption = document.querySelector(
    `input[name="mcq-${questionIndex}"]:checked`
  );

  if (!selectedOption) {
    alert("Please select an option before submitting.");
    return;
  }

  const selectedLabel = selectedOption.value;

  if (selectedLabel === correctOption) {
    // Correct Answer: Show "Correct!" popup
    showPopup(
      "Correct!",
      `${selectedTitleData.questions.length - questionIndex - 1} More Questions`,
      "Next Question »",
      () => nextQuestion()
    );
  } else {
    // Incorrect Answer: Show "That wasn’t it!" popup with retry button
    showPopup(
      "That wasn’t it!",
      "",
      "Try Again",
      () => renderMCQ(questionIndex),
      true // Show hint button for incorrect answers
    );
  }
}

// Function to show a popup message
function showPopup(title, subtitle, buttonText, onClick, showHint = false) {
  const popupContainer = document.createElement("div");
  popupContainer.className = "popup-container";

  const popupHTML = `
    <div class="popup">
      <h2>${title}</h2>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
      <div class="popup-buttons">
        <button class="popup-button" id="popup-action">${buttonText}</button>
        ${
          showHint
            ? `<button class="popup-button hint-button">Video hint</button>`
            : ""
        }
      </div>
    </div>
  `;

  popupContainer.innerHTML = popupHTML;
  document.body.appendChild(popupContainer);

  // Add event listeners for buttons
  document
    .getElementById("popup-action")
    .addEventListener("click", () => {
      onClick();
      document.body.removeChild(popupContainer); // Close popup
    });

  if (showHint) {
    document.querySelector(".hint-button").addEventListener("click", () => {
      alert("Hint: Review the video section.");
    });
  }
}

// Move to the next question
function nextQuestion() {
  if (currentQuestionIndex < selectedTitleData.questions.length - 1) {
    currentQuestionIndex++;
    renderMCQ(currentQuestionIndex);
  } else {
    alert("You have reached the end of the questions!");
  }
}

// Render navigation buttons
function renderNavigation(questions) {
  const navContainer = document.getElementById("nav-container");
  navContainer.innerHTML = ""; // Clear navigation before rendering

  questions.forEach((question, index) => {
    const navButton = document.createElement("button");
    navButton.innerText = index + 1;
    navButton.className = `nav-btn ${
      selectedOptions[index] ? "reviewed" : ""
    }`;
    navButton.onclick = () => {
      currentQuestionIndex = index;
      renderMCQ(index);
    };

    navContainer.appendChild(navButton);
  });
}

// Highlight the active navigation button
function highlightActiveNavigation(index) {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function updateVideo(url) {
  console.log("Updating video with URL:", url);
  const videoContainer = document.getElementById("video-container");
  const videoFrame = document.getElementById("video-frame");

  if (url) {
    videoFrame.src = url.replace("watch?v=", "embed/");
    videoContainer.style.display = "block";
  } else {
    videoFrame.src = "";
    videoContainer.style.display = "none";
  }
}

function handleTitleSelection() {
  const titleSelect = document.getElementById("title-select");
  const selectedIndex = titleSelect.value;

  console.log("Selected Index:", selectedIndex); // Debug log for selectedIndex

  if (!selectedIndex) return;

  selectedTitleData = mcqData[selectedIndex];
  console.log("Selected Title Data:", selectedTitleData); // Debug log for selectedTitleData

  currentQuestionIndex = 0;

  // Update the video
  if (selectedTitleData.url) {
    console.log("Video URL:", selectedTitleData.url); // Debug log for URL
    updateVideo(selectedTitleData.url);
  } else {
    console.error("No URL found for the selected title.");
  }

  document.getElementById("mcq-container").style.display = "block";
  document.getElementById("nav-container").style.display = "flex";
  renderMCQ(currentQuestionIndex);
  renderNavigation(selectedTitleData.questions);
}

// Function to handle the "Generate" button click
function generateMCQs() {
  const titleSelect = document.getElementById("title-select");
  const selectedIndex = titleSelect.value;

  // Check if a title is selected
  if (!selectedIndex) {
    alert("Please select a title first.");
    return;
  }

  // Store selected title's questions and reset question index
  selectedTitleData = mcqData[selectedIndex];
  currentQuestionIndex = 0;

  // Update video based on the selected title
  updateVideo(selectedTitleData.url);

  // Show the MCQ container and render the first question
  document.getElementById("mcq-container").style.display = "block";
  document.getElementById("nav-container").style.display = "flex";
  renderMCQ(currentQuestionIndex);
  renderNavigation(selectedTitleData.questions);
}
  

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadTitles();
});
