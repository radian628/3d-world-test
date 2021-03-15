import { quat, vec3 } from "./vector.js";
import { Vec3LookupTable } from "./util.js";
import { MessageType } from "./worker.js";
var WorkerManager = /** @class */ (function () {
    function WorkerManager(gl) {
        this.workers = [];
        this.gl = gl;
        this.threadCount = navigator.hardwareConcurrency - 1;
        this.loadedChunks = new Vec3LookupTable();
        this.loadedChunkCount = new Map();
        this.chunksToDraw = new Vec3LookupTable();
        for (var i = 0; this.threadCount > i; i++) {
            var worker = new Worker("./build/worker.js", { type: 'module' });
            this.loadedChunkCount.set(worker, 0);
            this.initListeners(worker);
            this.workers.push(worker);
        }
    }
    WorkerManager.prototype.draw = function (attribs) {
        var gl = this.gl;
        this.chunksToDraw.forEach(function (chunkData, position) {
            attribs.forEach(function (attribInfo) {
                gl.bindBuffer(gl.ARRAY_BUFFER, chunkData[WorkerManager.attribNameDict[attribInfo.attribName]]);
                gl.vertexAttribPointer(attribInfo.location, attribInfo.size, gl.FLOAT, false, attribInfo.stride, 0);
                gl.enableVertexAttribArray(attribInfo.location);
            });
            gl.drawArrays(gl.TRIANGLES, 0, chunkData.vertex.length);
        });
    };
    WorkerManager.prototype.addChunkToDrawList = function (chunk) {
        if (!this.chunksToDraw.has(chunk)) {
            this.chunksToDraw.set(chunk, this.loadedChunks.get(chunk));
        }
    };
    WorkerManager.prototype.removeChunkFromDrawList = function (chunk) {
        if (this.chunksToDraw.has(chunk)) {
            this.chunksToDraw["delete"](chunk);
        }
    };
    WorkerManager.prototype.initListeners = function (worker) {
        var _this = this;
        var gl = this.gl;
        worker.addEventListener("message", function (e) {
            var message = e.data;
            var payload = message.payload;
            switch (message.messageType) {
                case MessageType.SEND_BUFFER_RESPONSE:
                    var chunkData = _this.loadedChunks.get(payload.chunk);
                    chunkData.vertex = payload.vertex;
                    chunkData.normal = payload.normal;
                    chunkData.UV = payload.UV;
                    chunkData.glVertex = gl.createBuffer();
                    chunkData.glNormal = gl.createBuffer();
                    chunkData.glUV = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, chunkData.glVertex);
                    gl.bufferData(gl.ARRAY_BUFFER, chunkData.vertex, gl.STATIC_DRAW);
                    gl.bindBuffer(gl.ARRAY_BUFFER, chunkData.glNormal);
                    gl.bufferData(gl.ARRAY_BUFFER, chunkData.normal, gl.STATIC_DRAW);
                    gl.bindBuffer(gl.ARRAY_BUFFER, chunkData.glUV);
                    gl.bufferData(gl.ARRAY_BUFFER, chunkData.UV, gl.STATIC_DRAW);
                    _this.addChunkToDrawList(payload.chunk);
                    break;
            }
        });
    };
    WorkerManager.prototype.getLeastActiveWorker = function () {
        var leastActiveWorker;
        var leastActiveChunkCount = Infinity;
        this.loadedChunkCount.forEach(function (count, worker) {
            if (leastActiveChunkCount > count) {
                leastActiveChunkCount = count;
                leastActiveWorker = worker;
            }
        });
        return leastActiveWorker;
    };
    WorkerManager.prototype.loadChunk = function (chunk) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.loadedChunks.has(chunk)) {
                var leastActiveWorker_1 = _this.getLeastActiveWorker();
                _this.loadedChunks.set(chunk, {
                    glVertex: undefined,
                    glNormal: undefined,
                    glUV: undefined,
                    vertex: undefined,
                    normal: undefined,
                    UV: undefined,
                    worker: leastActiveWorker_1
                });
                _this.loadedChunkCount.set(leastActiveWorker_1, _this.loadedChunkCount.get(leastActiveWorker_1) + 1);
                var chunkLoadedListener_1 = function (e) {
                    if (e.data.messageType == MessageType.LOAD_RESPONSE && chunk.equals(e.data.payload.chunk)) {
                        leastActiveWorker_1.removeEventListener("message", chunkLoadedListener_1);
                        resolve();
                    }
                };
                leastActiveWorker_1.addEventListener("message", chunkLoadedListener_1);
                leastActiveWorker_1.postMessage({ messageType: MessageType.LOAD, payload: { chunk: chunk } });
            }
            else {
                resolve();
            }
        });
    };
    WorkerManager.prototype.generateChunkBuffers = function (chunk) {
        var chunkData = this.loadedChunks.get(chunk);
        //console.log(this.loadedChunks);
        var worker = chunkData.worker;
        worker.postMessage({ messageType: MessageType.GENERATE_SEND_BUFFER, payload: { chunk: chunk } });
    };
    WorkerManager.prototype.allocateChunkBuffers = function (chunk) {
    };
    WorkerManager.prototype.generateAndAllocateChunkBuffers = function (chunk) {
    };
    WorkerManager.attribNameDict = {
        "vertexPosition": "glVertex",
        "surfaceNormal": "glNormal",
        "UV": "glUV"
    };
    return WorkerManager;
}());
function loadShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compilation error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
function createShaderProgram(gl, vertexSource, fragmentSource) {
    var vShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Cannot create shader program: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}
