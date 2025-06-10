import "./utils";

export * from "./pokeapi";
export * from "./tyradex";
export * from "./tcgdex"; // Ajout du fichier tcgdex.js
export * from "./apiGitHub.js"; // Ajout du fichier tcgdex.js

import axios from "axios";

export const fetchGameCovers = async () => {
    try {
        const response = await axios.get("http://localhost:3000/list-jaquettes");
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des jaquettes:", error);
        return [];
    }
};


