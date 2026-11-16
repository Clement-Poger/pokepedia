const form = document.getElementById("form");
const input = document.getElementById("pokemon-input");
const card = document.getElementById("pokemon-card");
const error = document.getElementById("error");
const content = document.getElementById("tab-content");
const title = document.getElementById("panel-title");
const prevButton = document.getElementById("prev-pokemon");
const nextButton = document.getElementById("next-pokemon");
const pokemonNumberEl = document.getElementById("pokemon-number");
const pokemonSprite = document.getElementById("pokemon-sprite");
const pokemonTypes = document.getElementById("pokemon-types");
const suggestions = document.getElementById("pokemon-suggestions");
const tabButtons = document.querySelectorAll(".tabs button");
const statLabels = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  "special-attack": "Sp.Atk",
  "special-defense": "Sp.Def",
  speed: "Speed",
  atk: "Atk",
  def: "Def",
  spe_atk: "Sp.Atk",
  spe_def: "Sp.Def",
  vit: "Vit"
};

let currentTab = "abilities";
let pokemon = null;
let pokemonIndexPromise = null;
let matchingPokemon = [];
let activeSuggestionIndex = -1;
let selectedPokemonId = null;
let suggestionUpdateId = 0;

const formatName = (name) => {
  if (typeof name !== "string") return "";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchValue = input.value.trim();
  if (!searchValue) return;
  hideSuggestions();
  await loadPokemon(selectedPokemonId || searchValue.toLowerCase());
});

input.addEventListener("input", () => {
  selectedPokemonId = null;
  activeSuggestionIndex = -1;
  updateSuggestions();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideSuggestions();
    return;
  }

  if (!matchingPokemon.length) return;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    suggestions.hidden = false;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    activeSuggestionIndex = activeSuggestionIndex < 0
      ? direction === 1 ? 0 : matchingPokemon.length - 1
      : (activeSuggestionIndex + direction + matchingPokemon.length) % matchingPokemon.length;
    renderSuggestions(matchingPokemon);
  } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
    event.preventDefault();
    selectPokemon(matchingPokemon[activeSuggestionIndex]);
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".pokemon-search")) {
    hideSuggestions();
  }
});

prevButton.addEventListener("click", () => navigatePokemon(-1));
nextButton.addEventListener("click", () => navigatePokemon(1));

async function updateSuggestions() {
  const updateId = ++suggestionUpdateId;
  const query = normalizeName(input.value.trim());
  if (!query) {
    matchingPokemon = [];
    hideSuggestions();
    return;
  }

  suggestions.hidden = false;
  input.setAttribute("aria-expanded", "true");
  suggestions.replaceChildren(createSuggestionMessage("Chargement de la liste…"));

  try {
    const pokemonList = await getPokemonIndex();
    if (updateId !== suggestionUpdateId) return;

    const currentQuery = normalizeName(input.value.trim());
    if (!currentQuery) {
      hideSuggestions();
      return;
    }

    matchingPokemon = pokemonList.filter((item) =>
      [item.name?.fr, item.name?.en]
        .filter(Boolean)
        .some((name) => normalizeName(name).includes(currentQuery))
    );
    activeSuggestionIndex = -1;
    renderSuggestions(matchingPokemon);
  } catch (err) {
    if (updateId !== suggestionUpdateId) return;

    matchingPokemon = [];
    suggestions.replaceChildren(
      createSuggestionMessage("Impossible de charger la liste des Pokémon.")
    );
    console.error("Erreur lors du chargement de la liste des Pokémon :", err);
  }
}

function getPokemonIndex() {
  if (!pokemonIndexPromise) {
    pokemonIndexPromise = fetch("https://tyradex.app/api/v1/pokemon")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Impossible de récupérer la liste des Pokémon.");
        }
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("La liste reçue depuis l’API est invalide.");
        }
        return data.filter((item) => item.pokedex_id > 0);
      })
      .catch((err) => {
        pokemonIndexPromise = null;
        throw err;
      });
  }
  return pokemonIndexPromise;
}

