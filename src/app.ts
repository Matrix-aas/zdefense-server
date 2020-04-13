import Server from "./Server";

let app: App = null;

export default class App {
    protected interrupted = false;

    protected ticksPerSecond = 60; // Required ticks quantity per second

    protected currentTick = 0; // Current tick from server start

    protected lastTick = 0;
    protected lastTickDelay = 0; // Real delay between ticks

    protected lastTickSecond = 0;
    protected realTickPerSecond = 0; // Real ticks per second
    protected currentTickInSecond = 0;

    protected socketServer: Server = null;

    constructor() {
        this.socketServer = new Server();
    }

    public async init(): Promise<void> {
        await this.socketServer.init();
    }

    public get tickDelay(): number {
        return 1000 / this.ticksPerSecond;
    }

    protected async tick(delta: number): Promise<void> {
        await this.socketServer.tick(delta);
    }

    public async run(): Promise<void> {
        if (this.interrupted) {
            return;
        }

        const millis = (new Date()).getTime();

        this.lastTickDelay = millis - this.lastTick;
        this.lastTick = millis;

        if (millis - this.lastTickSecond >= 1000) {
            this.realTickPerSecond = this.currentTickInSecond;
            this.currentTickInSecond = 0;
            this.lastTickSecond = millis;

            process.stdout.write(
                `\rTPS: ${this.realTickPerSecond}, ` +
                `Delay: ${this.lastTickDelay}ms, ` +
                `Slots: ${this.getServer().getOccupiedSlots()}/${this.getServer().getMaxAvailableSlots()}, ` +
                `Entities: ${this.getServer().getWorld().getEntitiesCount()}             `
            );
        }

        ++this.currentTick;
        ++this.currentTickInSecond;

        await this.tick(this.lastTickDelay / this.tickDelay);

        setTimeout(this.run.bind(this), this.tickDelay);
    }

    protected onInterrupted(): void {
        console.log('Stopped.');
        process.exit(0);
    }

    public terminate(): void {
        this.socketServer.close();

        this.interrupted = true;

        this.onInterrupted();
    }

    public getServer(): Server {
        return this.socketServer;
    }

    public getCurrentTick(): number {
        return this.currentTick;
    }

    public getTicksPerSecond(): number {
        return this.ticksPerSecond;
    }

    public static get instance(): App {
        if (!app) {
            app = new App();
        }
        return app;
    }
}

(async (): Promise<void> => {
    await App.instance.init();

    App.instance.run();

    process.on('SIGINT', () => {
        App.instance.terminate();
    });
})();
