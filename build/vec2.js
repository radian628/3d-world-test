var vec2 = /** @class */ (function () {
    function vec2(x, y) {
        this.x = x;
        this.y = y;
    }
    vec2.prototype.add = function (v) {
        return new vec2(this.x + v.x, this.y + v.y);
    };
    vec2.prototype.sub = function (v) {
        return new vec2(this.x - v.x, this.y - v.y);
    };
    vec2.prototype.mult = function (s) {
        return new vec2(this.x * s, this.y * s);
    };
    vec2.prototype.div = function (s) {
        return new vec2(this.x / s, this.y / s);
    };
    vec2.prototype.multv = function (v) {
        return new vec2(this.x * v.x, this.y * v.y);
    };
    vec2.prototype.divv = function (v) {
        return new vec2(this.x / v.x, this.y / v.y);
    };
    vec2.prototype.mag = function () {
        return Math.hypot(this.x, this.y);
    };
    vec2.prototype.dir = function () {
        return Math.atan2(this.y, this.x);
    };
    vec2.prototype.unit = function () {
        return this.div(this.mag());
    };
    vec2.fromPolar = function (dir, mag) {
        return new vec2(Math.cos(dir) * mag, Math.sin(dir) * mag);
    };
    return vec2;
}());
export { vec2 };
