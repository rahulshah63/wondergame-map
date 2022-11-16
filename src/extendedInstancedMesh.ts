import * as THREE from "three"

interface Hex {
  q: number
  r: number
  s: number
}

//extend THREE.InstancedMesh
class ExtendedInstancedMesh extends THREE.InstancedMesh {
  private _hexes: Hex[] = []
  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number
  ) {
    super(geometry, material, count)
    this._hexes = new Array<Hex>(count)
  }

  //add a method to the class
  public setQRS(index: number, hex: Hex) {
    this._hexes[index] = hex
  }

  public getQRS(index: number): Hex {
    return this._hexes[index]
  }
}

export default ExtendedInstancedMesh
