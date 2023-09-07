import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Vector3 } from "three";

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
            this.add(this.getPlane(((i + 0.5) * this.reelDimensions.y), this.getRandomColor()));
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
        /** this can be configurable - since we don't know what way the reel will be created 
         * can also use @PlaneGeometry
        */
        const geometry = new BoxGeometry(this.reelDimensions.x, this.reelDimensions.y, this.reelDimensions.x);
        const material = new MeshBasicMaterial({
            map: utilsObj.getTexture(utilsObj.getRandomNumber(1, 5) + ".png")
        })
        const mesh = new Mesh(geometry, material);
        /** @todo: have a look - added workaround for inverted mesh */
        mesh.scale.x = -1;
        mesh.scale.y = -1;
        mesh.scale.z = -1;
        mesh.position.y = posY;
        return mesh;
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
                this.children.forEach((sym: Mesh, i) => (sym.position.y = ((i + 0.5) * this.reelDimensions.y)));
                /** add new sym */
                this.add(this.getPlane((3.5 * this.reelDimensions.y), this.getRandomColor()))
            }
        }
    }
}