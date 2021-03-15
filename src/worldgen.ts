import { vec3 } from "./vector.js";
import { clamp, between, Cuboid } from "./util.js";

export enum TileType {
    EMPTY,
    FULL
};

export enum Direction {
    LEFT, RIGHT, UP, DOWN, BACKWARD, FORWARD
}; //XMinus, XPlus, YMinus, YPlus, ZMinus, ZPlus

let directionOffsets = {
    [Direction.LEFT]: new vec3(-1, 0, 0),
    [Direction.RIGHT]: new vec3(1, 0, 0),
    [Direction.UP]: new vec3(0, -1, 0),
    [Direction.DOWN]: new vec3(0, 1, 0),
    [Direction.BACKWARD]: new vec3(0, 0, -1),
    [Direction.FORWARD]: new vec3(0, 0, 1),
}

export interface ForTilesCallback {
    (tile: TileType, position: vec3): void
}

export interface MapTilesCallback {
    (tile: TileType, position: vec3): TileType
}

export interface TerrainGenerator {
    generator: MapTilesCallback;
}

export type RenderData = {
    verts: Array<number>;
    normals: Array<number>;
    uv: Array<number>;
}

export class TileArray {
    volume: Cuboid;
    tiles: Array<Array<Array<TileType>>>;
    initialized: boolean;

    static vertexSets = {
        [Direction.LEFT]: [
            0, 0, 0,    0, 1, 0,    0, 0, 1,
            0, 1, 1,    0, 1, 0,    0, 0, 1,
        ],
        [Direction.RIGHT]: [
            1, 0, 0,    1, 1, 0,    1, 0, 1,
            1, 1, 1,    1, 1, 0,    1, 0, 1,
        ],
        [Direction.UP]: [
            0, 0, 0,    1, 0, 0,    0, 0, 1,
            1, 0, 1,    1, 0, 0,    0, 0, 1
        ],
        [Direction.DOWN]: [
            0, 1, 0,    1, 1, 0,    0, 1, 1,
            1, 1, 1,    1, 1, 0,    0, 1, 1
        ],
        [Direction.BACKWARD]: [
            0, 0, 0,    1, 0, 0,    0, 1, 0,
            1, 1, 0,    1, 0, 0,    0, 1, 0
        ],
        [Direction.FORWARD]: [
            0, 0, 1,    1, 0, 1,    0, 1, 1,
            1, 1, 1,    1, 0, 1,    0, 1, 1
        ]
    }

    static normalSets = {
        [Direction.LEFT]: [
            -1, 0, 0,     -1, 0, 0,     -1, 0, 0,     -1, 0, 0,     -1, 0, 0,     -1, 0, 0
        ],
        [Direction.RIGHT]: [
            1, 0, 0,     1, 0, 0,     1, 0, 0,     1, 0, 0,     1, 0, 0,     1, 0, 0,     
        ],
        [Direction.UP]: [
            0, -1, 0,      0, -1, 0,      0, -1, 0,      0, -1, 0,      0, -1, 0,      0, -1, 0,      
        ],
        [Direction.DOWN]: [
            0, 1, 0,      0, 1, 0,      0, 1, 0,      0, 1, 0,      0, 1, 0,      0, 1, 0,      
        ],
        [Direction.BACKWARD]: [
            0, 0, -1,     0, 0, -1,     0, 0, -1,     0, 0, -1,     0, 0, -1,     0, 0, -1,     
        ],
        [Direction.FORWARD]: [
            0, 0, 1,      0, 0, 1,      0, 0, 1,      0, 0, 1,      0, 0, 1,      0, 0, 1,      
        ]
    }

    static blockUV = [
        0, 0,     1, 0,     0, 1,      1, 1,     1, 0,     0, 1     
    ]

    constructor (volume: Cuboid) {
        this.initialized = false;
        this.volume = volume;
        this.tiles = [];
        for (let x = 0; this.volume.size.x > x; x++) {
            this.tiles.push([]);
            for (let y = 0; this.volume.size.y > y; y++) {
                this.tiles[x].push([]);
                for (let z = 0; this.volume.size.z > z; z++) {
                    this.tiles[x][y].push(TileType.EMPTY);
                }
            }
        }
    }

    forTiles(callback: ForTilesCallback) {
        for (let x = 0; this.volume.size.x > x; x++) {
            for (let y = 0; this.volume.size.y > y; y++) {
                for (let z = 0; this.volume.size.z > z; z++) {
                    callback(this.tiles[x][y][z], new vec3(x, y, z));
                }
            }
        }
    }

    mapTiles(callback: MapTilesCallback) {
        for (let x = 0; this.volume.size.x > x; x++) {
            for (let y = 0; this.volume.size.y > y; y++) {
                for (let z = 0; this.volume.size.z > z; z++) {
                    this.tiles[x][y][z] = callback(this.tiles[x][y][z], new vec3(x, y, z));
                }
            }
        }
    }

    setTile(position: vec3, state: TileType) {
        this.tiles[position.x][position.y][position.z] = state;
    }

    getTile(position: vec3) {
        return this.tiles[position.x][position.y][position.z];
    }

    getAdjacent(position: vec3, direction: Direction) {
        let position2 = position.add(directionOffsets[direction]);
        return this.tiles[position2.x][position2.y][position2.z];
    }
    
    hasAdjacent(position: vec3, direction: Direction) {
        if (position.x == 0 && direction == Direction.LEFT) {
            return false;
        } else if (position.x == this.volume.size.x-1 && direction == Direction.RIGHT) {
            return false;
        } else if (position.y == 0 && direction == Direction.UP) {
            return false;
        } else if (position.y == this.volume.size.y-1 && direction == Direction.DOWN) {
            return false;
        } else if (position.z == 0 && direction == Direction.BACKWARD) {
            return false;
        } else if (position.z == this.volume.size.z-1 && direction == Direction.FORWARD) {
            return false;
        }
        return true;
    }

    appendRenderData(rdata: RenderData): RenderData {
        this.forTiles((tile, position) => {
            [Direction.LEFT, Direction.RIGHT, Direction.UP, Direction.DOWN, Direction.BACKWARD, Direction.FORWARD].forEach((direction) => {
                let addFace = () => {
                    rdata.normals.push(
                        ...TileArray.normalSets[direction]
                        );
                    rdata.verts.push(...TileArray.vertexSets[direction].map((vertex, index) => {
                        return vertex + ([position.x + this.volume.corner.x, position.y + this.volume.corner.y, position.z + this.volume.corner.z])[index % 3];
                    }));
                    rdata.uv.push(...TileArray.blockUV);
                }
                if (tile != TileType.EMPTY) {
                    if (this.hasAdjacent(position, direction)) {
                        if (this.getAdjacent(position, direction) == TileType.EMPTY) {
                            addFace();
                        }
                    } else  {
                        addFace();
                    }
                }
            });
        });
        return rdata;
    }

    initialize (gen: TerrainGenerator): void {
        for (let x = 0; this.volume.size.x > x; x++) {
            for (let y = 0; this.volume.size.y > y; y++) {
                for (let z = 0; this.volume.size.z > z; z++) {
                    this.tiles[x][y][z] = gen.generator(this.tiles[x][y][z], new vec3(x, y, z).add(this.volume.corner));
                }
            }
        }
        this.initialized = true;
    }
}