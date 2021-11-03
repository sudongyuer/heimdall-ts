import {createRequire} from "module";
import {getOenAPI2YmlFileName, getOenAPI3YmlFileName, removeDir} from '../utils/file/index.js'
import {cwd} from "process";
import {getProjectName} from "../utils/common/index.js";
const require = createRequire(import.meta.url);
const path = require("path");
const {generateApi} = require('swagger-typescript-api');


/**
 * 创建api文件
 */
 function createApi(repo) {
     return new Promise<void>(async (resolve, reject) => {
         //V3
         /* NOTE: all fields are optional expect one of `output`, `url`, `spec` */
         const openApi3Array = getOenAPI3YmlFileName(path.resolve(cwd(), `${repo}`))
         for (let item of openApi3Array) {
             await generateApi({
                 name: `${item.replace('.oas3.yml', '')}Api.ts`,
                 url: null,
                 output: path.resolve(process.cwd(), "node_modules/@imf/heimdall-ts/api"),
                 input: path.resolve(process.cwd(), `${repo}`, `${item}`),
                 httpClientType: "axios", // or "fetch",
                 unwrapResponseData: true,
                 generateUnionEnums: true,
                 enumNamesAsValues: true,
                 moduleNameFirstTag: false,
                 moduleNameIndex:-1
             })
         }
         //V2
         /* NOTE: all fields are optional expect one of `output`, `url`, `spec` */
         const openApi2Array = getOenAPI2YmlFileName(path.resolve(cwd(), `${repo}`))
         for (let item of openApi2Array) {
             await generateApi({
                 name: `${item.replace('.oas2.yml', '')}Api.ts`,
                 url: null,
                 output: path.resolve(process.cwd(), "node_modules/@imf/heimdall-ts/api"),
                 input: path.resolve(process.cwd(), `${repo}`, `${item}`),
                 httpClientType: "axios", // or "fetch",
                 unwrapResponseData: true,//是否包裹response
                 generateUnionEnums: true,
                 enumNamesAsValues: true,
                 moduleNameFirstTag: false,
                 moduleNameIndex:-1 //模块名分割
             })
         }
         if(!openApi3Array.length&&!openApi2Array.length){
             await removeDir(path.resolve(cwd(), repo))
             reject('no openApi3 or openApi2 resources to generate !!!!!')
         }
            resolve()
     })

}

/**
 * 基于多个仓库生成API
 */
function createMultiApi(repos){
    return new Promise<void>((resolve, reject)=>{
        const promiseArray=[]
        for (const [repo,versionCode] of repos) {
            promiseArray.push(createApi(repo))
        }
        Promise.all(promiseArray).then(()=>{
            resolve()
        })
    })
}

export {
    createApi,
    createMultiApi
}
