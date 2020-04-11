import {Packet, packet, PacketSide} from "./Packet";
import ArrayBufferStream from "../ArrayBufferStream";

@packet(2, PacketSide.CLIENT)
export default class Packet2WorldInfo extends Packet {
    private version: number;
    private playerEntityId: number;

    constructor(version?: number, playerEntityId?: number) {
        super();
        this.version = version;
        this.playerEntityId = playerEntityId;
    }

    public readData(buffer: ArrayBufferStream): void {
        this.version = buffer.readUShort();
        this.playerEntityId = buffer.readUInt();
    }

    public writeData(buffer: ArrayBufferStream): void {
        buffer.writeUShort(this.version);
        buffer.writeUInt(this.playerEntityId);
    }

    public getVersion(): number {
        return this.version;
    }

    public getPlayerEntityId(): number {
        return this.playerEntityId;
    }
}
