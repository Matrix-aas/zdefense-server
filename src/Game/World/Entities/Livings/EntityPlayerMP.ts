import EntityPlayer from "./EntityPlayer";
import Packet3Chat from "../../../../Network/Packets/Packet3Chat";
import NetworkHandler from "../../../../Network/NetworkHandler";
import {entity} from "../Entity";
import World from "../../World";

@entity(0)
export default class EntityPlayerMP extends EntityPlayer {
    protected networkHandler: NetworkHandler = null;

    init(id: number, world: World): void {
        super.init(id, world);
        this.setSpeed(1.0);
    }

    public setNetworkHandler(networkHandler: NetworkHandler): void {
        this.networkHandler = networkHandler;
    }

    public getNetworkHandler(): NetworkHandler {
        return this.networkHandler;
    }

    public sendChatMessage(message: string): void {
        this.networkHandler.addPacketToQueue(new Packet3Chat(message));
    }
}
