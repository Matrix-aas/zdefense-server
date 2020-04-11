import * as WebSocket from 'ws';
import ArrayBufferStream from "./ArrayBufferStream";
import {Packet, PacketSide} from "./Packets/Packet";
import * as http from "http";
import Packet255Kicked from "./Packets/Packet255Kicked";
import Server from "../Server";

class UnknownMessageTypeError extends Error {
}

export default abstract class NetworkHandler {
    private server: Server = null;
    private socket: WebSocket = null;
    private webRequest: http.IncomingMessage = null;

    private packetsToProcess: Packet[] = [];
    private packetsToSend: Packet[] = [];

    constructor(server: Server, webSocket: WebSocket, webRequest: http.IncomingMessage) {
        this.server = server;
        this.socket = webSocket;
        this.webRequest = webRequest;

        if (this.server.getAvailableSlots() < 1) {
            this.kick('Server is full!');
        } else {
            this.socket.on('message', (message: WebSocket.Data) => {
                try {
                    this.handleMessage(message);
                } catch (e) {
                    this._onError(e);
                }
            });

            this.socket.on('close', this._onDisconnect.bind(this));
            this.socket.on('error', this._onError.bind(this));

            this._onConnect();
        }
    }

    public isConnected(): boolean {
        return this.socket.readyState === WebSocket.OPEN;
    }

    public close(): void {
        if (this.isConnected()) {
            this.socket.close();
        }
    }

    public kick(reason: string): void {
        if (this.isConnected()) {
            this.sendPacketToSocket(new Packet255Kicked(reason));
            this.close();
        }
    }

    private _onConnect(): void {
        this.server.fireEvent('client-connected', this);
        this.onConnect();
    }

    public onConnect(): void {
        //
    }

    private _onDisconnect(): void {
        this.server.fireEvent('client-disconnected', this);
        this.onDisconnect();
    }

    public onDisconnect(): void {
        //
    }

    private _onError(e: Error): void {
        if (e instanceof UnknownMessageTypeError) {
            this.close();
            return;
        }

        this.server.fireEvent('client-error', this, e);

        this.onError(e);
        this.close();
    }

    public onError(e: Error): void {
        //
    }

    private handleMessage(message: WebSocket.Data): void {
        if (!this.isConnected()) {
            return;
        }

        if (!(message instanceof Buffer)) {
            throw new UnknownMessageTypeError();
        }

        const packet = Packet.createPacketFromStream(new ArrayBufferStream(message), PacketSide.SERVER);
        this.packetsToProcess.push(packet);
    }

    public async process(): Promise<void> {
        if (!this.isConnected()) {
            return;
        }

        let processDone = false;

        const processThread = async (): Promise<void> => {
            let packet;
            while (this.isConnected() && (packet = this.packetsToProcess.shift()) instanceof Packet) {
                try {
                    this.server.fireEvent('client-packet-recieved', packet, this);
                    this.handlePacket(packet);
                } catch (e) {
                    this._onError(e);
                }
            }

            processDone = true;
        };

        const sendThread = async (): Promise<void> => {
            await new Promise(resolve => {
                const doSend = (): void => {
                    let packet;
                    while (this.isConnected() && (packet = this.packetsToSend.shift()) instanceof Packet) {
                        try {
                            this.sendPacketToSocket(packet);
                            this.server.fireEvent('client-packet-sended', packet, this);
                        } catch (e) {
                            this._onError(e);
                        }
                    }

                    if (!processDone && this.isConnected()) {
                        setTimeout(doSend.bind(this), 0);
                    } else {
                        resolve();
                    }
                };
                doSend();
            });
        };

        await Promise.all([processThread(), sendThread()]);
    }

    protected abstract handlePacket(packet: Packet): void;

    public addPacketToQueue(packet: Packet): void {
        if (!this.isConnected()) {
            return;
        }

        if (!packet) {
            throw new Error('Packet can\'t be null!');
        }

        this.packetsToSend.push(packet);
    }

    private sendPacketToSocket(packet: Packet): void {
        NetworkHandler.sendPacketToSocket(packet, this.socket);
    }

    public getServer(): Server {
        return this.server;
    }

    public getWebRequest(): http.IncomingMessage {
        return this.webRequest;
    }

    public static sendPacketToSocket(packet: Packet, socket: WebSocket): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(packet.writePacketToStream(new ArrayBufferStream()).toArrayBuffer());
        }
    }
}
