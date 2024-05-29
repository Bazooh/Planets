import * as THREE from 'three';
import { OrbitControls } from 'control';
import { GUI } from 'dat.gui';
import { addShader } from './shader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/postprocessing/ShaderPass.js';
import { getCloudsTexture, clouds_param } from './clouds.js';
import { updateCloudsGUI, updateAtmoshpereGUI, updateBiomeGUI, updateTimeGUI } from './GUI.js';
import { create_planet } from './planet.js';
import { biome } from './biome.js';

export const view = {
    fov: 75.0,
    pos_x: 40,
    pos_y: 0,
    pos_z: -1,
};

const time = {
    uTimeOfDay: 0,
    dayLength: 10,
    timeStatic: false,
};

const atmosphere_param = {
    uSunIntensity: 0.5,
    uScatteringCoefficients: {r: 5.19673, g: 12.1427, b: 29.6453},
    uAtmosphereHeight: 5.0,
    uEarthRadius: 6.371,
    uSunColor: {r: 1, g: 1, b: 1},
    uRayNumberOfPoints: 40,
    starsThreshold: 0.8,
    starsDensity: 100.0
};

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(view.pos_x, view.pos_y, view.pos_z);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

addShader(
    'atmosphere',
    {},
    {
        tDiffuse: null,
        tDepth: null,
        uTime: performance.now(),
        uCameraPosition: camera.position,
        uCameraDirection: camera.getWorldDirection(new THREE.Vector3()),
        uTanHalfFov: Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
        uAspectRatio: camera.aspect,
        uScatteringCoefficients: new THREE.Vector3(atmosphere_param.uScatteringCoefficients.r, atmosphere_param.uScatteringCoefficients.g, atmosphere_param.uScatteringCoefficients.b),
        uAtmosphereHeight: atmosphere_param.uAtmosphereHeight,
        uSunIntensity: atmosphere_param.uSunIntensity,
        uEarthRadius: atmosphere_param.uEarthRadius,
        uSunColor: new THREE.Vector3(atmosphere_param.uSunColor.r, atmosphere_param.uSunColor.g, atmosphere_param.uSunColor.b),
        uRayNumberOfPoints: atmosphere_param.uRayNumberOfPoints,
        projectionMatrixInverse: camera.projectionMatrixInverse,
        viewMatrixInverse: camera.matrixWorld,
        uCloudsHeight: 0.8*atmosphere_param.uEarthRadius,
        uSunPosition: new THREE.Vector3(0, 0, 0),
        starsThreshold: atmosphere_param.starsThreshold,
        starsDensity: atmosphere_param.starsDensity,
    }
).then(([shader, _]) => {
    composer.addPass(new ShaderPass(shader));

    const gui = new GUI();
    updateViewGUI(gui);
    updateCloudsGUI(gui, clouds_param);
    updateAtmoshpereGUI(gui, atmosphere_param, composer.passes[1]);
    updateBiomeGUI(gui, biome);
    updateTimeGUI(gui, time);
});


const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();


function updateViewGUI(gui) {
    const view_folder = gui.addFolder('View');

    view_folder.add(view, 'fov', 0, 100, 1).onChange(function (value) {
        camera.fov = value;
        camera.updateProjectionMatrix();
    });
    view_folder.add(view, 'pos_x', -100, 100, 1).onChange(function (value) {
        camera.position.x = value;
    });
    view_folder.add(view, 'pos_y', 0, 100, 1).onChange(function (value) {
        camera.position.y = value;
    });
    view_folder.add(view, 'pos_z', -100, 100, 1).onChange(function (value) {
        camera.position.z = value;
    });
}


const planet = create_planet()
scene.add(planet);

let prev_time = performance.now();
let delta_time = 0;

function animate() {
    requestAnimationFrame(animate);

    delta_time = performance.now() - prev_time;
    prev_time = performance.now();

    if (!time.timeStatic)
        time.uTimeOfDay = (time.uTimeOfDay + 24*delta_time / (1000*time.dayLength)) % 24;

    const sunAngle = 2*Math.PI*time.uTimeOfDay/24;
    const sunPosition = new THREE.Vector3(149e3*Math.sin(sunAngle), -149e3*Math.cos(sunAngle), 0);

    if (composer.passes[1] !== undefined) {
        composer.passes[1].uniforms.uTime.value += delta_time;
        composer.passes[1].uniforms.uSunPosition.value = sunPosition;
        composer.passes[1].uniforms.tDepth.value = composer.renderTarget2.texture;
        composer.passes[1].uniforms.uCameraPosition.value = camera.position;
        composer.passes[1].uniforms.uCameraDirection.value = camera.getWorldDirection(new THREE.Vector3());
        composer.passes[1].uniforms.uTanHalfFov.value = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        composer.passes[1].uniforms.uAspectRatio.value = camera.aspect;
        composer.passes[1].uniforms.projectionMatrixInverse.value = camera.projectionMatrixInverse;
        composer.passes[1].uniforms.viewMatrixInverse.value = camera.matrixWorld;
        composer.passes[1].uniforms.texture1 = { value: getCloudsTexture() };
    }

    if (Object.keys(planet.material.uniforms).length !== 0) {
        planet.material.uniforms.uSunPosition.value = sunPosition;
        planet.material.uniforms.uTime.value += delta_time / 1000;
    }

    composer.render();
}

animate();