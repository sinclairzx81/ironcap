import { type, bind, assert } from "../../src/ironcap"

export interface AboutControllerOptions {
  name: string
}

@type()
export class AboutController {
  constructor(@bind("AboutControllerOptions") private options: AboutControllerOptions) {
    console.log("AboutController Constructor")
  }
}