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
