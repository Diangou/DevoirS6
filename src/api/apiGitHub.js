import axios from 'axios'; // Importer axios
import { config } from '../config.js';  // Importer la config

const GITHUB_API = "https://api.github.com";
const OWNER = "Diangou";  // Remplace par ton nom d'utilisateur GitHub
const REPO = "DevoirS6";  // Remplace par le nom de ton repository
const TOKEN = config.GITHUB_TOKEN;  // Utiliser le token de config

async function fetchCollaborators() {
    try {
        // Prépare l'en-tête de la requête avec le token d'authentification
        const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

        // Envoie la requête pour récupérer la liste des collaborateurs
        const res = await axios.get(`${GITHUB_API}/repos/${OWNER}/${REPO}/collaborators`, { headers });

        const collaborators = res.data;

        // Récupère les données des utilisateurs
        const usersData = await Promise.all(
            collaborators.map(async (user) => {
                const userRes = await axios.get(`${GITHUB_API}/users/${user.login}`);
                return userRes.data;
            })
        );

        // Affiche les collaborateurs sur la page
        displayContributors(usersData);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des collaborateurs :", error);
    }
}

function displayContributors(users) {
    const container = document.getElementById("contributors");
    container.innerHTML = "";  // Vide le container avant d'ajouter les nouveaux contributeurs

    // Crée un élément pour chaque utilisateur
    users.forEach((user) => {
        const contributorEl = document.createElement("a");
        contributorEl.href = user.html_url;
        contributorEl.target = "_blank";  // Ouvre le profil dans un nouvel onglet
        contributorEl.className = "block p-2 hover:bg-gray-200 rounded-md flex items-center gap-2";

        contributorEl.innerHTML = `
            <img src="${user.avatar_url}" alt="${user.login}" class="w-8 h-8 rounded-full">
            <span>${user.name || "Nom inconnu"} (@${user.login})</span>
        `;

        container.appendChild(contributorEl);
    });
}

// Exporte la fonction pour l'utiliser ailleurs
export { fetchCollaborators };
