import ArrayBufferStream from "../ArrayBufferStream";

export enum PacketSide {
    CLIENT,
    SERVER,
}

interface PacketInfo {
    id: number;
    side: PacketSide[];
    immediately: boolean;
}

type PacketClass = new () => Packet;

export abstract class Packet {
    public static USE_SHORT_IDENTIFIER = false;

    public static readonly MAX_STRING_LEN = 32767;

    private static readonly idToPacket: Map<number, PacketClass> = new Map<number, PacketClass>();
    private static readonly packetToId: Map<PacketClass, number> = new Map<PacketClass, number>();

    private static recievedBytes = 0;
    private static sendedBytes = 0;

    public static getPacketInfo(packet: PacketClass): PacketInfo {
        if (!Object.prototype.hasOwnProperty.call(packet.prototype, 'packetId') ||
            !Object.prototype.hasOwnProperty.call(packet.prototype, 'packetSide') ||
            !Object.prototype.hasOwnProperty.call(packet.prototype, 'packetImmediately')
        ) {
            throw new Error(`${packet.name} not decorated with PacketInfo`);
        }

        return {
            id: packet.prototype.packetId,
            side: packet.prototype.packetSide,
            immediately: packet.prototype.packetImmediately,
        } as PacketInfo;
    }

    public static registerPacket(packet: PacketClass): void {
        const pi: PacketInfo = Packet.getPacketInfo(packet);

        if (Packet.packetToId.has(packet)) {
            throw new Error(`Packet "${packet.name}" already exists!`);
        }

        const packetId = pi.id;
        if (Packet.idToPacket.has(packetId)) {
            throw new Error(`Packet with id ${packetId} already exists!`);
        }

        Packet.idToPacket.set(packetId, packet);
        Packet.packetToId.set(packet, packetId);
    }

    public static getPacketId(packet: PacketClass): number {
        return Packet.packetToId.has(packet) ? Packet.packetToId.get(packet) : -1;
    }

    public static isPacketExist(id: number | PacketClass): boolean {
        if (typeof id === 'number') {
            return Packet.idToPacket.has(id);
        } else {
            return Packet.packetToId.has(id);
        }
    }

    public static getPacketSide(packet: PacketClass): PacketSide[] {
        return Packet.getPacketInfo(packet).side;
    }

    public static isPacketImmediately(packet: PacketClass): boolean {
        return Packet.getPacketInfo(packet).immediately;
    }

    public static createPacket(id: number): Packet {
        if (!Packet.isPacketExist(id)) {
            return null;
        }
        return new (Packet.idToPacket.get(id))();
    }

    public static createPacketFromStream(inputBuffer: ArrayBufferStream, side: PacketSide): Packet {
        if (inputBuffer == null) {
            throw new Error('Stream is null!');
        }

        let packet: Packet = null;

        try {
            let packetId;
            if (!Packet.USE_SHORT_IDENTIFIER) {
                packetId = inputBuffer.readByte();
            } else {
                packetId = inputBuffer.readUShort();
            }

            if (!Packet.isPacketExist(packetId)) {
                throw new Error(`Bad packet ID ${packetId}`);
            }

            const packetClass: PacketClass = Packet.idToPacket.has(packetId) ? Packet.idToPacket.get(packetId) : null;
            if (packetClass == null) {
                throw new Error(`Bad packet ID ${packetId}`);
            }

            const packetSide: PacketSide[] = Packet.getPacketSide(packetClass);
            if (packetSide.indexOf(side) < 0) {
                throw new Error(`Bad packet ID ${packetId}`);
            }

            packet = Packet.createPacket(packetId);
            if (packet == null) {
                throw new Error(`Bad packet ID ${packetId}`);
            }

            packet.readData(inputBuffer);

            Packet.recievedBytes += inputBuffer.size();
        } catch (e) {
            console.warn(e);
            packet = null;
        }

        return packet;
    }

    public static writeString(str: string, outputBuffer: ArrayBufferStream): void {
        if (str.length > Packet.MAX_STRING_LEN) {
            throw new Error('String too big');
        }
        outputBuffer.writeUShort(str.length);
        outputBuffer.writeChars(str);
    }

    public static readString(inputBuffer: ArrayBufferStream, maxLength: number = Packet.MAX_STRING_LEN): string {
        const strlen = inputBuffer.readUShort();

        if (strlen > maxLength) {
            throw new Error(`Received string length longer than maximum allowed (${strlen} > ${maxLength})`);
        } else if (strlen < 0) {
            throw new Error('Received string length is less than zero! Weird string!');
        } else {
            return inputBuffer.readChars(strlen);
        }
    }

    public static writePacketToStream(outputBuffer: ArrayBufferStream, packet: Packet): ArrayBufferStream {
        if (!packet) {
            throw new Error('Packet is required!');
        }

        const packetId = packet.getPacketId();
        if (packetId < 0 || ((!Packet.USE_SHORT_IDENTIFIER && packetId > 255) || (Packet.USE_SHORT_IDENTIFIER && packetId > 65535))) {
            throw new Error('Unknown packet for write!');
        }
        if (!Packet.USE_SHORT_IDENTIFIER) {
            outputBuffer.writeByte(packetId);
        } else {
            outputBuffer.writeUShort(packetId);
        }
        packet.writeData(outputBuffer);

        Packet.sendedBytes += outputBuffer.size();

        return outputBuffer;
    }

    public getPacketId(): number {
        return Packet.getPacketId(Object.getPrototypeOf(this).constructor);
    }

    public getPacketInfo(): PacketInfo {
        return Packet.getPacketInfo(Object.getPrototypeOf(this).constructor);
    }

    public getPacketSide(): PacketSide[] {
        return Packet.getPacketSide(Object.getPrototypeOf(this).constructor);
    }

    public isPacketImmediately(): boolean {
        return Packet.isPacketImmediately(Object.getPrototypeOf(this).constructor);
    }

    public abstract readData(buffer: ArrayBufferStream): void;

    public abstract writeData(buffer: ArrayBufferStream): void;

    public writePacketToStream(buffer: ArrayBufferStream): ArrayBufferStream {
        return Packet.writePacketToStream(buffer, this);
    }

    public static getRecievedBytes(): number {
        return Packet.recievedBytes;
    }

    public static getSendedBytes(): number {
        return Packet.sendedBytes;
    }

    public static resetRecievedSendedBytes(): void {
        Packet.recievedBytes = 0;
        Packet.sendedBytes = 0;
    }
}

export function packet(id: number, side: PacketSide | PacketSide[], immediately = false) {
    return function (constructor: Function): any {
        constructor.prototype.packetId = id;
        constructor.prototype.packetSide = Array.isArray(side) ? side : [side];
        constructor.prototype.packetImmediately = immediately;
    };
}
