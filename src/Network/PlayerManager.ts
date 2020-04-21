import Server from "../Server";
import EntityPlayerMP from "../Game/World/Entities/Livings/EntityPlayerMP";
import MathUtils from "../Helpers/MathUtils";
import * as WebSocket from 'ws';
import NetworkServerHandler from "./NetworkServerHandler";
import {Packet} from "./Packets/Packet";
import Packet3Chat from "./Packets/Packet3Chat";
import Packet2WorldInfo from "./Packets/Packet2WorldInfo";
import World from "../Game/World/World";
import App from "../app";
import Packet4SpawnEnitity from "./Packets/Packet4SpawnEnitity";
import Entity from "../Game/World/Entities/Entity";
import Packet6MoveEntity from "./Packets/Packet6MoveEntity";
import EntityLiving from "../Game/World/Entities/EntityLiving";

export default class PlayerManager {
    protected players: EntityPlayerMP[] = [];

    public buildEntityPlayerMP(username: string): EntityPlayerMP {
        const player = new EntityPlayerMP();
        player.setUsername(username);
        const spawnRadius = this.server.getWorld().getSpawnRadius();
        player.teleport(this.server.getWorld().getSpawnLocation().clone().add(
            MathUtils.random(-spawnRadius.x, spawnRadius.x),
            MathUtils.random(-spawnRadius.y, spawnRadius.y),
        ));
        return player;
    }

    public initializeConnection(socket: WebSocket, address: string, player: EntityPlayerMP): void {
        const networkHandler = new NetworkServerHandler(socket, address, player);
        player.setNetworkHandler(networkHandler);
        this.server.getClients().push(networkHandler);
        this.players.push(player);

        this.server.getWorld().spawnEntity(player);
        this.sendAllEntitiesToPlayer(player, player);

        networkHandler.addPacketToQueue(new Packet2WorldInfo(World.WORLD_VERSION, player.id));

        this.sendChatMessageToAll(`${player.getUsername()} joined the game!`);
    }

    public playerLoggerOut(player: EntityPlayerMP): void {
        const index = this.getPlayerIndex(player);
        if (index > -1) {
            this.players.splice(index);
            this.server.getWorld().removeEntity(player);
            this.sendChatMessageToAll(`${player.getUsername()} left the game!`);
        }
    }

    public getPlayerByUsername(username: string): EntityPlayerMP {
        username = username.toLowerCase();
        return this.players.find(player => player.getUsername().toLowerCase() === username);
    }

    public getPlayerIndex(player: EntityPlayerMP): number {
        return this.players.findIndex(_player => player.id === _player.id);
    }

    public sendPacketToAll(packet: Packet, except: EntityPlayerMP | EntityPlayerMP[] = []): void {
        if (!Array.isArray(except)) {
            except = [except];
        }

        for (const player of this.players) {
            if (except.indexOf(player) < 0) {
                player.getNetworkHandler().addPacketToQueue(packet);
            }
        }
    }

    public sendChatMessageToAll(message: string, except: EntityPlayerMP | EntityPlayerMP[] = []): void {
        this.sendPacketToAll(new Packet3Chat(message), except);
        console.log(`[CHAT] ${message}`);
    }

    public sendAllEntitiesToPlayer(player: EntityPlayerMP, except: Entity | Entity[] = []): void {
        if (!Array.isArray(except)) {
            except = [except];
        }
        this.server.getWorld().getEntities().forEach(entity => {
            if ((except as Entity[]).indexOf(entity) < 0) {
                player.getNetworkHandler().addPacketToQueue(new Packet4SpawnEnitity(entity));
            }
        });
    }

    public sendEntityMove(entity: Entity, teleport: boolean): void {
        this.sendPacketToAll(new Packet6MoveEntity(entity, teleport));
    }

    public sendAllMovesToAllPlayers(): void {
        let index = 0;
        let packet = new Packet6MoveEntity();
        this.server.getWorld().getEntities().forEach(entity => {
            if (entity instanceof EntityLiving) {
                packet.push(entity, false);
            }
            if (++index % 5 === 0 && !packet.isEmpty()) {
                this.sendPacketToAll(packet);
                packet = new Packet6MoveEntity();
            }
        });
        if (!packet.isEmpty()) {
            this.sendPacketToAll(packet);
        }
    }

    public getPlayers(): EntityPlayerMP[] {
        return this.players;
    }

    public get server(): Server {
        return App.instance.getServer();
    }
}
