import {createRequire} from "module";
import {
    getOenAPI2YmlFileName,
    getOenAPI3YmlFileName,
    getOpenAPIFileName,
    patchStringToFile,
    removeDir
} from '../utils/file/index.js'
import {cwd} from "process";
import {getProjectName} from "../utils/common/index.js";
const require = createRequire(import.meta.url);
const path = require("path");
const {generateApi} = require('swagger-typescript-api');
import * as fs from "fs";
import openapiTS from "openapi-typescript";
import * as fes from 'fs-extra'
import {asgardTemplateCodeGen} from "../template/asgardTemplate.js";


/**
 * 创建api文件
 */
function createHTTPApi(repo) {
    return new Promise<void>(async (resolve, reject) => {
        //V3
        /* NOTE: all fields are optional expect one of `output`, `url`, `spec` */
        const openApiArray = getOpenAPIFileName(path.resolve(cwd(), `${repo}`))
        for (let item of openApiArray) {
            await generateApi({
                name: `${item.replace(/((\.)\w*)*\.(yaml|json|yml)$/, '')}Api.ts`,
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
        if(!openApiArray.length){
            await removeDir(path.resolve(cwd(), repo))
            reject('no openApi3 or openApi2 resources to generate !!!!!')
        }
        resolve()
    })

}

/**
 * 创建api文件
 */
function createAsgardApi(repoName) {
    return new Promise<void>(async (resolve, reject) => {
        //V3
        /* NOTE: all fields are optional expect one of `output`, `url`, `spec` */
        const openApiFileNames = getOpenAPIFileName(path.resolve(cwd(), `${repoName}`))
        console.log('=======',openApiFileNames)
        for (let fileName of openApiFileNames) {
            //生成类型
            await generateApiTypes(repoName,fileName)
            //生成具体的API
            await generateApiCode(repoName,fileName)
        }
        if(!openApiFileNames.length){
            await removeDir(path.resolve(cwd(), repoName))
            reject('no openApi3 or openApi2 resources to generate !!!!!')
        }
        resolve()
    })
}

/**
 *
 * @param repoName 仓库名称(规范文件夹)
 * @param fileName 文件名称(规范文件)
 */
export  function generateApiCode(repoName, fileName) {
    return new Promise<void>(async (resolve, reject) => {
        //读取文件对象
        //TODO 读取文件失败
        const jsonObjString = await fs.promises.readFile(path.resolve(cwd(),repoName,fileName), "utf8")
        const jsonObj=JSON.parse(jsonObjString)
        //生成该文件所对应的代码
        const generateCode = asgardTemplateCodeGen(jsonObj)
        //将生成好的代码patch到指定的文件中
        await patchStringToFile(path.resolve(cwd(), 'node_modules/@imf/heimdall-ts/api', fileName.replace(/(.json|.yaml|.yml)$/, '.ts')), generateCode)
        resolve()
    })

}

/**
 * 创建api文件
 */
function generateApiTypes(repoName,fileName){
    return new Promise<void>(async (resolve, reject) => {
        //读取约束
        const schema = await fs.promises.readFile(path.resolve(cwd(),repoName,fileName), "utf8") // must be OpenAPI JSON
        //生成ts类型
        const output = await openapiTS(JSON.parse(schema));
        //将约束写进ts文件
        await fes.outputFile(path.resolve(cwd(), 'node_modules/@imf/heimdall-ts/api', fileName.replace(/(.json|.yaml|.yml)$/,'.ts')), output)
        resolve()
    })
}

/**
 * 基于多个仓库生成HTTP API
 */
function createMultiHTTPApi(repos){
    return new Promise<void>((resolve, reject)=>{
        const promiseArray=[]
        for (const [repoName,repoObj] of repos) {
            promiseArray.push(createHTTPApi(repoName))
        }
        Promise.all(promiseArray).then(()=>{
            resolve()
        })
    })
}

/**
 * 基于多个仓库生成Asgard API
 */
function createMultiAsgardApi(repos){
    console.log(repos)
    return new Promise<void>((resolve, reject)=>{
        const promiseArray=[]
        for (const [repoName,repoObj] of repos) {
            promiseArray.push(createAsgardApi(repoName))
        }
        Promise.all(promiseArray).then(()=>{
            resolve()
        })
    })
}

export {
    createHTTPApi,
    createAsgardApi,
    createMultiHTTPApi,
    createMultiAsgardApi
}
