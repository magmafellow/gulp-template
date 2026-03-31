var name = 'Alex';

var data = 42;

new Swiper('.my-class', {});
console.log('swiper');
console.log('tippy: ', tippy);
function greet() {
  console.log("Hello, ".concat(name, "!"));
}
var myFn = function myFn() {
  console.log('Hello World!');
  console.log('Data: ', data);
};
myFn();
greet();
