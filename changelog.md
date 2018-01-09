## 3.4.0/2018-01-09

- fix validate logic, even pass `required: false` or `default: false`, still check type & other validators
- upgrade deps

## 3.3.0/2018-01-08

- add `ignoreNodeType`

## 3.2.1/2017-11-14

- fix `required` throw error when value is 0|false

## 3.2.0/2017-11-14

- fix schema `required: false` bug

## 3.1.0/2017-10-13

- fix no `required` bug, when pass `null` will check `type`

## 3.0.0/2017-10-13

- fix bugs
- update test
- update README
- use power-assert
- use standard eslint
- add `default` & `required`
- rm `ignoreNodeType` option
- change validator function, add `key` and `parent` paramters, return `boolean`
