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
    vec2.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };
    vec2.fromPolar = function (dir, mag) {
        return new vec2(Math.cos(dir) * mag, Math.sin(dir) * mag);
    };
    return vec2;
}());
export { vec2 };
var vec3 = /** @class */ (function () {
    function vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    vec3.prototype.add = function (v) {
        return new vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    vec3.prototype.sub = function (v) {
        return new vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    vec3.prototype.mult = function (s) {
        return new vec3(this.x * s, this.y * s, this.z * s);
    };
    vec3.prototype.div = function (s) {
        return new vec3(this.x / s, this.y / s, this.z / s);
    };
    vec3.prototype.multv = function (v) {
        return new vec3(this.x * v.x, this.y * v.y, this.z * v.z);
    };
    vec3.prototype.divv = function (v) {
        return new vec3(this.x / v.x, this.y / v.y, this.z / v.z);
    };
    vec3.prototype.mag = function () {
        return Math.hypot(this.x, this.y, this.z);
    };
    vec3.prototype.dir = function () {
        return Math.atan2(this.y, this.x);
    };
    vec3.prototype.unit = function () {
        return this.div(this.mag());
    };
    vec3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    vec3.prototype.multm = function (m) {
        return new vec3(this.dot(m.row1), this.dot(m.row2), this.dot(m.row3));
    };
    vec3.prototype.asArray = function () {
        return [this.x, this.y, this.z];
    };
    vec3.prototype.cross = function (v) {
        return new vec3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
    };
    return vec3;
}());
export { vec3 };
var quat = /** @class */ (function () {
    function quat(real, i, j, k) {
        this.real = real;
        this.i = i;
        this.j = j;
        this.k = k;
    }
    quat.prototype.add = function (q) {
        return new quat(this.real + q.real, this.i + q.i, this.j + q.j, this.k + q.k);
    };
    quat.prototype.sub = function (q) {
        return new quat(this.real - q.real, this.i - q.i, this.j - q.j, this.k - q.k);
    };
    quat.prototype.mult = function (s) {
        return new quat(this.real * s, this.i * s, this.j * s, this.k * s);
    };
    quat.prototype.div = function (s) {
        return new quat(this.real / s, this.i / s, this.j / s, this.k / s);
    };
    quat.prototype.multq = function (q) {
        return new quat(this.real * q.real - this.i * q.i - this.j * q.j - this.k * q.k, this.real * q.i + this.i * q.real + this.j * q.k - this.k * q.j, this.real * q.j - this.i * q.k + this.j * q.real + this.k * q.i, this.real * q.k + this.i * q.j - this.j * q.i + this.k * q.real);
    };
    quat.prototype.mag = function () {
        return Math.hypot(this.real, this.i, this.j, this.k);
    };
    quat.prototype.norm2 = function () {
        return this.real * this.real + this.i * this.i + this.j * this.j + this.k * this.k;
    };
    quat.prototype.conjugate = function () {
        return new quat(this.real, -this.i, -this.j, -this.k);
    };
    quat.prototype.unit = function () {
        return this.div(this.mag());
    };
    quat.prototype.inverse = function () {
        return this.conjugate().div(this.norm2());
    };
    quat.fromV3 = function (s, v) {
        return new quat(s, v.x, v.y, v.z);
    };
    quat.fromAngleAxis = function (angle, axis) {
        var halfAngle = angle / 2;
        return new quat(Math.cos(halfAngle), Math.sin(halfAngle) * axis.x, Math.sin(halfAngle) * axis.y, Math.sin(halfAngle) * axis.z);
    };
    quat.prototype.toMatrix = function () {
        var r2 = this.real * this.real * 2;
        var i2 = this.i * this.i * 2;
        var j2 = this.j * this.j * 2;
        var k2 = this.k * this.k * 2;
        var ri = this.real * this.i * 2;
        var rj = this.real * this.j * 2;
        var rk = this.real * this.k * 2;
        var ij = this.i * this.j * 2;
        var ik = this.i * this.k * 2;
        var jk = this.j * this.k * 2;
        return new mat3(new vec3(1 - j2 - k2, ij - rk, ik + rj), new vec3(ij + rk, 1 - i2 - k2, jk - ri), new vec3(ik - rj, jk + ri, 1 - r2 - i2));
    };
    quat.prototype.rotate = function (v) {
        var resultq = this.multq(quat.fromV3(0, v)).multq(this.inverse());
        return new vec3(resultq.i, resultq.j, resultq.k);
    };
    quat.prototype.asArray = function () {
        return [this.real, this.i, this.j, this.k];
    };
    return quat;
}());
export { quat };
var mat3 = /** @class */ (function () {
    function mat3(row1, row2, row3) {
        this.row1 = row1;
        this.row2 = row2;
        this.row3 = row3;
    }
    mat3.prototype.transposed = function () {
        return new mat3(new vec3(this.row1.x, this.row2.x, this.row3.x), new vec3(this.row1.y, this.row2.y, this.row3.y), new vec3(this.row1.z, this.row2.z, this.row3.z));
    };
    mat3.prototype.add = function (m) {
        return new mat3(this.row1.add(m.row1), this.row2.add(m.row2), this.row3.add(m.row3));
    };
    mat3.prototype.sub = function (m) {
        return new mat3(this.row1.sub(m.row1), this.row2.sub(m.row2), this.row3.sub(m.row3));
    };
    mat3.prototype.mult = function (s) {
        return new mat3(this.row1.mult(s), this.row2.mult(s), this.row3.mult(s));
    };
    mat3.prototype.multm = function (m) {
        var mt = m.transposed();
        return new mat3(new vec3(this.row1.dot(mt.row1), this.row1.dot(mt.row2), this.row1.dot(mt.row3)), new vec3(this.row2.dot(mt.row1), this.row2.dot(mt.row2), this.row2.dot(mt.row3)), new vec3(this.row3.dot(mt.row1), this.row3.dot(mt.row2), this.row3.dot(mt.row3)));
    };
    mat3.identity = new mat3(new vec3(1, 0, 0), new vec3(0, 1, 0), new vec3(0, 0, 1));
    return mat3;
}());
export { mat3 };
