import {Packet, packet, PacketSide} from "./Packet";
import ArrayBufferStream from "../ArrayBufferStream";

@packet(1, PacketSide.SERVER)
export default class Packet1Handshake extends Packet {
    public static readonly MAX_USERNAME_LEN = 32;

    private protocolVersion: number;
    private username: string;

    constructor(protocolVersion?: number, username?: string) {
        super();
        this.protocolVersion = protocolVersion;
        this.username = (username || '').trim().substr(0, Packet1Handshake.MAX_USERNAME_LEN);
    }

    public readData(buffer: ArrayBufferStream): void {
        this.protocolVersion = buffer.readUShort();
        this.username = Packet.readString(buffer).trim().substr(0, Packet1Handshake.MAX_USERNAME_LEN);
    }

    public writeData(buffer: ArrayBufferStream): void {
        buffer.writeUShort(this.protocolVersion);
        Packet.writeString(this.username, buffer);
    }

    public getProtocolVersion(): number {
        return this.protocolVersion;
    }

    public getUsername(): string {
        return this.username;
    }
}
