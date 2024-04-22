export class Retry {
    constructor(private howManyTimes: number, private backoffAsync: () => Promise<void>) {
    }

    async async<T>(fun: () => Promise<T>) {
        for (let i = 0; i < this.howManyTimes; i++) {
            try {
                return await fun();
            } catch (err: any) {
                if (i === this.howManyTimes - 1) {
                    console.warn(`[RETRY]: Failed too many time.`)
                    throw err;
                } else {
                    console.warn(`[RETRY]: Caught an error. Retry ${i + 1}/${this.howManyTimes}.`)
                }
            }
            await this.backoffAsync();
        }
        throw Error(`Shouldn't happen...`)
    }
}