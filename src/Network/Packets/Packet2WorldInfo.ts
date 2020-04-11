import {Packet, PacketInfo, PacketSide} from "./Packet";
import ArrayBufferStream from "../ArrayBufferStream";

@PacketInfo(2, PacketSide.CLIENT)
export default class Packet2WorldInfo extends Packet {
    constructor(reason?: string) {
        super();
    }

    public readData(buffer: ArrayBufferStream): void {
        //
    }

    public writeData(buffer: ArrayBufferStream): void {
        //
    }
}
