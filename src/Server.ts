import * as WebSocket from 'ws';
import {AddressInfo} from 'ws';
import * as http from "http";
import registerPackets from './Network/Packets';
import NetworkServerHandler from "./Network/NetworkServerHandler";
import NetworkLoginHandler from "./Network/NetworkLoginHandler";
import PlayerManager from "./Network/PlayerManager";
import WorldServer from "./Game/World/WorldServer";

export default class Server {
    protected socketServer: WebSocket.Server = null;
    protected pendingClients: NetworkLoginHandler[] = [];
    protected clients: NetworkServerHandler[] = [];

    protected availableSlots = 10;

    protected playerManager: PlayerManager = null;
    protected gameWorld: WorldServer = null;

    public async init(): Promise<void> {
        await registerPackets();
        await WorldServer.registerEntities();

        this.socketServer = new WebSocket.Server({
            port: 8081,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
                threshold: 1024
            }
        });

        this.socketServer.on('connection', (socket: WebSocket, request: http.IncomingMessage) => {
            this.pendingClients.push(new NetworkLoginHandler(socket, request.connection.remoteAddress));
        });

        let address = this.socketServer.address();
        if (typeof address === 'object') {
            address = `${(address as AddressInfo).address}${(address as AddressInfo).port}`;
        }

        this.playerManager = new PlayerManager();
        this.gameWorld = new WorldServer();

        console.log(`Server listening on ${address}...`);
    }

    public async tick(delta: number): Promise<void> {
        const processes: Promise<void>[] = [];

        for (let index = 0; index < this.pendingClients.length; ++index) {
            if (this.pendingClients[index].isConnected()) {
                processes.push(this.pendingClients[index].process());
            } else {
                this.pendingClients.splice(index--);
            }
        }

        for (let index = 0; index < this.clients.length; ++index) {
            if (this.clients[index].isConnected()) {
                processes.push(this.clients[index].process());
            } else {
                this.clients.splice(index--);
            }
        }

        if (this.gameWorld) {
            processes.push(this.gameWorld.tick(delta));
        }

        await Promise.all(processes);
    }

    public close(): void {
        let client;
        while ((client = [...this.pendingClients, ...this.clients].pop()) instanceof NetworkServerHandler) {
            client.kick('Server stopped.');
        }

        this.socketServer.close();
    }

    public getPlayerManager(): PlayerManager {
        return this.playerManager;
    }

    public getWorld(): WorldServer {
        return this.gameWorld;
    }

    public getClients(): NetworkServerHandler[] {
        return this.clients;
    }

    public getAvailableSlots(): number {
        return this.availableSlots - this.getClients().length;
    }

    public getMaxAvailableSlots(): number {
        return this.availableSlots;
    }
}
