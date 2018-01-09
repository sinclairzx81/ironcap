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

import { Scope } from "./scope"
import "reflect-metadata"

const root = new Scope({})

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
    const bindings  = (Reflect.getMetadata("ironcap:bindings", ctor) || []) as { binding: string, index: number }[]
    const dependencies = []
    bindings.forEach(binding => {
      dependencies[binding.index] = binding.binding
    })
    root.define( component, dependencies, args => {
      return (args.length > 0) 
        ? (new ctor(...args)) 
        : (new ctor())
    })
  }
}
/**
 * (decorator) constructor argument binding.
 * @param {string} binding the component to bind.
 * @returns {Function}
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

/**
 * creates a new scope.
 * @param {TEnvironment?} environment optional host environment for assertion and environment binding.
 * @returns {Array<ComponentDefinition>}
 */
export function scope<TEnvironment>(environment?: TEnvironment): Scope<TEnvironment> {
  return root.scope(environment)
}

/**
 * defines a component in the root scope.
 * @param {string} component the name of the component to define. 
 * @param {() => TType} factory the component factory function.
 * @returns {Scope<{}>}
 */
export function define<TType>(component: string, dependencies: string[], factory: (...args: any[]) => TType): Scope<{}> {
  return root.define(component, dependencies, factory)
}

/**
 * resolves a component from the root scope.
 * @param {string} component the name of the component to resolve.
 * @returns {TType}
 */
export function resolve<TType>(component: string): TType {
  return root.resolve(component)
}

/**
 * creates a top level component assertion.
 * @param {string} component the name of the component to assert.
 * @param {ComponentAssertFunction<T>} assert the asset function.
 * @returns {void}
 */
export function assert<TType>(component: string, assert: (instance: TType) => void) {
  root.assert(component, assert)
}
