import { AnimationAction, AnimationClip, AnimationMixer, Scene } from "three";
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

    private initializeLoaders(): void {
        this.loaders = new Map();
        this.loaders.set("fbx", new FBXLoader());
        this.loaders.set("font", new FontLoader());
        this.loaders.set("gltf", new GLTFLoader());
        this.loaders.set("scene", new ObjectLoader());
    }

    /** maintain single mixer for one model */
    public registerFBX(fbx: any, animation: AnimationClip, playAnim: boolean, oldMixer?: AnimationMixer): { mixer: AnimationMixer, action: AnimationAction } {
        const mixer = oldMixer || new AnimationMixer(fbx);
        const action = mixer.clipAction(animation);
        /** in order to store ref of all possible animations */
        fbx.actions = fbx.actions ? [...fbx.actions, action] : [action];
        playAnim && action.play();
        return { mixer, action };
    }

    public loadAndBindFBXAnimation(fbx: any, scene: Scene, fileName: string, mixer: AnimationMixer, callback?: () => void) {
        this.loadFile(scene, fileName, "fbx", (fbxAnim) => {
            const animation = fbxAnim.animations[0];
            this.registerFBX(fbx, animation, false, mixer);
            callback && callback();
        });
    }

    public applyOpts(target: any, opts: any): void {
        /** usecase: mostly will need to apply opts on two levels */
        for (let opt in opts) {
            if (target[opt] && typeof opts[opt] !== "object") {
                target[opt] = opts[opt];
            }
            else if (target[opt]) {
                /** recursively update  */
                this.applyOpts(target[opt], opts[opt]);
            }
        }
    }

    public loadFile(scene: Scene, fileName: string, fileType: LoadFileType, callback?: (obj: any) => void, opts: any = {}, relPath: string = "assets/"): void {
        const loader: any = this.loaders.get(fileType);
        loader.load(relPath + fileName, (obj: any) => {
            scene.add(fileType === "gltf" ? obj.scene : obj);
            this.applyOpts(obj, opts);
            callback && callback(obj);
        });
    }
}