import {
    fetchPokemonForGeneration,
    fetchPokemon,
} from "#api";

import loadPokemonData from "./pokemon-modal";
import {
    replaceImage,
    cleanString,
    delegateEventHandler,
    isElementInViewport,
    typesAnimatedBorderColor,
    onTransitionsEnded,
    NB_NUMBER_INTEGERS_PKMN_ID,
    HTTP_NOT_FOUND_CODE_ERROR,
    POPOVER_ERRORS,
} from "./utils";
import { generationScrollingObserver, pokedexItemScrollingObserver, firstVisiblePkmn } from "./scroll-observer";

import ripple from '#src/worklets/ripple.js?url';
import loadingImageRaw from "/images/loading.svg?raw";

import "#src/window-events.js";

import "#src/styles/main.css";

if ('paintWorklet' in CSS) {
    CSS.paintWorklet.addModule(ripple);
}

const pkmnTemplateRaw = document.querySelector("[data-tpl-id='pokemon']");
const pkdexTemplateRaw = document.querySelector("[data-tpl-id='pokedex']");
const generationShortcutTemplateRaw = document.querySelector("[data-tpl-id='generation-shortcut-link']");
const marqueeTypeTextTemplateRaw = document.querySelector("[data-tpl-id='marquee-type-text']");
const marqueeTypeContainerTemplateRaw = document.querySelector("[data-tpl-id='marquee-type-container']");
const pkmnTypeBubbleTemplateRaw = document.querySelector("[data-tpl-id='pokemon-type-bubble']");

const pokedexContainer = document.querySelector("[data-list-pokedex]");

const errorPopover = document.querySelector("[data-error-popover]");
const errorMessageContainer = errorPopover.querySelector("[data-error-message]");

const modal = document.querySelector("[data-pokemon-modal]");
const generationShortcut = document.querySelector("[data-generation-shortcut]");

let isGridLayout = localStorage.getItem("is_grid_layout") ? JSON.parse(localStorage.getItem("is_grid_layout")) === true : true;
const initialPageTitle = document.title;

modal.dataset.isGridLayout = isGridLayout;

export const listPokemon = [];



export const setTitleTagForGeneration = () => {
    const allStickedHeaders = Array.from(document.querySelectorAll(".is-pinned"));
    let allStickedVisibleHeaders = allStickedHeaders.filter((item) => isElementInViewport(item));
    const currentHeader = (allStickedVisibleHeaders.at(-1) || document.querySelector("[data-header-pokedex]"));

    const currentHeaderIndex = allStickedVisibleHeaders.findIndex((item) => item === currentHeader);
    const indicatorId = `pokedex-${currentHeaderIndex === -1 ? 1 : currentHeaderIndex + 1}`

    const currentGenerationName = currentHeader.querySelector("h2").textContent.trim();
    document.title = `${currentGenerationName} - ${initialPageTitle}`;
    setScrollIndicator(indicatorId)
}

const setScrollIndicator = (indicatorId) => {
    generationShortcut.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("font-bold", item.dataset.id.includes(indicatorId))
    })
}

export let hasReachPokedexEnd = false;

const updateSwitchIcons = (_isGridLayout) => {
    Array.from(document.querySelectorAll("[data-layout-switch]")).forEach((item) => {
        item.checked = _isGridLayout;
    });

    Array.from(document.querySelectorAll("[data-icon='list']")).forEach((item) => {
        item.classList.toggle("opacity-20", _isGridLayout);
    });

    Array.from(document.querySelectorAll("[data-icon='grid']")).forEach((item) => {
        item.classList.toggle("opacity-20", !_isGridLayout);
    });
}

const updatePokedexLayout = (_isGridLayout) => {
    Array.from(document.querySelectorAll("[data-pokedex]")).forEach((item) => {
        item.classList.toggle("grid-cols-3", _isGridLayout);
        item.classList.toggle("md:grid-cols-5", _isGridLayout);
        item.classList.toggle("lg:grid-cols-6", _isGridLayout);
        item.classList.toggle("grid-cols-1", !_isGridLayout);
    });
    
    Array.from(document.querySelectorAll("[data-pokemon-type-container]")).forEach((typeContainer) => {
        typeContainer.classList.toggle("justify-end", !_isGridLayout);
        typeContainer.classList.toggle("ml-auto", !_isGridLayout);
    });
}

