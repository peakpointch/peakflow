let isHidden = false; // Track visibility state

document.addEventListener("keydown", function (event) {
  // Check if Ctrl key is pressed and 'M' key is pressed
  if (event.ctrlKey && event.key === "y") {
    // Select all elements with the data-automation-id attribute
    const elements = document.querySelectorAll(
      '[data-automation-id="designer-extension-floating-window"]',
    );

    // Toggle visibility based on current state
    elements.forEach(function (element) {
      element.style.display = isHidden ? "block" : "none";
    });

    // Flip the visibility state
    isHidden = !isHidden;
  }
});
