import * as THREE from 'three';
import { createNoise3D } from 'noise';
import { update_planets } from './terrain_generation.js';


export const biome = {
    height_frequency: 0.5,
    height_amplitude: 3,
    n_octaves: 3,
    persistence: 0.5,
    lacunarity: 2,
    water_height: 0.4, // value normalized to 0-1
    smooth_coef: 100.0,
};


export var get_pos_normalize_height;
update_normalize_height();


export function get_pos_normal(x, y, z) {
    const delta = 1e-6;
    
    const phi = Math.acos(z);
    const theta = Math.atan2(y, x);

    const phi_minus_height = get_pos_normalize_height(Math.cos(theta)*Math.sin(phi - delta), Math.sin(theta)*Math.sin(phi - delta), Math.cos(phi - delta));
    const phi_plus_height = get_pos_normalize_height(Math.cos(theta)*Math.sin(phi + delta), Math.sin(theta)*Math.sin(phi + delta), Math.cos(phi + delta));
    const theta_minus_height = get_pos_normalize_height(Math.cos(theta - delta)*Math.sin(phi), Math.sin(theta - delta)*Math.sin(phi), Math.cos(phi));
    const theta_plus_height = get_pos_normalize_height(Math.cos(theta + delta)*Math.sin(phi), Math.sin(theta + delta)*Math.sin(phi), Math.cos(phi));

    const dphi_height = (phi_plus_height - phi_minus_height) / (2*delta);
    const dphi = new THREE.Vector3(dphi_height*Math.cos(theta)*Math.cos(phi), dphi_height*Math.sin(theta)*Math.cos(phi), dphi_height*Math.sin(phi));
    const dtheta_height = (theta_plus_height - theta_minus_height) / (2*delta);
    const dtheta = new THREE.Vector3(dtheta_height*Math.cos(theta)*Math.cos(phi), dtheta_height*Math.sin(theta)*Math.cos(phi), dtheta_height*Math.sin(phi));

    return dphi.cross(dtheta).normalize();
}


function update_normalize_height() {
    const first_layer = create_noise(biome.n_octaves, biome.height_frequency);
    const second_layer = create_noise(biome.n_octaves, biome.height_frequency*2.0);

    get_pos_normalize_height = function(x, y, z) {
        return smooth_max(
            first_layer(x, y, z),
            second_layer(x, y, z)
        );
    }
}


/* smooth_coef = 0.0 => average; smooth_coef = inf => max; smooth_coef = -inf => min */
function smooth_max(a, b) {
    const exp_a = Math.exp(biome.smooth_coef * a);
    const exp_b = Math.exp(biome.smooth_coef * b);

    return (a*exp_a + b*exp_b) / (exp_a + exp_b);
}


function create_noise(n_octaves, frequency, mask = (_x, _y, _z) => 1) {
    const octaves = [];
    for (let i = 0; i < n_octaves; i++) {
        octaves.push(createNoise3D());
    }

    return (x, y, z, _frequency=frequency) => {
        let value = 0;
        let octave_amplitude = 1;
        let octave_frequency = _frequency;

        for (let i = 0; i < n_octaves; i++) {
            value += octave_amplitude * octaves[i](octave_frequency*x, octave_frequency*y, octave_frequency*z);
            octave_amplitude *= biome.persistence;
            octave_frequency *= biome.lacunarity;
        }

        return THREE.clamp(value / 2 + 0.5, 0, mask(x, y, z));
    }
}