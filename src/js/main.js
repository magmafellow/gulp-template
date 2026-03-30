import { name } from './module-a'
import data from './sub/module-b'

function greet() {
  console.log(`Hello, ${name}`)
}

const myFn = () => {
  console.log('Hello World!')
  console.log('Data: ', data)
}

myFn()
greet()
