# ironcap

An Inversion of Control library for TypeScript leveraging the ES7 decorators.

```typescript
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
```

### overview

ironcap is an [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) library for TypeScript leveraging ES7 decorator syntax for dependency injection.

ironcap is provided as a standalone typescript source file which can be added to a typescript project to enable dependency injection services.

### installation
Preform the following to install ironcap into a local typescript project.

```
copy ./src/ironcap.ts into local project.

npm i reflect-metadata

tsconfig.json:

    "experimentalDecorators": true

    "emitDecoratorMetadata": true
```

### registering types | resolving instances

ironcap supports two means of registering types. The ```@type()``` decorator which is applied to classes, and a more typical ```define()``` function. The following demonstrates both.

#### decorator

The following registers a type via decorator.

note: callers may override the automatic typename ```Foo``` with ```@ironcap.type("OtherName")```.

```typescript
import ironcap from "ironcap"

@ironcap.type() class Foo {

}

const foo = ironcap.resolve("Foo")
```

#### define

The following registers a type via define.

note: the ```define()``` function is primarily used to late register types dynamically.

```typescript
import ironcap from "ironcap"

class Foo { }

@ironcap.define("Foo", scope => new Foo())

const foo = ironcap.resolve("Foo")
```

### binding

ironcap will automatically inject constructor arguments which have been decorated with a ```@ironcap.bind(...)```. The following example will automatically inject ```Bar``` on ```Foo```.

```typescript

@ironcap.type()
class Bar {}

@ironcap.type()
class Foo {
  constructor(@ironcap.bind("Bar") private bar: Bar) {

  }
}

console.log(ironcap.resolve("Foo"))

// outputs:
// Foo { bar: Bar {} }
```

### scopes

Scopes are core concept in ironcap. In the preceeding examples, the type ```Foo``` was registered on a default root scope.

Scopes can be thought of as a space where types (classes) can be registered and instances of that type can be resolved from. All instances on a scope are created once, meaning if a scope resolves a new instance of a type, subsequent calls to resolve that type will returned that first instance. Scopes provide singleton like
initialization (as seen in other IoC libraries).

```typescript
@ironcap.type() 
class Foo { 
  constructor() { 
    console.log('Foo constructor called')
  }
}
ironcap.resolve("Foo")
ironcap.resolve("Foo")
ironcap.resolve("Foo")
ironcap.resolve("Foo")
// outputs: 
// Foo constructor called
```

Contrast this with the following code, where a new scope is created with the ```.scope()``` function, followed by resolving the type ```Foo```.

```typescript
@ironcap.type() 
class Foo { 
  constructor() { 
    console.log('Foo constructor called')
  }
}
ironcap.scope().resolve("Foo")
ironcap.scope().resolve("Foo")
ironcap.scope().resolve("Foo")
ironcap.scope().resolve("Foo")
// outputs: 
// Foo constructor called
// Foo constructor called
// Foo constructor called
// Foo constructor called
```

### late binding
class decoupling is a good model for developing flexible software and good use of interfacing to define contracts between interacting components 
is a sound pattern. Consider the following example. Here we have two possible repository types ```MongoRepository``` and ```SqlRepository``` 
which implements ```IRepository```. Next, we have a type ```Server``` that expects an instance of ```IRepository```.

In scenarios below, the selection of which repository to use is typically a configuration concern. Below we define the type
```IRepository``` to be of type ```MongoRepository``` via a call to ```define()```. 

```typescript
// repository types
interface IRepository {}
@ironcap.type() class MongoRepository implements IRepository { }
@ironcap.type() class SqlRepository   implements IRepository { }

// server
@ironcap.type() class Server {
  constructor(@ironcap.bind("IRepository") private repository: IRepository) {
  }
}

// configuration
ironcap.define("IRepository", scope => scope.resolve("MongoRepository"))

console.log(ironcap.resolve("Server"))

// outputs:
// Server { repository: MongoRepository {} }
```

### assertions
ironcap provides facilities for asserting instances. assertions are optional, but if specified, are run immediately after initializing the instance of a type. The following is the intended usecase.

```typescript

ironcap.assert<MongoRepositoryOptions>("MongoRepositoryOptions", options => {
  if ( options.host === undefined ) throw Error ("host expected")
  if ( options.port === undefined ) throw Error ("port expected")
  if ( options.user === undefined ) throw Error ("user expected")
  if ( options.pass === undefined ) throw Error ("pass expected")
})
interface MongoRepositoryOptions {
  host: string
  port: string
  user: string
  pass: string
}

@ironcap.type()
class MongoRepository {
  constructor(@ironcap.bind("MongoRepositoryOptions") private options: MongoRepositoryOptions) {

  }
}

// configuration time
ironcap.define("MongoRepositoryOptions", scope => {
  return {
    host: "localhost",
    port: 1234,
    user: "user",
    pass: "pass"
  }
})

console.log(ironcap.resolve("MongoRepository"))

// outputs:
// MongoRepository {
//  options: { host: 'localhost', port: 1234, user: 'user', pass: 'pass' } }
```

### prereq
```
npm install @types/reflect-metadata --save-dev
npm install reflect-metadata --save
```