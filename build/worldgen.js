var _a, _b, _c;
import { vec3 } from "./vector.js";
export var TileType;
(function (TileType) {
    TileType[TileType["EMPTY"] = 0] = "EMPTY";
    TileType[TileType["FULL"] = 1] = "FULL";
})(TileType || (TileType = {}));
;
export var Direction;
(function (Direction) {
    Direction[Direction["LEFT"] = 0] = "LEFT";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["UP"] = 2] = "UP";
    Direction[Direction["DOWN"] = 3] = "DOWN";
    Direction[Direction["BACKWARD"] = 4] = "BACKWARD";
    Direction[Direction["FORWARD"] = 5] = "FORWARD";
})(Direction || (Direction = {}));
; //XMinus, XPlus, YMinus, YPlus, ZMinus, ZPlus
var directionOffsets = (_a = {},
    _a[Direction.LEFT] = new vec3(-1, 0, 0),
    _a[Direction.RIGHT] = new vec3(1, 0, 0),
    _a[Direction.UP] = new vec3(0, -1, 0),
    _a[Direction.DOWN] = new vec3(0, 1, 0),
    _a[Direction.BACKWARD] = new vec3(0, 0, -1),
    _a[Direction.FORWARD] = new vec3(0, 0, 1),
    _a);
var TileArray = /** @class */ (function () {
    function TileArray(volume) {
        this.initialized = false;
        this.volume = volume;
        this.tiles = [];
        for (var x = 0; this.volume.size.x > x; x++) {
            this.tiles.push([]);
            for (var y = 0; this.volume.size.y > y; y++) {
                this.tiles[x].push([]);
                for (var z = 0; this.volume.size.z > z; z++) {
                    this.tiles[x][y].push(TileType.EMPTY);
                }
            }
        }
    }
    TileArray.prototype.forTiles = function (callback) {
        for (var x = 0; this.volume.size.x > x; x++) {
            for (var y = 0; this.volume.size.y > y; y++) {
                for (var z = 0; this.volume.size.z > z; z++) {
                    callback(this.tiles[x][y][z], new vec3(x, y, z));
                }
            }
        }
    };
    TileArray.prototype.mapTiles = function (callback) {
        for (var x = 0; this.volume.size.x > x; x++) {
            for (var y = 0; this.volume.size.y > y; y++) {
                for (var z = 0; this.volume.size.z > z; z++) {
                    this.tiles[x][y][z] = callback(this.tiles[x][y][z], new vec3(x, y, z));
                }
            }
        }
    };
    TileArray.prototype.setTile = function (position, state) {
        this.tiles[position.x][position.y][position.z] = state;
    };
    TileArray.prototype.getTile = function (position) {
        return this.tiles[position.x][position.y][position.z];
    };
    TileArray.prototype.getAdjacent = function (position, direction) {
        var position2 = position.add(directionOffsets[direction]);
        return this.tiles[position2.x][position2.y][position2.z];
    };
    TileArray.prototype.hasAdjacent = function (position, direction) {
        if (position.x == 0 && direction == Direction.LEFT) {
            return false;
        }
        else if (position.x == this.volume.size.x - 1 && direction == Direction.RIGHT) {
            return false;
        }
        else if (position.y == 0 && direction == Direction.UP) {
            return false;
        }
        else if (position.y == this.volume.size.y - 1 && direction == Direction.DOWN) {
            return false;
        }
        else if (position.z == 0 && direction == Direction.BACKWARD) {
            return false;
        }
        else if (position.z == this.volume.size.z - 1 && direction == Direction.FORWARD) {
            return false;
        }
        return true;
    };
    TileArray.prototype.appendRenderData = function (rdata) {
        var _this = this;
        this.forTiles(function (tile, position) {
            [Direction.LEFT, Direction.RIGHT, Direction.UP, Direction.DOWN, Direction.BACKWARD, Direction.FORWARD].forEach(function (direction) {
                var addFace = function () {
                    var _a, _b, _c;
                    (_a = rdata.normals).push.apply(_a, TileArray.normalSets[direction]);
                    (_b = rdata.verts).push.apply(_b, TileArray.vertexSets[direction].map(function (vertex, index) {
                        return vertex + ([position.x + _this.volume.corner.x, position.y + _this.volume.corner.y, position.z + _this.volume.corner.z])[index % 3];
                    }));
                    (_c = rdata.uv).push.apply(_c, TileArray.blockUV);
                };
                if (tile != TileType.EMPTY) {
                    if (_this.hasAdjacent(position, direction)) {
                        if (_this.getAdjacent(position, direction) == TileType.EMPTY) {
                            addFace();
                        }
                    }
                    else {
                        addFace();
                    }
                }
            });
        });
        return rdata;
    };
    TileArray.prototype.initialize = function (gen) {
        for (var x = 0; this.volume.size.x > x; x++) {
            for (var y = 0; this.volume.size.y > y; y++) {
                for (var z = 0; this.volume.size.z > z; z++) {
                    this.tiles[x][y][z] = gen.generator(this.tiles[x][y][z], new vec3(x, y, z).add(this.volume.corner));
                }
            }
        }
        this.initialized = true;
    };
    TileArray.vertexSets = (_b = {},
        _b[Direction.LEFT] = [
            0, 0, 0, 0, 1, 0, 0, 0, 1,
            0, 1, 1, 0, 1, 0, 0, 0, 1,
        ],
        _b[Direction.RIGHT] = [
            1, 0, 0, 1, 1, 0, 1, 0, 1,
            1, 1, 1, 1, 1, 0, 1, 0, 1,
        ],
        _b[Direction.UP] = [
            0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 1, 1, 0, 0, 0, 0, 1
        ],
        _b[Direction.DOWN] = [
            0, 1, 0, 1, 1, 0, 0, 1, 1,
            1, 1, 1, 1, 1, 0, 0, 1, 1
        ],
        _b[Direction.BACKWARD] = [
            0, 0, 0, 1, 0, 0, 0, 1, 0,
            1, 1, 0, 1, 0, 0, 0, 1, 0
        ],
        _b[Direction.FORWARD] = [
            0, 0, 1, 1, 0, 1, 0, 1, 1,
            1, 1, 1, 1, 0, 1, 0, 1, 1
        ],
        _b);
    TileArray.normalSets = (_c = {},
        _c[Direction.LEFT] = [
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
        ],
        _c[Direction.RIGHT] = [
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        ],
        _c[Direction.UP] = [
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        ],
        _c[Direction.DOWN] = [
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        ],
        _c[Direction.BACKWARD] = [
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        ],
        _c[Direction.FORWARD] = [
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        ],
        _c);
    TileArray.blockUV = [
        0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1
    ];
    return TileArray;
}());
export { TileArray };
