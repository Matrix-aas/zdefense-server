import * as WebSocket from 'ws';
import ArrayBufferStream from "./ArrayBufferStream";
import {Packet, PacketSide} from "./Packets/Packet";
import Packet255Kicked from "./Packets/Packet255Kicked";

class UnknownMessageTypeError extends Error {
}

export default abstract class NetworkHandler {
    protected socket: WebSocket = null;
    private address: string;

    private packetsToProcess: Packet[] = [];
    private packetsToSend: Packet[] = [];

    constructor(webSocket: WebSocket, address: string) {
        this.socket = webSocket;
        this.address = address;

        this.socket.on('message', (message: WebSocket.Data) => {
            try {
                this.handleMessage(message);
            } catch (e) {
                this._onError(e);
            }
        });

        this.socket.on('close', this.onDisconnect.bind(this));
        this.socket.on('error', this._onError.bind(this));

        this.onConnect();
    }

    public getAddress(): string {
        return this.address;
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

    public onConnect(): void {
        //
    }

    public onDisconnect(): void {
        //
    }

    private _onError(e: Error): void {
        if (e instanceof UnknownMessageTypeError) {
            this.close();
            return;
        }

        this.onError(e);
        this.close();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        if (packet.isPacketImmediately()) {
            this.handlePacket(packet);
        } else {
            this.packetsToProcess.push(packet);
        }
    }

    public async process(): Promise<void> {
        if (!this.isConnected()) {
            return;
        }

        await this.networkTick();

        let processDone = false;

        const processThread = async (): Promise<void> => {
            let packet;
            while (this.isConnected() && (packet = this.packetsToProcess.shift()) instanceof Packet) {
                try {
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

    protected async networkTick(): Promise<void> {
        //
    }

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

    public static sendPacketToSocket(packet: Packet, socket: WebSocket): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(packet.writePacketToStream(new ArrayBufferStream()).toArrayBuffer());
        }
    }
}
