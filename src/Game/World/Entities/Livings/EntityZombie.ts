import EntityLiving from "../EntityLiving";
import {entity} from "../Entity";
import Point from "../../../../Helpers/Point";

@entity(1)
export default class EntityZombie extends EntityLiving {
    getMaxHealth(): number {
        return 100;
    }

    get size(): Point {
        return new Point(32, 32);
    }
}
