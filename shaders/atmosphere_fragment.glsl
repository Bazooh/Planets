uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float uTime;
uniform vec3 uSunPosition;
uniform vec3 uCameraPosition;

uniform vec3 uScatteringCoefficients;
uniform float uAtmosphereHeight;
uniform float uSunIntensity;
uniform vec3 uSunColor;
uniform float uEarthRadius;
uniform int uRayNumberOfPoints;
uniform float uCloudsHeight;

uniform mat4 projectionMatrixInverse;
uniform mat4 viewMatrixInverse;

uniform float starsThreshold;
uniform float starsDensity;

uniform lowp sampler3D texture1;

varying vec2 vUv;

float invRayNumberOfPoints;

const float pi = 3.14159265359;


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


bool isAtmoshepere(float depth) {
    return depth == 0.0;
}


float cloudDensity(vec3 point) {
    return texture(texture1, fract(point / 2.0)).r * 2.0;
}


float density(vec3 point) {
    float altitude = length(point) - uEarthRadius;

    if (altitude < 0.0) {
        return 0.0;
    }

    return exp(-altitude / uAtmosphereHeight);
}


vec3 lightSample(float sampleOpticalDepth, vec3 startPoint, vec3 endPoint, bool clouds) {
    vec3 offset = (endPoint - startPoint) * invRayNumberOfPoints;

    vec3 samplePoint = startPoint + 0.5*offset;

    float sum = 0.0;
    for (int i = 0; i < uRayNumberOfPoints; i++) {
        sum += clouds ? cloudDensity(samplePoint) : density(samplePoint);
        samplePoint += offset;
    }
    float opticalDepth = sum * length(offset);

    return exp(-uScatteringCoefficients * 4e-2 * (sampleOpticalDepth + opticalDepth));
}


float phaseFunction(float cosThetaSquared) {
    const float coef = 3.0 / (16.0 * pi);
    return coef * (1.0 + cosThetaSquared);
}


vec3 scatteringPhaseFunction(float cosThetaSquared) {
    return uScatteringCoefficients * phaseFunction(cosThetaSquared);
}


bool intersectionRaySphere(vec3 origin, vec3 direction, vec3 center, float radius, out vec3 firstIntersection, out vec3 secondIntersection, out bool behind) {
    vec3 L = center - origin;
    float DT = dot(L, direction);
    float radiusSquared = radius * radius;
    float CT2 = dot(L,L) - DT*DT;
    
    // Intersection point outside the circle
    if (CT2 > radiusSquared)
        return false;
    
    float AT = sqrt(radiusSquared - CT2);

    firstIntersection = origin + (DT - AT)*direction;
    secondIntersection = origin + (DT + AT)*direction;

    behind = DT < 0.0;

    return true;
}


vec3 intensity(vec3 pos, vec3 dir, vec3 sunPosition) {
    vec3 atomsphereEntryPoint;
    vec3 atomsphereEndPoint;
    vec3 cloudsEntryPoint;
    bool behind;

    if (!intersectionRaySphere(pos, dir, vec3(0.0), uEarthRadius + uAtmosphereHeight, atomsphereEntryPoint, atomsphereEndPoint, behind)) {
        return vec3(0.0);
    }

    vec3 planetEntryPoint;
    vec3 planetEndPoint;
    if (intersectionRaySphere(pos, dir, vec3(0.0), uEarthRadius, planetEntryPoint, planetEndPoint, behind)) {
        if (!behind)
            return vec3(0.0);
        
        atomsphereEntryPoint = planetEndPoint;
    }

    float cos_theta = dot(normalize(sunPosition - pos), normalize(atomsphereEndPoint - atomsphereEntryPoint));
    vec3 offset = (atomsphereEndPoint - atomsphereEntryPoint) * invRayNumberOfPoints;

    vec3 samplePoint = atomsphereEntryPoint; // Maybe there is an error here if the ray is inside the atmosphere;
    float sampleLength = length(offset);

    vec3 sum = vec3(0.0);
    float sampleOpticalDepth = 0.0;
    for (int i = 0; i < uRayNumberOfPoints; i++) {
        vec3 sampleDirection = normalize(sunPosition - samplePoint);

        intersectionRaySphere(samplePoint, sampleDirection, vec3(0.0), uEarthRadius + uAtmosphereHeight, atomsphereEntryPoint, atomsphereEndPoint, behind);
        if (!intersectionRaySphere(samplePoint, sampleDirection, vec3(0.0), uEarthRadius, planetEntryPoint, planetEndPoint, behind) || behind) {
            vec3 light = lightSample(sampleOpticalDepth, samplePoint, atomsphereEndPoint, false) * density(samplePoint);
            sum += light;
        }

        // if (dot(samplePoint, samplePoint) >= uCloudsHeight * uCloudsHeight)
        //     cloudsEntryPoint = samplePoint;
        // else
        //     intersectionRaySphere(samplePoint, sampleDirection, vec3(0.0), uEarthRadius + uCloudsHeight, atomsphereEntryPoint, cloudsEntryPoint, behind);
        
        // sum += lightSample(sampleOpticalDepth, cloudsEntryPoint, atomsphereEndPoint, true) * cloudDensity(cloudsEntryPoint);

        samplePoint += offset;
        sampleOpticalDepth += density(samplePoint) * sampleLength;
    }

    return uSunIntensity * uSunColor * scatteringPhaseFunction(pow(cos_theta, 2.0)) * sum * sampleLength;
}


vec3 getLookingDirection() {
    vec4 clipSpaceCoordinate = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec4 viewSpaceCoordinate = projectionMatrixInverse * clipSpaceCoordinate;
    viewSpaceCoordinate /= viewSpaceCoordinate.w;
    vec4 worldSpaceCoordinates = viewMatrixInverse * viewSpaceCoordinate;

    return normalize(worldSpaceCoordinates.xyz);
}


vec3 atmosphereColor(vec3 sunPosition, vec3 lookingDirection) {
    const vec3 sunColor = vec3(1.0, 0.97, 0.38);

    // vec3 pos = vec3(0.0, uEarthRadius, 0.0);
    vec3 pos = uCameraPosition;
    vec3 sky = intensity(pos, lookingDirection, sunPosition);

    float cos_theta = dot(normalize(sunPosition - pos), lookingDirection);
    if (cos_theta > 0.99) {
        return mix(sky, sunColor, (cos_theta - 0.99) * (cos_theta - 0.99) * 10000.0);
    }

    return sky;
}


vec3 starsColor(vec3 color, vec3 lookingDirection, float time) {
    float atmosphereIntensity = dot(color, vec3(0.299, 0.587, 0.114));

    float stars = snoise(lookingDirection * starsDensity) > starsThreshold ? 1.0 : 0.0;

    return mix(color, vec3(1.0), stars * 0.5 * clamp(1.0 - 1.0*atmosphereIntensity, 0.0, 1.0));
}


void main() {
    invRayNumberOfPoints = 1.0 / float(uRayNumberOfPoints);

    vec4 diffuse = texture2D(tDiffuse, vUv);
    float depth = texture2D(tDepth, vUv).r;

    if (isAtmoshepere(depth)) {
        vec3 lookingDirection = getLookingDirection();

        vec3 color = atmosphereColor(uSunPosition, lookingDirection);
        color = starsColor(color, lookingDirection, uTime / 1000.0);
        gl_FragColor = vec4(color, 1.0);
        return;
    }

    gl_FragColor = vec4(diffuse.rgb, 1.0);
}