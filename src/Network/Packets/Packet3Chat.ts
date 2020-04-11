import {Packet, packet, PacketSide} from "./Packet";
import ArrayBufferStream from "../ArrayBufferStream";

@packet(3, [PacketSide.CLIENT, PacketSide.SERVER])
export default class Packet3Chat extends Packet {
    private message: string;

    constructor(message?: string) {
        super();
        this.message = (message || '').trim();
    }

    public readData(buffer: ArrayBufferStream): void {
        this.message = Packet.readString(buffer).trim();
    }

    public writeData(buffer: ArrayBufferStream): void {
        Packet.writeString(this.message, buffer);
    }

    public getMessage(): string {
        return this.message;
    }
}
