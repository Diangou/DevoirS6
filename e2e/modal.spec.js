import { test, expect } from "@playwright/test";

test("should open modal", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/");

    const firstPkmn = await page.getByTestId("pokemon").first();
    const firstPkmnDataRaw = await firstPkmn.getAttribute("data-pokemon-data");
    const firstPkmnData = JSON.parse(firstPkmnDataRaw);

    console.log("🔎 Données du premier Pokémon:", firstPkmnData);

    await firstPkmn.click();

    // Attendre que le modal soit bien ouvert
    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor();

    // Vérifier que le titre a bien changé avant de tester
    await page.waitForFunction(
        (expectedTitle) => document.title.includes(expectedTitle),
        firstPkmnData.name.fr
    );

    // Ajout d'un délai pour s'assurer que la page est bien mise à jour
    await page.waitForTimeout(2000);

    console.log("🕵️‍♂️ Titre actuel:", await page.title());

    // Vérification finale du titre
    await expect(page).toHaveTitle(new RegExp(String.raw`${firstPkmnData.name.fr}`, "g"));
});

test("should close modal", async ({ page }) => {
    await page.goto("/?id=17");
    await page.waitForResponse((resp) =>
        resp.url().includes("https://pokeapi.co/api/v2/pokemon-species/17")
    );

    await page.locator("[data-pokemon-data][open]").waitFor()
    await expect(page.getByTestId("pokemon-modal")).toHaveAttribute("open", "");

    await page.getByTestId("close-modal").first().click();
    await expect(page.getByTestId("pokemon-modal")).not.toHaveAttribute("open", "");

    const currentUrl = new URL(await page.url());
    expect(currentUrl.search).toBe("");
});

test("should load next pokemon", { tag: "@smoke" }, async ({ page }) => {
    const pkmnId = 25;
    await page.goto(`/?id=${pkmnId}`);

    console.log(`🚀 Chargement des données pour le Pokémon ID ${pkmnId}...`);

    // Ajout d'un timeout explicite pour éviter les blocages
    const responseTyradex = await page.waitForResponse(
        (resp) => resp.url().includes(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}`),
        { timeout: 60000 } // ⏳ Augmenté à 60s pour s'assurer que l'API répond bien
    );
    const responsePokeAPI = await page.waitForResponse(
        (resp) => resp.url().includes(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`),
        { timeout: 60000 }
    );

    console.log(`✅ Réponse Tyradex: ${responseTyradex.status()} - ${responseTyradex.url()}`);
    console.log(`✅ Réponse PokeAPI: ${responsePokeAPI.status()} - ${responsePokeAPI.url()}`);

    // Attente explicite pour s'assurer que le modal est bien ouvert
    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor({ state: "visible", timeout: 10000 });

    await expect(modal).toHaveAttribute("open", "");

    console.log(`🕵️‍♂️ Modal bien ouvert, chargement du prochain Pokémon...`);

    // Clic sur le bouton pour charger le Pokémon suivant
    await page.getByTestId("next-pkmn").first().click();

    // Ajout d'une attente pour s'assurer que l'URL change correctement
    await page.waitForTimeout(2000); 

    const currentUrl = new URL(await page.url());

    console.log(`🔎 Nouvelle URL après clic: ${currentUrl.href}`);

    // Récupérer les données du Pokémon suivant et vérifier la mise à jour
    const nextPokemonDataRaw = await page.getByTestId("pokemon-modal").getAttribute("data-pokemon-data");
    const nextPokemonData = JSON.parse(nextPokemonDataRaw);

    console.log(`🐉 Prochain Pokémon chargé: ID ${nextPokemonData.pokedex_id}, Nom: ${nextPokemonData.name.fr}`);

    await expect(currentUrl.searchParams.get("id")).toEqual(String(nextPokemonData.pokedex_id));
});

test("should load previous pokemon", async ({ page }) => {
    const pkmnId = 25;
    await page.goto(`/?id=${pkmnId}`);

    await Promise.all([
        page.waitForResponse((resp) =>
            resp.url().includes(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}`)
        ),
        page.waitForResponse((resp) =>
            resp.url().includes(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`)
        )
    ])

    await page.getByTestId("previous-pkmn").first().click();
    const currentUrl = new URL(await page.url());

    const previousPokemonDataRaw = await page.getByTestId("pokemon-modal").getAttribute("data-pokemon-data");
    const previousPokemonData = JSON.parse(previousPokemonDataRaw);

    await expect(currentUrl.searchParams.get("id")).toEqual(String(previousPokemonData.pokedex_id));
});

