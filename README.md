# heimdall-ts ✨

![](./img/heimdall.jpg)

Very simple to help you to generate typeScript api module  

(support swagger2.0 and OpenApi 3.0)

have fun ^_^

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

## Authors 👨‍💻

- [@sudongyuer](https://github.com/sudongyuer)

