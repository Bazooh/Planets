varying float vHeight;
varying vec3 worldPosition;
varying vec3 vNormal;
uniform float uTime;
uniform vec3 uLightPos;
uniform float uLightIntensity;

const vec3 DEFAULT_COLOR = vec3(1.0);

const float water_height = 0.4; // value normalized to 0-1

const uint Snow          = 0u;
const uint UpperMontains = 1u;
const uint LowerMontains = 2u;
const uint UpperHills    = 3u;
const uint LowerHills    = 4u;
const uint Beach         = 5u;
const uint ShallowOcean  = 6u;
const uint DeepOcean     = 7u;


const uint biomes_from_height_idx[20] = uint[](
    DeepOcean, DeepOcean, DeepOcean, DeepOcean, DeepOcean, DeepOcean,
    ShallowOcean, ShallowOcean,
    Beach,
    LowerHills, LowerHills, LowerHills, LowerHills,
    UpperHills, UpperHills,
    LowerMontains, LowerMontains,
    UpperMontains, UpperMontains,
    Snow
);


float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}


vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}


vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}


vec4 permute(vec4 x) {
    return mod289(((x*34.0)+10.0)*x);
}


vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}


float snoise(vec3 v) { 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    i = mod289(i); 
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

    vec4 x = x_*ns.x + ns.yyyy;
    vec4 y = y_*ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}


vec3 get_snow_color(float height) {
    const vec3 snow_color = vec3(0.89, 0.86, 0.85);

    return snow_color;
}


vec3 get_upper_montains_color(float height) {
    const vec3 upper_montains_color = vec3(0.22, 0.13, 0.10);

    return upper_montains_color;
}


vec3 get_lower_montains_color(float height) {
    const vec3 lower_montains_color = vec3(0.36, 0.19, 0.13);

    return lower_montains_color;
}


vec3 get_upper_hills_color(float height) {
    const vec3 upper_hills_color = vec3(0.15, 0.48, 0.04);
    const vec3 lower_hills_color = vec3(0.27, 0.73, 0.13);

    float depth = 10.0*(height - 0.65);

    vec3 color = mix(lower_hills_color, upper_hills_color, depth);

    return color;
}


vec3 get_lower_hills_color(float height) {
    const vec3 lower_hills_color = vec3(0.27, 0.73, 0.13);

    return lower_hills_color;
}


vec3 get_beach_color(float height) {
    const vec3 dark_beach_color = vec3(0.88, 0.85, 0.5);
    const vec3 light_beach_color = vec3(0.94, 0.97, 0.66);

    float random_value = random(vec2(float(int(worldPosition.x*10.0)), float(int(worldPosition.z*10.0))));
    
    return mix(dark_beach_color, light_beach_color, random_value);
}


vec3 get_ocean_color(float height) {
    const vec3 water_shallow_color = vec3(0.28, 0.59, 1.0);
    const vec3 water_deep_color = vec3(0.01, 0.08, 0.99);

    float depth = 2.5*height; // value in [0-1] (0 = deep, 1 = shallow)
    const float x_surface_noise_speed = 0.8;
    const float y_surface_noise_speed = 0.8;

    float surface_noise = 0.8*snoise(vec3(worldPosition.x + x_surface_noise_speed*uTime, worldPosition.z + y_surface_noise_speed*uTime, 0.5*uTime) * 0.3)
                        + 0.2*snoise(vec3(worldPosition.x + x_surface_noise_speed*uTime, worldPosition.z + y_surface_noise_speed*uTime, 0.5*uTime) * 0.5);
    if (surface_noise > 0.8) {
        return vec3(0.9, 0.9, 1.0);
    }

    float wave_noise = 0.0;
    if (depth > 0.9) {
        float wave_delay_offset = (snoise(vec3(worldPosition.x, worldPosition.z, 5.0*uTime) * 0.1) + 1.0) / 2.0;
        wave_noise = 5.0*(sin(2.5*uTime + 5.0*wave_delay_offset + 10.0*depth) + 1.0)*(depth - 0.9)*10.0*(depth - 0.9);
    }

    vec3 color = mix(water_deep_color, water_shallow_color, depth);
    color = mix(color, vec3(0.9, 0.9, 1.0), wave_noise);

    return color;
}


uint get_biome_from_normalized_height(float height) {
    int height_idx = int(height * 20.0);
    return biomes_from_height_idx[height_idx];
}


vec3 get_color_from_biome(float height) {
    bool is_water = height < water_height;

    height += snoise(vec3(worldPosition.x, worldPosition.z, 0.0) * 0.05) * 0.1;
    if (!is_water) {
        height = max(height, water_height);
    }

    uint biome = get_biome_from_normalized_height(height);

    switch (biome) {
        case Snow:          return get_snow_color(height);
        case UpperMontains: return get_upper_montains_color(height);
        case LowerMontains: return get_lower_montains_color(height);
        case UpperHills:    return get_upper_hills_color(height);
        case LowerHills:    return get_lower_hills_color(height);
        case Beach:         return get_beach_color(height);
        case ShallowOcean:  return get_ocean_color(height);
        case DeepOcean:     return get_ocean_color(height);
    }
    return DEFAULT_COLOR;
}


vec3 get_color_from_normalized_height(float height) {
    return get_color_from_biome(height);
}


vec3 apply_lighting(vec3 color) {
    const vec3 lightColor = vec3(1.0);
    const float specularStrength = 0.5;
    const float shininess = 32.0;

    vec3 lightDir = normalize(uLightPos - worldPosition);
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor * uLightIntensity;

    vec3 result = diffuse * color;

    return result;
}


void main() {
    vec3 color = get_color_from_normalized_height(vHeight);
    color = apply_lighting(color);

    gl_FragColor = vec4(color, 1);
}