import { Object3D } from "three";
import { reel } from "./reel";

export class reelpanel extends Object3D{
    private reels: Array<reel> = [];
    private readonly reelDimensions = { x: 4, y: 4};
    constructor(private reelCount: number, private symPerReel: number) {
        super();
        this.init();
    }

    private init() {
        /** to keep reel centered */
        if(this.reelCount % 2 === 0){
            this.position.x = - this.reelDimensions.x / 2;
        }
        for (let i = 0; i < this.reelCount; i++) {
            const newReel = new reel(this.symPerReel, this.reelDimensions);
            newReel.position.x = (this.reelCount - Math.ceil(this.reelCount / 2) - i) * this.reelDimensions.x;
            this.reels.push(newReel);
            this.add(newReel);
        }
    }

    public spin(reelIndex: number = 0): void{
        console.log(reelIndex);
        this.reels[reelIndex].spin();
        setTimeout(() => {
            if(reelIndex < this.reels.length){
                reelIndex++;
                this.spin(reelIndex);
            }
        }, 200);
        // this.reels.forEach(reel => reel.spin());
    }

    public update(): void{
        this.reels.length && this.reels.forEach((reel => reel.update()));
    }
}