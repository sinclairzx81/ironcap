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


export type ScopeRegistration     = { component: string, dependencies: string[], factory: (dependencies: any[]) => any, instance: any }
export type ScopeAssertion<TType> = { component: string, func: (instance: TType) => void }

/**
 * Scope
 * 
 * A isolation container for component instances.
 */
export class Scope<TEnvironment> {
  private registrations: ScopeRegistration    [] = []
  private assertions:    ScopeAssertion<any>  [] = []

  /**
   * creates a new Scope.
   * @param {TEnvironment} environment the host environment for this Scope.
   * @returns {Scope<TEnvironment>}
   */
  constructor(private environment: TEnvironment) { }

  /**
   * creates a new scope.
   * @param {UEnvironment} environment the environment for this scope.
   * @returns {Scope<UEnvironment>}
   */
  public scope<UEnvironment>(environment: UEnvironment): Scope<UEnvironment> {
    const scope = new Scope<UEnvironment>(Object.assign(this.environment, environment))
    scope.assertions = this.assertions.map(assertion => ({
       component: assertion.component,
       func:      assertion.func 
    }))
    scope.registrations = this.registrations.map(registration => ({
      component:    registration.component, 
      dependencies: registration.dependencies, 
      factory:      registration.factory,
      instance:     undefined
    }))
    return scope
  }

  /**
   * defines a new component on this scope.
   * @param {string} component the name of this component. 
   * @param {() => TType} factory the component factory function.
   * @returns {Scope<TEnvironment>}
   */
  public define<TType>(component: string, factory: () => TType): Scope<TEnvironment>

  /**
   * defines a component on this Scope.
   * @param {string} component the name of this component. 
   * @param {string[]} dependencies the dependencies array
   * @param {(...args: any[]) => TType} factory the component factory function.
   * @returns {Scope}
   */
  public define<TType>(component: string, dependencies: string[], factory: (...args: any[]) => TType): Scope<TEnvironment>

  /**
   * defines a component on this Scope.
   * @param {string} component the name of this component. 
   * @param {string[]} dependencies the dependencies array
   * @param {(...args: any[]) => TType} factory the component factory function.
   * @returns {Scope<TEnvironment>}
   */
  public define(...args: any[]): Scope<TEnvironment> {
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
   * @param {(instance: TType) => void} func the assert function.
   * @returns {Scope<TEnvironment>}
   */
  public assert<TType>(component: string, func: (instance: TType) => void): Scope<TEnvironment> {
    this.assertions.push({ component, func })
    return this
  }

  /**
   * resolves a component. throws error if unable to resolve.
   * @param {string} component the name of the component or definition resolve.
   * @returns {TType}
   */
  public resolve<TType>(component: string): TType {
    // load registration
    const registration = this.registrations.find(registration => registration.component === component)
    if (registration === undefined) { 
      throw Error(`component '${component}' does not exist`) 
    }

    // check if already initialized.
    if (registration.instance !== undefined) { 
      return registration.instance 
    }

    // resolve dependencies.
    const dependencies = registration.dependencies.map(dependency => {
      const registration = this.registrations.find(registration => registration.component === dependency)
      if (registration === undefined) { throw Error(`component '${dependency}' for '${component}' does not exist`) }
      if (registration.instance === undefined) {
        registration.instance = this.resolve(registration.component)
      }
      return registration.instance
    })

    // create instance with dependencies.
    const instance   = registration.factory(dependencies)
    const assertions = this.assertions.filter(assertion => assertion.component === registration.component)
    assertions.forEach(assertion => { 
      try {
        assertion.func(instance)
      } catch (error) {
        throw Error(`component '${assertion.component}' assertion ${error}`)
      }
    })
    registration.instance = instance
    return registration.instance
  }
}
