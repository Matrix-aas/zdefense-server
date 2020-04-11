import * as WebSocket from 'ws';
import {AddressInfo} from 'ws';
import * as http from "http";
import registerPackets from './Network/Packets';
import ServerNetworkHandler from "./Network/ServerNetworkHandler";
import {Packet} from "./Network/Packets/Packet";
import Packet3Chat from "./Network/Packets/Packet3Chat";
import * as Event from 'events';
import NetworkHandler from "./Network/NetworkHandler";
import World from "./Game/World";

type ServerEvent = 'client-connected' | 'client-disconnected' | 'client-error' |
    'client-packet-recieved' | 'client-packet-sended' | 'client-handshaked';

export default class Server {
    protected socketServer: WebSocket.Server = null;
    protected clients: ServerNetworkHandler[] = [];
    protected eventBus: Event.EventEmitter = new Event.EventEmitter();

    protected availableSlots = 10;

    protected gameWorld: World = null;

    public async init(): Promise<void> {
        await registerPackets();

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
            this.clients.push(new ServerNetworkHandler(this, socket, request));
        });

        let address = this.socketServer.address();
        if (typeof address === 'object') {
            address = `${(address as AddressInfo).address}${(address as AddressInfo).port}`;
        }

        this.subscribeEvent('client-connected', (networkHandler: NetworkHandler) => {
            console.log(`Client from ${networkHandler.getWebRequest().connection.remoteAddress} connected!`);
        });

        this.subscribeEvent('client-disconnected', (networkHandler: NetworkHandler) => {
            console.log(`Client from ${networkHandler.getWebRequest().connection.remoteAddress} disconnected!`);
        });

        this.subscribeEvent('client-error', (networkHandler: NetworkHandler, error: Error) => {
            console.warn(`Client from ${networkHandler.getWebRequest().connection.remoteAddress} throw error!`, error);
        });

        this.gameWorld = new World(this);

        console.log(`Server listening on ${address}...`);
    }

    public async tick(delta: number): Promise<void> {
        const processes: Promise<void>[] = [];

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
        while ((client = this.clients.pop()) instanceof ServerNetworkHandler) {
            client.kick('Server stopped.');
        }

        this.socketServer.close();
    }

    public getClients(): ServerNetworkHandler[] {
        return this.clients;
    }

    /**
     * Warn, can be slow!
     */
    public getOnlineClients(): ServerNetworkHandler[] {
        return this.getClients().filter(client => client.isOnline());
    }

    public getAvailableSlots(): number {
        return this.availableSlots - this.getClients().length;
    }

    public getMaxAvailableSlots(): number {
        return this.availableSlots;
    }

    public sendPacketToAll(packet: Packet, except: ServerNetworkHandler | ServerNetworkHandler[] = []): void {
        if (!Array.isArray(except)) {
            except = [except];
        }

        for (const client of this.clients) {
            if (except.indexOf(client) < 0) {
                client.addPacketToQueue(packet);
            }
        }
    }

    public sendChatMessage(message: string, except: ServerNetworkHandler | ServerNetworkHandler[] = []): void {
        this.sendPacketToAll(new Packet3Chat(message), except);
    }

    public serverSay(message: string, serverName = 'SERVER: '): void {
        console.log(`[CHAT] SERVER: ${message}`);
        this.sendChatMessage(`${serverName}${message}`);
    }

    public subscribeEvent(event: ServerEvent, listener: (...args: any[]) => void): void {
        this.eventBus.on(event, listener);
    }

    public fireEvent(event: ServerEvent, ...args: any): void {
        this.eventBus.emit(event, ...args);
    }
}
