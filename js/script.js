import { POINTS } from "./points.js";
import { computeEfficientRoute } from "./route.js";

const dropoffCountEl = document.querySelector("#dropoffCount");
const dropoffContainer = document.querySelector("#dropoffContainer");

function createSelect(i) {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const label = document.createElement("label");
  label.htmlFor = `dropoff-${i}`;
  label.textContent = `Drop-off point ${i}:`;

  const select = document.createElement("select");
  select.id = `dropoff-${i}`;
  select.name = `dropoff-${i}`;
  select.dataset.index = String(i);

  wrapper.append(label, select);
  return { wrapper, select };
}

function getDropoffSelects() {
  return [...dropoffContainer.querySelectorAll("select")];
}

function getSelectedValues() {
  return getDropoffSelects()
    .map((s) => s.value)
    .filter((v) => v); // remove ""
}

function renderOptionsForSelect(select, selectedSet) {
  const current = select.value;

  // Build options: allow the select's current value even if it's in selectedSet
  const opts = [
    { value: "", label: "— Select a drop-off —" },
    ...POINTS,
  ];

  select.innerHTML = ""; // reset
  for (const o of opts) {
    const option = document.createElement("option");
    option.value = o.value;
    option.textContent = o.label;

    const takenByOthers = selectedSet.has(o.value) && o.value !== current;
    option.disabled = takenByOthers;

    select.append(option);
  }

  // restore selection if possible
  select.value = current;
}

function refreshAllOptions() {
  const selected = new Set(getSelectedValues());
  for (const s of getDropoffSelects()) {
    renderOptionsForSelect(s, selected);
  }
}

function renderDropoffs(count) {
  // preserve existing selections (best effort)
  const oldValues = getDropoffSelects().map((s) => s.value);

  dropoffContainer.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const { wrapper, select } = createSelect(i);

    // set previous value if it existed
    select.value = oldValues[i - 1] ?? "";

    select.addEventListener("change", refreshAllOptions);

    dropoffContainer.append(wrapper);
  }

  refreshAllOptions();
}

// init
renderDropoffs(Number(dropoffCountEl.value) || 1);

dropoffCountEl.addEventListener("change", (e) => {
  renderDropoffs(Number(e.target.value) || 1);
});

const computeBtn = document.querySelector("#computeBtn");
const terminalEl = document.querySelector("#terminal");
const outputEl = document.querySelector("#output");

function getDropoffsFromUI() {
  return [...document.querySelectorAll("#dropoffContainer select")]
    .map((s) => s.value)
    .filter(Boolean);
}

computeBtn.addEventListener("click", () => {
  const start = terminalEl.value;
  const dropOffs = getDropoffsFromUI();

  if (dropOffs.length === 0) {
    outputEl.textContent = "Please choose at least one drop-off point.";
    return;
  }

  const result = computeEfficientRoute(start, dropOffs);

  const legsText = result.legs
    .map((leg, idx) => {
      const routeText = leg.path.length ? leg.path.join(" → ") : "(no path)";
      return `Leg ${idx + 1}: ${leg.from} → ${leg.to}\n` +
             `  Path: ${routeText}\n` +
             `  Distance: ${leg.distance.toFixed(5)} km\n`;
    })
    .join("\n");

  outputEl.textContent =
    `Starting Terminal: ${result.start}\n` +
    `Ending Terminal:   ${result.end}\n\n` +
    `Efficient Route (stops): ${result.finalRoute.join(" → ")}\n` +
    `Total Distance:         ${result.totalDistance.toFixed(5)} km\n` +
    `Operating Cost:         Php ${result.cost.toFixed(2)}\n\n` +
    `Shortest path per leg:\n` +
    `${legsText}`;
});