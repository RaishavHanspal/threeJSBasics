import { MainGame } from "./main";
import { SceneLoader } from "./sceneLoader";
import { Utils } from "./utils/Utils";
declare global {
    var utilsObj: Utils;
    var mainScene: SceneLoader;
}

window.utilsObj = new Utils();

// window.mainScene = new MainGame();
window.mainScene = new SceneLoader();