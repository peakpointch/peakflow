import createAttribute from "../attributeselector";
const syncSelector = createAttribute("input-sync");
function constructInputMap(inputs) {
  const inputMap = /* @__PURE__ */ new Map();
  inputs.forEach((input) => {
    const value = input.getAttribute("input-sync");
    if (inputMap.has(value)) {
      inputMap.get(value).push(input);
    } else {
      inputMap.set(value, [input]);
    }
  });
  return inputMap;
}
function syncGroup(input, groupInputs) {
  groupInputs.filter((otherInput) => otherInput !== input).forEach((otherInput) => otherInput.value = input.value);
}
function inputSync(container = document.body) {
  if (!container) throw new Error(`Container cannot be undefined.`);
  const inputs = Array.from(container.querySelectorAll(syncSelector()));
  const inputMap = constructInputMap(inputs);
  const inputGroups = Array.from(inputMap.entries());
  inputGroups.forEach(([groupName, groupInputs]) => {
    if (groupInputs.length < 2) {
      console.warn(`Input group "${groupName}" has less than 2 inputs. Skipping group.`);
      return;
    }
    groupInputs.forEach((currentInput) => {
      currentInput.addEventListener("change", () => {
        syncGroup(currentInput, groupInputs);
      });
    });
  });
}
export {
  inputSync,
  syncSelector
};