function renderSuggestions(items) {
  suggestions.replaceChildren();

  if (!items.length) {
    suggestions.append(createSuggestionMessage("Aucun Pokémon trouvé."));
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const option = document.createElement("li");
    const frenchName = item.name?.fr || item.name?.en;
    const englishName = item.name?.en;
    option.id = `pokemon-suggestion-${index}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === activeSuggestionIndex));
    option.textContent =
      englishName && frenchName !== englishName
        ? `${frenchName} — ${englishName}`
        : frenchName;
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => selectPokemon(item));
    fragment.append(option);
  });

  suggestions.append(fragment);
  input.setAttribute(
    "aria-activedescendant",
    activeSuggestionIndex >= 0 ? `pokemon-suggestion-${activeSuggestionIndex}` : ""
  );
}

function createSuggestionMessage(message) {
  const item = document.createElement("li");
  item.textContent = message;
  item.setAttribute("aria-disabled", "true");
  return item;
}

function selectPokemon(item) {
  input.value = item.name?.fr || item.name?.en || "";
  selectedPokemonId = item.pokedex_id;
  hideSuggestions();
  form.requestSubmit();
}

function hideSuggestions() {
  suggestionUpdateId++;
  suggestions.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  activeSuggestionIndex = -1;
}

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function loadPokemon(nameOrId) {
  error.style.display = "none";

  try {
    const response = await fetch(
      `https://tyradex.app/api/v1/pokemon/${encodeURIComponent(nameOrId)}`
    );

    if (!response.ok) {
      throw new Error("Pokémon non trouvé.");
    }

    pokemon = await response.json();
    showTab(currentTab);
    displayPokemon();
    updateNavigationButtons();
    card.style.display = "block";
  } catch (err) {
    pokemon = null;
    card.style.display = "none";
    error.textContent = err.message || "Une erreur est survenue.";
    error.style.display = "block";
  }
}

function navigatePokemon(direction) {
  if (!pokemon) return;

  const nextId = pokemon.pokedex_id + direction;
  if (nextId < 1 || nextId > 1025) return;

  loadPokemon(nextId);
}

function updateNavigationButtons() {
  prevButton.disabled = !pokemon || pokemon.pokedex_id <= 1;
  nextButton.disabled = !pokemon || pokemon.pokedex_id >= 1025;
}

function displayPokemon() {
  selectedPokemonId = null;
  pokemonNumberEl.textContent = String(pokemon.pokedex_id).padStart(4, "0");
  input.value = formatName(pokemon.name.fr);
  pokemonSprite.src = pokemon.sprites?.regular;
  pokemonSprite.alt = `Image de ${pokemon.name.fr}`;

  pokemonTypes.innerHTML = (pokemon.types || [])
    .map((item) => {
      const typeName = item?.name || "normal";
      return `<span class="type"><img src="${item?.image}" title="${formatName(typeName)}" class="ability-icon" loading="lazy"></span>`;
    })
    .join("");
}

function showTab(tabName) {
  if (!pokemon) return;

  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  if (tabName === "abilities") {
    currentTab = tabName;
    title.textContent = "Capacités";

    const abilities = [...(pokemon.talents || [])].sort((a, b) => (a?.slot || 0) - (b?.slot || 0));
    content.innerHTML = abilities
      .map((item) => {
        const abilityName = formatName(item?.name);
        return `
          <div class="ability-card">
            <div class="ability-text">
              <strong>${abilityName}</strong>
            </div>
          </div>
        `;
      })
      .join("");
  }

  if (tabName === "basic") {
    currentTab = tabName;
    title.textContent = "Informations";

    const evolution = pokemon?.evolution || {};
    const nextEvolution = Array.isArray(evolution.next) ? evolution.next : [];
    const firstEvolution = nextEvolution[0] || null;
    const evolNames = firstEvolution?.name ? [firstEvolution.name] : [];
    const evolConditions = firstEvolution?.condition ? [firstEvolution.condition] : [];
    const firstEvol = evolNames[0] || "Aucune évolution";
    const firstCond = evolConditions[0] || "";

    content.innerHTML = `
      <div class="info-grid">
        <div class="info-card">
          <div class="info-text">
            <span class="info-label">Taille</span>
            <strong>${pokemon.height}</strong>
          </div>
        </div>
        <div class="info-card">
          <div class="info-text">
            <span class="info-label">Poids</span>
            <strong>${pokemon.weight}</strong>
          </div>
        </div>
        <div class="info-card">
          <div class="info-text">
            <span class="info-label">${firstCond}</span>
            <strong>${firstEvol}</strong>
          </div>
        </div>
      </div>
    `;
  }

  if (tabName === "stats") {
    currentTab = tabName;
    title.textContent = "Base Stats";

    const statsObj = pokemon.stats || {};
    const statsArray = Array.isArray(statsObj)
      ? statsObj
      : Object.entries(statsObj).map(([key, value]) => ({ name: key, value }));

    content.innerHTML = statsArray
      .map((item) => {
        const statName = item?.name;
        const statValue = Number(item?.value ?? item?.base_stat ?? item ?? 0);
        const label = formatStat(statName);
        const width = Math.min((statValue / 155) * 100, 100);

        return `
          <div class="stat">
            <span>${label}</span>
            <span>${statValue}</span>
            <span class="stat-bar" style="width:${width}%"></span>
          </div>
        `;
      })
      .join("");
  }
}

function formatStat(stat) {
  return statLabels[stat] || stat;
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});

form.dispatchEvent(new Event("submit"));
