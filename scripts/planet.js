import * as THREE from 'three';
import { get_pos_normalize_height, biome } from './biome.js';
import { create_material } from './material.js';
import { update_planets } from './terrain_generation.js';


export const planet = {
    radius: 6.371,
    n_vertices: 21, // hom many vertices the shpere has
};


export function add_chunk_gui_folder(gui) {
    const planet_folder = gui.addFolder('Planet');
    planet_folder.add(planet, 'radius', 1, 100, 1).onChange(function (value) {
        update_planets();
    });
    planet_folder.add(planet, 'n_vertices', 1, 100, 1).onChange(function (value) {
        update_planets();
    });
}


function modify_planet_heights(geometry) {
    const positions = geometry.attributes.position;
    const heights = new Float32Array(positions.count);

    for (let i = 0; i < positions.count; i++) {
        
        const position = new THREE.Vector3(
            positions.array[3*i],
            positions.array[3*i + 1],
            positions.array[3*i + 2]
        );

        const height = get_pos_normalize_height(position.x, position.y, position.z);
        const clamp_height = THREE.clamp(height, biome.water_height, 1)*biome.height_amplitude;

        position.normalize().multiplyScalar(planet.radius + clamp_height);

        positions.array[3*i] = position.x;
        positions.array[3*i + 1] = position.y;
        positions.array[3*i + 2] = position.z;

        heights[i] = height - 1e-6; // to avoid floating point being exactly 1 (interprected as an int) in the string conversion in the shader
    }

    return heights;
}


function create_planet_geometry() {
    const geometry = new THREE.SphereGeometry(1, 2*planet.n_vertices, planet.n_vertices);
    const heights = modify_planet_heights(geometry);

    geometry.computeVertexNormals();

    return {geometry, heights};
}


export function create_planet() {
    const {geometry, heights} = create_planet_geometry();

    const material = create_material(heights);
    const chunk = new THREE.Mesh(geometry, material);

    return chunk;
}