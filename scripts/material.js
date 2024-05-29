import * as THREE from 'three';


function add_shader(shader, material) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `./shaders/${shader}.glsl`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            material.fragmentShader = xhr.responseText;
            material.needsUpdate = true;
            material.uniforms.uSunPosition = { value: new THREE.Vector3() };
            material.uniforms.uTime = { value: 0 };
            material.uniforms.uLightIntensity = { value: 1.0 };
        }
    };
    xhr.send();
}


export function create_material(heights) {
    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        vertexShader: `
            varying float vHeight;
            varying vec3 worldPosition;
            varying vec3 vNormal;
            uniform mat4 model;

            void main() {
                float heights[${heights.length}] = float[${heights.length}](${heights});

                vHeight = heights[int(gl_VertexID)];
                worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vNormal = normal;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        transparent: true,
    });
    add_shader("terrain_fragment", material);

    return material;
}