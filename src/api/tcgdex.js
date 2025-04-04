import axios from "axios";

// L'URL de l'API pour récupérer les cartes Pokémon
const BASE_URL = "https://api.tcgdex.net/v2/fr/cards?name=";

const tcgdexCache = new Map();

export async function fetchPokemonCards(pokemonName) {
    const cacheKey = `tcgdex-card-${pokemonName}`;

    if (tcgdexCache.has(cacheKey)) {
        return tcgdexCache.get(cacheKey);
    }

    try {
        console.log(`🔍 Recherche des cartes pour ${pokemonName}...`);

        const response = await axios.get(`${BASE_URL}${encodeURIComponent(pokemonName)}`);

        console.log("📦 Réponse API complète :", response.data);

        // On filtre les cartes qui ont une image valide
        const cards = (response.data || []).filter(card => card.image);

        console.log("🎴 Cartes récupérées après filtrage :", cards);

        tcgdexCache.set(cacheKey, cards);
        return cards;
    } catch (error) {
        console.error("❌ Erreur API TCGDex :", error);
        return [];
    }
}

