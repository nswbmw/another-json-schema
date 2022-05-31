## 3.8.4/2022-05-31

- add: `Integer` & `Double` types

## 3.8.3/2020-09-15

- update deps

## 3.8.2/2018-01-17

- add `.length` helper

## 3.8.1/2018-01-10

- `default` helper support function now

## 3.8.0/2018-12-20

- upgrade deps
- add validator's all `isXxx`

## 3.7.0/2018-06-21

- fix: `type` function maybe change value, then override original value

## 3.6.1/2018-06-04

- check schema value & throw TypeError when got null

## 3.6.0/2018-05-14

- add `Types`

## 3.5.1/2018-04-12

- add `.eq` `.equal` validator

## 3.5.0/2018-04-11

- add `_customErrorMsg`

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
