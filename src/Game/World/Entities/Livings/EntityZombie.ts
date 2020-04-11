import EntityLiving from "../EntityLiving";
import {entity} from "../Entity";
import Point from "../../../../Helpers/Point";

@entity(1)
export default class EntityZombie extends EntityLiving {
    constructor() {
        super();
        this.setSpeed(0.75);
    }

    getMaxHealth(): number {
        return 100;
    }

    get size(): Point {
        return new Point(32, 32);
    }

    tick(delta: number): void {
        super.tick(delta);

        const angle = this.getHeadAngle() - 20.0 + Math.random() * 40.0;
        this.setHeadAngleSmoothly(angle, 5.0 * 0.5);
        this.setMoveAngleSmoothly(angle, 5.0 * 0.5);
        this.move();
        return;
    }
}
