import {Packet, PacketInfo, PacketSide} from "./Packet";
import ArrayBufferStream from "../ArrayBufferStream";

@PacketInfo(255, PacketSide.CLIENT)
export default class Packet255Kicked extends Packet {
    private reason: string;

    constructor(reason?: string) {
        super();
        this.reason = (reason || '').trim();
    }

    public readData(buffer: ArrayBufferStream): void {
        this.reason = Packet.readString(buffer).trim();
    }

    public writeData(buffer: ArrayBufferStream): void {
        Packet.writeString(this.reason, buffer);
    }

    public getReason(): string {
        return this.reason;
    }
}
