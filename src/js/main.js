import { name } from './module-a'
import data from './sub/module-b'

const swiper = new Swiper('.my-class', {})
console.log('swiper')
console.log('tippy: ', tippy)
function greet() {
  console.log(`Hello, ${name}!`)
}

const myFn = () => {
  console.log('Hello World!')
  console.log('Data: ', data)
}

myFn()
greet()
