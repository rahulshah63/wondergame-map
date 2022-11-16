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
    1000
  )
  camera.position.set(0, -30, 20)
  camera.lookAt(0, 0, 0)

  scene = new THREE.Scene()

  const light = new THREE.HemisphereLight(0xffffff, 0x000000, 2)
  light.position.set(0, 10, 10)
  scene.add(light)

  const geometry = new THREE.CircleGeometry(0.5, 6, Math.PI / 2, Math.PI * 2)
  const texture = new THREE.TextureLoader().load("assets/hex-texture-png.png")
  const material = new THREE.MeshStandardMaterial({ map: texture })
  // const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const hexCount = 40000
  const hexRow = 200 //Math.sqrt(hexCount)
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
        matrix.makeTranslation(columnOffset, rowOffset, 0)
      } else {
        matrix.makeTranslation(columnOffset, rowOffset, 0)
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
