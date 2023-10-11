import HavokPhysics from "@babylonjs/havok";
import { LottoHavoc } from "./lottoHavoc";
import { Utils } from "./utils/Utils";
import { GameHavok } from "./havocSimple";
import { LottoProto } from "./lottoProto";
import { SceneLoader } from "./sceneLoader";
declare global {
    var utilsObj: Utils;
    var mainScene: any;
}

window.utilsObj = new Utils();
window.mainScene = new SceneLoader();