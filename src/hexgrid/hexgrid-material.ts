import * as THREE from 'three'
import { Settings } from '../settings';

const vertexShader : string = `
    varying vec3 vUV;
    varying vec3 vPosition;
    varying vec3 vColor;
    void main()
    {
        vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vColor = instanceColor;
        vUV = worldPos.xyz;
        vPosition = position;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }`;

const fragmentShader : string = `
        precision highp sampler2DArray;

        uniform float innerRadius;
        uniform float outlineWidth;
        uniform float mapLoadFlag;
        uniform vec3 outlineColor;
        uniform vec3 worldSize;
        uniform sampler2D texture0;
        uniform sampler2DArray texture1;

        in vec3 vColor;
        in vec3 vPosition;
        in vec3 vUV;

        // SDF for hexagon in 2D
        float calcHexDistance(vec2 p)
        {
            // Diagonal vector ratio for the hexagon in +ve quadrant
            const vec2 s = vec2(1, 1.7320508);
            
            // Domain wraping
            p = abs(p);

            // Project the point into diagonal(half because the radius for only one quadrant is 0.5)
            // Select distance based on upper/lower half
            // upper half if dot(p, s * 0.5) > p.x && lower half if it is not
            // subtract innerradius to get total length
            return max(dot(p, s * .5), p.x) - innerRadius;
        }

        vec3 getUV(vec3 worldPos)
        {
            float tgridSpan = 5.0f;
            vec2 textureGridSize = worldSize.xz / vec2(tgridSpan);
            worldPos.xz += worldSize.xz * 0.5;
            vec2 ip = floor(worldPos.xz / textureGridSize);
            float layer = ip.y * tgridSpan + ip.x;
            vec2 uv = (worldPos.xz / textureGridSize) - ip;
            return vec3(uv, layer);
        }

        void main()
        {
            float d = calcHexDistance(vPosition.xz);
            float f = smoothstep(d, outlineWidth, 0.0);

            vec3 textureColor = vec3(0.0);
            if(mapLoadFlag < 0.5)
            {
                vec2 uv0 = (vUV.xz / worldSize.xz) + 0.5;
                uv0.y = 1.0 - uv0.y;
                textureColor = texture(texture0, uv0).rgb;
            }
            else {
                vec3 uv1 = getUV(vUV);
                uv1.y = 1.0 - uv1.y;
                textureColor = texture(texture1, uv1).rgb;
                //textureColor = vec3(uv1.x, uv1.y, uv1.z / 25.0);
            }

            vec3 color = mix(outlineColor, textureColor, f);
            //color = mix(textureColor0, color, 0.5);
            gl_FragColor = vec4(color, 1.0);
        }
    `;

const outlineColor = Settings.outlineColor;
const innerRadius = Settings.gridOuterRadius * 0.866025404;

export class HexgridMaterial {
    material : THREE.ShaderMaterial;

    constructor() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                innerRadius: { value: innerRadius },
                outlineWidth: { value: Settings.outlineWidth },
                outlineColor: { value: new THREE.Vector3(outlineColor.r, outlineColor.g, outlineColor.b) },
                worldSize: { value: new THREE.Vector3(0, 0, 0.) },
                texture0: {value: null},
                texture1 : {value: null},
                mapLoadFlag : {value : 0.0}
            },
            vertexShader,
            fragmentShader
        });
    }

    setUniform(name : string, value : any) {
        this.material.uniforms[name].value = value;
    }
};
