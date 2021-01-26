// Parametry można podać też w adresie, np. /?N=2
const queryString = window.location.search || '';
const urlParams = new URLSearchParams(queryString.toUpperCase());

// UWAGA! Budynki tworzone są na kwadratowej siatce -N..N
// dla N=30: 961 budynków!
export const N = urlParams.get('N') || 10;
export const MUTATION = urlParams.get('MUTATION') || 0.04;
export const GENERATIONS = 40;
export const SELECTION = urlParams.get('SELECTION') || 0.5;

export const MAX_SEGMENTS = urlParams.get('MAX_SEGMENTS') || 8;
export const MAX_FLOORS = urlParams.get('MAX_FLOORS') || 80;

export const METER = 1. / 16; // skalowanie, bo inaczej mgła dziwnie wygląda
export const FLOOR = 3.25 * METER;
export const GRID = (urlParams.get('GRID') || 60) * METER;

export const STREET = (urlParams.get('STREET') || (3.5 * 4 + 1.75 * 2)) * METER;

export const SPACING = (urlParams.get('SPACING') || 8) * METER;
export const GRIDS_PER_BLOCK_X = urlParams.get('GRIDS_PER_BLOCK_X') || 3;
export const GRIDS_PER_BLOCK_Y = urlParams.get('GRIDS_PER_BLOCK_Y') || 2;
