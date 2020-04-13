import World, {NearestEntity} from "../World";
import * as Event from 'events';
import Point from "../../../Helpers/Point";
import ArrayBufferStream from "../../../Network/ArrayBufferStream";
import App from "../../../app";

interface EntityInfo {
    typeId: number;
}

type EntityClass = new () => Entity;

export class EntityNotDecorated extends Error {
}

export default abstract class Entity {
    private static readonly idToEntity: Map<number, EntityClass> = new Map<number, EntityClass>();
    private static readonly entityToId: Map<EntityClass, number> = new Map<EntityClass, number>();

    private readonly eventBus: Event.EventEmitter = new Event.EventEmitter();

    private _id = -1;
    private world: World = null;

    public readonly position = new Point();
    public readonly size = new Point();

    private health = 1;
    protected lastAttacker: Entity = null;

    constructor() {
        //
    }

    public init(id: number, world: World): void {
        this._id = id;
        this.world = world;
        this.health = this.getMaxHealth();
    }

    public abstract getMaxHealth(): number;

    public isDied(): boolean {
        return this.health <= 0;
    }

    public setHealth(health: number): void {
        if (this.health === health) {
            return;
        }

        const lastDiedState = this.isDied();

        this.health = health;
        if (this.health < 0) {
            this.health = 0;
        } else if (this.health > this.getMaxHealth()) {
            this.health = this.getMaxHealth();
        }

        if (!lastDiedState && this.isDied()) {
            this.fireEvent('died');
        }
    }

    public getHealth(): number {
        return this.health;
    }

    public heal(power: number, healer: Entity): void {
        if (power > 0 && !this.isDied()) {
            this.lastAttacker = healer;
            this.setHealth(this.health + power);
            if (healer) {
                healer.fireEvent('healing', power, this);
            }
            this.fireEvent('heal', power, healer);
        }
    }

    public damage(power: number, attacker: Entity): void {
        if (power > 0 && !this.isDied()) {
            this.lastAttacker = attacker;
            this.setHealth(this.health - power);
            if (attacker) {
                attacker.fireEvent('damaging', power, this);
            }
            this.fireEvent('damage', power, attacker);
        }
    }

    public kill(): void {
        this.setHealth(0);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public tick(delta: number): void {
        //
    }

    public get positionCenter(): Point {
        return this.position.clone().add(this.size.x / 2, this.size.y / 2);
    }

    protected onAngleChanged(): void {
        //
    }

    public teleport(point: Point): void {
        this.position.copyFrom(point);
        App.instance.getServer().getPlayerManager().sendEntityMove(this, true);
    }

    public subscribeEvent(event: string, listener: (...args: any[]) => void): void {
        this.eventBus.on(event, listener);
    }

    public fireEvent(event: string, ...args: any): void {
        this.eventBus.emit(event, ...args);
    }

    public get id(): number {
        return this._id;
    }

    public getTypeId(): number {
        return Entity.getEntityTypeId(Object.getPrototypeOf(this).constructor);
    }

    public writeEntityToBuffer(outputBuffer: ArrayBufferStream): void {
        Entity.writeEntityToBuffer(this, outputBuffer);
    }

    public getNearestEntity(type: typeof Entity = null,
                            max = 0,
                            exclude: Entity | Entity[] = []): NearestEntity | null {
        return this.world.getNearestEntity(this, type, max, exclude);
    }

    public getAngleToEntity(entity: Entity): number {
        return entity ? this.positionCenter.angle(entity.positionCenter) : 0;
    }

    public static getEntityInfo(entity: EntityClass): EntityInfo {
        if (!Object.prototype.hasOwnProperty.call(entity.prototype, 'entityTypeId')) {
            throw new EntityNotDecorated(`${entity.name} not decorated as entity`);
        }

        return {
            typeId: entity.prototype.entityTypeId,
        } as EntityInfo;
    }

    public static registerEntity(entity: EntityClass): void {
        const pi: EntityInfo = Entity.getEntityInfo(entity);

        if (Entity.entityToId.has(entity)) {
            throw new Error(`Entity "${entity.name}" already exists!`);
        }

        const entityTypeId = pi.typeId;
        if (Entity.idToEntity.has(entityTypeId)) {
            throw new Error(`Entity with id ${entityTypeId} already exists!`);
        }

        Entity.idToEntity.set(entityTypeId, entity);
        Entity.entityToId.set(entity, entityTypeId);
    }

    public static getEntityTypeId(entity: EntityClass): number {
        return Entity.entityToId.has(entity) ? Entity.entityToId.get(entity) : -1;
    }

    public static isEntityExist(id: number | EntityClass): boolean {
        if (typeof id === 'number') {
            return Entity.idToEntity.has(id);
        } else {
            return Entity.entityToId.has(id);
        }
    }

    public static createEntity(id: number): Entity {
        if (!Entity.isEntityExist(id)) {
            return null;
        }
        return new (Entity.idToEntity.get(id))();
    }

    public static createEntityFromBuffer(inputBuffer: ArrayBufferStream): Entity {
        if (inputBuffer == null) {
            throw new Error('Stream is null!');
        }

        let entity: Entity = null;

        try {
            const entityTypeId = inputBuffer.readUShort();

            if (!Entity.isEntityExist(entityTypeId)) {
                throw new Error(`Bad entity ID ${entityTypeId}`);
            }

            const entityClass: EntityClass = Entity.idToEntity.has(entityTypeId) ? Entity.idToEntity.get(entityTypeId) : null;
            if (entityClass == null) {
                throw new Error(`Bad entity ID ${entityTypeId}`);
            }

            entity = Entity.createEntity(entityTypeId);
            if (entity == null) {
                throw new Error(`Bad entity ID ${entityTypeId}`);
            }

            entity._id = inputBuffer.readUInt();
            entity.position.readFromBuffer(inputBuffer);
            entity.health = inputBuffer.readUInt();

            entity.readDataFromBuffer(inputBuffer);
        } catch (e) {
            console.warn(e);
            entity = null;
        }

        return entity;
    }

    public static writeEntityToBuffer(entity: Entity, outputBuffer: ArrayBufferStream): void {
        if (entity.getTypeId() < 0) {
            throw new Error('Entity id can\'t be lower zero!');
        }
        outputBuffer.writeUShort(entity.getTypeId());
        outputBuffer.writeUInt(entity.id);
        entity.position.writeToBuffer(outputBuffer);
        outputBuffer.writeUInt(entity.health);
        entity.writeDataToBuffer(outputBuffer);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public readDataFromBuffer(inputBuffer: ArrayBufferStream): void {
        //
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public writeDataToBuffer(outputBuffer: ArrayBufferStream): void {
        //
    }
}

export function entity(typeId: number) {
    return function (constructor: Function): any {
        constructor.prototype.entityTypeId = typeId;
    };
}
