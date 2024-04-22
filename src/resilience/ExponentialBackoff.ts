import { sleepAsync } from "./sleepAsync";

export class ExponentialBackoff {
    private i = 0
    private timeout: number;

    constructor(initialTimeoutMs: number = 500) {
        this.timeout = initialTimeoutMs;
    }

    async backoffAsync() {
        await sleepAsync(this.timeout);
        this.timeout *= 2;
    }
}