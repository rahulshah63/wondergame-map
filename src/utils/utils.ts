import * as THREE from 'three'

export const TextureUtils = {
    create3DTexture: (data : any, params = {width: 0, height: 0, depth: 1, channel: 4}) => 
    {
        if(params.width === 0 || params.height === 0  || params.depth === 0) return null;
        const texture = new THREE.Data3DTexture(data, params.width, params.height, params.depth);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        texture.type = THREE.UnsignedByteType;
        texture.needsUpdate = true;
        return texture;
    },

    createTexture: (image : any) : THREE.Texture =>
    {
        let texture = new THREE.Texture();
        texture.image = image;
        texture.needsUpdate = true;
        return texture;
    }
}

// https://github.com/mrdoob/three.js/blob/master/examples/jsm/capabilities/WebGL.js
export class WebGLUtils
{
    static isWebGLAvailable() {

		try {

			const canvas = document.createElement( 'canvas' );
			return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

		} catch ( e ) {

			return false;

		}

	}

	static isWebGL2Available() {

		try {

			const canvas = document.createElement( 'canvas' );
			return !! ( window.WebGL2RenderingContext && canvas.getContext( 'webgl2' ) );

		} catch ( e ) {

			return false;

		}

	}

	static getWebGLErrorMessage() {

		return this.getErrorMessage( 1 );

	}

	static getWebGL2ErrorMessage() {

		return this.getErrorMessage( 2 );

	}

	static getErrorMessage( version : number) {

		const names = {
			1: 'WebGL',
			2: 'WebGL 2'
		};

		const contexts = {
			1: window.WebGLRenderingContext,
			2: window.WebGL2RenderingContext
		};

		let message = 'Your $0 does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">$1</a>';

		const element = document.createElement( 'div' );
		element.id = 'webglmessage';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( contexts[ version ] ) {

			message = message.replace( '$0', 'graphics card' );

		} else {

			message = message.replace( '$0', 'browser' );

		}

		message = message.replace( '$1', names[ version ] );

		element.innerHTML = message;

		return element;

	}
}