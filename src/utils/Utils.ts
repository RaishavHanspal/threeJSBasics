import { AnimationClip, AnimationMixer, Scene } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { LoadFileType } from "../interface";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ObjectLoader } from "three/src/loaders/ObjectLoader";

export class Utils {
    /** map to hold all loaders */
    private loaders: Map<LoadFileType, any>;
    constructor() {
        this.initializeLoaders();
    }

    private initializeLoaders(): void{
        this.loaders = new Map();
        this.loaders.set("fbx", new FBXLoader());
        this.loaders.set("font", new FontLoader());
        this.loaders.set("gltf", new GLTFLoader());
        this.loaders.set("scene", new ObjectLoader());
    }

    public playFBX(fbx: any, animation: AnimationClip) {
        const mixer = new AnimationMixer(fbx);
        const anim = mixer.clipAction(animation);
        anim.play();
        return mixer;
    }

    public applyOpts(target: any, opts: any): void {
        /** usecase: mostly will need to apply opts on two levels */
        for (let opt in opts) {
            if (target[opt] && typeof opts[opt] !== "object") {
                target[opt] = opts[opt];
            }
            else if(target[opt]) {
                /** recursively update  */
                this.applyOpts(target[opt], opts[opt]);
            }
        }
    }

    public loadFile(scene: Scene, fileName: string, fileType: LoadFileType, callback?: (obj: any) => void, opts: any = {}, relPath: string = "assets/"): void{
        const loader: any = this.loaders.get(fileType);
        loader.load(relPath + fileName, (obj: any) => {
            scene.add(fileType === "gltf" ? obj.scene : obj);
            this.applyOpts(obj, opts);
            callback && callback(obj);
        });
    }
}