import { vec3 } from "./vector.js";

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function between(value: number, min: number, max: number) {
    return value == clamp(value, min, max);
}

export class Cuboid {
    readonly corner: vec3;
    readonly size: vec3;
    readonly corner2: vec3;

    constructor(corner: vec3, size: vec3) {
        this.corner = corner;
        this.size = size;
        this.corner2 = this.corner.add(this.size);
    }

    isInside (point: vec3) {
        return between(point.x, this.corner.x, this.corner2.x)
         && between(point.y, this.corner.y, this.corner2.y)
          && between(point.z, this.corner.z, this.corner2.z);
    }
}

interface Octreeable {
    position: vec3;
}



class OctreeNode<T extends Octreeable> {
    children: Array<OctreeNode<T>>
    data: Array<T>;
    area: Cuboid;
    halfArea: Cuboid;
    capacity: number;
    subdivided: boolean;

    constructor (data: Array<T>, area: Cuboid, capacity: number) {
        this.data = data;
        this.area = area;
        this.halfArea = new Cuboid(
            this.area.corner,
            this.area.size.mult(0.5)
        );
        this.children = [];
        this.capacity = capacity;
        this.subdivided = false;
    }

    getChildIndex(datum: T) {
        return ((datum.position.x > this.halfArea.corner2.x) ? 1 : 0)
         + ((datum.position.y > this.halfArea.corner2.y) ? 2 : 0)
         + ((datum.position.z > this.halfArea.corner2.z) ? 4 : 0);
    }

    subdivide () {
        this.subdivided = true;
        let newDataIndeces: Array<number> = this.data.map(datum => {
            return this.getChildIndex(datum);
        });

        this.children.length = 8;
        this.children = this.children.map((child, index) => {
            let childArea: Cuboid = new Cuboid(
                this.area.corner.add(new vec3(
                    (index % 2) ? this.halfArea.size.x : 0,
                    ((index >> 1) % 2) ? this.halfArea.size.y : 0,
                    ((index >> 2) % 2) ? this.halfArea.size.z : 0
                )),
                this.halfArea.size
            );
            return new OctreeNode([], childArea, this.capacity);
        });

        newDataIndeces.forEach((childIndex, index) => {
            this.children[childIndex].data.push(this.data[index]);
        });
        this.data = [];
    }

    insert (datum: T) {
        if (this.subdivided) {
            this.children[this.getChildIndex(datum)].insert(datum);
        } else {
            if (this.data.length == this.capacity) {
                this.data.push(datum);
                this.subdivide();
            }
        }
    }
}
