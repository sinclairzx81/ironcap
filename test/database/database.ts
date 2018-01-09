export interface IDatabase {
  get(): Promise<string>
}