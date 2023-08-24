export type HttpContext = {
  http: {
    response: {
      status(value: number): void;
      headers(value: Record<string, string>): void;
      body(value: any): void;
    };
  };
};
