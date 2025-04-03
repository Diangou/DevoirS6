import WaveSurfer from 'wavesurfer.js';
import { getPokemonCry } from '../api/pokeapi.js'; // Assure-toi que l'import est correct

export async function setupWaveSurfer(pokemonName) {
    try {
        const container = document.getElementById("waveform");
        container.innerHTML = ""; // Reset du spectre

        const audioUrl = await getPokemonCry(pokemonName);
        if (!audioUrl) {
            console.error(`❌ Aucun cri trouvé pour ${pokemonName}`);
            return;
        }

        const wavesurfer = WaveSurfer.create({
            container: "#waveform",
            waveColor: "#1E40AF",
            progressColor: "#3B82F6",
            cursorColor: "#2563EB",
            barWidth: 3,
            height: 60,
            responsive: true
        });

        wavesurfer.load(audioUrl);
        
        document.getElementById("playPause").addEventListener("click", () => {
            wavesurfer.playPause();
        });

    } catch (error) {
        console.error("❌ Erreur lors de la configuration de WaveSurfer :", error);
    }
}
