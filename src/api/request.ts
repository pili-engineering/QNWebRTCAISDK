class Request {
  private init?: RequestInit;

  constructor(init?: RequestInit) {
    this.init = init;
  }

  setInit(init: RequestInit) {
    this.init = init;
  }

  get<P extends Record<string, number | string> | undefined, R>(url: string, query?: P): Promise<R> {
    const baseUrl = import.meta.env.VITE_BASE_URL + url;
    const queryToString = typeof query === 'object' && query !== null ?
      `?${Object.keys(query).map(key => `${key}=${query[key]}`).join('&')}` : '';

    return fetch(baseUrl + queryToString, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
      ...this.init
    })
      .then((res) => res.json())
      .then(result => {
        if (result.code === 0) {
          return result.data;
        }
        return Promise.reject(new TypeError(result.message));
      });
  }
}

export const request = new Request();
