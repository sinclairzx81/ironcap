/*--------------------------------------------------------------------------

ironcap - An inversion of control library for TypeScript

The MIT License (MIT)

Copyright (c) 2018 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

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

export type ScopeRegistration     = { typeName: string, factory: (local: Scope<any>, environment: any) => any, instance: any }
export type ScopeAssertion<TType> = { typeName: string, func: (instance: TType) => void }

/**
 * Scope
 *
 * A resolution scope for types.
 */
export class Scope<TEnvironment> {

  private registrations: ScopeRegistration[]        = []
  private assertions:    Array<ScopeAssertion<any>> = []

  /**
   * creates a new Scope.
   * @param {TEnvironment} environment the host environment for this Scope.
   * @returns {Scope<TEnvironment>}
   */
  constructor(private environment: TEnvironment) { }

  /**
   * creates a new scope from this scope.
   * @param {UEnvironment} environment the environment for this scope.
   * @returns {Scope<UEnvironment>}
   */
  public scope<UEnvironment>(environment?: UEnvironment): Scope<UEnvironment> {
    const scope = new Scope<UEnvironment>(Object.assign(this.environment, environment))
    scope.assertions = this.assertions.map(assertion => ({
       typeName: assertion.typeName,
       func:     assertion.func
    }))
    scope.registrations = this.registrations.map(registration => ({
      typeName:  registration.typeName,
      factory:   registration.factory,
      instance:  undefined
    }))
    return scope
  }

  /**
   * registers a new type available on this scope.
   * @param {string} typeName the name of the type being registered.
   * @param {(Scope<TEnvironment>, TEnvironment) => TType} factory the type factory.
   * @returns {Scope<TEnvironment>}
   */
  public  define<TType>(typeName: string, factory: (local: Scope<TEnvironment>, environment: TEnvironment) => TType): Scope<TEnvironment> {
    const registration = this.registrations.find(registration  => registration.typeName === typeName)
    if (registration !== undefined ) { throw Error(`Scope: component '${typeName}' already registered.`)}
    this.registrations.push({ typeName, factory, instance: undefined })
    return this
  }

  /**
   * creates a type assertion for the given type name.
   * @param {string} typeName the name of the type to assert.
   * @param {(instance: TType) => void} func the instance assertion function.
   * @returns {Scope<TEnvironment>}
   */
  public assert<TType>(typeName: string, func: (instance: TType) => void): Scope<TEnvironment> {
    this.assertions.push({ typeName, func })
    return this
  }

  /**
   * resolves a type from this scope.
   * @param {string} typeName the name of the type to resolve.
   * @returns {TType}
   */
  public resolve<TType>(typeName: string): TType {
    // load registration
    const registration = this.registrations.find(registration => registration.typeName === typeName)
    if (registration === undefined) {
      throw Error(`component '${typeName}' does not exist`)
    }

    // if already resolved, return.
    if (registration.instance !== undefined) {
      return registration.instance
    }

    // resolve the instance.
    const instance = registration.factory(this, this.environment)

    // check for assertions on the instance.
    const assertions = this.assertions.filter(assertion => assertion.typeName === registration.typeName)
    assertions.forEach(assertion => {
      try {
        assertion.func(instance)
      } catch (error) {
        throw Error(`component '${assertion.typeName}' assertion ${error}`)
      }
    })

    // assign instance
    registration.instance = instance

    // return
    return registration.instance
  }

  // ------------------------------------------------
  // decorators
  // -------------------------------------------------

  /**
   * (decorator) registers a class as a resolvable type.
   * @param {string} typeName (optional) override for the typeName.
   * @returns {(ctor: any) => any}
   */
  public type (typeName?: string): (ctor: any) => void {
    return (ctor: any) => {
      this.define(typeName || ctor.name, local => {
        const ctor_args = (Reflect.getMetadata("ironcap::bindings", ctor) || []) as Array<{
          binding: string,
          index:   number
        }>
        const sequenced = []
        ctor_args.forEach(binding => {
          sequenced[binding.index] = binding.binding
        })
        const dependencies = sequenced.map(dependency => {
          return (dependency !== undefined)
            ? local.resolve(dependency)
            : undefined
        })
        return (dependencies.length > 0)
          ? (new ctor(...dependencies))
          : (new ctor())
      })
    }
  }

  /**
   * (decorator) constructor argument binding.
   * @param {string} binding the component to bind.
   * @returns {(ctor: any, n: any, index: number) => void}
   */
  public bind (binding: string): (ctor: any, n: any, index: number) => void {
    return (ctor: any, n: any, index: number) => {
      const dependencies = Reflect.getMetadata("ironcap::bindings", ctor)
      const contructor_arguments = { binding, index }
      if (dependencies === undefined) {
        Reflect.defineMetadata("ironcap::bindings", [contructor_arguments], ctor)
      } else {
        dependencies.unshift(contructor_arguments)
      }
    }
  }
}

export default new Scope({})
