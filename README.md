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

- support multi openAPI repository

## Installation 🌝

Install heimdall-ts with npm

```bash
  npm install @imf/heimdall-ts -D
```

## Usage 🍉
just run script `heimdall -g` in script then can help you to generate typeScript api module code

## config 📖

config is required

`repo Parameters`

| Parameter   | Type     | Description                            | value            |
| :---------- | :------- | :------------------------------------- | :--------------- |
| `key` | `string` | **Required**  repoName                       | eg: kalista             |
| `value` | `string` | **Required**   the repo versionCode        | eg: 54ffc83 (^ means latest)         |

`package.json`

```json
  "heimdall": {
    "repo": {
        "kalista":"^",
        "demo":"^"
    }
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
heimdall -l kalista
```



## Example 🐞

`package.json`

```json

"script":{
  "hemdall": "heimdall -g",
},
"heimdall": {
  "repo": {
    "kalista":"^",
    "demo":"^"
  }
}

```

## Q&A ❓

If you have any question,you can contact me in following ways

- Email : 976499226@qq.com


## Authors 👨‍💻

- [@sudongyuer](https://github.com/sudongyuer)



