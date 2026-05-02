const dropoffs = [...document.querySelectorAll("#dropoffContainer select")]
  .map((s) => s.value)
  .filter(Boolean);

console.log(dropoffs); // e.g. ["B","J","Q"]