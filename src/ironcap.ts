/*--------------------------------------------------------------------------

ironcap - A dependency injection library for TypeScript

The MIT License (MIT)

Copyright (c) 2017 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import "reflect-metadata"

// --------------------------------------------------------------------
// INTERNAL STATE
// --------------------------------------------------------------------

const COMPONENT_DEFINITIONS: ComponentDefinition      [] = []
const COMPONENT_ASSERTIONS:  ComponentAssertion<any>  [] = []


// --------------------------------------------------------------------
// ASSERT
// --------------------------------------------------------------------

/**
 * creates a top level component assertion.
 * @param {string} component the name of the component to assert.
 * @param {ComponentAssertFunction<T>} assert the asset function.
 * @returns {void}
 */
export function assert<T>(component: string, assert: ComponentAssertFunction<T>) {
  COMPONENT_ASSERTIONS.push({ component, assert })
}

// --------------------------------------------------------------------
// DECORATOR: BIND
// --------------------------------------------------------------------

/**
 * (decorator) creates a constructor argument binding for components.
 * @param {string} binding the binding name.
 * @returns {(ctor: any, n: any, index: number) => any}
 */
export function bind (binding: string) {
  return (ctor: any, n: any, index: number) => {
    const dependencies = Reflect.getMetadata("ironcap:bindings", ctor)
    const element      = { binding, index }
    if(dependencies === undefined) {
      Reflect.defineMetadata("ironcap:bindings", [element], ctor)
    } else {
      dependencies.unshift(element)
    }
  }
}

// --------------------------------------------------------------------
// DECORATOR: COMPONENT
// --------------------------------------------------------------------

export type ComponentBinding           = { binding: string, index: number }
export type ComponentDefinition        = { component:  string, bindings: ComponentBinding[], ctor: new (...dependencies: any[]) => any; }
export type ComponentAssertFunction<T> = ( instance: T ) => void
export type ComponentAssertion<T>      = { component: string, assert: ComponentAssertFunction<T> }

/**
 * (decorator) registers a class as a component with named override.
 * @param {string} component the name of the type being defined
 * @returns {(ctor: any) => any}
 */
export function component (component: string): (ctor: any) => any

/**
 * (decorator) registers a class as a component.
 * @returns {(ctor: any) => any}
 */
export function component (): (ctor: any) => any

/**
 * (decorator) registers a class as a component.
 * @param {any[]} args the arguments
 * @returns {(ctor: any) => any}
 */
export function component (...args: any[]) {
  return (ctor: any) => {
    const component = (args.length > 0) ? args[0] : ctor.name
    const bindings  = (Reflect.getMetadata("ironcap:bindings", ctor) || []) as ComponentBinding[]
    COMPONENT_DEFINITIONS.push({ component, bindings, ctor })
  }
}

// --------------------------------------------------------------------
// SCOPE
// --------------------------------------------------------------------

/**
 * creates a new scope.
 * @param {TEnvironment?} environment optional host environment for assertion and environment binding.
 * @returns {Array<ComponentDefinition>}
 */
export function scope<TEnvironment>(environment?: TEnvironment): Scope<TEnvironment> {
  const scope = new Scope(environment)
  COMPONENT_ASSERTIONS.forEach(assertion => {
    scope.assert(assertion.component, (instance) => assertion.assert(instance))
  })
  COMPONENT_DEFINITIONS.forEach(definition => {
    // map the bindings into a dependency
    // array; using the binding index to
    // correctly align constructor args.
    const dependencies = []
    definition.bindings.forEach(binding => {
      dependencies[binding.index] = binding.binding
    })

    // define the Scope component through
    // the definition, we note that 0 length
    // arrays have problems with the spread
    // operator. test and return
    scope.define( definition.component, dependencies, args => {
      return (args.length > 0) 
        ? (new definition.ctor(...args)) 
        : (new definition.ctor())
    })
  })
  return scope
}

// --------------------------------------------------------------------
// SCOPE
// --------------------------------------------------------------------

export type ScopeFactoryFunction                             = ( dependencies: any[]) => any
export type ScopeAssertFunction<T>                           = ( instance: T) => void
export type ScopeEnvironmentBindingFunction<TEnvironment, T> = ( environment: TEnvironment, instance: T) => void
export type ScopeRegistration                                = { component: string, dependencies: string[], factory: (dependencies: any[]) => any, instance: any }
export type ScopeAssertion<T>                                = { component: string, assert:  ScopeAssertFunction<T> }
export type ScopeEnvironmentBinding<TEnvironment, T>         = { component: string, binding: ScopeEnvironmentBindingFunction<TEnvironment, T> }

/**
 * Scope
 * 
 * A isolation container for component instances.
 */
