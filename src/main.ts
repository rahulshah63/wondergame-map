import "./styles/main.css"
import * as THREE from "three"
import Stats from "three/examples/jsm/libs/stats.module.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

let mesh, camera, scene, renderer, controls, stats

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const color = new THREE.Color()
const white = new THREE.Color().setHex(0xffffff)

init()
animate()

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.set(0, 1, 0)
  camera.lookAt(0, 0, 0)

  scene = new THREE.Scene()

  const light = new THREE.HemisphereLight(0xffffff, 0x888888)
  light.position.set(0, 1, 0)
  scene.add(light)

  const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6, 1, false)
  const texture = new THREE.TextureLoader().load("assets/hex-texture.png")
  const material = new THREE.MeshStandardMaterial({ map: texture })
  const hexCount = 40000
  const hexRow = 200 //Math.sqrt(hexCount)
  // let offset = 0.5
  // let offsetW = 12
  // let offsetH = 12

  // let w = 0 - offsetW
  // let h = 0 - offsetH
  let i = 0
  const radius = 0.5

  mesh = new THREE.InstancedMesh(geometry, material, hexCount)

  const matrix = new THREE.Matrix4()

  for (let row = 0; row < hexRow; row++) {
    for (let column = 0; column < hexRow; column++) {
      // based on hex distance of radius 1
      let columnOffset = 2 * column * radius * Math.sin(Math.PI / 3)
      let rowOffset = 3 * row * radius * Math.cos(Math.PI / 3)
      //Adding Row Shift for a grid View
      // rowOffset = rowOffset - 1 - Math.cos(Math.PI / 3)
      if (row % 2 == 0) {
        //Adding Column Shift for a grid View
        columnOffset += radius * Math.sin(Math.PI / 3)
        matrix.makeTranslation(columnOffset, 0, rowOffset)
      } else {
        matrix.makeTranslation(columnOffset, 0, rowOffset)
      }
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, color)
      i++
    }
  }

  scene.add(mesh)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enableZoom = true
  controls.enablePan = true

  stats = new Stats()
  document.body.appendChild(stats.dom)

  window.addEventListener("resize", onWindowResize)
  document.addEventListener("mousemove", onMouseMove)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onMouseMove(event) {
  event.preventDefault()

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  raycaster.setFromCamera(mouse, camera)

  const intersection = raycaster.intersectObject(mesh)

  if (intersection.length > 0) {
    const instanceId = intersection[0].instanceId
    console.log({ instanceId })

    mesh.getColorAt(instanceId, color)

    if (color.equals(white)) {
      mesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff))

      mesh.instanceColor.needsUpdate = true
    }
  }

  render()

  stats.update()
}

function render() {
  renderer.render(scene, camera)
}
