import ironcap from "ironcap"

export interface AboutControllerOptions {
  name: string
}

@ironcap.type()
export class AboutController {
  constructor(@ironcap.bind("AboutControllerOptions") private options: AboutControllerOptions) {
    console.log("AboutController Constructor")
  }
}