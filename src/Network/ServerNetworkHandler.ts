import NetworkHandler from "./NetworkHandler";
import {Packet} from "./Packets/Packet";
import Packet1Handshake from "./Packets/Packet1Handshake";
import PlayerInstance from "./PlayerInstance";
import Packet3Chat from "./Packets/Packet3Chat";
import Packet2WorldInfo from "./Packets/Packet2WorldInfo";

const PROTOCOL_VERSION = 1;

export default class ServerNetworkHandler extends NetworkHandler {
    protected player: PlayerInstance = null;

    protected handlePacket(packet: Packet): void {
        if (!this.player) {
            if (packet instanceof Packet1Handshake) {
                if (packet.getProtocolVersion() > PROTOCOL_VERSION) {
                    this.kick('Server protocol is out of date');
                } else if (packet.getProtocolVersion() < PROTOCOL_VERSION) {
                    this.kick('Your protocol is out of date');
                } else if (this.isUsernameAlreadyRegistered(packet.getUsername())) {
                    this.kick('Username already registered!');
                } else {
                    this.player = new PlayerInstance(this, packet.getUsername());
                    this.getServer().fireEvent('client-handshaked', this.player);
                    this.initWorld();
                }
            } else {
                this.kick('The first package should be a handshake');
            }
        } else {
            this.handlePacketOnline(packet);
        }
    }

    protected initWorld(): void {
        this.addPacketToQueue(new Packet2WorldInfo());
    }

    protected handlePacketOnline(packet: Packet): void {
        if (packet instanceof Packet3Chat) {
            console.log(`[CHAT] ${this.player.getUsername()}: ${packet.getMessage()}`);
            this.getServer().sendChatMessage(`${this.player.getUsername()}: ${packet.getMessage()}`);
        }
    }

    private isUsernameAlreadyRegistered(username: string): boolean {
        username = username.toLowerCase();
        return this.getServer().getOnlineClients().some(client => username === client.player.getUsername().toLowerCase());
    }

    public getPlayer(): PlayerInstance {
        return this.player;
    }

    public isOnline(): boolean {
        return this.player !== null;
    }
}
