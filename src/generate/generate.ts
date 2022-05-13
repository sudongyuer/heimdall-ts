import {createRequire} from "module";
import {getOenAPI2YmlFileName, getOenAPI3YmlFileName, getOpenAPIFileName, removeDir} from '../utils/file/index.js'
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
        const openApiArray = getOpenAPIFileName(path.resolve(cwd(), `${repo}`))
        for (let item of openApiArray) {
            await generateApi({
                name: `${item.replace(/((\.)\w*)*\.(yaml|json|yml)$/, '')}Api.ts`,
                url: null,
                output: path.resolve(process.cwd(), "node_modules/@haiyaotec/heimdall-ts/api"),
                input: path.resolve(process.cwd(), `${repo}`, `${item}`),
                httpClientType: "axios", // or "fetch",
                unwrapResponseData: true,
                generateUnionEnums: true,
                enumNamesAsValues: true,
                moduleNameFirstTag: false,
                moduleNameIndex:-1
            })
        }
        if(!openApiArray.length){
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
