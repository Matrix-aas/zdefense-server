import {packet, Packet, PacketSide} from "./Packet";
import Point from "../../Helpers/Point";
import Entity from "../../Game/World/Entities/Entity";
import EntityLiving from "../../Game/World/Entities/EntityLiving";
import ArrayBufferStream from "../ArrayBufferStream";

interface EntityMoveData {
    entityId: number;
    position: Point;
    speed: number;
    headAngle: number;
    moveAngle: number;
    strafeAngle: number;
    moving: boolean;
    teleport: boolean;
}

@packet(6, [PacketSide.CLIENT, PacketSide.SERVER])
export default class Packet6MoveEntity extends Packet {
    private moves: EntityMoveData[] = [];

    constructor(entityId?: number | Entity, position?: Point | boolean, speed?: number, headAngle?: number, moveAngle?: number, strafeAngle?: number, moving?: boolean, teleport?: boolean) {
        super();
        if (entityId) {
            this.push(entityId, position, speed, headAngle, moveAngle, strafeAngle, moving, teleport);
        }
    }

    public push(entityId: number | Entity, position?: Point | boolean, speed?: number, headAngle?: number, moveAngle?: number, strafeAngle?: number, moving?: boolean, teleport?: boolean): void {
        if (entityId instanceof Entity) {
            const _entityId = entityId.id;
            const _position = entityId.position.clone();
            let _speed = 0.0;
            let _moveAngle = 0;
            let _headAngle = 0;
            let _strafeAngle = 0;
            let _moving = false;
            if (entityId instanceof EntityLiving) {
                _speed = entityId.getDefaultSpeed();
                _moveAngle = entityId.getMoveAngle();
                _headAngle = entityId.getHeadAngle();
                _strafeAngle = entityId.getStrafeAngle();
                _moving = entityId.isMoving();
            }
            const _teleport = typeof position === 'boolean' ? position : false;
            this.moves.push({
                entityId: _entityId,
                position: _position,
                speed: _speed,
                headAngle: _headAngle,
                moveAngle: _moveAngle,
                strafeAngle: _strafeAngle,
                moving: _moving,
                teleport: _teleport,
            });
        } else if (position instanceof Point) {
            this.moves.push({
                entityId: entityId,
                position: position,
                speed: speed,
                headAngle: headAngle,
                moveAngle: moveAngle,
                strafeAngle: strafeAngle,
                moving: moving,
                teleport: teleport,
            });
        }
    }

    public shift(): EntityMoveData | undefined {
        return this.moves.shift();
    }

    public isEmpty(): boolean {
        return this.moves.length === 0;
    }

    readData(buffer: ArrayBufferStream): void {
        let count = buffer.readUShort();
        while (count-- > 0) {
            this.moves.push({
                entityId: buffer.readUInt(),
                position: Point.createFromBuffer(buffer),
                speed: buffer.readFloat32(),
                headAngle: buffer.readUShort(),
                moveAngle: buffer.readUShort(),
                strafeAngle: buffer.readUShort(),
                moving: buffer.readBoolean(),
                teleport: buffer.readBoolean(),
            });
        }
    }

    writeData(buffer: ArrayBufferStream): void {
        buffer.writeUShort(this.moves.length);
        for (const move of this.moves) {
            buffer.writeUInt(move.entityId);
            move.position.writeToBuffer(buffer);
            buffer.writeFloat32(move.speed);
            buffer.writeUShort(move.headAngle);
            buffer.writeUShort(move.moveAngle);
            buffer.writeUShort(move.strafeAngle);
            buffer.writeBoolean(move.moving);
            buffer.writeBoolean(move.teleport);
        }
    }
}
