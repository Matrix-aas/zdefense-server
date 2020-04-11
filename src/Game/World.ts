import Server from "../Server";
import PlayerInstance from "../Network/PlayerInstance";
import ServerNetworkHandler from "../Network/ServerNetworkHandler";
import Entity from "./Entity/Entity";
import Point from "../Helpers/Point";
import * as Event from "events";

export interface NearestEntity {
    distance: number;
    entities: Entity[];
}

export default class World {
    protected eventBus: Event.EventEmitter = new Event.EventEmitter();

    protected server: Server = null;
    protected players: Set<PlayerInstance> = new Set<PlayerInstance>();

    protected generatedIds: Set<number> = new Set<number>();
    protected entities: Map<number, Entity> = new Map<number, Entity>();

    constructor(server: Server) {
        this.server = server;

        this.server.subscribeEvent('client-handshaked', (player: PlayerInstance) => {
            this.players.add(player);
            this.server.serverSay(`${player.getUsername()} joined the game!`);
        });

        this.server.subscribeEvent('client-disconnected', (networkHandler: ServerNetworkHandler) => {
            if (networkHandler.isOnline() && this.players.has(networkHandler.getPlayer())) {
                this.players.delete(networkHandler.getPlayer());
                this.server.serverSay(`${networkHandler.getPlayer().getUsername()} left the game!`);
            }
        });
    }


    public genUniqId(): number {
        let id;
        do {
            id = Math.floor(Math.random() * 65535)
        } while (id <= 0 || this.generatedIds.has(id));
        this.generatedIds.add(id);
        return id;
    }

    public spawnEntity(entity: Entity): Entity {
        const identifer = this.genUniqId();
        entity.init(identifer, this);
        this.entities.set(identifer, entity);
        this.fireEvent('entity-spawned', entity, this);
        return entity;
    }

    public removeEntity(entity: Entity): void {
        if (this.entities.has(entity.id)) {
            this.entities.delete(entity.id);
            this.generatedIds.delete(entity.id);
            this.fireEvent('entity-removed', entity, this);
        }
    }

    public entitiesCount(): number {
        return this.entities.size;
    }

    public async tick(delta: number): Promise<void> {
        this.entities.forEach(entity => {
            if (!entity.isDied()) {
                entity.tick(delta);
            } else {
                this.removeEntity(entity);
            }
        });
    }

    public getEntitiesSortedByDistance(point: Point | Entity,
                                       max = 0,
                                       type: typeof Entity = null,
                                       exclude: Entity | Entity[] = []
    ): Map<number, Entity[]> {
        max *= max;

        if (!Array.isArray(exclude)) {
            exclude = [exclude];
        }

        if (point instanceof Entity) {
            if (exclude.indexOf(point) < 0) {
                exclude.push(point);
            }
            point = point.positionCenter;
        }

        const entities: Map<number, Entity[]> = new Map<number, Entity[]>();

        this.entities.forEach(entity => {
            if ((type !== null && !(entity instanceof type)) || (exclude as Entity[]).includes(entity)) {
                return;
            }
            const distance = (point as Point).squareDistance(entity.positionCenter);
            if (max === 0 || distance < max) {
                if (entities.has(distance)) {
                    entities.get(distance).push(entity);
                } else {
                    entities.set(distance, [entity]);
                }
            }
        });

        return new Map<number, Entity[]>([...entities.entries()].sort((entry1, entry2) => {
            return entry1[0] > entry2[0] ? 1 : (entry1[0] < entry2[0] ? -1 : 0);
        }));
    }

    public getNearestEntity(point: Point | Entity,
                            type: typeof Entity = null,
                            max = 0,
                            exclude: Entity | Entity[] = []
    ): NearestEntity | null {
        const entities = this.getEntitiesSortedByDistance(point, max, type, exclude);
        if (entities.size) {
            const elem = entities.entries().next().value;
            return {
                distance: Math.sqrt(elem[0]),
                entities: elem[1]
            };
        }
        return null;
    }

    public subscribeEvent(event: string, listener: (...args: any[]) => void): void {
        this.eventBus.on(event, listener);
    }

    public fireEvent(event: string, ...args: any): void {
        this.eventBus.emit(event, ...args);
    }
}
