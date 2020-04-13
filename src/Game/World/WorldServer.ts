import World from "./World";
import Entity from "./Entities/Entity";
import Server from "../../Server";
import App from "../../app";
import Packet4SpawnEnitity from "../../Network/Packets/Packet4SpawnEnitity";
import Packet5DamageEntity from "../../Network/Packets/Packet5DamageEntity";
import EntityZombie from "./Entities/Livings/EntityZombie";
import MathUtils from "../../Helpers/MathUtils";

export default class WorldServer extends World {
    constructor() {
        super();
    }

    spawnEntity(entity: Entity, id?: number): Entity {
        super.spawnEntity(entity, id);
        this.server.getPlayerManager().sendPacketToAll(new Packet4SpawnEnitity(entity));
        return entity;
    }

    removeEntity(entity: Entity | number): void {
        super.removeEntity(entity);
        const id = entity instanceof Entity ? entity.id : entity;
        this.server.getPlayerManager().sendPacketToAll(new Packet5DamageEntity(id, 0, 0, 0, true));
    }

    async tick(delta: number): Promise<void> {
        await super.tick(delta);

        if (App.instance.getCurrentTick() % 4 === 0) {
            for (const player of this.server.getPlayerManager().getPlayers()) {
                if (Math.random() > 0.95) {
                    const randPos = player.positionCenter.add(MathUtils.random(-400, 400));
                    const e = this.spawnEntity(new EntityZombie()) as EntityZombie;
                    e.position.set(randPos.x, randPos.y);
                    const angle = MathUtils.randomAngle();
                    e.setHeadAngle(angle);
                    e.setMoveAngle(angle);
                }
            }
        }

        if (App.instance.getCurrentTick() % 4 === 0) {
            this.server.getPlayerManager().sendAllMovesToAllPlayers();
        }
    }

    public get server(): Server {
        return App.instance.getServer();
    }
}
