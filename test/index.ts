import * as ironcap from "../src/ironcap"

@ironcap.component() 
export class Bar { }

@ironcap.component() 
export class Baz { }

@ironcap.component() export class Foo {
  constructor(@ironcap.bind("Bar") private bar: Bar,
              @ironcap.bind("Baz") private baz: Baz) {
  }
}

console.log(ironcap.scope().resolve("Foo"))