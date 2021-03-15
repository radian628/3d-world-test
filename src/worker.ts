import { vec3 } from "./vector.js";
import { noise3 } from "./noise.js";
import { Cuboid, Vec3LookupTable } from "./util.js";
import { TileType, Direction, TileArray, RenderData } from "./worldgen.js";

const chunkSize = 64;

export enum MessageType {
    LOAD,
    LOAD_RESPONSE,
    GENERATE_SEND_BUFFER,
    SEND_BUFFER_RESPONSE
}

let chunks: Vec3LookupTable<TileArray> = new Vec3LookupTable();

function loadChunk(payload) {
    let chunkPosition: vec3 = vec3.from(payload.chunk);

    if (!chunks.has(chunkPosition)) {
        let loadedChunk = new TileArray(new Cuboid(chunkPosition.mult(chunkSize), new vec3(chunkSize, chunkSize, chunkSize)));

        chunks.set(chunkPosition, loadedChunk);

        loadedChunk.initialize({
            generator: (tile, position) => {
                let stackedLayerNoise = noise3(position.divv(new vec3(32, 7, 32)));
                return  (stackedLayerNoise > 0.05) ? TileType.FULL : TileType.EMPTY;
            }
        });

        chunks.forEach((tileArray, vector) => {
            console.log(vector, tileArray);
        });

        //@ts-ignore
        postMessage({ messageType: MessageType.LOAD_RESPONSE, payload: { chunk: chunkPosition } });
    }
}

function generateAndSendBuffer(payload) {
    let chunkPosition: vec3 = vec3.from(payload.chunk);

    if (!chunks.has(chunkPosition)) {
        //console.log("THIS SHOULDVE BEEN GEENRATAED SKDJFLSDJFSDK")
        loadChunk(payload);
    }
    
    let chunk: TileArray = chunks.get(chunkPosition);

    let renderData: RenderData = {
        verts: [],
        normals: [],
        uv: []
    }

    chunk.appendRenderData(renderData);

    let tVerts = new Float32Array(renderData.verts)
    let tNormals = new Float32Array(renderData.normals)
    let tUV = new Float32Array(renderData.uv)

    //@ts-ignore
    postMessage({ messageType: MessageType.SEND_BUFFER_RESPONSE, payload: { 
        chunk: chunkPosition,
        vertex: tVerts,
        normal: tNormals,
        UV: tUV
    //@ts-ignore
    } }, [tVerts.buffer, tNormals.buffer, tUV.buffer]);
}



onmessage = function(e) {
    // let offset = e.data[0];

    // let renderData: RenderData = {
    //     verts: [],
    //     normals: [],
    //     uv: []
    // }

    // let tiles = new TileArray(new Cuboid(new vec3(offset.x * 64, offset.y * 64, offset.z * 64), new vec3(64, 64, 64)));
    // tiles.initialize({
    //     generator: (tile, position) => {
    //         let stackedLayerNoise = noise3(position.divv(new vec3(32, 7, 32)));
    //         return  (stackedLayerNoise > 0.05) ? TileType.FULL : TileType.EMPTY;
    //     }
    // });
    // tiles.appendRenderData(renderData);
    
    // //@ts-ignore
    // postMessage([renderData]);
    let message = e.data;
    switch (message.messageType) {
        case MessageType.LOAD:
            loadChunk(message.payload);
            break;
        case MessageType.GENERATE_SEND_BUFFER:
            generateAndSendBuffer(message.payload);
            break;
    }

}