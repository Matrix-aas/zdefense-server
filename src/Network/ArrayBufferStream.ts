export default class ArrayBufferStream {
    private buffer: number[];
    private pointer = 0;

    constructor(buffer: ArrayBuffer | number[] = null) {
        this.buffer = [];

        if (buffer) {
            const bytes = new Uint8Array(buffer);
            for (const byte of bytes) {
                this.buffer.push(byte);
            }
        }
    }

    public toArrayBuffer(): ArrayBuffer {
        return new Uint8Array(this.buffer);
    }

    public seek(pointer: number): void {
        this.pointer = pointer;
    }

    public reset(): void {
        this.seek(0);
    }

    public end(): void {
        this.seek(this.buffer.length - 1);
    }

    public size(): number {
        return this.buffer.length;
    }

    public available(): boolean {
        return this.pointer >= 0 && this.pointer < this.buffer.length;
    }

    public writeByte(byte: number): void {
        if (byte === null || byte === undefined) {
            throw new Error('Byte is required!');
        }
        if (this.pointer === this.buffer.length - 1) {
            this.buffer.push(byte);
        } else {
            this.buffer.splice(this.pointer, 0, byte);
        }
        ++this.pointer;
    }

    public write(bytes: number[] | ArrayBuffer, offset = 0, len = 0): void {
        let _bytes;
        if (bytes instanceof ArrayBuffer) {
            _bytes = Array.from(new Uint8Array(bytes));
        } else {
            _bytes = bytes;
        }

        if (len === 0) {
            len = _bytes.length;
        }

        do {
            this.writeByte(_bytes[offset++]);
        } while (offset < len);
    }

    public writeShort(value: number): void {
        this.write(new Uint8Array(new Int16Array([value]).buffer).buffer);
    }

    public writeInt(value: number): void {
        this.write(new Uint8Array(new Int32Array([value]).buffer).buffer);
    }

    public writeUShort(value: number): void {
        this.write(new Uint8Array(new Uint16Array([value]).buffer).buffer);
    }

    public writeUInt(value: number): void {
        this.write(new Uint8Array(new Uint32Array([value]).buffer).buffer);
    }

    public writeFloat32(value: number): void {
        this.write(new Uint8Array(new Float32Array([value]).buffer).buffer);
    }

    public writeFloat64(value: number): void {
        this.write(new Uint8Array(new Float64Array([value]).buffer).buffer);
    }

    public writeChar(value: string): void {
        this.writeUShort(value.charCodeAt(0));
    }

    public writeChars(value: string): void {
        for (const char of value) {
            this.writeChar(char);
        }
    }

    public writeBoolean(value: boolean): void {
        this.writeByte(value ? 1 : 0);
    }

    public readByte(): number {
        if (!this.available()) {
            throw new Error('Reached end of stream');
        }
        return this.buffer[this.pointer++];
    }

    public read(len: number): number[] {
        const bytes: number[] = [];
        while (len--) {
            bytes.push(this.readByte());
        }
        return bytes;
    }

    public readShort(): number {
        return new Int16Array(new Uint8Array(this.read(2)).buffer)[0];
    }

    public readUShort(): number {
        return new Uint16Array(new Uint8Array(this.read(2)).buffer)[0];
    }

    public readInt(): number {
        return new Int32Array(new Uint8Array(this.read(4)).buffer)[0];
    }

    public readUInt(): number {
        return new Uint32Array(new Uint8Array(this.read(4)).buffer)[0];
    }

    public readFloat32(): number {
        return new Float32Array(new Uint8Array(this.read(4)).buffer)[0];
    }

    public readFloat64(): number {
        return new Float64Array(new Uint8Array(this.read(8)).buffer)[0];
    }

    public readChar(): string {
        return String.fromCharCode(this.readUShort());
    }

    public readChars(len: number): string {
        let string = '';
        while (len--) {
            string += this.readChar();
        }
        return string;
    }

    public readBoolean(): boolean {
        return this.readByte() !== 0;
    }
}
