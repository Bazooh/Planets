import { create_planet } from './planet.js';
import { scene } from './scene.js';
import { update_trees } from './tree.js';


export const planets = {};


export function add_planet(coordinate_idx) {
    if (planets[coordinate_idx]) {
        return;
    }

    const new_planet = create_planet(coordinate_idx.split(',').map(Number));

    planets[coordinate_idx] = new_planet;
    scene.add(new_planet);
}


export function update_planets() {
    Object.keys(planets).forEach(coordinate_idx => {
        scene.remove(planets[coordinate_idx]);
        delete planets[coordinate_idx];
        add_planet(coordinate_idx);
    });

    update_trees();
}