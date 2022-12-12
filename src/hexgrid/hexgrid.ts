import * as THREE from 'three'

// Hexagon Alignment Mode
/*
 *    +---+       
 *   /     \     Pointy up is rotated by 30deg     
 *   \     /           
 *    +---+           
 *   Flat Up
 */
const HexAlignmentMode = {
	PointyUp: "PointyUp",
	FlatUp: "FlatUp"
};

// https://catlikecoding.com/unity/tutorials/hex-map/part-1/
class HexGrid {

	outerRadius: number;
	innerRadius: number;
	gridSize: number;
	lastIndex: number | null;
	geometry: THREE.BufferGeometry;
	material: THREE.MeshBasicMaterial;
	mesh: THREE.InstancedMesh;
	topLeft: THREE.Vector3;
	/*
	 * outerRadius : Specifies the outer radius of unit hexagon (bounding circle)
	 * gridSize    : Specifies the total grid size of tiled hexagon
	 * hexAlignMode: Defines hexagon alignment mode (only support PointyUp now)
	 */
	constructor(outerRadius = 1, gridSize = 10) {
		this.outerRadius = outerRadius;

		// innerRadius = outerRadius * (sqrt(3) / 2)
		this.innerRadius = this.outerRadius * 0.866025404;

		this.gridSize = gridSize;
		this.lastIndex = null;
		// Initialize vertices
		const positions = [
			0.0, 0.0, 0.0,
			0.0, 0.0, this.outerRadius,
			this.innerRadius, 0.0, 0.5 * this.outerRadius,
			this.innerRadius, 0.0, -0.5 * this.outerRadius,
			0.0, 0.0, -this.outerRadius,
			-this.innerRadius, 0.0, -0.5 * this.outerRadius,
			-this.innerRadius, 0.0, 0.5 * this.outerRadius];

		// Create hexagon mesh
		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		this.geometry.setIndex([
			1, 2, 0,
			2, 3, 0,
			3, 4, 0,
			4, 5, 0,
			5, 6, 0,
			6, 1, 0]);

		// Default MeshBasicMaterial
		this.material = new THREE.MeshBasicMaterial({ wireframe: false });
		this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.gridSize * this.gridSize);
		this.topLeft = this.getWorldSize().multiplyScalar(-0.5);
		this.generateMeshGrid();
	};

	setMaterial(material: THREE.Material) {
		this.mesh.material = material;
	}

	getWorldSize(): THREE.Vector3 {
		return new THREE.Vector3(this.gridSize * this.innerRadius * 2.0, 0.0,
			this.gridSize * this.outerRadius * 1.5);
	}

	// Coordinate Conversion Functions
	/* We will be using mainly two coordinate system
	 *  1. Offset Coordinate
	 *  2. Cube Coordinate (Helps to find neighbour)
	 */

	// Given an offset coordinate like that in 2D grid it can be used to retrive
	// the worldposition where that particular grid end up
	convertOffsetToWorldPosition(p: THREE.Vector3) {
		const px = this.topLeft.x + (p.x + p.z * 0.5 - Math.floor(p.z / 2)) * this.innerRadius * 2.0;
		const pz = this.topLeft.z + p.z * this.outerRadius * 1.5;
		return new THREE.Vector3(px, 0, pz);
	}

	// Given a cube coordinate of hexgrid it can be used to retrive the world position
	// where that particular grid end up
	convertCubeToWorldCoordinate(p: THREE.Vector3): THREE.Vector3 {
		return this.convertOffsetToWorldPosition(this.convertCubeToOffsetCoordinate(p));
	}

	// Given a cube coordinate it can be used to retrive the 
	// index to the uniform buffer (matrix and color)
	// @NOTE Currently not used
	convertCubeToIndex(p: THREE.Vector3): number {
		// Calculate offset coordinate
		const offset = p.x + Math.floor(p.z / 2);
		//if (offset < 0.0 || offset >= this.gridSize || p.z < 0.0 || p.z > this.gridSize)
		//return null;
		return p.z * this.gridSize + p.x + Math.floor(p.z / 2);
	}

	// Given a cube coordinate it can be used to generate offset coordinate
	convertCubeToOffsetCoordinate(p: THREE.Vector3) {
		const x = p.x + Math.floor(p.z / 2);
		return new THREE.Vector3(x, p.y, p.z);
	}

	// Reverse of gridToWorldCoordinate
	// Given a world coordinate this can be used to retrive the grid coordinate
	// of the hex that the point lies in

	convertToCubeCoordinate(position: THREE.Vector3) {
		// Undo translation
		position.x -= this.topLeft.x;
		position.y -= this.topLeft.y;
		position.z -= this.topLeft.z;

		let x = position.x / (this.innerRadius * 2.0);
		let y = -x;
		let offset = position.z / (this.outerRadius * 3.);
		x -= offset;
		y -= offset;

		let ix = Math.round(x);
		let iy = Math.round(y);
		let iz = Math.round(-x - y);

		if (ix + iy + iz !== 0) {
			let dx = Math.abs(x - ix);
			let dy = Math.abs(y - iy);
			let dz = Math.abs(-x - y - iz);

			if (dx > dy && dx > dz) {
				ix = -iy - iz;
			}
			else if (dz > dy) {
				iz = -ix - iy;
			}
			else
				iy = -ix - iz;
		}


		if (!this.isInRange(new THREE.Vector3(ix, iy, iz)))
			return null;

		//const offsetX = ix + Math.floor(iz / 2);
		return new THREE.Vector3(ix, iy, iz);
	}

	// Check if the coordinate is within the range of gridSize
	isInRange(cubeCoord: THREE.Vector3) {
		const offsetX = cubeCoord.x + Math.floor(cubeCoord.z / 2);
		if (offsetX < 0.0 || offsetX >= this.gridSize || cubeCoord.z < 0.0 || cubeCoord.z >= this.gridSize)
			return false;
		return true;
	}

	generateMeshGrid() {
		let transform = new THREE.Object3D();
		for (let z = 0; z < this.gridSize; ++z) {
			for (let x = 0; x < this.gridSize; ++x) {

				let p = this.convertOffsetToWorldPosition(new THREE.Vector3(x, 0, z));
				transform.position.set(p.x, 0.0, p.z);
				transform.updateMatrix();

				this.mesh.setMatrixAt(z * this.gridSize + x, transform.matrix);
				this.mesh.setColorAt(z * this.gridSize + x, new THREE.Color(Math.random(), Math.random(), Math.random()));
			}
		}
		this.mesh.instanceMatrix.needsUpdate = true;
	}

	// Get neighbour in CubeCoordinate
	findNeighbour(p: THREE.Vector3) {
		let { x, y, z } = p;
		let neighbours: THREE.Vector3[] = [];
		neighbours.push(new THREE.Vector3(x + 1, y, z)); // right (0deg)
		neighbours.push(new THREE.Vector3(x - 1, y, z)); // left (180deg)
		neighbours.push(new THREE.Vector3(x, y, z + 1)); // top  (-60deg)
		neighbours.push(new THREE.Vector3(x, y, z - 1)); // bottom (120deg)
		neighbours.push(new THREE.Vector3(x + 1, y, z - 1)); // diag1 (60deg)
		neighbours.push(new THREE.Vector3(x - 1, y, z + 1)); // diag2 (-120deg)
		return neighbours;
	}

	setColorAt(index: number, color: THREE.Color) {
		if (index) {
			this.mesh.setColorAt(index, color);
			this.mesh!.instanceColor!.needsUpdate = true;
		}
	}

	/*
	 * Find intersection with hexgrid plane and
	 * returns the hex grid coordinate
	 */
	getIntersection(ray: THREE.Ray) {
		let origin = ray.origin.clone();
		let direction = ray.direction.clone();
		// Ray Plane Intersection
		// equation of plane is Ax + By + Cz + d  = 0
		// dot(N, p) = - d
		// dot(N, o + t * dir) = -d (substituting N = (0, 1, 0))
		// t = (-d - o.y) / dir.y
		let t = -origin.y / direction.y;
		let p = origin.add(direction.multiplyScalar(t));
		return this.convertToCubeCoordinate(p);
	}
}

export { HexGrid, HexAlignmentMode };
