uniform mat4 projectionMatrixCamera;
uniform mat4 viewMatrixCamera;

varying vec3 vNormal;
varying vec4 vWorldPosition;
varying vec4 vTexCoords;
varying vec2 vUv;


void main() {
    vNormal = mat3(modelMatrix) * normal;
    vWorldPosition = modelMatrix * vec4(position, 1.0);
    vTexCoords = projectionMatrix * viewMatrix * vWorldPosition;
    vUv = position.xy*0.5 + 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}