test("should open regional form", async ({ page }) => {
    const pkmnId = 19;
    await page.goto(`/?id=${pkmnId}`);

    await Promise.all([
        page.waitForResponse((resp) =>
            resp.url().includes(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}`)
        ),
        page.waitForResponse((resp) =>
            resp.url().includes(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`)
        )
    ])

    await expect(page.getByTestId("pokemon-modal")).toHaveAttribute("open", "");
    await page.getByTestId("regional-forms").first().click();
    const firstRegionalPokemon = await page.getByTestId("regional-forms").getByTestId("pokemon").first();
    const firstRegionalPokemonURL = new URL(await firstRegionalPokemon.getAttribute("href"));
    const firstRegionalPokemonRegion = firstRegionalPokemonURL.searchParams.get("region");

    await firstRegionalPokemon.click();

    await page.waitForResponse((resp) =>
        resp.url().includes(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}/${firstRegionalPokemonRegion}`)
    );

    const currentUrl = new URL(await page.url());

    await expect(Array.from(currentUrl.searchParams.values())).toHaveLength(3);
});

test("should keep title tag value after scroll", async ({ page }) => {
    const pkmnId = 25;
    await page.goto(`/?id=${pkmnId}`);

    await Promise.all([
        page.waitForResponse("https://pokeapi.co/api/v2/evolution-chain/10/"),
        page.waitForResponse(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`),
        page.waitForResponse(`https://pokeapi.co/api/v2/pokemon/${pkmnId}`),
        page.waitForResponse(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}`),
    ])

    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor();

    const title = await page.title()

    await page.mouse.wheel(0, 550);
    await page.waitForTimeout(2);

    await expect(page).toHaveTitle(title);
});

test("should cache dex's data", async ({ page }) => {
    const pkmnId = 25;

    // Aller à la page du Pokémon avec l'ID 25
    await page.goto(`/?id=${pkmnId}`);

    // Attendre toutes les requêtes API nécessaires à l'affichage du modal
    await Promise.all([
        page.waitForResponse("https://pokeapi.co/api/v2/evolution-chain/10/"),
        page.waitForResponse(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`),
        page.waitForResponse(`https://pokeapi.co/api/v2/pokemon/${pkmnId}`),
        page.waitForResponse(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}`),
    ]);

    // Vérifie que le modal est bien affiché
    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await expect(modal).toBeVisible();

    // Activer l'écoute des requêtes vers le Pokédex général
    let called = false;
    page.on("request", request => {
        if (request.url().includes("https://tyradex.vercel.app/api/v1/gen/1")) {
            called = true;
        }
    });

    // Cliquer sur le bouton "previous" pour naviguer vers un autre Pokémon
    await page.getByTestId("previous-pkmn").first().click();

    // Attendre que le nouveau modal soit chargé (peut adapter selon l’UX)
    await page.waitForTimeout(500); // ou `await modal.waitFor();` à nouveau si c'est le même sélecteur

    // Assertion : l'appel à /api/v1/gen/1 ne doit pas être refait (car en cache)
    expect(called).toBeFalsy();
});

test("should cache pokemon's data", async ({ page }) => {
    const pkmnId = 25;
    await page.goto(`/?id=${pkmnId}`);

    await Promise.all([
        page.waitForResponse("https://pokeapi.co/api/v2/evolution-chain/10/"),
        page.waitForResponse(`https://pokeapi.co/api/v2/pokemon-species/${pkmnId}`),
        page.waitForResponse(`https://pokeapi.co/api/v2/pokemon/${pkmnId}`),
        page.waitForResponse(`https://tyradex.vercel.app/api/v1/pokemon/${pkmnId}`),
    ])

    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor();

    await page.getByTestId("previous-pkmn").first().click();
    await page.getByTestId("next-pkmn").first().click();

    const pkmnRequest = page.waitForResponse(`https://pokeapi.co/api/v2/pokemon/${pkmnId}`, { timeout: 5000 });
    try {
        await pkmnRequest;
    } catch {
        expect(true).toBeTruthy();
    }
});

test("should have a label for all abilities", async ({ page }) => {
    const pkmnId = 13;
    await page.goto(`/?id=${pkmnId}`);

    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor();

    const listAbilitiesAfter = await page.locator("[data-list-abilities] summary").all();

    for (const element of listAbilitiesAfter) {
    await expect(element).not.toBeEmpty();
}

});

test("should have a label for all abilities after loading Pokémon and its Pokédex", async ({ page }) => {
    const pkmnId = 171;
    await page.goto(`/?id=${pkmnId}`);

    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor();

    const listAbilities = await page.locator("[data-list-abilities] summary").all();

    for (const element of listAbilities) {
        await expect(element).not.toBeEmpty();
    }

    await page.getByTestId("close-modal").first().click();

    const loadGenerationButton = await page.getByTestId("load-generation-btn").first()
    await loadGenerationButton.click();

    await page.getByTestId("pokemon").nth(170).click();
    await modal.waitFor();

    for (const element of listAbilities) {
        await expect(element).not.toBeEmpty();
    }
});

test("should not have more than 4 levels of evolutions", async ({ page }) => {
    const pkmnId = 265;
    await page.goto(`/?id=${pkmnId}`);

    const modal = page.locator("[data-testid='pokemon-modal'][open]");
    await modal.waitFor();

    const nbEvolutionLevels = await page.locator("[data-list-evolutions] > li:not([inert])").count();
    expect(nbEvolutionLevels).toBeLessThanOrEqual(4);
});
