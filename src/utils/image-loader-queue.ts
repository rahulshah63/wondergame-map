import { EventDispatcher } from "three";
import * as THREE from 'three'

export const ImageLoadingMode = {
    Image: 'Image',
    Array: 'Array',
};

export class ImageLoaderQueue extends EventDispatcher {
    constructor(images, loadingMode = ImageLoadingMode.Image) {
        super();
        this.loadingMode = loadingMode
        this.images = images;
        this.#startLoading();
    }

    async #startLoading() {
        for (let i = 0; i < this.images.length; ++i) {
            const file = this.images[i];
            await fetch("http://localhost:3000/assets/" + file)
                .then(res => { return res.blob() })
                .then(blob => {
                    if (this.loadingMode === ImageLoadingMode.Array) {
                        blob.arrayBuffer().then((arr) => {
                            this.dispatchEvent({
                                type: 'loaded',
                                file,
                                data: new Uint8Array(arr)
                            });
                        });
                    }
                    else {
                        let url = URL.createObjectURL(blob);
                        let image = new Image();
                        image.src = url;
                        image.onload = (evt) => {
                            this.dispatchEvent({
                                type: 'loaded',
                                file,
                                image
                            });
                        };
                    }
                });
        }

        this.dispatchEvent({
            type: 'done',
        });
    }
}