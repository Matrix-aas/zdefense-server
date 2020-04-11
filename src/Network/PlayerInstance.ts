import ServerNetworkHandler from "./ServerNetworkHandler";
import Packet3Chat from "./Packets/Packet3Chat";

export default class PlayerInstance {
    protected networkHandler: ServerNetworkHandler = null;
    protected username: string;

    constructor(networkHandler: ServerNetworkHandler, username: string) {
        this.networkHandler = networkHandler;
        this.username = username;
    }

    public getUsername(): string {
        return this.username;
    }

    public sendChatMessage(message: string): void {
        this.networkHandler.addPacketToQueue(new Packet3Chat(message))
    }
}
