import Stats from "three/examples/jsm/libs/stats.module.js"
import * as THREE from "three"
import { AxesHelper } from "three"

export class DebugUtils {
  private showStats: Boolean = false
  private showAxesHelper: Boolean = false
  private axesHelper: AxesHelper | null = null
  private stats: Stats | null = null

  constructor(
    scene: THREE.Scene,
    settings = { axesHelper: true, stats: true }
  ) {
    this.showStats = settings.stats
    this.showAxesHelper = settings.axesHelper

    // Debug
    if (settings.axesHelper) {
      this.axesHelper = this.createAxesHelper()
      scene.add(this.axesHelper)
    }

    if (settings.stats) this.stats = this.#createStatsPanel()
  }

  #createStatsPanel() {
    let stats = Stats()
    stats.showPanel(1)
    document.body.appendChild(stats.dom)
    return stats
  }

  private createAxesHelper() {
    const axesHelper = new THREE.AxesHelper(20)
    return axesHelper
  }

  begin() {
    if (this.showStats) this.stats?.begin()
  }

  end() {
    if (this.showStats) this.stats?.end()
  }
}
