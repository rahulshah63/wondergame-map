import "./styles/main.css"
import * as THREE from "three"
import Stats from "three/examples/jsm/libs/stats.module.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import ExtendedInstancedMesh from "./extendedInstancedMesh"

let mesh: ExtendedInstancedMesh,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  stats: Stats

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const color = new THREE.Color()
const matrix = new THREE.Matrix4()
const white = new THREE.Color().setHex(0xffffff)

init()
animate()

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000000
  )
  camera.position.set(0, -1000, 2000) // y = -1000 for angle view, 2000 for zoom out
  camera.lookAt(0, 0, 0)

  scene = new THREE.Scene()

  const light = new THREE.HemisphereLight(0xffffff, 0x000000, 2)
  light.position.set(0, 10, 10)
  scene.add(light)

  //HEX GRID
  const hexCount = 40000
  const hexRow = 200 //Math.sqrt(hexCount)
  let i = 0
  const radius = 20

  const geometry = new THREE.CircleGeometry(radius, 6, Math.PI / 2, Math.PI * 2)
  // const texture = new THREE.TextureLoader().load("assets/hex-texture-png.png")
  // const material = new THREE.MeshStandardMaterial({ map: texture })
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  })

  mesh = new ExtendedInstancedMesh(geometry, material, hexCount)

  // const matrix = new THREE.Matrix4()

  for (let row = 0; row < hexRow; row++) {
    for (let column = 0; column < hexRow; column++) {
      let columnOffset = 2 * column * radius * Math.sin(Math.PI / 3)
      let rowOffset = 3 * row * radius * Math.cos(Math.PI / 3)

      if (row % 2 == 0) {
        //Adding Column Shift for a grid View
        columnOffset += radius * Math.sin(Math.PI / 3)
        matrix.makeTranslation(columnOffset, rowOffset, 0)
      } else {
        matrix.makeTranslation(columnOffset, rowOffset, 0)
      }

      // adding q,r,s to each hex mesh
      mesh.setQRS(i, { q: column, r: row, s: -column - row })

      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, color)
      i++
    }
  }
  mesh.translateX(-hexRow * radius * Math.sin(Math.PI / 3))
  mesh.translateY(-hexRow * radius + 1000) // DON'T Know why offset of 1000 is needed but it fits the land part of the map
  mesh.translateZ(10)

  console.log(mesh)
  scene.add(mesh)

  // Planer geometry
  /* Since the hex grid doesnot yiels square size because in this grid the :
    veticle height = cellHeight * hexRow = 2 * radius * hexRow
    horizontal width = cellWidth * hexRow = 2 * radius * Math.sin(Math.PI / 3) * hexRow

    So we need to create a planer geometry to fill the gap with size of the hex grid, for radius = 2
    height = 2 * 2 * 200 = 800
    width = 2 * 2 * Math.sin(Math.PI / 3) * 200 = 692.82

    map-resized = 8000 * 6928

    */

  const planeGeometry = new THREE.PlaneGeometry(
    2 * radius * hexRow,
    2 * radius * Math.sin(Math.PI / 3) * hexRow
  )
  const mapTexture = new THREE.TextureLoader().load("assets/map.png") // map-resized = 8000 * 6928
  const planeMaterial = new THREE.MeshBasicMaterial({
    map: mapTexture,
    side: THREE.DoubleSide,
  })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  // plane.translateX((2 * radius * hexRow) / 2 - radius)
  // plane.translateY((2 * radius * Math.sin(Math.PI / 3) * hexRow) / 2 - radius)
  scene.add(plane)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enableZoom = true
  controls.enablePan = true

  stats = Stats()
  document.body.appendChild(stats.dom)

  window.addEventListener("resize", onWindowResize)
  document.addEventListener("mousemove", onMouseMove)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onMouseMove(event: {
  preventDefault: () => void
  clientX: number
  clientY: number
}) {
  event.preventDefault()

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  hoverHex()

  render()

  stats.update()
}

function hoverHex() {
  raycaster.setFromCamera(mouse, camera)

  const intersection = raycaster.intersectObject(mesh)

  if (intersection.length > 0) {
    const instanceId = intersection[0].instanceId as number

    mesh.getColorAt(instanceId, color) //no return anything rather update var

    const { q, r, s } = mesh.getQRS(instanceId)
    console.log({ instanceId, q, r, s })

    if (color.equals(white)) {
      mesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff))
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true
      }
    }
  } else {
    // reset color
    for (let i = 0; i < mesh.count; i++) {
      mesh.getColorAt(i, color)
      if (!color.equals(white)) {
        mesh.setColorAt(i, color.setHex(0xffffff))
        mesh.instanceColor ? (mesh.instanceColor.needsUpdate = true) : null
      }
    }
  }
}

function render() {
  renderer.render(scene, camera)
}
