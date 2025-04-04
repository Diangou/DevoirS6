import { fetchPokemonDetails, getPokemonCry } from '../api/pokeapi.js';
import WaveSurfer from 'wavesurfer.js';

let wavesurfer = null; // Variable globale

export async function setupPokemonCry(pokemonId) {
    try {
        // Vérifier que l'ID est bien reçu
        if (!pokemonId) {
            console.error("❌ Aucun ID de Pokémon trouvé.");
            return;
        }

        console.log(`🔍 ID du Pokémon sélectionné : ${pokemonId}`);

        // Récupérer les détails du Pokémon
        const pokemonData = await fetchPokemonDetails(pokemonId);
        if (!pokemonData) {
            console.error(`❌ Aucun Pokémon trouvé avec l'ID ${pokemonId}`);
            return;
        }

        // Met à jour le titre dans la modal
        document.getElementById("pokemonName").innerText = `Cri de ${pokemonData.name}`;

        // Générer l'URL du cri
        const audioUrl = getPokemonCry(pokemonId);

        if (!audioUrl) {
            console.error(`❌ Aucun cri trouvé pour ${pokemonData.name}`);
            return;
        }

        console.log(`🔊 Chargement du cri : ${audioUrl}`);

        // **Réinitialiser le lecteur audio**
        if (wavesurfer) {
            wavesurfer.destroy();  // Supprime l'instance précédente
            wavesurfer = null;
            document.getElementById("waveform").innerHTML = ""; // Nettoie l'UI
        }

        // **Créer une nouvelle instance pour éviter les bugs**
        wavesurfer = WaveSurfer.create({
            container: "#waveform",
            waveColor: "#1E40AF",
            progressColor: "#3B82F6",
            cursorColor: "#2563EB",
            barWidth: 3,
            height: 60,
            responsive: true
        });

        // Charger le nouveau fichier audio
        wavesurfer.load(audioUrl);
        wavesurfer.on('ready', () => {
            console.log("✅ Cri chargé !");
        });

        // **Gérer le bouton play/pause**
        const playPauseBtn = document.getElementById("playPause");
        playPauseBtn.removeEventListener("click", playPauseHandler);
        playPauseBtn.addEventListener("click", playPauseHandler);

    } catch (error) {
        console.error("❌ Erreur lors de la configuration du cri :", error);
    }
}

// Fonction de gestion du bouton play/pause
function playPauseHandler() {
    if (wavesurfer) {
        wavesurfer.playPause();
    }
}
