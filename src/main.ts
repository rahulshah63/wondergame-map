import "./styles/main.css"
import * as THREE from "three"
import { MapControls } from "three/examples/jsm/controls/OrbitControls.js"
import { HexGrid } from "./hexgrid/hexgrid.js"
import { DebugUtils } from "./debug/debug-utils"
import { Settings } from "./settings"
import { HexgridMaterial } from "./hexgrid/hexgrid-material"
import { ImageLoaderQueue } from "./utils/image-loader-queue"
import { TextureUtils, WebGLUtils } from "./utils/utils"
import { GPUTextureCopyUtils } from "./utils/texture-copy"
import { MeshBasicMaterial } from "three"
/**
 * Global Variables
 */
let mouse = new THREE.Vector2(0, 0)

// Check WebGL2 Support
// Needed for 2D Texture Array
if (!WebGLUtils.isWebGL2Available())
  document.body.appendChild(WebGLUtils.getWebGL2ErrorMessage())

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  Settings.fov,
  sizes.width / sizes.height,
  Settings.nearPlane,
  Settings.farPlane
)
camera.position.x = Settings.cameraPosition.x
camera.position.y = Settings.cameraPosition.y
camera.position.z = Settings.cameraPosition.z

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  //renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  //canvas: canvas,
  antialias: true,
})

renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor(new THREE.Color(0.5, 0.7, 1.0))
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)
/**
 * Scene
 */
const hexgrid = new HexGrid(Settings.gridOuterRadius, Settings.gridSize)
const hexMaterial = new HexgridMaterial()
hexMaterial.setUniform("worldSize", hexgrid.getWorldSize())
hexgrid.setMaterial(hexMaterial.material)

const scene = new THREE.Scene()
scene.add(hexgrid.mesh)

// Overlay hexagon that is rendered on top of active hexagon
let overlayHex: THREE.Mesh[] = []
const hexCount = Settings.showNeighbour ? 7 : 1
for (let i = 0; i < hexCount; ++i) {
  overlayHex.push(
    new THREE.Mesh(
      hexgrid.geometry,
      new THREE.MeshBasicMaterial({
        color: 0x000,
        depthTest: false,
        opacity: Settings.gridOverlayMinOpacity,
        transparent: true,
      })
    )
  )
  overlayHex[i].visible = false
}

scene.add(...overlayHex)
scene.add(camera)

// Controls
const controls = new MapControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enableRotate = false
controls.zoomSpeed = Settings.zoomSpeed
controls.dampingFactor = Settings.dampingFactor
controls.minDistance = Settings.minZoom
controls.maxDistance = Settings.maxZoom

/*
 * Load Image around the camera
 */
let textureGrids: any = []
// Total no of image grid in each direction
const worldSize = hexgrid.getWorldSize()
const xPos = camera.position.x + worldSize.x * 0.5
const zPos = camera.position.z + worldSize.z * 0.5
const tgridSpan = 5

// @TODO check if cameraPosition is outside the world
let ix = Math.floor((tgridSpan * xPos) / worldSize.x)
let iz = Math.floor((tgridSpan * zPos) / worldSize.z)
let stack: THREE.Vector3[] = [new THREE.Vector3(ix, 0, iz)]

// Add the grid around the player in loading list
// remove the grid from front and find it's neighbour
while (stack.length > 0) {
  let grid = stack.shift()!

  // Don't process the grid that is outside the range
  if (grid.x >= tgridSpan || grid.x < 0 || grid.z >= tgridSpan || grid.z < 0)
    continue

  textureGrids.push(grid)

  let neighbours: THREE.Vector3[] = []
  // generate 8 neighbour
  // top row
  neighbours.push(new THREE.Vector3(grid.x - 1, 0.0, grid.z - 1))
  neighbours.push(new THREE.Vector3(grid.x, 0.0, grid.z - 1))
  neighbours.push(new THREE.Vector3(grid.x + 1, 0.0, grid.z - 1))

  // middle row
  neighbours.push(new THREE.Vector3(grid.x - 1, 0.0, grid.z))
  neighbours.push(new THREE.Vector3(grid.x + 1, 0.0, grid.z))

  // bottom row
  neighbours.push(new THREE.Vector3(grid.x - 1, 0.0, grid.z + 1))
  neighbours.push(new THREE.Vector3(grid.x, 0.0, grid.z + 1))
  neighbours.push(new THREE.Vector3(grid.x + 1, 0.0, grid.z + 1))

  // check if the grid is already in stack
  // or in loading list
  neighbours.forEach((neighbour) => {
    if (stack.find((grid) => grid.x == neighbour.x && grid.z == neighbour.z))
      return
    if (
      textureGrids.find(
        (grid: THREE.Vector3) => grid.x == neighbour.x && grid.z == neighbour.z
      )
    )
      return

    stack.push(neighbour)
  })
}

