import NetworkHandler from "./NetworkHandler";
import Packet1Handshake from "./Packets/Packet1Handshake";
import {Packet} from "./Packets/Packet";
import App from "../app";

const PROTOCOL_VERSION = 1;

export default class NetworkLoginHandler extends NetworkHandler {
    private loginTicks = 600;
    private initialized = false;
    private handshake: Packet1Handshake = null;

    protected handlePacket(packet: Packet): void {
        if (packet instanceof Packet1Handshake) {
            if (this.handshake || this.initialized) {
                this.kick('Quit repeating yourself!');
            } else if (packet.getProtocolVersion() > PROTOCOL_VERSION) {
                this.kick('Server protocol is out of date!');
            } else if (packet.getProtocolVersion() < PROTOCOL_VERSION) {
                this.kick('Your protocol is out of date!');
            } else if (this.isUsernameAlreadyRegistered(packet.getUsername())) {
                this.kick('Username already registered!');
            } else {
                this.handshake = packet;
            }
        } else {
            this.kick('The first package should be a handshake!');
        }
    }

    private isUsernameAlreadyRegistered(username: string): boolean {
        username = username.toLowerCase();
        return App.instance.getServer().getClients().some(client => username === client.getPlayer().getUsername().toLowerCase());
    }

    protected async networkTick(): Promise<void> {
        await super.networkTick();
        if (this.isConnected()) {
            if (this.handshake) {
                this.initializePlayerConnection();
            } else if (this.loginTicks-- <= 0) {
                this.kick('Took too long to log in!');
            }
        }
    }

    protected initializePlayerConnection(): void {
        this.initialized = true;
        try {
            const entityPlayerMP = App.instance.getServer().getPlayerManager().buildEntityPlayerMP(this.handshake.getUsername());
            App.instance.getServer().getPlayerManager().initializeConnection(this.socket, this.getAddress(), entityPlayerMP);
        } catch (e) {
            this.initialized = false;
            this.kick(`Ooups, something went wrong! ${e}`);
            this.initialized = true;
        }
    }

    isConnected(): boolean {
        return super.isConnected() && !this.initialized;
    }
}
