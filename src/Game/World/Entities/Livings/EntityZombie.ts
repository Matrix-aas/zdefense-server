import EntityLiving from "../EntityLiving";
import {entity} from "../Entity";
import App from "../../../../app";
import MathUtils from "../../../../Helpers/MathUtils";

@entity(1)
export default class EntityZombie extends EntityLiving {
    private targetAngle = 0;
    private ttl = 0;

    constructor() {
        super();
        this.size.set(32, 32);
        this.setSpeed(0.75);
        this.ttl = MathUtils.random(10, 20) * App.instance.getTicksPerSecond();
        this.targetAngle = MathUtils.randomAngle();
    }

    getMaxHealth(): number {
        return 100;
    }

    tick(delta: number): void {
        super.tick(delta);

        if (this.ttl-- > 0) {
            if (App.instance.getCurrentTick() % App.instance.getTicksPerSecond() * 4 === 0) {
                this.targetAngle += MathUtils.random(-20, 40);
            }
            this.setHeadAngleSmoothly(this.targetAngle, 1.5);
            this.setMoveAngleSmoothly(this.targetAngle, 1.5);
            this.move();
        } else if (!this.isDied()) {
            this.kill();
        }
    }
}
