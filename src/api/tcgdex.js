async function fetchPokemonCards(pokemonName) {
    const cachedCards = localStorage.getItem(pokemonName); // Vérifier si les cartes sont déjà en cache
  
    if (cachedCards) {
      // Si les cartes sont en cache, les afficher
      displayCards(JSON.parse(cachedCards));
    } else {
      const response = await fetch(`https://api.tcgdex.net/v2/cards?name=${pokemonName}&language=fr`);
      const data = await response.json();
      
      if (data.data) {
        localStorage.setItem(pokemonName, JSON.stringify(data.data)); // Mettre en cache la réponse
        displayCards(data.data); // Afficher les cartes
      } else {
        console.log("Aucune carte trouvée pour ce Pokémon");
      }
    }
  }
  
  function displayCards(cards) {
    const container = document.getElementById('pokemon-cards-container');
    container.innerHTML = ''; // Vider le conteneur avant de l'injecter
  
    cards.forEach(card => {
      const imgElement = document.createElement('img');
      imgElement.src = card.images.large; // Utiliser l'URL de l'image de la carte
      imgElement.alt = `Carte Pokémon ${card.name}`;
      imgElement.classList.add('pokemon-card-image');
      container.appendChild(imgElement);
    });
  }
  
  // Exemple d'appel de fonction pour récupérer les cartes d'un Pokémon (ex. Pikachu)
  fetchPokemonCards('pikachu');
  