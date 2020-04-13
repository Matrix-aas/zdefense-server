import EntityLiving from "../EntityLiving";
import ArrayBufferStream from "../../../../Network/ArrayBufferStream";
import {Packet} from "../../../../Network/Packets/Packet";

export default class EntityPlayer extends EntityLiving {
    protected username: string;

    constructor() {
        super();
        this.size.set(32, 32);
    }

    public getMaxHealth(): number {
        return 100;
    }

    public getUsername(): string {
        return this.username;
    }

    public setUsername(username: string): void {
        this.username = username;
    }

    writeDataToBuffer(outputBuffer: ArrayBufferStream): void {
        super.writeDataToBuffer(outputBuffer);
        Packet.writeString(this.username, outputBuffer);
    }

    readDataFromBuffer(inputBuffer: ArrayBufferStream): void {
        super.readDataFromBuffer(inputBuffer);
        this.username = Packet.readString(inputBuffer);
    }
}
