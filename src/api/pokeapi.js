import axios from "axios";

export const fetchPokemonDetails = async (pkmnId) => {
    try {
        const req = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pkmnId}`);
        return req.data;
    } catch (error) {
        throw new Error(error);
    }
}

export const fetchPokemonExternalData = async (pkmnId) => {
    try {
        const req = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`);
        return req.data;
    } catch (error) {
        throw new Error(error);
    }
}

export const fetchEvolutionChain = async (url) => {
    try {
        const req = await axios.get(url);
        return req.data;
    } catch (error) {
        throw new Error(error);
    }
}

export const fetchAbilityData = async (url) => {
    try {
        const req = await axios.get(url);
        return req.data;
    } catch (error) {
        throw new Error(error);
    }
}

export const getPokemonCry = async (pokemonName) => {
    try {
        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        return res.data.cries?.latest || null;
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du cri de ${pokemonName} :`, error);
        return null;
    }
}




