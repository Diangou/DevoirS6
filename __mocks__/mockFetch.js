import pokedex from "./pokedex";
import evolutionLine from "./evolutionline";
import evolutionLineFr from "./evolutionline.fr";

export const mockFetchDefinition = `
window.fetch = async function(url, config) {
    switch (url) {
        case "https://pokeapi.co/api/v2/pokemon-species/8/":
            return {
                ok: true,
                status: 200,
                json: async () => ${JSON.stringify(evolutionLine)}
            };
        case "https://pokeapi.co/api/v2/pokedex/8/":
            return {
                ok: true,
                status: 200,
                json: async () => ${JSON.stringify(pokedex)}
            };
        case "https://pokeapi.co/api/v2/pokemon-species/8/?language=fr":
            return {
                ok: true,
                status: 200,
                json: async () => ${JSON.stringify(evolutionLineFr)}
            };
        default:
            return {
                ok: false,
                status: 404,
                json: async () => ({ message: "Not Found" })
            };
    }
};
`;