var CameraController = /** @class */ (function () {
    function CameraController(cameraSpeed, acceleration, lockElem) {
        var _this = this;
        this.position = new vec3(0, 0, 0);
        this.velocity = new vec3(0, 0, 0);
        this.velocity = new vec3(0, 0, 0);
        this.cameraSpeed = cameraSpeed;
        this.lockElem = lockElem;
        this.locked = false;
        this.rotation = new quat(0, 0, 0, 1);
        this.acceleration = acceleration;
        this.lockElem.addEventListener("click", function () {
            _this.lockElem.requestPointerLock();
        });
        this.pressedKeys = {};
        document.addEventListener("pointerlockchange", function (evt) {
            _this.locked = document.pointerLockElement === _this.lockElem;
        });
        this.lockElem.addEventListener("mousemove", function (evt) {
            if (_this.locked) {
                var up = _this.rotation.rotate(new vec3(0, 0, -1));
                var right = _this.rotation.rotate(new vec3(0, -1, 0));
                _this.rotation = quat.fromAngleAxis(_this.cameraSpeed * evt.movementY, up).multq(_this.rotation);
                _this.rotation = quat.fromAngleAxis(_this.cameraSpeed * evt.movementX, right).multq(_this.rotation);
                _this.rotation = _this.rotation.unit();
            }
        });
        document.addEventListener("keydown", function (evt) {
            _this.pressedKeys[evt.key.toUpperCase()] = true;
        });
        document.addEventListener("keyup", function (evt) {
            _this.pressedKeys[evt.key.toUpperCase()] = false;
        });
    }
    CameraController.prototype.doPhysicsStep = function () {
        var accel = new vec3(0, 0, 0);
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
            var accelTransformed = this.rotation.rotate(accel).unit().mult(this.acceleration);
            this.velocity = this.velocity.add(new vec3(accelTransformed.z, -accelTransformed.y, accelTransformed.x));
        }
        this.position = this.position.add(this.velocity);
        this.velocity = this.velocity.mult(0.9);
    };
    return CameraController;
}());
var img = new Image();
var renderData = {
    verts: [],
    normals: [],
    uv: []
};
img.onload = function () {
    var time = Date.now();
    console.log("loaded");
    // let workerPromises = [];
    // let t2 = 0;
    // for (let i = 0; 16 > i; i++) {
    //     let worker = new Worker("./build/worker.js", { type: 'module' });
    //     workerPromises.push(new Promise(resolve => {
    //         worker.onmessage = e => {
    //             let time = Date.now();
    //             resolve(0);
    //             let newRenderData = e.data[0];
    //             for (let i = 0; newRenderData.verts.length > i; i++) {
    //                 renderData.verts.push(newRenderData.verts[i]);
    //             }
    //             for (let i = 0; newRenderData.normals.length > i; i++) {
    //                 renderData.normals.push(newRenderData.normals[i]);
    //             }
    //             for (let i = 0; newRenderData.uv.length > i; i++) {
    //                 renderData.uv.push(newRenderData.uv[i]);
    //             }
    //             t2 += (Date.now() - time);
    //             console.log("TIME TAKEN TO CONCAT ARRAY (cumulative): ", t2);
    //         }
    //     }));
    //     worker.postMessage([new vec3(i % 4, 0, (i >> 2) % 4)]);
    //     // let tiles = new TileArray(new Cuboid(new vec3((i % 2) * 64, 0, ((i >> 1) % 2) * 64), new vec3(64, 64, 64)));
    //     // tiles.initialize({
    //     //     generator: (tile, position) => {
    //     //         let stackedLayerNoise = noise3(position.divv(new vec3(32, 5, 32)));
    //     //         return  (stackedLayerNoise > 0.05) ? TileType.FULL : TileType.EMPTY;
    //     //     }
    //     // });
    //     // tiles.appendRenderData(renderData);
    // }
    // Promise.all(workerPromises).then(() => {
    //     console.log("TIME TAKEN TO GENERATE CHUNKS: ", Date.now() - time);
    //     main();
    // });
    main();
};
img.src = "test_texture.png";
function main() {
    var canvas = document.getElementById("canvas");
    var cameraController = new CameraController(0.001, 0.06, canvas);
    cameraController.position = new vec3(0, 0, -6);
    var gl = canvas.getContext("webgl2");
    if (gl === null) {
        window.alert("Get a better browser you dinosaur! Mozilla Firefox or Google Chrome are likely your best choices.");
    }
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener("resize", resizeCanvas);
    var vertexShaderSource = "\n        attribute vec4 vertexPosition;\n        attribute vec3 surfaceNormal;\n        attribute vec2 UV;\n\n        uniform mat4 projectionMatrix;\n        uniform vec4 modelViewRotation;\n        uniform vec3 modelViewTranslation;\n\n        varying lowp vec2 uv;\n        varying lowp vec3 normal;\n        varying mediump float depth;\n\n        vec3 qtransform(vec4 q, vec3 v) {\n            return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n        }\n\n        void main() {\n            vec4 posBeforeProjection = vec4(qtransform(modelViewRotation, vertexPosition.xyz + modelViewTranslation), 1.0);\n            gl_Position = projectionMatrix * posBeforeProjection;\n            uv = UV;\n            normal = surfaceNormal;\n            depth = -posBeforeProjection.z;\n        }\n    ";
    var fragmentShaderSource = "\n        uniform sampler2D img;\n\n        varying lowp vec2 uv;\n        varying lowp vec3 normal;\n        varying mediump float depth;\n\n        void main() {\n            lowp vec3 normal2 = normal * 0.5 + vec3(0.5);\n            gl_FragColor = vec4(((normal2.x * 0.8 + normal2.y * 0.5 + normal2.z * 0.3) * texture2D(img, uv).rgb + normal * 0.3) * (1.0 - depth / 100.0), 1.0);\n        }\n    ";
    var shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    var locations = {
        UV: gl.getAttribLocation(shaderProgram, "UV"),
        surfaceNormal: gl.getAttribLocation(shaderProgram, "surfaceNormal"),
        vertexPosition: gl.getAttribLocation(shaderProgram, "vertexPosition"),
        projectionMatrix: gl.getUniformLocation(shaderProgram, "projectionMatrix"),
        modelViewRotation: gl.getUniformLocation(shaderProgram, "modelViewRotation"),
        modelViewTranslation: gl.getUniformLocation(shaderProgram, "modelViewTranslation")
    };
    var workerManager = new WorkerManager(gl);
    var _loop_1 = function (i) {
        //let worker = new Worker("./build/worker.js", { type: 'module' });
        var relativeChunkPos = new vec3(i % 4, 0, (i >> 2) % 4);
        workerManager.loadChunk(relativeChunkPos).then(function () {
            workerManager.generateChunkBuffers(relativeChunkPos);
        });
    };
    for (var i = 0; 16 > i; i++) {
        _loop_1(i);
    }
    // const positionBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderData.verts), gl.STATIC_DRAW);
    // const normalBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderData.normals), gl.STATIC_DRAW);
    // const uvBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(renderData.uv), gl.STATIC_DRAW);
    // //const indexBuffer = gl.createBuffer();
    // //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elementData), gl.STATIC_DRAW);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // gl.vertexAttribPointer(
    //     locations.vertexPosition,
    //     3,
    //     gl.FLOAT,
    //     false,
    //     0,
    //     0
    // );
    // gl.enableVertexAttribArray(
    //     locations.vertexPosition
    // );
    // gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // gl.vertexAttribPointer(
    //     locations.surfaceNormal,
    //     3,
    //     gl.FLOAT,
    //     false,
    //     0,
    //     0
    // );
    // gl.enableVertexAttribArray(
    //     locations.surfaceNormal
    // );
    // gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    // gl.vertexAttribPointer(
    //     locations.UV,
    //     2,
    //     gl.FLOAT,
    //     false,
    //     0,
    //     0
    // );
    // gl.enableVertexAttribArray(
    //     locations.UV
    // );
    gl.useProgram(shaderProgram);
    var near = 0.01;
    var far = 100;
    console.log("TOTAL VERTEX COUNT: ", renderData.verts.length);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    var t = 0;
    setInterval(function () {
        gl.uniformMatrix4fv(locations.projectionMatrix, false, [
            0.5 * window.innerHeight / window.innerWidth, 0, 0, 0,
            0, 0.5, 0, 0,
            0, 0, -far / (far - near), -1,
            0, 0, -far * near / (far - near), 0
        ].map(function (a) { return a * 1.0; }));
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        t++;
        cameraController.doPhysicsStep();
        var rotquat = cameraController.rotation.asArray(); //quat.fromAngleAxis(Math.PI / 2 + t * 0.02, new vec3(1, 0, 0).unit()).asArray();
        gl.uniform4fv(locations.modelViewRotation, rotquat);
        gl.uniform3fv(locations.modelViewTranslation, cameraController.position.asArray() //[0, 0, -6]
        );
        workerManager.draw([
            {
                location: gl.getAttribLocation(shaderProgram, "vertexPosition"),
                attribName: "vertexPosition",
                size: 3,
                stride: 0,
                type: gl.FLOAT
            },
            {
                location: gl.getAttribLocation(shaderProgram, "surfaceNormal"),
                attribName: "surfaceNormal",
                size: 3,
                stride: 0,
                type: gl.FLOAT
            },
            {
                location: gl.getAttribLocation(shaderProgram, "UV"),
                attribName: "UV",
                size: 2,
                stride: 0,
                type: gl.FLOAT
            }
        ]);
        // gl.drawArrays(gl.TRIANGLES, 0, renderData.verts.length);
    }, 16);
}
