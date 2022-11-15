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
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff })
  const hexCount = 40000
  const hexRow = 200 //Math.sqrt(hexCount)
  let offset = 0
  let offsetW = 12
  let offsetH = 12

  let w = 0 - offsetW
  let h = 0 - offsetH
  let i = 0

  mesh = new THREE.InstancedMesh(geometry, material, hexCount)

  const matrix = new THREE.Matrix4()
  // for (let i = 0; i < hexCount; i++) {
  //   // let randInst = Math.random() + i / 200000
  //   // let index = Math.floor(Math.random() * 20)

  //   // if (randInst < 0.95) {
  //   //   let randoColor2 = new THREE.Color("#A9A9A9")
  //   //   mesh.setColorAt(i, randoColor2)
  //   // } else {
  //   //   let randoColor3 = new THREE.Color("#292929")
  //   //   mesh.setColorAt(i, randoColor3)
  //   // }

  //   // match event
  //   // mesh.setColorAt(hexHi, new THREE.Color("#8ed645"))
  //   // mesh.setColorAt(hexHi + 1, new THREE.Color("#b5de2b"))
  //   // mesh.setColorAt(hexHi + 2, new THREE.Color("#ece51b"))

  //   // row by col
  //   if (i % hexRow == 0) {
  //     if (offset == 0) {
  //       offset = 1
  //       h++
  //       w = 0 - offsetW

  //       randomizeMatrix(matrix, w, h)
  //       mesh.setMatrixAt(i, matrix)
  //     } else {
  //       offset = 0
  //       h++
  //       w = 0.5 - offsetW

  //       randomizeMatrix(matrix, w, h)
  //       mesh.setMatrixAt(i, matrix)
  //     }
  //   } else {
  //     w++

  //     randomizeMatrix(matrix, w, h)
  //     mesh.setMatrixAt(i, matrix)
  //   }
  // }
  // console.log("Built " + hexCount + " hexagons...")
  // mesh.matrixAutoUpdate = false

  for (let x = 0; x < hexRow; x++) {
    for (let y = 0; y < hexRow; y++) {
      for (let z = 0; z < hexRow; z++) {
        matrix.makeTranslation(offset - x, offset - y, offset - z)

        mesh.setMatrixAt(i, matrix)
        mesh.setColorAt(i, color)

        i++
      }
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
