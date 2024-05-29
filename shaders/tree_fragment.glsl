uniform sampler2D map;

varying vec3 vNormal;
varying vec4 vWorldPosition;
varying vec4 vTexCoords;
varying vec2 vUv;


void main() {
    vec4 color = texture2D(map, 1.0*vUv);
    gl_FragColor = vec4(color.rgb, 1.0);
}