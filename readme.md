# ironcap

An experimental inversion of control library for TypeScript leveraging the ES7 decorator syntax.

```typescript
import * as ironcap from "<path-to>/ironcap"

@ironcap.component() 
export class Bar { }

@ironcap.component() 
export class Baz { }

@ironcap.component() 
export class Foo {
  constructor( 
    @ironcap.bind("Bar") private bar: Bar,
    @ironcap.bind("Baz") private baz: Baz
  ) {
  }
}

// explicit
const foo_0 = new Foo(new Bar(), new Baz())

// declarative through binding
const foo_1 = ironcap.scope().resolve<Foo>("Foo")
```

### overview

ironcap is an experimental inversion of control library for TypeScript. It leverages TypeScript's experimental decorator syntax to declaratively wire dependencies for classes marked as ```components```.

### scopes

ironcap ties much of its functionality to a concept called a scope.

A scope can be thought of as a container or template for all registered ```components```. Callers use scopes to ```resolve()``` actual component instances; and the scope will internally cache the instance for subsequent calls to ```resolve()```. This is conceptually inline with ```singleton``` and ```transient``` initialization seen in other IoC libraries, but with transient resolution tied to different scopes.

Consider the following class / component

```typescript
@ironcap.component() class Foo { 
  constructor() { 
    console.log('constructor called' )
  }
}
```
#### single scope
note that the constructor is only called once per scope.
```typescript
const scope = ironcap.scope()
const foo_0 = scope.resolve("Foo")
const foo_1 = scope.resolve("Foo")
const foo_2 = scope.resolve("Foo")
const foo_3 = scope.resolve("Foo")
const foo_4 = scope.resolve("Foo")

// outputs: 
// constructor called
```
#### multiple scopes
new instances can be created by creating new scopes.
```typescript
const foo_0 = ironcap.scope().resolve("Foo")
const foo_1 = ironcap.scope().resolve("Foo")
const foo_2 = ironcap.scope().resolve("Foo")
const foo_3 = ironcap.scope().resolve("Foo")
const foo_4 = ironcap.scope().resolve("Foo")

// outputs: 
// constructor called
// constructor called
// constructor called
// constructor called
// constructor called
```

### late bound components
ironcap supports late binding dependencies on scopes which allows a scope to be augmented with additional components via the scopes ```define()``` function. This is useful for unresolvable objects that are loaded in after the fact, (such as data read in from configuration files).

note: ironcap will throw a ```component not found``` error if attempting to resolve to things it cannot find. 

```typescript
@ironcap.component() class Foo {
  // note: 'Foo' wants to bind on 'Options'
  constructor(@ironcap.bind("Options") private options: any) {
    console.log(options.config)
  }
}

...

// create the scope
const scope = ironcap.scope()

// define 'Options'
scope.define("Options", () => {
  return {
    config: "<some-config-here>"
  }
})

// resolve
const foo = scope.resolve("Foo")
```

### late interface binding
class decoupling is a good model for developing flexible software, and ironcap was built with this approach in mind. Consider the following where we have the interface ```IBar``` and implementations ```XBar``` and ```YBar```. Note that the component ```Foo``` is binding on the interface ```IBar```.

The following code outlines how to preform binding ```IBar``` as ```XBar``` on the scope.

```typescript
interface IBar {}
@ironcap.component() 
class XBar implements IBar {

}

@ironcap.component() 
class YBar implements IBar {

}

@ironcap.component() class Foo {
  constructor(@ironcap.bind("IBar") private bar: IBar) {
  }
}

...

// create a scope
const scope = ironcap.scope()

// map 'IBar' as 'XBar'
scope.define("IBar", () => scope.resolve("XBar"))

// 'Foo' will resolve with instance 'XBar'
const foo = scope.resolve("Foo")
```
### assertions
It is common to want to assert on a component prior to using it. When ironcap resolves on a component, it also passes through a assertion phase that the caller can hook into for asserting the object is what they expect. This is primary useful for configuration validation at startup.

```typescript
const scope = ironcap.scope()
scope.define("options", () => 1)
scope.assert("options", instance => {
  if(instance !== 1) throw Error("does not eq 1")
})
const options = scope.resolve("options")

```
### environments
components are typically run on some host environment. ironcap provides the scope  ```bind()``` function to optionally bind a component to its host environment prior to ```resolve()```. This functionality can be useful if object initialization also involves attaching the object to some host (an example of which might include attaching a http component to its respective server)

In the code below, we model the interface type ```IComponent``` as well as a concrete type ```Host``` which provides the method ```mount(component: IComponent)```.

Next, we create an the concrete type ```Component``` which implements ```IComponent``` and register it as ironcap component via decoration.

Lastly, we want to resolve a new ```Component``` with the expectation it will be already mounted on the environment. This is achieved via the scopes ```bind(...)``` function. Also note that when requesting a scope, we pass a new instance of ```Host``` which ironcap interprets as the binding environment.

```typescript
export interface IComponent { 

}

export class Host { 
  public mount (component: IComponent) {
    console.log("mounting", component)
  }
}

...

@ironcap.component() 
export class Component implements IComponent { }

...

// create scope with the host.
const scope = ironcap.scope(new Host())

// configure scope to bind to the environment (Host)
scope.bind<Component>("Component", (environment, component) => 

  environment.mount(component))

// component is bound to the environment !
const component = scope.resolve("Component")
```

### how to use

clone this project and run ```npm start``` from the project root. To use in local projects, copy the ```./src/ironcap.ts``` file and configure the typescript compiler in the following way

tsconfig.json
```json
"compilerOptions": {
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```
and install


#### reflect-metadata
```
npm install @types/reflect-metadata --save-dev
npm install reflect-metadata --save
```