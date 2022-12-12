import * as THREE from "three"

export const ImageLoadingMode = {
    Image,
    Array
};

export class ImageLoaderQueue extends THREE.EventDispatcher {
    private loader: THREE.TextureLoader | null = null;

    constructor(private images: string[], private basePath: string = "assets/map/") {
        super();
        this.images = images;
        this.loader = new THREE.TextureLoader();
        this.#startLoading();
    }

    async #startLoading() {
        let promises: Promise<any>[] = this.images.map((image)=>{
            const file = this.basePath + 'map top down-' + image + '.png';
            return new Promise((resolve, reject) => {
                this.loader?.load(file, (texture) => {
                    resolve({file: image, texture});
                });
            });
        });

        Promise.all(promises).then((results) => {
            results.forEach(result =>{
                this.dispatchEvent({
                    type: 'loaded',
                    file: result.file,
                    texture: result.texture
                });
            })
        })
        .catch(err=> console.error(err))
        .finally(()=>{
            this.dispatchEvent({
                type: 'done'
            });
        });
    }
}
