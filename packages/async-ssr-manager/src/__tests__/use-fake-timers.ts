const queueMacroTask = setImmediate;

export async function useFakeTimers<TResult>(
  createPromise: () => Promise<TResult>,
  expectedTimeout?: number
): Promise<TResult> {
  jest.useFakeTimers();

  try {
    const promise = createPromise();

    let pending = true;

    promise.then(() => (pending = false), () => (pending = false));

    let actualTimeout = 0;

    await new Promise(queueMacroTask);

    while (pending) {
      jest.runAllTicks();
      jest.runAllImmediates();
      jest.advanceTimersByTime(1);

      actualTimeout += 1;

      await new Promise(queueMacroTask);
    }

    if (typeof expectedTimeout === 'number') {
      expect(actualTimeout).toBe(expectedTimeout);
    }

    return promise;
  } finally {
    jest.useRealTimers();
  }
}
