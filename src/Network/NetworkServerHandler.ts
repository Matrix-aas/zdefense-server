import NetworkHandler from "./NetworkHandler";
import {Packet} from "./Packets/Packet";
import EntityPlayerMP from "../Game/World/Entities/Livings/EntityPlayerMP";
import * as WebSocket from "ws";
import Server from "../Server";
import App from "../app";
import Packet6MoveEntity from "./Packets/Packet6MoveEntity";
import Entity from "../Game/World/Entities/Entity";

export default class NetworkServerHandler extends NetworkHandler {
    protected player: EntityPlayerMP = null;

    constructor(webSocket: WebSocket, address: string, entityPlayerMP: EntityPlayerMP) {
        super(webSocket, address);
        this.player = entityPlayerMP;
    }

    protected handlePacket(packet: Packet): void {
        if (packet instanceof Packet6MoveEntity) {
            const moveData = packet.shift();
            const entity: Entity = this.server.getWorld().getEntity(moveData.entityId);
            if (entity != null && entity instanceof EntityPlayerMP) {
                entity.setHeadAngle(moveData.headAngle);
                entity.setMoveAngle(moveData.moveAngle);
                entity.setStrafeAngle(moveData.strafeAngle);
                entity.setMove(moveData.moving);
            }
        } else {
            console.log(packet);
        }
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
