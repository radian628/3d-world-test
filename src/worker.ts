import { vec3 } from "./vector.js";
import { noise3 } from "./noise.js";
import { Cuboid } from "./util.js";
import { TileType, Direction, TileArray, RenderData } from "./worldgen.js";

onmessage = function(e) {
    let offset = e.data[0];

    let renderData: RenderData = {
        verts: [],
        normals: [],
        uv: []
    }

    let tiles = new TileArray(new Cuboid(new vec3(offset.x * 64, offset.y * 64, offset.z * 64), new vec3(64, 64, 64)));
    tiles.initialize({
        generator: (tile, position) => {
            let stackedLayerNoise = noise3(position.divv(new vec3(32, 7, 32)));
            return  (stackedLayerNoise > 0.05) ? TileType.FULL : TileType.EMPTY;
        }
    });
    tiles.appendRenderData(renderData);
    
    //@ts-ignore
    postMessage([renderData]);
}