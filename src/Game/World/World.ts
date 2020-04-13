import Entity from "./Entities/Entity";
import Point from "../../Helpers/Point";
import registerEntityLivings from "./Entities/Livings";

export interface NearestEntity {
    distance: number;
    entities: Entity[];
}

export default abstract class World {
    public static readonly WORLD_VERSION = 1;

    protected generatedIds: Set<number> = new Set<number>();
    protected entities: Map<number, Entity> = new Map<number, Entity>();
    protected spawnLocation: Point = new Point(0, 0);
    protected spawnRadius: Point = new Point(50, 50);

    public static async registerEntities(): Promise<void> {
        await registerEntityLivings();
    }

    public genUniqId(): number {
        let id;
        do {
            id = Math.floor(Math.random() * 2147483647);
        } while (id <= 0 || this.generatedIds.has(id));
        this.generatedIds.add(id);
        return id;
    }

    public spawnEntity(entity: Entity, id?: number): Entity {
        const identifer = id ? id : this.genUniqId();
        entity.init(identifer, this);
        this.entities.set(identifer, entity);
        return entity;
    }

    public removeEntity(entity: Entity | number): void {
        const id = entity instanceof Entity ? entity.id : entity;
        if (this.entities.has(id)) {
            this.entities.delete(id);
            this.generatedIds.delete(id);
        }
    }

    public entitiesCount(): number {
        return this.entities.size;
    }

    public hasEntity(id: Entity | number): boolean {
        return this.entities.has(id instanceof Entity ? id.id : id);
    }

    public getEntity(id: number): Entity {
        return this.entities.has(id) ? this.entities.get(id) : null;
    }

    public getEntities(): Map<number, Entity> {
        return this.entities;
    }

    public getEntitiesCount(): number {
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

    public getSpawnLocation(): Point {
        return this.spawnLocation;
    }

    public getSpawnRadius(): Point {
        return this.spawnRadius;
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
}