updatePokedexLayout(isGridLayout);


export const rippleEffect = (e, color = "#fff") => {
    return new Promise((resolve) => {
        if ("paintWorklet" in CSS === false) {
            resolve();
        }
        const $el = e.currentTarget;
        $el.classList.add('animating');

        const rect = $el.getBoundingClientRect();

        const [x, y] = [parseInt(e.clientX - rect.left), parseInt(e.clientY - rect.top)];
        const start = performance.now();

        requestAnimationFrame(function raf(now) {
            const count = Math.floor(now - start);
            $el.style.cssText = `--ripple-x: ${x}; --ripple-y: ${y}; --animation-tick: ${count}; --ripple-color: ${color}`;

            if (count > 350) {
                $el.classList.remove('animating');
                $el.style.cssText = `--animation-tick: 0`;

                resolve();
                return;
            }
            requestAnimationFrame(raf);
        });
    })
}

const loadDetailsModal = async (e) => {
    e.preventDefault();

    const listPokedexEntries = document.querySelectorAll("[data-pokemon-data]")
    listPokedexEntries.forEach((item) => { item.inert = true; });

    const $el = e.currentTarget;

    const pkmnDataRaw = $el.dataset.pokemonData;
    const pkmnData = JSON.parse(pkmnDataRaw);

    let rippleColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(pkmnData.types[0].name)}`);
    const href = $el.href;

    $el.removeAttribute("href");
    if (Math.random() > 0.5 && pkmnData.types[1]) {
        rippleColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(pkmnData.types[1].name)}`);
    }
    await rippleEffect(e, rippleColor);
    $el.href = href;

    await loadPokemonData(pkmnData);

    modal.showModal();

    const url = new URL(location);
    url.searchParams.set("id", pkmnData.pokedex_id);
    history.pushState({}, "", url);

    listPokedexEntries.forEach((item) => { item.inert = false; });
}

