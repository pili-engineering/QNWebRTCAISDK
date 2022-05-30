export interface TimerTask {
  cancel: () => void;
  run: () => Promise<void>;
}

export const createTimeoutTask = (ms: number): TimerTask => {
  let timer: null | NodeJS.Timer = null;
  const promise = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      resolve();
    }, ms);
  });
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return {
    cancel,
    run: () => promise,
  };
};
