import * as ironcap from "../../src/ironcap"
import {IDatabase} from "./database"

export interface MongoDatabaseOptions {
  host: string
  port: string
}

@ironcap.component()
export class MongoDatabase implements IDatabase {
  constructor(@ironcap.bind("MongoDatabaseOptions") private options: MongoDatabaseOptions) {
    console.log("MongoDatabase Constructor")
  }
  public get(): Promise<string> {
    return Promise.resolve("hello world")
  }
}