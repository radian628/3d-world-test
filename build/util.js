import { vec3 } from "./vector.js";
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function between(value, min, max) {
    return value == clamp(value, min, max);
}
var Cuboid = /** @class */ (function () {
    function Cuboid(corner, size) {
        this.corner = corner;
        this.size = size;
        this.corner2 = this.corner.add(this.size);
    }
    Cuboid.prototype.isInside = function (point) {
        return between(point.x, this.corner.x, this.corner2.x)
            && between(point.y, this.corner.y, this.corner2.y)
            && between(point.z, this.corner.z, this.corner2.z);
    };
    return Cuboid;
}());
export { Cuboid };
var OctreeNode = /** @class */ (function () {
    function OctreeNode(data, area, capacity) {
        this.data = data;
        this.area = area;
        this.halfArea = new Cuboid(this.area.corner, this.area.size.mult(0.5));
        this.children = [];
        this.capacity = capacity;
        this.subdivided = false;
    }
    OctreeNode.prototype.getChildIndex = function (datum) {
        return ((datum.position.x > this.halfArea.corner2.x) ? 1 : 0)
            + ((datum.position.y > this.halfArea.corner2.y) ? 2 : 0)
            + ((datum.position.z > this.halfArea.corner2.z) ? 4 : 0);
    };
    OctreeNode.prototype.subdivide = function () {
        var _this = this;
        this.subdivided = true;
        var newDataIndeces = this.data.map(function (datum) {
            return _this.getChildIndex(datum);
        });
        this.children.length = 8;
        this.children = this.children.map(function (child, index) {
            var childArea = new Cuboid(_this.area.corner.add(new vec3((index % 2) ? _this.halfArea.size.x : 0, ((index >> 1) % 2) ? _this.halfArea.size.y : 0, ((index >> 2) % 2) ? _this.halfArea.size.z : 0)), _this.halfArea.size);
            return new OctreeNode([], childArea, _this.capacity);
        });
        newDataIndeces.forEach(function (childIndex, index) {
            _this.children[childIndex].data.push(_this.data[index]);
        });
        this.data = [];
    };
    OctreeNode.prototype.insert = function (datum) {
        if (this.subdivided) {
            this.children[this.getChildIndex(datum)].insert(datum);
        }
        else {
            if (this.data.length == this.capacity) {
                this.data.push(datum);
                this.subdivide();
            }
        }
    };
    return OctreeNode;
}());
var Vec3LookupTable = /** @class */ (function () {
    function Vec3LookupTable() {
        this.contents = new Map();
    }
    Vec3LookupTable.prototype.get = function (v) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.contents) === null || _a === void 0 ? void 0 : _a.get(v.x)) === null || _b === void 0 ? void 0 : _b.get(v.y)) === null || _c === void 0 ? void 0 : _c.get(v.z);
    };
    Vec3LookupTable.prototype.set = function (v, data) {
        var yMap = this.contents.has(v.x) ? this.contents.get(v.x) : this.contents.set(v.x, new Map()).get(v.x);
        var zMap = yMap.has(v.y) ? yMap.get(v.y) : yMap.set(v.y, new Map()).get(v.y);
        zMap.set(v.z, data);
    };
    Vec3LookupTable.prototype["delete"] = function (v) {
        var yMap = this.contents.get(v.x);
        var zMap = yMap.get(v.y);
        zMap["delete"](v.z);
        if (zMap.size == 0) {
            yMap["delete"](v.y);
            if (yMap.size == 0) {
                this.contents["delete"](v.x);
            }
        }
    };
    Vec3LookupTable.prototype.has = function (v) {
        if (!this.contents.has(v.x))
            return false;
        if (!this.contents.get(v.x).has(v.y))
            return false;
        if (!this.contents.get(v.x).get(v.y).has(v.z))
            return false;
        return true;
    };
    Vec3LookupTable.prototype.forEach = function (callback) {
        this.contents.forEach(function (yMap, x) {
            yMap.forEach(function (zMap, y) {
                zMap.forEach(function (value, z) {
                    callback(value, new vec3(x, y, z));
                });
            });
        });
    };
    return Vec3LookupTable;
}());
export { Vec3LookupTable };
