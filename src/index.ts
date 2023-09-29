import HavokPhysics from "@babylonjs/havok";
import { LottoHavoc } from "./lottoHavoc";
import { Utils } from "./utils/Utils";
declare global {
    var utilsObj: Utils;
    var mainScene: any;
}

window.utilsObj = new Utils();

// window.mainScene = new MainGame();
// window.mainScene = new SceneLoader();
// new Lotto();
// window.mainScene = new LottoProto();
document.addEventListener("DOMContentLoaded", () => {
    HavokPhysics().then((havok) => {
        window.mainScene = new LottoHavoc(havok);
    })
})