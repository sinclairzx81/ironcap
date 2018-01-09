import { component, bind, assert } from "../../src/ironcap"

export interface AboutControllerOptions {
  name: string
}

@component()
export class AboutController {
  constructor(@bind("AboutControllerOptions") private options: AboutControllerOptions) {
    console.log("AboutController Constructor")
  }
}