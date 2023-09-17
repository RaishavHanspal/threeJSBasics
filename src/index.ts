import { Lotto } from "./lotto";
import { LottoProto } from "./lottoProto";
import { MainGame } from "./main";
import { SceneLoader } from "./sceneLoader";
import { Utils } from "./utils/Utils";
declare global {
    var utilsObj: Utils;
    var mainScene: any;
}

window.utilsObj = new Utils();

// window.mainScene = new MainGame();
window.mainScene = new SceneLoader();
// new Lotto();
// window.mainScene = new LottoProto();