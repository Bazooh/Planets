export function addShader(shader, material = {}, uniforms = {}) {
    if (material.uniforms === undefined) material.uniforms = {};

    Object.entries(uniforms).forEach(([key, value]) => {
        material.uniforms[key] = { value: value };
    });

    const vertexPromise = fetch(`./shaders/${shader}_vertex.glsl`)
        .then((response) => response.text())
        .then((data) => {
            material.vertexShader = data;
            material.needsUpdate = true;

            return material;
    });
    
    const fragmentPromise = fetch(`./shaders/${shader}_fragment.glsl`)
        .then((response) => response.text())
        .then((data) => {
            material.fragmentShader = data;
            material.needsUpdate = true;

            return material;
    });

    material.isShaderMaterial = true;

    return Promise.all([vertexPromise, fragmentPromise]);
}