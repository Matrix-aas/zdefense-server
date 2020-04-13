import World from "./World";
import Entity from "./Entities/Entity";
import Server from "../../Server";
import App from "../../app";
import Packet4SpawnEnitity from "../../Network/Packets/Packet4SpawnEnitity";
import Packet5DamageEntity from "../../Network/Packets/Packet5DamageEntity";
import EntityZombie from "./Entities/Livings/EntityZombie";
import Point from "../../Helpers/Point";

export default class WorldServer extends World {
    constructor() {
        super();
        this.spawnEntity(new EntityZombie()).teleport(new Point(50, 50));
        this.spawnEntity(new EntityZombie()).teleport(new Point(150, 150));
        this.spawnEntity(new EntityZombie()).teleport(new Point(250, 250));
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
            this.server.getPlayerManager().sendAllMovesToAllPlayers();
        }
    }

    public get server(): Server {
        return App.instance.getServer();
    }
}
