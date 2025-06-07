import axios from 'axios'; // Importer axios

const GITHUB_API = "https://api.github.com";
const CONTRIBUTORS = ["Diangou", "jhermaine14", "AODAMA"];

async function fetchCollaborators() {
    try {
        // Récupère les données des utilisateurs spécifiques
        const usersData = await Promise.all(
            CONTRIBUTORS.map(async (username) => {
                const userRes = await axios.get(`${GITHUB_API}/users/${username}`);
                return userRes.data;
            })
        );

        // Affiche les contributeurs sur la page
        displayContributors(usersData);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des contributeurs :", error);
    }
}

function displayContributors(users) {
    const container = document.getElementById("contributors");
    if (!container) return;
    
    container.innerHTML = "";
    container.className = "flex flex-wrap justify-center gap-4 p-4";

    // Crée un élément pour chaque utilisateur
    users.forEach((user) => {
        const contributorEl = document.createElement("a");
        contributorEl.href = user.html_url;
        contributorEl.target = "_blank";
        contributorEl.rel = "noopener noreferrer";
        contributorEl.className = "flex flex-col items-center p-3 hover:bg-gray-200 rounded-lg transition-colors duration-200";

        contributorEl.innerHTML = `
            <img src="${user.avatar_url}" alt="${user.login}" class="w-16 h-16 rounded-full mb-2 border-2 border-gray-300">
            <span class="font-medium text-lg">${user.name || user.login}</span>
            <span class="text-sm text-gray-600">@${user.login}</span>
        `;

        container.appendChild(contributorEl);
    });
}

// Exporte la fonction pour l'utiliser ailleurs
export { fetchCollaborators };
