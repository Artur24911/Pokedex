const apiUrl = "https://pokeapi.co/api/v2";
const batchSize = 20;
const pokemonCache = {};
const evolutionCache = {};
let allPokemon = [];
let currentList = [];
let renderedCount = 0;
let currentIndex = 0;
let isLoading = false;

function getElement(dataId) {
    return document.querySelector(`[data-id="${dataId}"]`);
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    return response.json();
}

function init() {
    setupDialog();
    withLoading(async () => {
        await loadPokemonList();
        await showPokemon(allPokemon);
        await waitForImages(0);
    });
}

async function withLoading(task) {
    setLoading(true);
    try {
        await task();
    } catch (error) {
        showMessage("error-message", "Something went wrong. Please try again.");
    } finally {
        setLoading(false);
    }
}

async function loadPokemonList() {
    if (allPokemon.length > 0) return;
    const data = await fetchJson(`${apiUrl}/pokemon?limit=1025`);
    allPokemon = data.results;
}

async function loadPokemon(entry) {
    if (!pokemonCache[entry.name]) {
        pokemonCache[entry.name] = await fetchJson(entry.url);
    }
    return pokemonCache[entry.name];
}

async function showPokemon(list) {
    currentList = list;
    renderedCount = 0;
    getElement("pokemon-list").innerHTML = "";
    removeMessage();
    await renderNextBatch();
}

async function renderNextBatch() {
    const listElement = getElement("pokemon-list");
    const batch = currentList.slice(renderedCount, renderedCount + batchSize);
    const details = await Promise.all(batch.map(loadPokemon));
    details.forEach((pokemon, i) => {
        const html = getCardTemplate(pokemon, renderedCount + i);
        listElement.insertAdjacentHTML("beforeend", html);
    });
    renderedCount += batch.length;
    updateLoadMoreButton();
}

function loadMore() {
    const startIndex = renderedCount;
    withLoading(async () => {
        await renderNextBatch();
        await waitForImages(startIndex);
    });
}

function waitForImages(startIndex) {
    const images = [...document.querySelectorAll('[data-id="card-image"]')].slice(startIndex);
    const loaded = images.map((img) => new Promise((done) => {
        if (img.complete) done();
        img.onload = img.onerror = done;
    }));
    const timeout = new Promise((done) => setTimeout(done, 5000));
    return Promise.race([Promise.all(loaded), timeout]);
}

function setLoading(isOn) {
    isLoading = isOn;
    getElement("loading").hidden = !isOn;
    getElement("load-more-button").disabled = isOn;
    updateSearchButton();
}

function updateLoadMoreButton() {
    getElement("load-more-button").hidden = renderedCount >= currentList.length;
}

function showMessage(dataId, text) {
    removeMessage();
    getElement("content").insertAdjacentHTML("beforeend", getMessageTemplate(dataId, text));
}

function removeMessage() {
    const selector = '[data-id="not-found"], [data-id="error-message"]';
    document.querySelectorAll(selector).forEach((element) => element.remove());
}

function updateSearchButton() {
    const text = getElement("search-input").value.trim();
    getElement("search-button").disabled = isLoading || text.length < 3;
}

function onSearchInput() {
    updateSearchButton();
    const isEmpty = getElement("search-input").value.trim() === "";
    if (isEmpty && !isLoading) withLoading(() => showPokemon(allPokemon));
}

function onSearchKey(event) {
    const button = getElement("search-button");
    if (event.key === "Enter" && !button.disabled) searchPokemon();
}

function searchPokemon() {
    const text = getElement("search-input").value.trim().toLowerCase();
    const results = allPokemon.filter((entry) => entry.name.includes(text));
    if (results.length === 0) return showNotFound();
    withLoading(() => showPokemon(results));
}

function showNotFound() {
    getElement("pokemon-list").innerHTML = "";
    currentList = [];
    renderedCount = 0;
    updateLoadMoreButton();
    showMessage("not-found", "No match found.");
}

function setupDialog() {
    const dialog = getElement("dialog");
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => document.body.classList.remove("no-scroll"));
}

async function openDialog(index) {
    currentIndex = index;
    await renderDialog();
    const dialog = getElement("dialog");
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("no-scroll");
}

async function renderDialog() {
    const pokemon = await loadPokemon(currentList[currentIndex]);
    getElement("dialog").innerHTML = getDialogTemplate(pokemon);
    showEvolution(pokemon);
}

async function showEvolution(pokemon) {
    let names = [];
    try {
        names = await loadEvolution(pokemon);
    } catch (error) {
        names = [];
    }
    const box = getElement("evolution");
    const isStillOpen = currentList[currentIndex].name === pokemon.name;
    if (box && isStillOpen) box.innerHTML = getEvolutionTemplate(names);
}

async function loadEvolution(pokemon) {
    if (!evolutionCache[pokemon.name]) {
        const species = await fetchJson(pokemon.species.url);
        const chain = await fetchJson(species.evolution_chain.url);
        evolutionCache[pokemon.name] = flattenChain(chain.chain);
    }
    return evolutionCache[pokemon.name];
}

function flattenChain(node) {
    return [node.species.name, ...node.evolves_to.flatMap(flattenChain)];
}

function closeDialog() {
    getElement("dialog").close();
}

function showNext() {
    currentIndex = (currentIndex + 1) % currentList.length;
    renderDialog();
}

function showPrevious() {
    currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    renderDialog();
}