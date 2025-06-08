// tests/fixtures.js
import { test as base } from '@playwright/test';
import pokedex from '../__mocks__/pokedex.js';
import evolutionLine from '../__mocks__/evolutionline.js';
import evolutionLineFr from '../__mocks__/evolutionline.fr.js';

export const test = base.extend({});

test.beforeEach(async ({ page }) => {
  await page.route('**/tyradex.vercel.app/api/v1/pokemon/**', async (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split('/').pop();
    const mockedPokemon = pokedex.find((p) => p.pokedex_id == id);
    if (mockedPokemon) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedPokemon),
      });
    } else {
      route.abort();
    }
  });

  await page.route('**/pokeapi.co/api/v2/pokemon-species/**', async (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split('/').pop();
    if (['7', '8', '9'].includes(id)) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(evolutionLine),
      });
    } else {
      route.continue();
    }
  });

  await page.route('**/evolutionline.fr', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(evolutionLineFr),
    })
  );
});
