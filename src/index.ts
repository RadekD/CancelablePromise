export default class CancelablePromise<T> {
    static all(iterable) {
        return new CancelablePromise((y, n) => {
            Promise.all(iterable).then(y, n);
        });
    }

    static race(iterable) {
        return new CancelablePromise((y, n) => {
            Promise.race(iterable).then(y, n);
        });
    }

    static reject(value) {
        return new CancelablePromise((y, n) => {
            Promise.reject(value).then(y, n);
        });
    }

    static resolve(value) {
        return new CancelablePromise((y, n) => {
            Promise.resolve(value).then(y, n);
        });
    }

    private promise: Promise<T>
    private canceled: boolean
    constructor(executor: (
        resolve: (value?: T | PromiseLike<any>) => void,
        reject: (value?: any | void) => void,
    ) => void) {

        this.canceled = false

        this.promise = new Promise<T>(executor)
    }
    public then(
        onfulfilled?: ((value: T) => T | PromiseLike<T>) | undefined | null, 
        onrejected?: ((reason: any) => never | PromiseLike<never>) | undefined | null): 
        CancelablePromise<T> {

        const promise = new CancelablePromise<T>((resolve, reject) => {
            const callback = (callback: any, r: any) => {
                try {
                    resolve(callback(r));
                } catch (e) {
                    reject(e);
                }
            };

            this.promise.then((r) => {
                if (this.canceled) {
                    promise.cancel();
                }
                if (onfulfilled && !this.canceled) {
                    callback(onfulfilled, r);
                } else {
                    resolve(r);
                }
            }, (r) => {
                if (this.canceled) {
                    promise.cancel();
                }
                if (onrejected && !this.canceled) {
                    callback(onrejected, r);
                } else {
                    reject(r);
                }
            });
        });
        return promise;
    }
    public catch(
        onrejected?: ((reason: any) => any | PromiseLike<any>) | undefined | null)
        : Promise<void> | any {

        return this.then(undefined, onrejected)
    }
    public cancel() {
        this.canceled = true;
        return this;
    }
}