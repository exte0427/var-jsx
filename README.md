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
    "stateMaker" : "state"
}
```
like this