class Scope<TEnvironment> {

  private registrations: ScopeRegistration                  [] = []
  private assertions:    ScopeAssertion<any>  [] = []
  private bindings:      ScopeEnvironmentBinding<TEnvironment, any>[] = []

  /**
   * creates a new Scope.
   * @param {TEnvironment} environment the host environment for this Scope.
   * @returns {Scope<TEnvironment>}
   */
  constructor(private environment: TEnvironment) { }

  /**
   * defines a new component on this scope.
   * @param {string} component the name of this component. 
   * @param {ScopeFactoryFunction} factory the component factory function.
   * @returns {Scope}
   */
  public define(component: string, factory: ScopeFactoryFunction): this

  /**
   * defines a component on this Scope.
   * @param {string} component the name of this component. 
   * @param {string[]} dependencies the dependencies array
   * @param {ScopeFactoryFunction} factory the component factory function.
   * @returns {Scope}
   */
  public define(component: string, dependencies: string[], factory: ScopeFactoryFunction): this

  /**
   * defines a component on this Scope.
   * @param {string} component the name of this component. 
   * @param {string[]} dependencies the dependencies array
   * @param {ScopeFactoryFunction} factory the component factory function.
   * @returns {Scope}
   */
  public define(...args: any[]): this {
    const component    = args[0] as string
    const dependencies = (args.length === 3) ? args[1] : []
    const factory      = (args.length === 3) ? args[2] : args[1]
    const registration = this.registrations.find(registration  => registration.component === component)
    if (registration !== undefined ) { throw Error(`Scope: component '${component}' already registered.`)}
    this.registrations.push({ component, dependencies, factory, instance: undefined })
    return this
  }

  /**
   * creates assertion to the given component.
   * @param {string} component the name of the component to assert.
   * @param {ScopeAssertFunction<T>} assert the assert function.
   * @returns {Scope}
   */
  public assert<T>(component: string, assert: ScopeAssertFunction<T>): this {
    this.assertions.push({ component, assert })
    return this
  }
  /**
   * binds the specified component to the scopes environment.
   * @param {string} component the name of the component to assert.
   * @param {ScopeEnvironmentBindingFunction<TEnvironment, T>} binding the environment binding function.
   * @returns {Scope}
   */
  public bind<T>(component: string, binding: ScopeEnvironmentBindingFunction<TEnvironment, T>): this {
    this.bindings.push({ component, binding })
    return this
  }
  /**
   * resolves a component. throws error if unable to resolve.
   * @param {string} component the name of the component or definition resolve.
   * @returns {T}
   */
  public resolve<T>(component: string): T {
    const registration = this.registrations.find(registration => registration.component === component)
    if (registration === undefined) { throw Error(`component '${component}' does not exist`) }
    if (registration.instance !== undefined) { return registration.instance }
    const dependencies = registration.dependencies.map(dependency => {
      const registration = this.registrations.find(registration => registration.component === dependency)
      if (registration === undefined) { throw Error(`component '${dependency}' for '${component}' does not exist`) }
      if (registration.instance === undefined) {
        registration.instance = this.resolve(registration.component)
      }
      return registration.instance
    })
    const instance = registration.factory(dependencies)
    const assertions = this.assertions.filter(assertion => assertion.component === registration.component)
    assertions.forEach(assertion => { 
      try {
        assertion.assert(instance)
      } catch (error) {
        throw Error(`component '${assertion.component}' assertion ${error}`)
      }
    })
    const bindings = this.bindings.filter(binding => binding.component === registration.component)
    bindings.forEach(binding => { 
      try {
        binding.binding(this.environment, instance)
      } catch (error) {
        throw Error(`component '${binding.component}' bind error ${error}`)
      }
    })
    registration.instance = instance
    return registration.instance
  }
}

// --------------------------------------------------------------------
// Start
// --------------------------------------------------------------------

export type StartOptions = {[component: string]: {
  bindings?: {[binding: string]: string},
  options?:  {[option: string]: any}
}}

/**
 * creates instances through configuration.
 * @param {StartOptions} options the boot configuration.
 * @returns {any[]}
 */
export function start (options: StartOptions): any[] {
  return Object.keys(options).map(instance_name => {
    const instance        = options[instance_name]
    const instance_scope  = scope()
    if(instance.options) {
      Object.keys(instance.options).forEach(option_name => {
        instance_scope.define(option_name, [], () => 
          instance.options[option_name])
      })
    }
    if(instance.bindings) {
      Object.keys(instance.bindings).forEach(binding_name => {
        instance_scope.define(binding_name, [], () => 
          instance_scope.resolve(instance.bindings[binding_name]))
      })
    }
    return instance_scope.resolve(instance_name)
  })
}