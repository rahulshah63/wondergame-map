import * as THREE from 'three';

// Copy texture from src to destination using 
// fragment shader.
// This is used to populate 2D Texture Array
// with the texture as converting image to
// byte array and finding the right index 
// is tedious

export class GPUTextureCopyUtils {
    constructor(width = 2048, height = 2048, depth = 25) {

        this.width = width;
        this.height = height;
        this.depth = depth;

        this.scene = new THREE.Scene();

        // Shaders
        this.vertexShader = `
        out vec2 vUv;
    	void main()
	    {
		    vUv = uv;
		    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	    }`;

        this.fragmentShader = `
	    precision mediump float;

    	in vec2 vUv;
    	uniform sampler2D uTexture;
    	void main()
	    {
		    vec3 color  = texture(uTexture, vUv).rgb;
		    gl_FragColor = vec4(color, 1.0);
	    }`;

        this.uniforms = {
            uTexture: { value: null }
        };

        // Material
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            depthWrite: false,
            depthTest: false
        })

        // Mesh
        this.quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this.material
        );

        // Camera
        this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        this.scene.add(this.quad);

        this.renderTarget = new THREE.WebGLArrayRenderTarget( width, height, depth);
        this.renderTarget.texture.format = THREE.RGBFormat;
        this.renderTarget.texture.minFilter = THREE.LinearFilter;
        this.renderTarget.texture.magFilter = THREE.LinearFilter;
        this.renderTarget.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.renderTarget.texture.wrapT = THREE.ClampToEdgeWrapping;
        this.renderTarget.texture.wrapR = THREE.ClampToEdgeWrapping;
    }

    // Specify the array layer to which the src image is to be copied
    copyTexture(renderer, src, layer) {
        if(layer > this.depth)
            console.error("Layer is greater than max layer", layer);
        this.material.uniforms.uTexture.value = src;
        renderer.setRenderTarget( this.renderTarget, layer );
        renderer.render( this.scene, this.camera);
        renderer.setRenderTarget( null );
    }

    getAttachment()
    {
        return this.renderTarget.texture;
    }
}
