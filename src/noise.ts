import { vec3 } from "./vector.js";

//from https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
function mulberry32hash(a) {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function sfc32hash(a, b, c, d) {
    a |= 0; b |= 0; c |= 0; d |= 0;
    a = a << 16 | a >>> 16;
    b = b + c | 0;
    a = a + b | 0;
    c = c ^ b;
    c = c << 11 | c >>> 21;
    b = b ^ a;
    a = a + c | 0;
    b = c << 19 | c >>> 13;
    c = c + a | 0;
    d = d + 0x96a5 | 0;
    b = b + d | 0;
    return (a >>> 0) / 4294967296;
}

function lerp(x, a0, a1) {
    return a0 + (a1 - a0) * x;
}

function smoothstep(x) {
    return x * x * (3 - 2 * x);
}

function smoothstepLerp(x, a0, a1) {
    return a0 + smoothstep(x) * (a1 - a0);
}

function fract(x) {
    return x - Math.trunc(x);
}

// console.log(sfc32hash(234324, 23234230, 23420, 1232130));
// console.log(sfc32hash(20, 36450, 0, 0));
// console.log(sfc32hash(0, 3463560, 10, 0));

export function noise3(input: vec3): number {
    let intPoints = [];
    let xCeil = Math.ceil(input.x);
    let xFloor = Math.floor(input.x);
    let yCeil = Math.ceil(input.y);
    let yFloor = Math.floor(input.y);
    let zCeil = Math.ceil(input.z);
    let zFloor = Math.floor(input.z);
    for (let i = 0; 8 > i; i++) {
        let x = (i % 2) ? xCeil : xFloor;
        let y = ((i >> 1) % 2) ? yCeil : yFloor;
        let z = ((i >> 2) % 2) ? zCeil : zFloor;
        intPoints.push(new vec3(x, y, z));
    }

    let dots = [];
    for (let i = 0; 8 > i; i++) {
        let intPoint = intPoints[i];
        let offset = intPoint.sub(input);
        let ip2 = intPoint.mult(234234);
        let randVec = new vec3(sfc32hash(ip2.x * 122343, ip2.y * 2342, ip2.z*346, 111234245), sfc32hash(ip2.x*412, ip2.y*56, ip2.z*623,363565), sfc32hash(ip2.x*1237, ip2.y*5468, ip2.z*2349,12313)).sub(new vec3(0.5, 0.5, 0.5)).unit();
        dots.push(offset.dot(randVec));
    }

    let fracty = fract(input.y);
    let fractx = fract(input.x);

    return smoothstepLerp(
        fract(input.z),
        smoothstepLerp(
            fracty,
            smoothstepLerp(
                fractx,
                dots[0],
                dots[1]
            ),
            smoothstepLerp(
                fractx,
                dots[2],
                dots[3]
            
            )
        ),
        smoothstepLerp(
            fracty,
            smoothstepLerp(
                fractx,
                dots[4],
                dots[5]
            
            ),
            smoothstepLerp(
                fractx,
                dots[6],
                dots[7]
            
            )
        )
    )
}

export function fractalNoise3(input, octaves, lacunarity) {
    let sum = 0;
    for (let i = 0; octaves > i; i++) {
        sum += noise3(input.mult(Math.pow(lacunarity, i)));
    }
    return sum;
}