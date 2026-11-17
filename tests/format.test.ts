import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  CountryNames,
  countryFromLocale,
  flagEmoji,
  hueFromText,
  initials,
  normalizeForSearch,
} from '../src/shared/format.js';

describe('format', () => {
  test('flagEmoji convierte códigos de país y usa 🌐 si no hay', () => {
    assert.equal(flagEmoji('CO'), '🇨🇴');
    assert.equal(flagEmoji(null), '🌐');
    assert.equal(flagEmoji('col'), '🌐');
  });

  test('initials toma hasta dos iniciales ignorando símbolos', () => {
    assert.equal(initials('La Mega 90.9'), 'LM');
    assert.equal(initials('★ ★'), '♪');
    assert.equal(initials('Ñapa'), 'Ñ');
  });

  test('hueFromText es estable y está entre 0 y 359', () => {
    assert.equal(hueFromText('Tropicana'), hueFromText('Tropicana'));
    assert.ok(hueFromText('Tropicana') >= 0 && hueFromText('Tropicana') < 360);
  });

  test('normalizeForSearch ignora tildes y mayúsculas', () => {
    assert.equal(normalizeForSearch('Perú'), 'peru');
  });

  test('countryFromLocale lee la región del idioma', () => {
    assert.equal(countryFromLocale('es-MX', 'CO'), 'MX');
    assert.equal(countryFromLocale('es', 'CO'), 'CO');
    assert.equal(countryFromLocale(undefined, 'CO'), 'CO');
  });

  test('CountryNames traduce al español', () => {
    assert.equal(new CountryNames('es').of('DE'), 'Alemania');
    assert.equal(new CountryNames('es').of(null), '');
  });
});
