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

import { Scope } from "./scope"

const root = new Scope({})

/**
 * (decorator) registers a class as a resolvable type.
 * @param {string} typeName optional override for the typeName.
 * @returns {(ctor: any) => any}
 */
export function type(typeName?: string) {
  return root.type (typeName)
}

/**
 * (decorator) binds a constructor argument at resolution.
 * @param {string} typeName the type to bind.
 * @returns {Function}
 */
export function bind (typeName) {
  return root.bind (typeName)
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
 * @param {string} typeName the name of the component to define. 
 * @param {(Scope<{}>, {}) => TType} factory the component factory function.
 * @returns {Scope<{}>}
 */
export function define<TType>(typeName: string, factory: (local: Scope<{}>, environment: {}) => TType): Scope<{}> {
  return root.define(typeName, factory)
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
