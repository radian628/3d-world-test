import { quat, vec2, vec3 } from "./vector.js";
import { noise3, fractalNoise3 } from "./noise.js";
import { clamp, between, Cuboid } from "./util.js";
import { TileArray, TileType, Direction, RenderData } from "./worldgen.js"






class WorkerManager {
    threadCount: number;

    workers: Array<Worker>;

    constructor () {
        this.threadCount = navigator.hardwareConcurrency - 1;
        for (let i = 0; this.threadCount > i; i++) {
            this.workers.push(new Worker("./build/worker.js", { type: 'module' }));
        }
    }
}

function loadShader(gl: WebGL2RenderingContext, type, source: string) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compilation error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createShaderProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    const vShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Cannot create shader program: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

class CameraController {
    cameraSpeed: number;
    lockElem: HTMLElement;
    locked: boolean;
    rotation: quat;
    position: vec3 = new vec3(0, 0, 0);
    velocity: vec3 = new vec3(0, 0, 0);
    pressedKeys: object;
    acceleration: number;
    
    constructor (cameraSpeed: number, acceleration: number, lockElem: HTMLElement) {
        this.velocity = new vec3(0, 0, 0);
        this.cameraSpeed = cameraSpeed;
        this.lockElem = lockElem;
        this.locked = false;
        this.rotation = new quat(0, 0, 0, 1);
        this.acceleration = acceleration;
        this.lockElem.addEventListener("click", () => {
            this.lockElem.requestPointerLock();
        });

        this.pressedKeys = {};

        document.addEventListener("pointerlockchange", evt => {
            this.locked = document.pointerLockElement === this.lockElem;
        });

        this.lockElem.addEventListener("mousemove", evt => {
            if (this.locked) {
                let up = this.rotation.rotate(new vec3(0, 0, -1));
                let right = this.rotation.rotate(new vec3(0, -1, 0));

                this.rotation = quat.fromAngleAxis(this.cameraSpeed * evt.movementY, up).multq(this.rotation);
                this.rotation = quat.fromAngleAxis(this.cameraSpeed * evt.movementX, right).multq(this.rotation);
                this.rotation = this.rotation.unit();
            }
        });

        document.addEventListener("keydown", evt => {
            this.pressedKeys[evt.key.toUpperCase()] = true;
        });
        document.addEventListener("keyup", evt => {
            this.pressedKeys[evt.key.toUpperCase()] = false;
        });
    }

    doPhysicsStep() {

        let accel = new vec3(0, 0, 0);

        if (this.pressedKeys["W"]) {
            accel = accel.add(new vec3(-1, 0, 0));
        }
        if (this.pressedKeys["A"]) {
            accel = accel.add(new vec3(0, 0, 1));
        }
        if (this.pressedKeys["S"]) {
            accel = accel.add(new vec3(1, 0, 0));
        }
        if (this.pressedKeys["D"]) {
            accel = accel.add(new vec3(0, 0, -1));
        }
        if (this.pressedKeys[" "]) {
            accel = accel.add(new vec3(0, -1, 0));
        }
        if (this.pressedKeys["SHIFT"]) {
            accel = accel.add(new vec3(0, 1, 0));
        }

        if (accel.mag() != 0) {
            let accelTransformed = this.rotation.rotate(accel).unit().mult(this.acceleration);
            this.velocity = this.velocity.add(new vec3(
                accelTransformed.z,
                -accelTransformed.y,
                accelTransformed.x,
            ));
        }
        this.position = this.position.add(this.velocity);
        this.velocity = this.velocity.mult(0.9);
    }
}

let img = new Image();

let renderData: RenderData = {
    verts: [],
    normals: [],
    uv: []
}

img.onload = function () {
    let time = Date.now();

    console.log("loaded");
    
    let workerPromises = [];
    let t2 = 0;
    for (let i = 0; 16 > i; i++) {
        let worker = new Worker("./build/worker.js", { type: 'module' });
        workerPromises.push(new Promise(resolve => {
            worker.onmessage = e => {
                let time = Date.now();
                resolve(0);
                let newRenderData = e.data[0];
                for (let i = 0; newRenderData.verts.length > i; i++) {
                    renderData.verts.push(newRenderData.verts[i]);
                }
                for (let i = 0; newRenderData.normals.length > i; i++) {
                    renderData.normals.push(newRenderData.normals[i]);
                }
                for (let i = 0; newRenderData.uv.length > i; i++) {
                    renderData.uv.push(newRenderData.uv[i]);
                }
                t2 += (Date.now() - time);
                console.log("TIME TAKEN TO CONCAT ARRAY (cumulative): ", t2);
            }
        }));
        worker.postMessage([new vec3(i % 4, 0, (i >> 2) % 4)]);
        
        // let tiles = new TileArray(new Cuboid(new vec3((i % 2) * 64, 0, ((i >> 1) % 2) * 64), new vec3(64, 64, 64)));
        // tiles.initialize({
        //     generator: (tile, position) => {
        //         let stackedLayerNoise = noise3(position.divv(new vec3(32, 5, 32)));
        //         return  (stackedLayerNoise > 0.05) ? TileType.FULL : TileType.EMPTY;
        //     }
        // });
        // tiles.appendRenderData(renderData);
    }
    Promise.all(workerPromises).then(() => {
        console.log("TIME TAKEN TO GENERATE CHUNKS: ", Date.now() - time);
        main();
    });
}
img.src = "test_texture.png";

