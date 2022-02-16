# heimdall-ts ✨
[中文](./README.md) ｜ [English](./README_EN.md)

![](./img/heimdall.jpg)

非常简单的帮助你生成typeScript api模块 

(支持 swagger2.0 和 OpenApi 3.0 规范)

玩得开心 ^_^

## Feature ❤️

- 只需要执行一行脚本命令就可以自动生成基于TypeScript的API请求模块

- 你可以在代码中自定义的你的请求和响应拦截器

- 强类型系统可以帮助您轻松编写和智能提示

- 兼容swagger2.0和OpenApi3.0

- 支持json、yml、yaml格式

- 支持按需导入，可以帮助您的项目容易摇树

- 支持回滚版本

- 支持多openAPI存储库生成代码

## 安装 🌝

Install heimdall-ts with npm

```bash
  npm install @imf/heimdall-ts -D
```

## Usage 🍉

只要在script中运行脚本 `heimdall -g `就可以帮助你生成TypeScript api模块代码，在自己的api目录中引入API
模块，进行自定义设置。

生成的API文件都在当前项目 **/node_modules/@imf/heimdall-ts/api** 中。

`api/index.ts`

```ts
//需要什么模块API直接按需导入就行了
import {
    MainUserApi,
    MainGameApi,
    MainEvoApi,
    MainYggApi,
    MainPpApi as MainPPApi,
    MainBgamingApi,
    MainSiteApi,
    MainFinanceApi,
    HeraclesWithdrawApi,
    HeraclesPayApi,
    HeraclesAdApi as AdApi,
} from '@imf/heimdall-ts';

import {AxiosRequestConfig, AxiosResponse} from 'axios';

//处理查询参数为数组的情况
import * as qs from 'qs';
//配置默认baseURL
const baseURL = '/api';

//baseAPI
const baseAPIMap = new Map();

baseAPIMap.set('heraclesWithdrawApi', HeraclesWithdrawApi);
baseAPIMap.set('heraclesPayApi', HeraclesPayApi);
baseAPIMap.set('adApi', AdApi);

//默认请求中间件
const requestMiddleWare = (config: AxiosRequestConfig) => {
    config = {
        ...config,
        headers: {
            user_token: localStorage.getItem('token') ?? '',
            // user_id: '8',
        },
        paramsSerializer: (params: any) => {
            return qs.stringify(params, {arrayFormat: 'comma'});
        },
    };
    return config;
};

//默认响应中间件
const responseMiddleWare = (res: AxiosResponse) => {
    //TODO
    return res;
};

const responseErrHandler = (error: any) => {
    return new Promise<Response>((resolve, reject) => {
        reject(error.response.data);
    });
};

const result: Record<string, any> = {};

for (let [key, value] of baseAPIMap) {
    result[key] = new value({
        baseURL: baseURL,
    });
    result[key].instance.interceptors.request.use(requestMiddleWare);
    result[key].instance.interceptors.response.use(responseMiddleWare, responseErrHandler);
}

type mainApi = {
    userApi: MainUserApi<unknown>
    gameApi: MainGameApi<unknown>,
    evoApi: MainEvoApi<unknown>,
}

const mainApi: mainApi = {
    userApi: result['userApi'],
    gameApi: result['gameApi'],
    evoApi: result['evoApi'],
};
export default mainApi;

```

## config 📖

配置文件是必须的

`repo Parameters`

| Parameter   | Type     | Description                            | value            |
| :---------- | :------- | :------------------------------------- | :--------------- |
| `reponame` | `string` | **Required**  仓库名(需要和git地址一致)                       | eg: kalista             |
| `repoConfig` | `json` | **Required**   仓库的详细信息        | eg: {"git": "https://gitee.com/xxx/abc.git","version": "^"}      |

`repoConfig Parameters`

| Parameter   | Type     | Description                            | value            |
| :---------- | :------- | :------------------------------------- | :--------------- |
| `git` | `string` | **Required**  仓库地址ssh or https                       | eg: https://gitee.com/xxx/abc.git             |
| `version` | `string` | **Required**   仓库的版本号(^代表最新)        | eg: ^ or 6a7082d   |



`package.json`

```json
  "heimdall": {
    "repo": {
        "abc": {
            "git": "https://gitee.com/xxx/abc.git",
            "version": "^"
        },
        "demo-api": {
            "git": "git@gitee.com:xxx/demo-api.git",
            "version": "^"
        }
    }
  }
```

## Command 🪟

` 获取帮助`
```bash
heimdall -h
```

`生成API请求模块代码`

```bash
heimdall -g
```

`查看相应仓库的版本号`
```bash
heimdall -l <repoName>
```



## 试例🐞

`package.json`

```json
  "heimdall": {
    "repo": {
        "abc": {
            "git": "https://gitee.com/xxx/abc.git",
            "version": "^"
        },
        "demo-api": {
            "git": "git@gitee.com:xxx/demo-api.git",
            "version": "^"
        }
    }
  }
 ```

## 问题 ❓

如果您有任何问题，您可以通过以下方式与我联系

- Email : 976499226@qq.com


## 作者 👨‍💻

- [@sudongyuer](https://github.com/sudongyuer)



