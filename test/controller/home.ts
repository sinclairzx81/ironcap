import { component, bind, assert } from "../../src/ironcap"
import { IDatabase }               from "../database/index"

export interface HomeControllerOptions {
  name: string
}

@component()
export class HomeController {
  constructor(@bind("HomeControllerOptions") private options: HomeControllerOptions,
              @bind("IDatabase") private database: any) {
    console.log("HomeController Constructor")
  }
}