# heimdall-ts ✨

![](./img/heimdall.jpg)

Very simple to help you to generate typeScript api module  

(support swagger2.0 and OpenApi 3.0)

have fun ^_^

## Feature ❤️

- just need run script then you can get the latest typeScript api module

- you can diy request or response interceptor in you code

- strong type system can help you to code and easily smart tips

- compatible swagger2.0 and OpenApi3.0

- support import on demand that can help your project easy to tree shaking

- support rollback version 

## Installation 🌝

Install heimdall-ts with npm

```bash
  npm install @imf/heimdall-ts -D
```

## Usage 🍉
just run script `heimdall -g` in script then can help you to generate typeScript api module code

## config 📖

config is optional,if you want to get the latest code ,
you do not need this config .

if you want to `reset` generate code version,you just need to fill the config in `package.json`

`package.json`

```json
  "heimdall": {
      "versionCode": "b8fbc83"
  }
```

## Command 🪟

` get help`
```bash
heimdall -h
```

`generate api module code`

```bash
heimdall -g
```

`check stoplight version`
```bash
heimdall -l
```



## Example 🐞

`package.json`

```json

"script":{
  "hemdall": "heimdall -g"
}

```

## Q&A ❓

If you have any question,you can contact me in following ways

- Email : 976499226@qq.com


## Authors 👨‍💻

- [@sudongyuer](https://github.com/sudongyuer)



