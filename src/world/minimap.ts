import * as THREE from 'three';

export class Minimap {
    radius: number = 1.0;
    mesh: THREE.Object3D
    material : THREE.ShaderMaterial

    constructor(radius: number = 0.1) {
        this.radius = radius;
        // Shaders
        const vertexShader = `
            out vec2 vUv;
            void main()
            {
                vUv = uv;
                gl_Position = modelMatrix * vec4( position, 1.0 );
            }`

        const fragmentShader = `
                precision mediump float;
                in vec2 vUv;
                uniform sampler2D uTexture;
                uniform int useTexture;
                const float padding = 0.12;
                void main()
                {
                    vec2 uv = vUv;
                    uv = -padding + uv * (1.0 + padding * 2.0);
                    vec3 color = vec3(1.0);
                    if(useTexture == 1)
                        color  = texture(uTexture, vec2(uv)).rgb;
                    gl_FragColor = vec4(color, 1.0);
                }`

        const uniforms = {
            uTexture: { value: null },
            useTexture: {value: 1}
        }

        let geometry = new THREE.CircleGeometry(radius, 64);
        this.material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
        });

        let map = new THREE.Mesh(geometry, this.material);
        map.frustumCulled = false;

        let mapBg = new THREE.Mesh(geometry, this.material.clone());
        mapBg.material.uniforms.useTexture.value = 0;
        mapBg.scale.set(1.05, 1.05, 1.05);
        mapBg.position.set(0.0, 0.0, 0.1);
        mapBg.frustumCulled = false;
        mapBg.matrixWorldNeedsUpdate = true;

        this.mesh = new THREE.Object3D();
        this.mesh.add(map);
        this.mesh.add(mapBg);
        
        this.setTranslate(this.radius - 0.95, this.radius - 0.7);
    }

    setMapTexture(texture : THREE.Texture)
    {
        this.material!.uniforms!.uTexture.value = texture;
    }

    scaleY(val : number)
    {
        this.mesh.scale.setY(val);
        this.mesh.matrixWorldNeedsUpdate = true;
    }

    setTranslate(x : number, y : number)
    {
        this.mesh.translateX(x);
        this.mesh.translateY(y);
        this.mesh.matrixWorldNeedsUpdate = true;
    }
}