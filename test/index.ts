import * as ironcap     from "../src/ironcap"
import * as controllers from "./controller/index"
import * as database    from "./database/index"

// late bound definitions
ironcap.define("HomeControllerOptions",  [], () => ({message: "1"}))
ironcap.define("AboutControllerOptions", [], () => ({message: "2"}))
ironcap.define("MongoDatabaseOptions",   [], () => ({message: "3"}))

// interface binding
ironcap.define("IDatabase", [], () => ironcap.scope().resolve("MongoDatabase"))

// resolution
const home  = ironcap.resolve("HomeController")
const about = ironcap.resolve("AboutController")

console.log(home)
console.log(about)
