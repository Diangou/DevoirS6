import axios from "axios";

import { debounce, CUSTOM_EVENTS } from "#src/utils/index.js";

let numberOfAjaxCallPending = 0;

const startLoadingEvent = new Event(CUSTOM_EVENTS.startLoading);
const endLoadingEvent = new Event(CUSTOM_EVENTS.endLoading);

const delayBeforeFlagEndRequests = 850;
const notifyEndRequests = debounce(() => {
    window.dispatchEvent(endLoadingEvent);
}, delayBeforeFlagEndRequests);

const listURLToIntercept = ["https://tyradex.vercel.app/api/v1/gen", "https://pokeapi.co/api/v2/", "https://pokeapi.co/api/v2/pokemon/"]

axios.interceptors.request.use(async (config) => {
    try {
        if (listURLToIntercept.some((item) => config.url.startsWith(item))) {
            numberOfAjaxCallPending++;
            window.dispatchEvent(startLoadingEvent);
        }

        return config;
    } catch (error) {
        return Promise.reject(error);
    }
})

axios.interceptors.response.use(async (response) => {
    try {
        return response;
    } catch (error) {
        return Promise.reject(error);
    } finally {
        if (listURLToIntercept.some((item) => response.config.url.startsWith(item))) {
            numberOfAjaxCallPending--;
            if (numberOfAjaxCallPending == 0) {
                notifyEndRequests();
            }
        }
    }
});

/**
 * Récupère dynamiquement tous les jeux contenant 'Pokémon' depuis PokéAPI (langue FR)
 * et force le nom à commencer par "Pokémon ".
 * @returns {Promise<string[]>} Liste des noms de jeux
 */
export async function fetchAllGames() {
    const response = await axios.get("https://pokeapi.co/api/v2/version?limit=100");
    const results = response.data.results;
  
    const allGames = [];
  
    for (const version of results) {
      const detail = await axios.get(version.url);
      const nameFR = detail.data.names.find(n => n.language.name === "fr");
      if (nameFR) {
        let name = nameFR.name;
        if (!name.startsWith("Pokémon")) {
          name = "Pokémon " + name;
        }
        allGames.push(name);
      }
    }
  
    return [...new Set(allGames)].sort();
  }