const generateMarqueeTypes = (e) => {
    if (e.currentTarget.dataset.hasMarqueeTypes) {
        return;
    }
    e.currentTarget.dataset.hasMarqueeTypes = true;
    const nbMarqueeTextToGenerate = 7;
    const marqueeTypeContainer = e.currentTarget.querySelector("[data-marquee]");
    const pkmnData = JSON.parse(e.currentTarget.dataset.pokemonData);
    pkmnData.types.forEach((type, idx) => {
        const scrollTypeContainerTemplate = document.importNode(marqueeTypeContainerTemplateRaw.content, true);
        const scrollTypeContainer = scrollTypeContainerTemplate.querySelector("div");
        scrollTypeContainer.style.backgroundColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(type.name)}`);
        scrollTypeContainer.setAttribute("aria-label", `Type ${idx + 1} ${type.name}`);

        for (let index = 0; index <= nbMarqueeTextToGenerate; index++) {
            const typeText = document.importNode(marqueeTypeTextTemplateRaw.content, true);
            typeText.querySelector("p").textContent = type.name;
            if (idx === 1) {
                typeText.querySelector("p").style.animationDirection = "reverse";
            }
            scrollTypeContainer.append(typeText);
        }
        marqueeTypeContainer.append(scrollTypeContainer);
    })
}

const loadPokedexForGeneration = async (generation = 1, triggerElement) => {
    const listLoadGenerationBtns = document.querySelectorAll("[data-load-generation]");

    try {
        listLoadGenerationBtns.forEach((item) => item.inert = true);
        const pokedexData = await fetchPokemonForGeneration(generation);
        const cloneDex = document.importNode(pkdexTemplateRaw.content, true);

        const pokedex = cloneDex.querySelector("[data-pokedex]");

        const layoutSwitch = cloneDex.querySelector("[data-layout-switch]")
        layoutSwitch.checked = JSON.parse(localStorage.getItem("is_grid_layout") === true);

        const generationNumber = cloneDex.querySelector(
            "[data-generation-number]"
        );
        const generationRange = cloneDex.querySelector(
            "[data-generation-range]"
        );
        const headerPokedex = cloneDex.querySelector('[data-header-pokedex]');
        headerPokedex.dataset.headerPokedex = generation;
        headerPokedex.style.scrollMargin = `${headerPokedex.offsetHeight}px`;

        let nonRegionalPokedexData = pokedexData.filter((item) => {
            const name = item.name.fr;
            const listNames = (item.formes || []).map((form) => form.name.fr);

            return !listNames.includes(name);
        })

        generationNumber.textContent = `#${generation}`;
        const firstPkmnId = nonRegionalPokedexData[0].pokedex_id;

        generationRange.textContent = `${String(firstPkmnId).padStart(NB_NUMBER_INTEGERS_PKMN_ID, '0')} ➜ ${
            String(nonRegionalPokedexData.at(-1).pokedex_id).padStart(NB_NUMBER_INTEGERS_PKMN_ID, '0')
        }`;

        const fetchPriorityHighThreshold = 20;
        const url = new URL(window.location);

        nonRegionalPokedexData = nonRegionalPokedexData.map((item) => {
            const pkmnUpdated = {...item, ...(listPokemon.find((pkmn) => pkmn?.pokedex_id === item.pokedex_id) || {})}
            listPokemon[item.pokedex_id - 1] = pkmnUpdated;

            return pkmnUpdated;
        })
        pokedexContainer.append(cloneDex);

        nonRegionalPokedexData.forEach((item, index) => {
            url.searchParams.set("id", item.pokedex_id)

            if (firstPkmnId > item.pokedex_id) {
                return;
            }

            const clone = document.importNode(pkmnTemplateRaw.content, true);
            const imgTag = clone.querySelector("img");

            const encodedData = window.btoa(
                loadingImageRaw.replaceAll(
                    "#037ef3", 
                    window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(item.types[0].name)}`)
                )
            );
            imgTag.src = `data:image/svg+xml;base64,${encodedData}`;

            replaceImage(imgTag, item.sprites.regular);

            imgTag.alt = `sprite de ${item.name.fr}`;
            imgTag.fetchPriority =
                index <= fetchPriorityHighThreshold ? "high" : "low";

            const pkmnNameContainer = clone.querySelector("[data-pkmn-name]")
            pkmnNameContainer.textContent = `#${String(item.pokedex_id).padStart(NB_NUMBER_INTEGERS_PKMN_ID, '0')}\n${item.name.fr}`;

            const aTag = clone.querySelector("[data-pokemon-data]");
            aTag.href = url;
            aTag.style.scrollMargin = `${headerPokedex.offsetHeight}px`;
            aTag.dataset.pokemonData = JSON.stringify(item);
            aTag.dataset.pokemonId = item.pokedex_id;
            aTag.classList.add(
                typesAnimatedBorderColor[`${cleanString(item.types[0].name)}_${cleanString(item.types[1]?.name || item.types?.[0].name)}`]
            );

            const typesList = document.createElement('ul');
            typesList.classList.add('flex', 'gap-1', 'mt-1', 'types-list');
            typesList.setAttribute('data-types-list', '');

            item.types.forEach((type) => {
                const typeBubble = document.importNode(pkmnTypeBubbleTemplateRaw.content, true);
                const li = typeBubble.querySelector('li');
                const typeSpan = typeBubble.querySelector('span');
                const typeImg = typeBubble.querySelector('img');
                
                li.style.backgroundColor = `var(--type-${cleanString(type.name)})`;
                li.setAttribute('aria-label', `Type ${type.name}`);
                typeSpan.textContent = type.name;
                
                typeImg.alt = `icône type ${type.name}`;
                replaceImage(typeImg, type.image);
                
                typesList.appendChild(typeBubble);
            });

            aTag.appendChild(typesList);

            aTag.addEventListener("click", loadDetailsModal);
            aTag.addEventListener("mouseover", generateMarqueeTypes);
            aTag.addEventListener("focus", generateMarqueeTypes);
            if (index === 0) {
                aTag.id = `pokedex-${generation}`;
            }

            pokedex.append(clone);
            pokedexItemScrollingObserver.observe(aTag);
        });
        listLoadGenerationBtns.forEach((item) => item.dataset.loadGeneration = Number(generation) + 1);

        updateSwitchIcons(isGridLayout);
        updatePokedexLayout(isGridLayout);

        await onTransitionsEnded(layoutSwitch)
        layoutSwitch.nextElementSibling.classList.add("after:transition-all")

        generationScrollingObserver.observe(headerPokedex);

        const generationShortcutTemplate = document.importNode(generationShortcutTemplateRaw.content, true);
        const buttonGenerationShorcutTemplate = generationShortcutTemplate.querySelector("button");
        buttonGenerationShorcutTemplate.textContent = `#${generation}`;
        buttonGenerationShorcutTemplate.dataset.id = `pokedex-${generation}`;
        buttonGenerationShorcutTemplate.setAttribute("aria-label", `Accéder à la génération ${generation}`);
        buttonGenerationShorcutTemplate.addEventListener("click", () => {
            document.querySelector(`#pokedex-${generation}`).scrollIntoView();
        });
        generationShortcut.append(generationShortcutTemplate);
        generationShortcut.classList.replace("opacity-0", "opacity-100");
        generationShortcut.classList.replace("hidden", "flex");

        listLoadGenerationBtns.forEach((item) => item.inert = false);
        if (triggerElement) {
            triggerElement.parentNode.parentNode.removeChild(triggerElement.parentNode)
        }
        const pokedexLoadedEvent = new CustomEvent("pokedexLoaded", {
            detail: {
                pokedexId: generation,
            },
        });
        window.dispatchEvent(pokedexLoadedEvent);
    } catch (error) {
        if (error?.cause?.status === HTTP_NOT_FOUND_CODE_ERROR) {
            listLoadGenerationBtns.forEach((item) => item.inert = true);
            hasReachPokedexEnd = true;

            errorMessageContainer.textContent = "Impossible d'afficher cette génération, car elle n'existe pas.";
        } else {
            console.error(error);
            errorMessageContainer.textContent = "Une erreur est survenue.";
            listLoadGenerationBtns.forEach((item) => item.inert = false);
        }
        errorPopover.dataset.error = POPOVER_ERRORS.unknown;
        errorPopover.showPopover();
    }
};

const urlParams = new URLSearchParams(window.location.search);
const pkmnId = urlParams.get("id");

//easter egg ;)
export const observeURL = async () => {
    if (pkmnId !== null) {
        try {
            if (pkmnId === "kiryu" || pkmnId === "777") {
                const kiryuPokemon = {
                    pokedex_id: 777,
                    generation: 1,
                    category: "Pokémon Dragon de Dojima",
                    name: { fr: "Kiryu Kazuma", en: "Kiryu Kazuma", jp: "桐生 一馬" },
                    sprites: {
                        regular: "https://i.imgur.com/GuNPIVe.jpeg", 
                        shiny: "https://i.imgur.com/GuNPIVe.jpeg",   
                        gmax: null
                    },
                    types: [
                        {
                            name: "Combat",
                            image: "https://raw.githubusercontent.com/Yarkis01/TyraDex/images/types/combat.png",
                        },
                        {
                            name: "Dragon",
                            image: "https://raw.githubusercontent.com/Yarkis01/TyraDex/images/types/dragon.png",
                        }
                    ],
                    talents: [
                        { name: "Esprit du Dragon", tc: false },
                        { name: "Brawler", tc: false },
                        { name: "Cœur d'Or", tc: true },
                    ],
                    stats: { hp: 150, atk: 130, def: 120, spe_atk: 60, spe_def: 100, vit: 100 },
                    height: "1,8 m",
                    weight: "88,0 kg",
                    evolution: {
                        pre: null,
                        next: null,
                        mega: null
                    },
                    egg_groups: ["Dragon", "Humanoïde"],
                    sexe: { male: 100, female: 0 },
                    catch_rate: 3,
                    level_100: 1250000,
                    cry: "KIRYU-CHAN!",
                    resistances: [
                        { name: "Normal", multiplier: 1.0 },
                        { name: "Feu", multiplier: 0.5 },
                        { name: "Eau", multiplier: 1.0 },
                        { name: "Électrik", multiplier: 1.0 },
                        { name: "Plante", multiplier: 1.0 },
                        { name: "Glace", multiplier: 2.0 },
                        { name: "Combat", multiplier: 0.5 },
                        { name: "Poison", multiplier: 1.0 },
                        { name: "Sol", multiplier: 1.0 },
                        { name: "Vol", multiplier: 1.0 },
                        { name: "Psy", multiplier: 1.0 },
                        { name: "Insecte", multiplier: 1.0 },
                        { name: "Roche", multiplier: 1.0 },
                        { name: "Spectre", multiplier: 1.0 },
                        { name: "Dragon", multiplier: 0.5 },
                        { name: "Ténèbres", multiplier: 0.5 },
                        { name: "Acier", multiplier: 1.0 },
                        { name: "Fée", multiplier: 2.0 }
                    ],
                    descriptions: {
                        "rubis": "Un Pokémon légendaire originaire de Kamurocho. Sa force de volonté est comparable à celle d'un dragon.",
                        "saphir": "Il combat pour protéger ceux qu'il aime, et ne recule jamais face à l'adversité.",
                        "emeraude": "On l'appelle le Dragon de Dojima. Ses poings sont aussi puissants qu'un Impact Météore.",
                        "rouge-feu": "Sa technique de combat légendaire, le Tiger Drop, peut repousser n'importe quel adversaire.",
                        "vert-feuille": "Bien qu'il paraisse intimidant, il a un cœur d'or et ne refuse jamais d'aider ceux dans le besoin.",
                        "diamant": "Il erre dans les rues à la recherche d'adversaires dignes de lui. A déjà vaincu des organisations entières.",
                        "perle": "Son sens de la justice est inébranlable. Il préfère régler les conflits avec ses poings.",
                        "platine": "Son style de combat évolue au fil du temps. Il maîtrise les styles Dragon, Rush, Bête et Tigre.",
                        "or-heartgold": "Il maîtrise tous les arts martiaux et peut adopter différents styles de combat selon la situation.",
                        "argent-soulsilver": "La légende raconte qu'il aurait vaincu cent hommes lors d'un seul combat.",
                        "noir": "Ce Pokémon légendaire a passé 10 ans en prison pour un crime qu'il n'a pas commis, afin de protéger ses amis.",
                        "blanc": "Il peut sembler stoïque, mais il éprouve des émotions profondes et un grand sens de l'honneur.",
                        "noir-2": "Ses exploits à Kamurocho sont devenus légendaires. Peu osent le défier directement.",
                        "blanc-2": "On dit qu'il a vaincu des créatures mythiques et même des dragons à mains nues.",
                        "x": "Un Pokémon légendaire originaire de Kamurocho. Sa force de volonté est comparable à celle d'un dragon.",
                        "y": "Il combat pour protéger ceux qu'il aime, et ne recule jamais face à l'adversité.",
                        "rubis-omega": "Il a plus de 50 cicatrices, chacune témoignant d'une bataille légendaire.",
                        "saphir-alpha": "Son talent 'Cœur d'Or' lui permet de ressentir les émotions des autres Pokémon en détresse.",
                        "soleil": "Certains racontent qu'il aurait même battu un Pokémon Légendaire en duel singulier.",
                        "lune": "Il semble toujours apparaître quand une ville est en danger, puis disparaît une fois la paix revenue.",
                        "ultra-soleil": "Sa loyauté envers ses amis est sans égale, même parmi tous les Pokémon.",
                        "ultra-lune": "Malgré sa puissance, il préfère utiliser les mots avant les poings.",
                        "epee": "Ce Pokémon rare peut apprendre diverses techniques de combat. Il devient plus fort après chaque bataille.",
                        "bouclier": "On raconte qu'il peut vaincre 100 adversaires à lui seul. Il a un code d'honneur strict.",
                    },
                    habitat: "Urbain",
                    color: "Gris",
                    shape: "Humanoïde",
                    formes: null,
                    abilities: [
                        "Peut exécuter l'attaque Heat Action lorsque sa jauge de chaleur est pleine.",
                        "Devient plus fort lorsqu'il protège ses amis.",
                        "Peut changer de style de combat en plein affrontement."
                    ],
                    moves: [
                        "Tiger Drop",
                        "Essence of Dragon",
                        "Rush Combo",
                        "Beast Mode",
                        "Extreme Heat Mode",
                        "Komaki Parry",
                        "Thug Style",
                        "Dragon of Dojima"
                    ]
                };
                
                const kiryuSpecies = {
                    is_legendary: true,
                    flavor_text_entries: Object.entries(kiryuPokemon.descriptions).map(([version, text]) => ({
                        language: { name: "fr" },
                        version: { name: version },
                        flavor_text: text
                    }))
                };
                
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    const url = args[0].toString();
                    
                    if (url.includes('/api/') || url.includes('pokemon')) {
                        return Promise.resolve({
                            ok: true,
                            json: () => Promise.resolve(kiryuPokemon),
                            text: () => Promise.resolve(JSON.stringify(kiryuPokemon)),
                            status: 200
                        });
                    }
                    
                    if (url.includes('/species/') || url.includes('species')) {
                        return Promise.resolve({
                            ok: true,
                            json: () => Promise.resolve(kiryuSpecies),
                            text: () => Promise.resolve(JSON.stringify(kiryuSpecies)),
                            status: 200
                        });
                    }
                    
                    return originalFetch.apply(this, args);
                };
                
                try {
                    await loadPokemonData(kiryuPokemon);
                    modal.showModal();
                } finally {
                    window.fetch = originalFetch;
                }
                
                return;
            }
            
            const pkmnData = await fetchPokemon(pkmnId, urlParams.get("region"));
            pkmnData.alternate_form_id = urlParams.get("alternate_form_id");

            await loadPokemonData(pkmnData);
            modal.showModal();
        } catch (_e) {
            console.error("Error loading Pokémon:", _e);
            modal.close();
            errorMessageContainer.textContent = `Le Pokémon avec l'id "${pkmnId}" n'existe pas`;
            errorPopover.dataset.error = POPOVER_ERRORS.unknown_pkmn;
            errorPopover.showPopover();
        }
    }
}

