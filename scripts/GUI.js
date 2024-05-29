import * as THREE from 'three';


export function updateAtmoshpereGUI(gui, atmosphere_param, shader) {
    const folder = gui.addFolder('Atmosphere');
    folder.add(atmosphere_param, 'uSunIntensity', 0, 2, 0.01).onChange((value) => shader.uniforms.uSunIntensity.value = value);
    
    const scatteringCoefficients = folder.addFolder('Scattering Coefficients');
    scatteringCoefficients.add(atmosphere_param.uScatteringCoefficients, 'r', 0, 50, 0.001).onChange((value) => shader.uniforms.uScatteringCoefficients.value = new THREE.Vector3(value, shader.uniforms.uScatteringCoefficients.value.y, shader.uniforms.uScatteringCoefficients.value.z));
    scatteringCoefficients.add(atmosphere_param.uScatteringCoefficients, 'g', 0, 50, 0.001).onChange((value) => shader.uniforms.uScatteringCoefficients.value = new THREE.Vector3(shader.uniforms.uScatteringCoefficients.value.x, value, shader.uniforms.uScatteringCoefficients.value.z));
    scatteringCoefficients.add(atmosphere_param.uScatteringCoefficients, 'b', 0, 50, 0.001).onChange((value) => shader.uniforms.uScatteringCoefficients.value = new THREE.Vector3(shader.uniforms.uScatteringCoefficients.value.x, shader.uniforms.uScatteringCoefficients.value.y, value));

    folder.add(atmosphere_param, 'uAtmosphereHeight', 0, 20, 1e-3).onChange((value) => shader.uniforms.uAtmosphereHeight.value = value);
    folder.add(atmosphere_param, 'uEarthRadius', 0, 10, 1e-3).onChange((value) => shader.uniforms.uEarthRadius.value = value);
    
    const sunColorFolder = folder.addFolder('Sun Color');
    sunColorFolder.add(atmosphere_param.uSunColor, 'r', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(value, shader.uniforms.uSunColor.value.y, shader.uniforms.uSunColor.value.z));
    sunColorFolder.add(atmosphere_param.uSunColor, 'g', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(shader.uniforms.uSunColor.value.x, value, shader.uniforms.uSunColor.value.z));
    sunColorFolder.add(atmosphere_param.uSunColor, 'b', 0, 1, 0.01).onChange((value) => shader.uniforms.uSunColor.value = new THREE.Vector3(shader.uniforms.uSunColor.value.x, shader.uniforms.uSunColor.value.y, value));

    folder.add(atmosphere_param, 'uRayNumberOfPoints', 1, 100, 1).onChange((value) => shader.uniforms.uRayNumberOfPoints.value = value);

    folder.add(atmosphere_param, 'starsThreshold', 0, 1, 0.01).onChange((value) => shader.uniforms.starsThreshold.value = value);
    folder.add(atmosphere_param, 'starsDensity', 0, 1000, 1).onChange((value) => shader.uniforms.starsDensity.value = value);
}


export function updateCloudsGUI(gui, clouds_param) {
    const clouds_folder = gui.addFolder('Clouds');

    clouds_folder.add(clouds_param.n_pixels, 'x', 1, 128, 1).name('n_pixels').onChange(function (value) {
        clouds_param.n_pixels = new THREE.Vector3(value, value, value);
        updateDataTexture();
    });

    clouds_folder.add(clouds_param.n_points, 'x', 1, 128, 1).name('n_points').onChange(function (value) {
        clouds_param.n_points = new THREE.Vector3(value, value, value);

        updateCloudsNoise();
        updateDataTexture();
    });
}


export function updateTimeGUI(gui, time) {
    const folder = gui.addFolder('Time');
    folder.add(time, 'uTimeOfDay', 0, 24, 0.1).name('Time of Day').listen();
    folder.add(time, 'dayLength', 1, 1e6, 1).name('Day Length (s)');
    folder.add(time, 'timeStatic').name('Time Static');
}


export function updateBiomeGUI(gui, biome) {
    const chunk_folder = gui.addFolder('Biome');

    chunk_folder.add(biome, 'height_frequency', 0.1, 1.0, 0.01).onChange(function (value) {
        update_normalize_height();
        update_planets();
    });
    chunk_folder.add(biome, 'height_amplitude', 0, 100, 1).onChange(function (value) {
        update_planets();
    });
    chunk_folder.add(biome, 'n_octaves', 1, 10, 1).onChange(function (value) {
        update_normalize_height();
        update_planets();
    });
    chunk_folder.add(biome, 'persistence', 0, 1, 0.01).onChange(function (value) {
        update_planets();
    });
    chunk_folder.add(biome, 'lacunarity', 0, 10, 0.1).onChange(function (value) {
        update_planets();
    });
    chunk_folder.add(biome, 'water_height', 0, 1, 0.01).onChange(function (value) {
        update_planets();
    });
    chunk_folder.add(biome, 'smooth_coef', -100, 100, 1).onChange(function (value) {
        update_planets();
    });
}