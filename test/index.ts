
import ironcap from "ironcap"

import ironcap from "ironcap"

@ironcap.type() export class Bar { }
@ironcap.type() export class Baz { }
@ironcap.type() export class Foo {
  constructor(@ironcap.bind("Bar") private bar: Bar,
              @ironcap.bind("Baz") private baz: Baz) {
  }
}

// explicit
const foo_0 = new Foo(new Bar(), new Baz())

// implicit
const foo_1 = ironcap.resolve<Foo>("Foo")