await observeURL();
await loadPokedexForGeneration(1);

delegateEventHandler(document, "click", "[data-load-generation]", (e) => {
    loadPokedexForGeneration(e.target.dataset.loadGeneration, e.target.dataset.selfDelete === "" ? e.target : null);
});

delegateEventHandler(document, "change", "[data-layout-switch]", (e) => {
    localStorage.setItem("is_grid_layout", e.target.checked);

    updatePokedexLayout(e.target.checked);
    updateSwitchIcons(e.target.checked);
    isGridLayout = e.target.checked;
    modal.dataset.isGridLayout = e.target.checked;

    if(window.scrollY !== 0) {
        firstVisiblePkmn.scrollIntoView({
            behavior: "instant",
        });
    }
});

errorPopover.addEventListener("beforetoggle", (e) => {
    if (e.newState !== "open" && e.target.dataset.error === POPOVER_ERRORS.unknown_pkmn) {
        const url = new URL(location);
        url.searchParams.delete("id");
        url.searchParams.delete("region");
        url.searchParams.delete("alternate_form_id");
        history.pushState({}, "", url);
    }
});

if (process.env.NODE_ENV === "development") {
    await import("./utils/vite.error-overlay");
}

window.addEventListener("offline", () => {
    errorMessageContainer.textContent = "Connexion perdue";
    errorPopover.dataset.error = POPOVER_ERRORS.lost_connection;
    errorPopover.showPopover();
});

export { loadPokedexForGeneration };
