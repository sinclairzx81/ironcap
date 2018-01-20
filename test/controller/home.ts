import ironcap from "ironcap"
import { IDatabase } from "../database/index"

export interface HomeControllerOptions {
  name: string
}

@ironcap.type()
export class HomeController {
  constructor(@ironcap.bind("HomeControllerOptions") private options:  HomeControllerOptions,
              @ironcap.bind("IDatabase")             private database: IDatabase) {
    console.log("HomeController Constructor")
  }
}
