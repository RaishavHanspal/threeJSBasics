import { Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";

export class reel extends Object3D {
    private readonly symCount = 4;
    private readonly reelDimensions = { x: 4, y: 4};
    private spinning: boolean = false;
    constructor(){
        super();
        this.init();
    }

    private init(){
        new Object3D();
        for (let i = 0; i < this.symCount; i++) {
            this.add(this.getPlane(0.5 + (i * this.reelDimensions.y), this.getRandomColor()));
        }
    }

    public spin(): void{
        this.spinning = true;
    }

    private getRandomColor(): string {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return color;
    }

    private getPlane(posY: number, color: string): Mesh {
        const planeGeometry = new PlaneGeometry(this.reelDimensions.x, this.reelDimensions.y);
        const material = new MeshBasicMaterial({
            color,
        })
        const plane = new Mesh(planeGeometry, material);
        plane.position.y = posY;
        return plane;
    }

    /** @todo - need to use delta to maintain correct time */
    public update(): void {
        if (this.spinning) {
            this.position.y -= 0.05;
            if (this.position.y < - this.reelDimensions.y) {
                this.position.y = 0;
                /** remove the bottom most symbol */
                const lastSym = this.children.shift();
                this.remove(lastSym);
                this.children.forEach((sym: Mesh, i) => (sym.position.y = (i * this.reelDimensions.y) + 0.5));
                /** add new sym */
                this.add(this.getPlane((3 * this.reelDimensions.y) + 0.5, this.getRandomColor()))
            }
        }
    }

}