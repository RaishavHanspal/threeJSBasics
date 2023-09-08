import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D } from "three";
import { reel } from "./reel";

export class reelpanel extends Object3D{
    private reels: Array<reel> = [];
    private readonly reelDimensions = { x: 4, y: 4, z: 4};
    constructor(private reelCount: number, private symPerReel: number) {
        super();
        this.init();
    }

    private init() {
        this.position.y = this.reelDimensions.y;
        /** to keep reel centered  for even with below formula*/
        let additionalOffset = 0;
        if(this.reelCount % 2 === 0){
            additionalOffset = - this.reelDimensions.x / 2;
        }
        for (let i = 0; i < this.reelCount; i++) {
            const newReel = new reel(this.symPerReel, this.reelDimensions);
            newReel.position.x = (this.reelCount - Math.ceil(this.reelCount / 2) - i) * this.reelDimensions.x + additionalOffset;
            this.reels.push(newReel);
            this.add(newReel);
        }
        this.createReelHouseGeometry().position.y = (this.symPerReel + 1) * this.reelDimensions.y - 1;
        this.createReelHouseGeometry().position.y = 1 - this.reelDimensions.y;
    }

    private createReelHouseGeometry(): Mesh{
        const reelHouseGeometry = new BoxGeometry(this.reelCount * this.reelDimensions.x + 2, this.reelDimensions.y + 2, this.reelDimensions.z + 2);
        const reelHouseMesh  = new Mesh(reelHouseGeometry, new MeshBasicMaterial({ color: "#000"}));
        this.add(reelHouseMesh);
        return reelHouseMesh;
    }

    public spin(reelIndex: number = 0): void{
        console.log(reelIndex);
        this.reels[reelIndex].spin();
        setTimeout(() => {
            reelIndex++;
            if(reelIndex < this.reels.length){
                this.spin(reelIndex);
            }
        }, 200);
        // this.reels.forEach(reel => reel.spin());
    }

    public update(): void{
        this.reels.length && this.reels.forEach((reel => reel.update()));
    }
}