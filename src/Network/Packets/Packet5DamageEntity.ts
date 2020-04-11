import {Packet, packet, PacketSide} from "./Packet";
import ArrayBufferStream from "../ArrayBufferStream";

@packet(5, PacketSide.CLIENT)
export default class Packet5DamageEntity extends Packet {
    private entityId: number;
    private attackerId: number;
    private health: number;
    private damage: number;
    private killed: boolean;

    constructor(entityId?: number, attackerId?: number, health?: number, damage?: number, killed?: boolean) {
        super();
        this.entityId = entityId;
        this.attackerId = attackerId;
        this.health = health;
        this.damage = damage;
        this.killed = killed;
    }

    readData(buffer: ArrayBufferStream): void {
        this.entityId = buffer.readUInt();
        this.attackerId = buffer.readUInt();
        this.health = buffer.readUInt();
        this.damage = buffer.readInt();
        this.killed = buffer.readBoolean();
    }

    writeData(buffer: ArrayBufferStream): void {
        buffer.writeUInt(this.entityId);
        buffer.writeUInt(this.attackerId);
        buffer.writeUInt(this.health);
        buffer.writeInt(this.damage);
        buffer.writeBoolean(this.killed);
    }

    public getEntityId(): number {
        return this.entityId;
    }

    public getAttackerId(): number {
        return this.attackerId;
    }

    public getHealth(): number {
        return this.health;
    }

    public getDamage(): number {
        return this.damage;
    }

    public isKilled(): boolean {
        return this.killed;
    }
}
