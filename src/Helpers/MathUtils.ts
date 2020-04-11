export default class MathUtils {
    public static toRadians(degrees: number): number {
        return degrees / 180.0 * Math.PI;
    }

    public static toDegree(radians: number): number {
        return radians / Math.PI * 180.0;
    }

    public static getAngleDistance(angle1: number, angle2: number): number {
        const angle = angle1 - angle2;
        if (angle < 0)
            return angle + 360.0;
        else if (angle > 360.0)
            return angle - 360.0;
        else
            return angle;
    }

    public static smoothlyAngle(angleCurrent: number, angleTarget: number, rotationSpeed: number): number {
        while (angleCurrent > 360.0)
            angleCurrent -= 360.0;
        while (angleCurrent < 0.0)
            angleCurrent += 360.0;
        if (Math.abs(angleCurrent - angleTarget) >= rotationSpeed + 0.1) {
            const left: number = MathUtils.getAngleDistance(angleCurrent, angleTarget);
            const right: number = MathUtils.getAngleDistance(angleTarget, angleCurrent);
            if (left < right) {
                if (left - rotationSpeed < 0.0)
                    return angleTarget;
                else
                    return angleCurrent - rotationSpeed;
            } else {
                if (left - rotationSpeed < 0.0)
                    return angleTarget;
                else
                    return angleCurrent + rotationSpeed;
            }
        }
        return angleTarget;
    }

    public static random(min: number, max?: number): number {
        return Math.floor((max === undefined || max === null) ? (Math.random() * min) : (min + Math.random() * (max + 1 - min)));
    }
}
