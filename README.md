# Var - Jsx
It's jsx translator that can easily be used
```js
const {jsx} = require(`jsx`);
```
it's done!\
now you can use `jsx.translate` to translate
```js
jsx.translate(`const a = <div>hi!</div>`);
```
```js
const a = Var.make(`a`,[],Var.text(`hi!`));
```
you can also customize the returning code
```js
jsx.setting = {
    "domMaker" : "make",
    "textMaker" : "text",
    "stateMaker" : "state",
    "changeMaker" : "change"
}
```
if you want to use variables, try this
```html
const a = <div><-variable-></div>;
```
```js
const a = Var.make(`div`,[],Var.change(variable));
```
### domMaker
dom maker function is the function that should function as making virtual dom\
```js
const domMakerName = (name,states, ...child) => {
    //name : string
    //states : Array<{name, date}>
    //...child : virtualDom
};
```
### textMaker
textMaker function should function as making text virtual dom
```js
const textMakerName = (data) => {
    //data : string
};
```
### stateMaker
stateMaker function should function as making state
```js
const stateMakerName = (name,data) => {
    //name : string
    //data : string
}
```
### changeMaker
changeMaker function should function\
 as change variable (whose type isn't virtualDom) to virtualDom
```js
const changeMakerName = (data) => {
    //data : any
}
```