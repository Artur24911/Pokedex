const placeholderImage = "./assets/icons/placeholder.png";

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function getImage(pokemon) {
    const artwork = pokemon.sprites.other["official-artwork"].front_default;
    return artwork || pokemon.sprites.front_default || placeholderImage;
}

function getMainType(pokemon) {
    return pokemon.types[0].type.name;
}

function getTypesTemplate(pokemon) {
    return pokemon.types
        .map((entry) => `<span class="type-tag">${capitalize(entry.type.name)}</span>`)
        .join("");
}

function getCardTemplate(pokemon, index) {
    return `
        <li>
            <button class="card type-${getMainType(pokemon)}" data-id="card class"
                aria-label="Show details of ${capitalize(pokemon.name)}"
                onclick="openDialog(${index})">
                <h2 class="card-name">${capitalize(escapeHtml(pokemon.name))}</h2>
                <div class="card-body">
                <span class="card-types">${getTypesTemplate(pokemon)}</span>
                <img data-id="card-image" src="${getImage(pokemon)}" alt="${escapeHtml(pokemon.name)}">
                </div>
            </button>
        </li>
    `;
}

function getDialogTemplate(pokemon) {
    return `
        <div class="dialog-card type-${getMainType(pokemon)}" data-id="overlay-pokemon-name">
            <button class="dialog-close" data-id="close-dialog-button"
                aria-label="Close dialog" onclick="closeDialog()">✕</button>
            <h2>${capitalize(escapeHtml(pokemon.name))} <small>#${pokemon.id}</small></h2>
            <div class="card-types">${getTypesTemplate(pokemon)}</div>
            <img data-id="dialog-image" src="${getImage(pokemon)}" alt="${escapeHtml(pokemon.name)}">
            <div class="dialog-body">
                <p>${getAboutText(pokemon)}</p>
                <div class="stats">${getStatsTemplate(pokemon)}</div>
                <div data-id="evolution">${getEvolutionTemplate(null)}</div>
            </div>
            ${getDialogNavTemplate()}
        </div>
    `;
}

function getAboutText(pokemon) {
    const abilities = pokemon.abilities.map((a) => capitalize(a.ability.name)).join(", ");
    return `${pokemon.height / 10} m · ${pokemon.weight / 10} kg · ${abilities}`;
}

function getStatsTemplate(pokemon) {
    return pokemon.stats.map(getStatTemplate).join("");
}

function getStatTemplate(entry) {
    const label = capitalize(entry.stat.name.replace("special-", "sp. ").replace("-", " "));
    const width = Math.min(entry.base_stat, 150) / 1.5;
    return `
        <div class="stat">
            <span>${label}</span><span>${entry.base_stat}</span>
            <div class="bar"><div style="width: ${width}%"></div></div>
        </div>
    `;
}

function getEvolutionTemplate(names) {
    if (names === null) return "<p>Loading evolution…</p>";
    if (names.length < 2) return "<p>This Pokemon does not evolve.</p>";
    return `<p>Evolution: ${names.map(capitalize).join(" → ")}</p>`;
}

function getDialogNavTemplate() {
    return `
        <div class="dialog-nav">
            <button data-id="prev-button" aria-label="Previous Pokemon"
                onclick="showPrevious()">←</button>
            <button data-id="next-button" aria-label="Next Pokemon"
                onclick="showNext()">→</button>
        </div>
    `;
}

function getMessageTemplate(dataId, text) {
    return `<p class="message" data-id="${dataId}">${escapeHtml(text)}</p>`;
}