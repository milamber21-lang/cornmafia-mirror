type UpFn = (...args: unknown[]) => unknown | Promise<unknown>;
type DownFn = (...args: unknown[]) => unknown | Promise<unknown>;

export interface Migration {
  slug: string;
  up: UpFn;
  down: DownFn;
}

const migrations: Migration[] = [];

export default migrations;
export { migrations };
