import NetworkHandler from "./NetworkHandler";
import {Packet} from "./Packets/Packet";
import EntityPlayerMP from "../Game/World/Entities/Livings/EntityPlayerMP";
import * as WebSocket from "ws";
import Server from "../Server";
import App from "../app";

export default class NetworkServerHandler extends NetworkHandler {
    protected player: EntityPlayerMP = null;

    constructor(webSocket: WebSocket, address: string, entityPlayerMP: EntityPlayerMP) {
        super(webSocket, address);
        this.player = entityPlayerMP;
    }

    protected handlePacket(packet: Packet): void {
        console.log(packet);
    }

    onDisconnect(): void {
        super.onDisconnect();
        this.server.getPlayerManager().playerLoggerOut(this.player);
    }

    public getPlayer(): EntityPlayerMP {
        return this.player;
    }

    public get server(): Server {
        return App.instance.getServer();
    }
}
