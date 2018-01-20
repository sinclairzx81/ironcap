import { type, bind, assert } from "../../src/ironcap"
import { IDatabase }               from "../database/index"

export interface HomeControllerOptions {
  name: string
}

@type()
export class HomeController {
  constructor(@bind("HomeControllerOptions") private options: HomeControllerOptions,
              @bind("IDatabase") private database: any) {
    console.log("HomeController Constructor")
  }
}