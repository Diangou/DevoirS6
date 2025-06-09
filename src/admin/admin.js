import { games } from "../utils/index.js";
import axios from "axios";

// Formulaire & bouton
const form = document.getElementById("uploadForm");
const toggleBtn = document.getElementById("toggleFormBtn");
const select = document.getElementById("gameSelect");
const jaquetteList = document.getElementById("jaquetteList");

// Toggle affichage du formulaire
toggleBtn.addEventListener("click", () => {
  form.classList.toggle("hidden");
});

// Remplir la liste des jeux
games.forEach(game => {
  const option = document.createElement("option");
  option.value = game.name;
  option.textContent = game.label;
  select.appendChild(option);
});

// Nettoyer le nom de fichier
function sanitizeFileName(fileName) {
  return fileName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/--+/g, "-")
    .toLowerCase();
}

// Soumission du formulaire (envoi avec axios)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const gameName = select.value;
  const file = fileInput.files[0];

  if (!file || !gameName) return alert("Veuillez remplir tous les champs.");

  const sanitized = sanitizeFileName(file.name);
  const formData = new FormData();
  formData.append("file", file, sanitized);
  formData.append("game_name", gameName);

  try {
    const res = await axios.post("http://localhost:3000/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (res.status === 200) {
      alert("Jaquette envoyée !");
      form.reset();
      fetchJaquettes(); // Rafraîchir la liste
    } else {
      alert("Erreur : " + res.data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Erreur lors de l’envoi.");
  }
});

async function fetchJaquettes() {
  try {
    const res = await axios.get("http://localhost:3000/list-jaquettes");
    const jaquettes = res.data;

    // Nettoyage du conteneur
    jaquetteList.innerHTML = "";

    // Affichage des jaquettes
    jaquettes.forEach(j => {
      const img = document.createElement("img");
      img.src = j.url;
      img.alt = j.name;
      img.className = "w-full rounded shadow"; // Tailwind classes pour style propre
      jaquetteList.appendChild(img);
    });
  } catch (err) {
    console.error("Erreur de récupération des jaquettes :", err);
  }
}


fetchJaquettes();

