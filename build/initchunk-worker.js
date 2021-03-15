import { vec3 } from "./vector.js";
import { noise3 } from "./noise.js";
import { Cuboid } from "./util.js";
import { TileType, TileArray } from "./worldgen.js";
onmessage = function (e) {
    var offset = e.data[0];
    var renderData = {
        verts: [],
        normals: [],
        uv: []
    };
    var tiles = new TileArray(new Cuboid(new vec3(offset.x * 64, offset.y * 64, offset.z * 64), new vec3(64, 64, 64)));
    tiles.initialize({
        generator: function (tile, position) {
            var stackedLayerNoise = noise3(position.divv(new vec3(32, 5, 32)));
            return (stackedLayerNoise > 0.05) ? TileType.FULL : TileType.EMPTY;
        }
    });
    tiles.appendRenderData(renderData);
    //@ts-ignore
    postMessage([renderData]);
};