function main() {

    



    let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
    let cameraController = new CameraController(0.001, 0.06, canvas);
    cameraController.position = new vec3(0, 0, -6);
    
    
    
    let gl = canvas.getContext("webgl2");
    
    if (gl === null) {
        window.alert("Get a better browser you dinosaur! Mozilla Firefox or Google Chrome are likely your best choices.");
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener("resize", resizeCanvas);

    const vertexShaderSource = `
        attribute vec4 vertexPosition;
        attribute vec3 surfaceNormal;
        attribute vec2 UV;

        uniform mat4 projectionMatrix;
        uniform vec4 modelViewRotation;
        uniform vec3 modelViewTranslation;

        varying lowp vec2 uv;
        varying lowp vec3 normal;
        varying mediump float depth;

        vec3 qtransform(vec4 q, vec3 v) {
            return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
        }

        void main() {
            vec4 posBeforeProjection = vec4(qtransform(modelViewRotation, vertexPosition.xyz + modelViewTranslation), 1.0);
            gl_Position = projectionMatrix * posBeforeProjection;
            uv = UV;
            normal = surfaceNormal;
            depth = -posBeforeProjection.z;
        }
    `;

    const fragmentShaderSource = `
        uniform sampler2D img;

        varying lowp vec2 uv;
        varying lowp vec3 normal;
        varying mediump float depth;

        void main() {
            lowp vec3 normal2 = normal * 0.5 + vec3(0.5);
            gl_FragColor = vec4(((normal2.x * 0.8 + normal2.y * 0.5 + normal2.z * 0.3) * texture2D(img, uv).rgb + normal * 0.3) * (1.0 - depth / 100.0), 1.0);
        }
    `;

    const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    const locations = {
        UV: gl.getAttribLocation(shaderProgram, "UV"),
        surfaceNormal: gl.getAttribLocation(shaderProgram, "surfaceNormal"),
        vertexPosition: gl.getAttribLocation(shaderProgram, "vertexPosition"),
        projectionMatrix: gl.getUniformLocation(shaderProgram, "projectionMatrix"),
        modelViewRotation: gl.getUniformLocation(shaderProgram, "modelViewRotation"),
        modelViewTranslation: gl.getUniformLocation(shaderProgram, "modelViewTranslation")
    };

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderData.verts), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderData.normals), gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderData.uv), gl.STATIC_DRAW);

    //const indexBuffer = gl.createBuffer();

    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elementData), gl.STATIC_DRAW);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        locations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(
        locations.vertexPosition
    );


    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(
        locations.surfaceNormal,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(
        locations.surfaceNormal
    );


    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(
        locations.UV,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(
        locations.UV
    );


    gl.useProgram(shaderProgram);


    let near = 0.01;
    let far = 100;

    console.log("TOTAL VERTEX COUNT: ", renderData.verts.length);



    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    let t = 0;
    setInterval(() => {

        gl.uniformMatrix4fv(
            locations.projectionMatrix,
            false,
            [
                0.5 * window.innerHeight / window.innerWidth, 0, 0, 0, 
                0, 0.5, 0, 0, 
                0, 0, -far / (far - near), -1, 
                0, 0, -far *near / (far - near), 0
            ].map(a => a * 1.0)
        );

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        t++;

        cameraController.doPhysicsStep();
        let rotquat = cameraController.rotation.asArray();//quat.fromAngleAxis(Math.PI / 2 + t * 0.02, new vec3(1, 0, 0).unit()).asArray();
    
        gl.uniform4fv(
            locations.modelViewRotation,
            rotquat
        );

        gl.uniform3fv(
            locations.modelViewTranslation,
            cameraController.position.asArray()//[0, 0, -6]
        )
    
        gl.drawArrays(gl.TRIANGLES, 0, renderData.verts.length);
    }, 16);
}
