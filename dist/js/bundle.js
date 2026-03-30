var name = 'Alex';

var data = 42;

function greet() {
  console.log("Hello, ".concat(name));
}
var myFn = function myFn() {
  console.log('Hello World!');
  console.log('Data: ', data);
};
myFn();
greet();
