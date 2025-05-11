import createAttribute from "./attributeselector"

/**
 * Returns the *"input-sync"* attribute as a CSSSelector.
 */
export const syncSelector = createAttribute('input-sync');

/**
 * Groups the inputs to be synced by their sync names 
 * into a `Map`.
 */
function constructInputMap(inputs: HTMLInputElement[]): Map<string, HTMLInputElement[]> {
  const inputMap = new Map<string, HTMLInputElement[]>();

  inputs.forEach((input) => {
    const value = input.getAttribute('input-sync');

    if (inputMap.has(value)) {
      inputMap.get(value).push(input);
    } else {
      inputMap.set(value, [input]);
    }
  });

  return inputMap;
}

/**
 * Sync the current input value with the other inputs in 
 * the group.
 */
function syncGroup(input: HTMLInputElement, groupInputs: HTMLInputElement[]): void {
  // Sync the value of the current input with all the other inputs
  groupInputs
    .filter(otherInput => otherInput !== input)
    .forEach((otherInput) => otherInput.value = input.value);
}

/**
 * Sync all the inputs that belong to the same group.
 *
 * A group is defined by the `input-sync` attribute.
 *
 * All Inputs which belong to a group will have the same 
 * group name as the `input-sync` attribute value.
 */
export function inputSync(container: HTMLElement = document.body): void {
  if (!container) throw new Error(`Container cannot be undefined.`);

  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>(syncSelector()));

  const inputMap = constructInputMap(inputs);

  const inputGroups = Array.from(inputMap.entries());
  inputGroups.forEach(([groupName, groupInputs]) => {
    if (groupInputs.length < 2) {
      console.warn(`Input group "${groupName}" has less than 2 inputs. Skipping group.`);
      return;
    }

    groupInputs.forEach((currentInput) => {
      currentInput.addEventListener('change', () => {
        syncGroup(currentInput, groupInputs);
      });
    });
  });
}

