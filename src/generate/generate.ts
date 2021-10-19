import {createRequire} from "module";
import {getTsgConfig} from '../template/tsgConfig.js'
import {getFetchConfig} from '../template/fetch.js'
import {getPkgMaifest, writeFile} from '../utils/file/index.js'
import {cwd} from "process";
import {generateDir} from  '../utils/file/index.js'
const require = createRequire(import.meta.url);
const path = require("path");
let shell = require('shelljs');

async function initTsg() {

    //1.获取tsg配置文件字符
    const tsgConfig = getTsgConfig()
    //1.1向客户端写入tsgConfig配置文件
    await writeFile(path.resolve(cwd(),'./', 'tsg.config.ts'), tsgConfig)
    //2.生成requester文件夹 src/api/requester
    await generateDir(path.resolve(cwd(), 'src/api/requester'))
    //3.获取fetchConfig配置文件字符
    const fetchConfig=getFetchConfig()
    //4.1向客户端写入fetch.ts
    await writeFile(path.resolve(cwd(),'src/api/requester', 'fetch.ts'), fetchConfig)
    //添加脚本命令
    await addScript()
    //为客户端安装依赖
    await installDep()



}


function bootTsg() {
    return new Promise<void>((resolve, reject)=>{
        shell.exec(`npx tsg -c ./tsg.config.ts`, {
            cwd: `${cwd()}`
        }, () => {
            resolve()
        })
    })
}

/**
 * 安装依赖
 */
function installDep(){
    return  new Promise<void>((resolve, reject) => {
        shell.exec(`npm i ts-gear -D`, {
            cwd: `${cwd()}`
        },()=>{
            shell.exec(`npm i lodash`, {
                cwd: `${cwd()}`
            },()=>{
                resolve()
            })
        })

    })

}

/**
 * 添加脚本命令
 */
function addScript(){
        let packageJson = getPkgMaifest()
        packageJson.scripts.tsg='tsg -c ./tsg.config.ts'
        return writeFile(path.resolve(cwd(),'package.json'), JSON.stringify(packageJson,null,'\t'))
}





export {
    initTsg,
    bootTsg,
    installDep
}
