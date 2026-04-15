// Mock for bcrypt in host environments where native bindings are unavailable.

export const hash = jest.fn(async (plain: string, rounds: number): Promise<string> =>
  Promise.resolve(`$mock$${rounds}$${plain}`),
);

export const compare = jest.fn(async (plain: string, hashed: string): Promise<boolean> =>
  Promise.resolve(hashed === `$mock$10$${plain}` || hashed.endsWith(plain)),
);

export default {
  hash,
  compare,
};
