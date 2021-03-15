interface vector<V extends vector<V>> {
    add(v: V): V;
    sub(v: V): V;
    mult(s: number): V;
    div(s: number): V;
    multv(v: V): V;
    divv(v: V): V;
    mag(): number;
    unit(): V;
    dot(v: V): number;
}

export class vec2 implements vector<vec2> {
    x: number;
    y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: vec2): vec2 {
        return new vec2(this.x + v.x, this.y + v.y);
    }

    sub(v: vec2): vec2 {
        return new vec2(this.x - v.x, this.y - v.y);
    }

    mult(s: number): vec2 {
        return new vec2(this.x * s, this.y * s);
    }

    div(s: number): vec2 {
        return new vec2(this.x / s, this.y / s);
    }

    multv(v: vec2): vec2 {
        return new vec2(this.x * v.x, this.y * v.y);
    }

    divv(v: vec2): vec2 {
        return new vec2(this.x / v.x, this.y / v.y);
    }

    mag(): number {
        return Math.hypot(this.x, this.y);
    }

    dir(): number {
        return Math.atan2(this.y, this.x);
    }

    unit(): vec2 {
        return this.div(this.mag());
    }

    dot(v: vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    static fromPolar(dir, mag): vec2 {
        return new vec2(Math.cos(dir) * mag, Math.sin(dir) * mag);
    }
}

interface vec3able {
    x: number;
    y: number;
    z: number;
}

export class vec3 implements vector<vec3> {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    add(v: vec3) {
        return new vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    
    sub(v: vec3): vec3 {
        return new vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    mult(s: number): vec3 {
        return new vec3(this.x * s, this.y * s, this.z * s);
    }

    div(s: number): vec3 {
        return new vec3(this.x / s, this.y / s, this.z / s);
    }

    multv(v: vec3): vec3 {
        return new vec3(this.x * v.x, this.y * v.y, this.z * v.z);
    }

    divv(v: vec3): vec3 {
        return new vec3(this.x / v.x, this.y / v.y, this.z / v.z);
    }

    mag(): number {
        return Math.hypot(this.x, this.y, this.z);
    }

    dir(): number {
        return Math.atan2(this.y, this.x);
    }

    unit(): vec3 {
        return this.div(this.mag());
    }

    dot(v: vec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    multm(m: mat3) {
        return new vec3(
            this.dot(m.row1),
            this.dot(m.row2),
            this.dot(m.row3)
        );
    }

    asArray(): Array<number> {
        return [this.x, this.y, this.z];
    }

    cross(v: vec3): vec3 {
        return new vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    equals(v: vec3): boolean {
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }

    static from(obj: vec3able) {
        return new vec3(obj.x, obj.y, obj.z);
    }
}



export class quat {
    real: number;
    i: number;
    j: number;
    k: number;

    constructor(real: number, i: number, j: number, k: number) {
        this.real = real;
        this.i = i;
        this.j = j;
        this.k = k;
    }

    add(q: quat) {
        return new quat(this.real + q.real, this.i + q.i, this.j + q.j, this.k + q.k);
    }

    sub(q: quat) {
        return new quat(this.real - q.real, this.i - q.i, this.j - q.j, this.k - q.k);
    }

    mult(s: number) {
        return new quat(this.real * s, this.i * s, this.j * s, this.k * s);
    }

    div(s: number) {
        return new quat(this.real / s, this.i / s, this.j / s, this.k / s);
    }

    multq(q: quat) {
        return new quat(
            this.real * q.real - this.i * q.i - this.j * q.j - this.k * q.k,
            this.real * q.i + this.i * q.real + this.j * q.k - this.k * q.j,
            this.real * q.j - this.i * q.k + this.j * q.real + this.k * q.i,
            this.real * q.k + this.i * q.j - this.j * q.i + this.k * q.real
        );
    }

    mag() {
        return Math.hypot(this.real, this.i, this.j, this.k);
    }

    norm2() {
        return this.real * this.real + this.i * this.i + this.j * this.j + this.k * this.k;
    }

    conjugate() {
        return new quat(this.real, -this.i, -this.j, -this.k);
    }

    unit() {
        return this.div(this.mag());
    }

    inverse() {
        return this.conjugate().div(this.norm2());
    }

    static fromV3(s: number, v: vec3): quat {
        return new quat(s, v.x, v.y, v.z);
    }

    static fromAngleAxis(angle: number, axis: vec3) {
        let halfAngle = angle / 2;
        return new quat(
            Math.cos(halfAngle),
            Math.sin(halfAngle) * axis.x,
            Math.sin(halfAngle) * axis.y,
            Math.sin(halfAngle) * axis.z
        );
    }

    toMatrix() {
        const r2 = this.real * this.real * 2;
        const i2 = this.i * this.i * 2;
        const j2 = this.j * this.j * 2;
        const k2 = this.k * this.k * 2;

        const ri = this.real * this.i * 2;
        const rj = this.real * this.j * 2;
        const rk = this.real * this.k * 2;
        const ij = this.i * this.j * 2;
        const ik = this.i * this.k * 2;
        const jk = this.j * this.k * 2;

        return new mat3(
            new vec3(1 - j2 - k2, ij - rk, ik + rj),
            new vec3(ij + rk, 1 - i2 - k2, jk - ri),
            new vec3(ik - rj, jk + ri, 1 - r2 - i2)
        );
    }

    rotate(v: vec3): vec3 {
        let resultq = this.multq(quat.fromV3(0, v)).multq(this.inverse());
        return new vec3(resultq.i, resultq.j, resultq.k);
    }

    asArray(): Array<number> {
        return [this.real, this.i, this.j, this.k];
    }
}

export class mat3 {
    row1: vec3;
    row2: vec3;
    row3: vec3;

    constructor(row1: vec3, row2: vec3, row3: vec3) {
        this.row1 = row1;
        this.row2 = row2;
        this.row3 = row3;
    }

    transposed() {
        return new mat3(
            new vec3(this.row1.x, this.row2.x, this.row3.x),
            new vec3(this.row1.y, this.row2.y, this.row3.y),
            new vec3(this.row1.z, this.row2.z, this.row3.z)
        );
    }

    add(m: mat3) {
        return new mat3(
            this.row1.add(m.row1),
            this.row2.add(m.row2),
            this.row3.add(m.row3)
        );
    }

    sub(m: mat3) {
        return new mat3(
            this.row1.sub(m.row1),
            this.row2.sub(m.row2),
            this.row3.sub(m.row3)
        );
    }

    mult(s: number) {
        return new mat3(
            this.row1.mult(s),
            this.row2.mult(s),
            this.row3.mult(s)
        );
    }

    multm(m: mat3) {
        let mt = m.transposed();
        return new mat3(
            new vec3(this.row1.dot(mt.row1), this.row1.dot(mt.row2), this.row1.dot(mt.row3)), 
            new vec3(this.row2.dot(mt.row1), this.row2.dot(mt.row2), this.row2.dot(mt.row3)), 
            new vec3(this.row3.dot(mt.row1), this.row3.dot(mt.row2), this.row3.dot(mt.row3))
        );
    }
    
    static identity: mat3 = new mat3(
        new vec3(1, 0, 0),
        new vec3(0, 1, 0),
        new vec3(0, 0, 1)
    );
}