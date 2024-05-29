import * as THREE from 'three'
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.140.0/examples/jsm/loaders/FBXLoader.js';
import { scene, camera } from './scene.js'
import { get_pos_normal, get_pos_normalize_height } from './biome.js'
import { planet } from './planet.js'
import { biome } from './biome.js';
import { addShader } from './shader.js';

const fbxLoader = new FBXLoader()
fbxLoader.setPath('../models/')

const MAX_ITER = 50

const tree = {
    scale: 0.1,
    n_trees: 500,
}

const tree_meshes = load_trees();


export function add_tree_gui_folder(gui) {
    const tree_folder = gui.addFolder('Tree');
    
    tree_folder.add(tree, 'scale', 0.1, 1, 0.1).onChange(function (value) {
        scene.children.filter(child => child.name.includes('tree_')).forEach((tree) => tree.scale.set(value, value, value));
    });
    tree_folder.add(tree, 'n_trees', 0, 1000, 1).onChange(function (value) {
        update_trees();
    });
}


function get_spawnable_pos() {
    for (let i = 0; i < MAX_ITER; i++) {
        const direction = new THREE.Vector3().randomDirection().normalize();
        const height = get_pos_normalize_height(...direction);

        if (height < 0.45 || height > 0.75) continue;

        if (Math.abs(get_pos_normal(...direction).dot(direction)) < 0.001) {
            const clamp_height = THREE.clamp(height, biome.water_height, 1)*biome.height_amplitude;
            
            direction.normalize().multiplyScalar(planet.radius + clamp_height);

            return direction;
        }
    }

    console.log('Could not find spawnable position');

    return null;
}


function add_tree() {
    const pos = get_spawnable_pos();
    if (!pos) return;
    
    const random_tree_id = Math.floor(Math.random() * 6);
    let mesh = tree_meshes[random_tree_id].clone();
    
    addShader("tree",
        new THREE.ShaderMaterial({side: THREE.DoubleSide}),
        {map: mesh.material.map, projectionMatrixCamera: camera.projectionMatrix, viewMatrixCamera: camera.matrixWorldInverse}
    ).then(([shader, _]) => {
        mesh.position.copy(pos);
        mesh.scale.set(tree.scale, tree.scale, tree.scale);
        mesh.lookAt(0, 0, 0);
        mesh.rotateY(Math.PI);
        mesh.translateZ(10 * tree.scale);
        
        mesh.material = shader;

        scene.add(mesh);
    });

}


function add_trees() {
    for (let i = 0; i < tree.n_trees; i++)
        add_tree();
}


function load_trees() {
    return;
    
    const tree_meshes = [];

    fbxLoader.load(
        'trees.fbx',
        (object) => {
            object.traverse(function(child) {
                if (child instanceof THREE.Mesh && child.name.includes('tree_'))
                    tree_meshes.push(child);
            });

            add_trees();
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (error) => console.error(error)
    )

    return tree_meshes;
}


export function update_trees() {
    const trees = scene.children.filter(child => child.name.includes('tree_'));
    trees.forEach(tree => scene.remove(tree));

    add_trees();
}