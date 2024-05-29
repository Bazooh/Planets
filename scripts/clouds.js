import * as THREE from 'three';


export const clouds_param = {
    n_pixels: new THREE.Vector3(64, 64, 64),
    n_points: new THREE.Vector3(8, 8, 8),
}

let noise = warleyNoise(clouds_param.n_points);
let dataTexture;
updateDataTexture()


function updateDataTexture() {
    const dataArray = new Uint8Array(clouds_param.n_pixels.x * clouds_param.n_pixels.y * clouds_param.n_pixels.z * 4);

    for (let i = 0; i < clouds_param.n_pixels.x; i++) {
        for (let j = 0; j < clouds_param.n_pixels.y; j++) {
            for (let k = 0; k < clouds_param.n_pixels.z; k++) {
                const value = Math.round(noise(i, j, k) * 255);
                const index = (i * clouds_param.n_pixels.y * clouds_param.n_pixels.z + j * clouds_param.n_pixels.z + k) * 4;

                dataArray[index] = value;
                dataArray[index + 1] = value;
                dataArray[index + 2] = value;
                dataArray[index + 3] = 1.0;
            }
        }
    }

    dataTexture = new THREE.Data3DTexture(dataArray, clouds_param.n_pixels.x, clouds_param.n_pixels.y, clouds_param.n_pixels.z, THREE.RGBAFormat);
    dataTexture.needsUpdate = true;
}


function warleyNoise(n_points) {
    const points = new Array(n_points.x).fill(0).map(
        () => new Array(n_points.y).fill(0).map(
            () => new Array(n_points.z).fill(0).map(
                () => new THREE.Vector3(
                    Math.random(),
                    Math.random(),
                    Math.random()
                )
            )
        )
    )

    const cell_size = clouds_param.n_pixels.clone().divide(n_points);

    return (x, y, z) => {
        const cell = new THREE.Vector3(
            Math.floor(x / cell_size.x),
            Math.floor(y / cell_size.y),
            Math.floor(z / cell_size.z)
        );

        const local = new THREE.Vector3(
            (x % cell_size.x) / cell_size.x,
            (y % cell_size.y) / cell_size.y,
            (z % cell_size.z) / cell_size.z
        );

        let min_distance = 1.0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    let x = (cell.x + i + n_points.x) % n_points.x;
                    let y = (cell.y + j + n_points.y) % n_points.y;
                    let z = (cell.z + k + n_points.z) % n_points.z;

                    const point = new THREE.Vector3(i, j, k).add(points[x][y][z]);
                    const distance = point.distanceTo(local);

                    if (distance < min_distance) {
                        min_distance = distance;
                    }
                }
            }
        }

        return min_distance;
    }
}


export function getCloudsTexture() {
    return dataTexture;
}


export function updateCloudsNoise() {
    noise = warleyNoise(clouds_param.n_points);
}