const POKEMON_URL = "https://pokeapi.co/api/v2/pokemon/";
const POKEMON_SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species/";

const POKEMON_COUNT = 898;
const MAX_SEARCH_ENTRIES = 10;

//const form = document.querySelector("#search-form");
const pokedex = document.querySelector("#pokedex");
const pokedexContainer = document.querySelector(".dex-container");
const pokedexContent = document.querySelector(".dex-content");
const loadingImg = document.querySelector(".loading");
const randPokemonButton = document.querySelector("#btn-random-pokemon");

const pokemon = {
    img: document.querySelector("#pokemon-sprite"),
    name: document.querySelector("#pokemon-name"),
    types: document.querySelector("#types"),
    flavor: document.querySelector("#pokemon-flavor"),
    reset() {
        this.img.src = "";
        this.name.innerText = "";
        this.flavor.innerText = "";
        while (this.types.lastChild) {
            this.types.lastChild.remove();
        }
    }
}

let opened = false;

// FX
let pokedexScanline = null;
let glitchSlices = [];
let glitchInterval;
let glitchTimeout;

async function fetchPokemon(query) {
    try {
        if (query === "") {
            return;
        }
        
        pokemon.reset();
        loadingImg.classList.add("loading-in");

        const data = await fetch(`${POKEMON_URL}${query}`).then(response => response.json());
        const dexData = await fetch(`${POKEMON_SPECIES_URL}${query}`).then(response => response.json());
        
        //const nationalDexNumber = dexData.pokedex_numbers.filter(filterByPokedex("national"))[0].entry_number;
        
        const englishName = dexData.names.filter(filterByLanguage("en"))[0].name;
        pokemon.name.innerText = englishName;
        pokemon.img.alt = englishName;
        
        for (let i = 0; i < data.types.length; i++) {
            const typeSpan = document.createElement("span");
            const typeName = data.types[i].type.name;
            typeSpan.innerText = typeName;
            typeSpan.classList.add("type", `type-${typeName}`)
            pokemon.types.append(typeSpan);
        }
        
        // Get more recent flavor?
        const englishFlavorText = dexData.flavor_text_entries.filter(filterByLanguage("en"))[0].flavor_text;
        pokemon.flavor.innerText = englishFlavorText.replace(/\s+/g, " ");

        pokemon.img.src = data.sprites.other["official-artwork"].front_default;
        if (pokemon.img.src) {
            await pokemon.img.decode();
        }
    } catch (e) {
        console.error(e);
    }
}

function filterByLanguage(languageName) {
    return ({ language }) => {
        return language.name === languageName;
    }
}

function filterByPokedex(pokedexName) {
    return ({ pokedex }) => {
        return pokedex.name === pokedexName;
    }
}

function randomPokemon() {
    return getRandomIntInclusive(1, POKEMON_COUNT);
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function createGlitchedScanline() {
    if (pokedexScanline) {
        pokedexScanline.remove();
    }

    pokedexScanline = pokedexContent.cloneNode(true);
    pokedexScanline.classList.add("glitched-scanline", "visible");

    pokedexContainer.append(pokedexScanline);
}

function createGlitch(element, slices) {
    removeGlitches();
    
    for (let i = 0; i < slices; i++) {
        const slice = element.cloneNode(true);

        const step = i * 100 / slices;
        slice.style.clipPath = `inset(${step}% 0 ${100 - (i + 1) * 100 / slices}% 0)`;

        const offset1 = 20;
        const offset2 = 50;
        slice.animate([
            { transform: `translate(${getRandomIntInclusive(-offset1, offset1)}px, ${getRandomIntInclusive(-offset1, offset1)}px)` },
            { transform: `translate(${getRandomIntInclusive(-offset2, offset2)}px, ${getRandomIntInclusive(-offset2, offset2)}px)` },
            { transform: `translate(${getRandomIntInclusive(-offset1, offset1)}px, ${getRandomIntInclusive(-offset1, offset1)}px)` },
            { transform: `translate(${getRandomIntInclusive(-offset2, offset2)}px, ${getRandomIntInclusive(-offset2, offset2)}px)` },
            {
                transform: `translate(${getRandomIntInclusive(-offset1, offset1)}px, ${getRandomIntInclusive(-offset1, offset1)}px)`,
                opacity: 0
            }
        ], {
            duration: 500,
            easing: "steps(10)",
            fill: "forwards"
        });

        slice.classList.add("glitch");

        element.insertAdjacentElement("afterend", slice);

        glitchSlices.push(slice);
    }

    element.classList.add("hidden");
    glitchTimeout = setTimeout(() => {
        element.classList.remove("hidden");
    }, 500);
}

function removeGlitches() {
    for (const slice of glitchSlices) {
        slice.remove();
    }
    glitchSlices = [];
}
    
function displayPokemon() {
    loadingImg.classList.remove("loading-in");
    pokedexContent.classList.remove("hidden");
    pokedexContent.classList.remove("dex-content-off");
    randPokemonButton.classList.remove("transparent");

    createGlitch(pokedexContent, 50);

    if (glitchInterval) {
        clearInterval(glitchInterval);
    }

    glitchInterval = setInterval(() => {
        createGlitch(pokedexContent, 50);
    }, 2000);

    createGlitchedScanline();
}

pokedex.addEventListener("click", async () => {
    pokedex.classList.toggle("opened");
    pokedexContainer.classList.toggle("dex-container-on");
    opened = !opened;
    
    if (opened) {
        await fetchPokemon(randomPokemon());
        if (opened) {
            displayPokemon();
        }
    }
    else {
        pokedexContent.classList.add("dex-content-off");
        randPokemonButton.classList.add("transparent");
        loadingImg.classList.remove("loading-in");
        clearTimeout(glitchTimeout);
        clearInterval(glitchInterval);
        removeGlitches();
        if (pokedexScanline) {
            pokedexScanline.remove();
        }
        pokedexContent.classList.add("hidden");
    }
});

randPokemonButton.addEventListener("click", async (evt) => {
    evt.stopPropagation();

    pokedexContent.classList.add("hidden");

     await fetchPokemon(randomPokemon());
    if (opened) {
        displayPokemon();
    }
});