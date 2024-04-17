import * as THREE from 'three';
import { OrbitControls } from 'control';
import { GUI } from 'dat.gui';


export const gui = new GUI();

export const view = {
    fov: 75.0,
    pos_x: -50.0,
    pos_y: 50.0,
    pos_z: -50.0,
    back_distance: 30.0
};

add_view_gui_folder(gui);

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(view.pos_x, view.pos_y, view.pos_z);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(view.back_distance, 0, view.back_distance);
controls.update();


function add_view_gui_folder(gui) {
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


function animate() {
    requestAnimationFrame(animate);



    renderer.render(scene, camera);
}

animate();