// Convert grid id to the texture id
textureGrids = textureGrids.map((grid: THREE.Vector3) => grid.x + "-" + grid.z)

// Load low res 2048 map and display it until all other textures
// are loaded
const imageLoader = new ImageLoaderQueue(["2048"])
let maps: THREE.Texture | null = null
imageLoader.addEventListener("loaded", (evt) => {
  const texture = evt.texture
  texture.minFilter = THREE.LinearMipMapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  hexMaterial.setUniform("texture0", texture)
})

imageLoader.addEventListener("done", () => {
  // Start loading individual texture when the whole 2048 map is loaded
  const mapLoader = new ImageLoaderQueue(textureGrids)
  //@TODO width, height, depth is currently hard coded
  // Start loading grid texture and copy it to texture array
  const gpuTextureCopyUtils = new GPUTextureCopyUtils(2048, 2048, 25)
  let mapLoadFlag = 0

  hexMaterial.setUniform("texture1", gpuTextureCopyUtils.getAttachment())
  mapLoader.addEventListener("loaded", (evt) => {
    const file = evt.file
    const texture = evt.texture

    const width = texture.image.width
    const height = texture.image.height

    if (!maps) {
      const data = new Uint8Array(
        width * height * tgridSpan * tgridSpan * 4
      ).fill(128)
      maps = TextureUtils.create3DTexture(data, {
        width,
        height,
        depth: tgridSpan * tgridSpan,
        channel: 4,
      })
    }
    const [x, z] = file.split("-")
    const layer = parseInt(z) * tgridSpan + parseInt(x)
    gpuTextureCopyUtils.copyTexture(renderer, texture, layer)

    // Load flag indicates which region of map is loaded in hi-resolution
    mapLoadFlag = mapLoadFlag | (1 << layer)
    //hexMaterial.setUniform('mapLoadFlag', mapLoadFlag);
  })

  mapLoader.addEventListener("done", (_evt) => {
    hexMaterial.setUniform("mapLoadFlag", 1.0)
  })
})
// Debug
const debugUtils = new DebugUtils(scene, {
  stats: Settings.showStats,
  axesHelper: Settings.showAxesHelper,
})

/**
 * Animate
 */
const clock = new THREE.Clock()
// var lastElapsedTime = 0
const raycaster = new THREE.Raycaster()
let normalizedMouseCoord = new THREE.Vector2(-100, -100)

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  // const deltaTime = elapsedTime - lastElapsedTime;
  // lastElapsedTime = elapsedTime

  debugUtils.begin()

  // Update controls
  controls.update()

  // Find intersection with the plane and convert it to hex-coordinate
  // Currently overlay grid is shown at that grid
  raycaster.setFromCamera(normalizedMouseCoord, camera)
  let intersection = hexgrid.getIntersection(raycaster.ray)
  if (intersection) {
    let translation = hexgrid.convertCubeToWorldCoordinate(intersection)
    overlayHex[0].position.set(translation.x, translation.y, translation.z)

    let minOpacity = Settings.gridOverlayMinOpacity
    let maxOpacity = Settings.gridOverlayMaxOpacity
    let t = Math.sin(elapsedTime * 5) * 0.8 + 0.2
    ;(overlayHex[0].material as MeshBasicMaterial).opacity =
      minOpacity + t * (maxOpacity - minOpacity)
    overlayHex[0].visible = true

    if (Settings.showNeighbour) {
      let neighbours = hexgrid.findNeighbour(intersection)
      for (let i = 0; i < 6; ++i) {
        if (hexgrid.isInRange(neighbours[i])) {
          let p = hexgrid.convertCubeToWorldCoordinate(neighbours[i])
          overlayHex[i + 1].position.set(p.x, p.y, p.z)
          overlayHex[i + 1].visible = true
          ;(<MeshBasicMaterial>(<unknown>overlayHex[i + 1])).opacity = (<
            MeshBasicMaterial
          >overlayHex[0].material).opacity
          ;(<MeshBasicMaterial>(<unknown>overlayHex[i + 1].material)).color =
            new THREE.Color(0.5, 0.2, 0.1)
        } else overlayHex[i + 1].visible = false
      }
    }
  }
  // Render
  renderer.render(scene, camera)

  debugUtils.end()
  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

if (WebGLUtils.isWebGL2Available()) tick()

document.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
  normalizedMouseCoord.x = (e.clientX / sizes.width) * 2 - 1
  normalizedMouseCoord.y = -(e.clientY / sizes.height) * 2 + 1
})
