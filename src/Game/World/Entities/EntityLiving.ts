import Entity from "./Entity";
import MathUtils from "../../../Helpers/MathUtils";
import ArrayBufferStream from "../../../Network/ArrayBufferStream";

export default abstract class EntityLiving extends Entity {
    protected defaultSpeed = 0;
    protected currentSpeed = 0;

    protected _headAngle = 0;
    protected _strafeAngle = 0;

    tick(delta: number): void {
        super.tick(delta);
        const angle = this.moveAngle + this.strafeAngle;
        this.position.add(Math.cos(angle) * this.currentSpeed / delta, Math.sin(angle) * this.currentSpeed * delta);
    }

    protected get moveAngle(): number {
        return this.angle;
    }

    protected set moveAngle(value: number) {
        this.angle = value;
    }

    protected get headAngle(): number {
        return this._headAngle;
    }

    protected set headAngle(value: number) {
        this._headAngle = value;
    }

    protected get strafeAngle(): number {
        return this._strafeAngle;
    }

    protected set strafeAngle(value: number) {
        this._strafeAngle = value;
    }

    public setMove(moving: boolean): void {
        if (moving) {
            this.move();
        } else {
            this.stop();
        }
    }

    public move(): void {
        this.currentSpeed = this.defaultSpeed;
    }

    public stop(): void {
        this.currentSpeed = 0.0;
    }

    public setSpeed(speed: number): void {
        this.defaultSpeed = speed;
    }

    public setHeadAngle(angle: number): void {
        this.headAngle = angle;
    }

    public setHeadAngleSmoothly(angle: number, speed: number): void {
        this.headAngle = MathUtils.smoothlyAngle(this.headAngle, angle, speed);
    }

    public getHeadAngle(): number {
        return this.headAngle;
    }

    public setMoveAngle(angle: number): void {
        this.moveAngle = angle;
    }

    public setMoveAngleSmoothly(angle: number, speed: number): void {
        this.moveAngle = MathUtils.smoothlyAngle(this.moveAngle, angle, speed);
    }

    public getMoveAngle(): number {
        return this.moveAngle;
    }

    public setStrafeAngle(angle: number): void {
        this.strafeAngle = angle;
    }

    public setStrafeAngleSmoothly(angle: number, speed: number): void {
        this.strafeAngle = MathUtils.smoothlyAngle(this.strafeAngle, angle, speed);
    }

    public getStrafeAngle(): number {
        return this.strafeAngle;
    }

    public getDefaultSpeed(): number {
        return this.defaultSpeed;
    }

    public getCurrentSpeed(): number {
        return this.currentSpeed;
    }

    public isMoving(): boolean {
        return this.currentSpeed > 0.0;
    }

    readDataFromBuffer(inputBuffer: ArrayBufferStream): void {
        super.readDataFromBuffer(inputBuffer);
        this.defaultSpeed = inputBuffer.readFloat32();
        this.currentSpeed = inputBuffer.readFloat32();
        this.headAngle = inputBuffer.readFloat32();
        this.strafeAngle = inputBuffer.readFloat32();
    }

    writeDataToBuffer(outputBuffer: ArrayBufferStream): void {
        super.writeDataToBuffer(outputBuffer);
        outputBuffer.writeFloat32(this.defaultSpeed);
        outputBuffer.writeFloat32(this.currentSpeed);
        outputBuffer.writeFloat32(this.headAngle);
        outputBuffer.writeFloat32(this.strafeAngle);
    }
}
