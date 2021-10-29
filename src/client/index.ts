import {Command} from "commander";
import {cwd} from "process";
import {createRequire} from "module";
import {createApi} from '../generate/generate.js'
import * as path from "path";
import {
    generateFile,
    getFileName,
    getPkgMaifest,
    removeDir,
    writeFile
} from "../utils/file/index.js";

import {transformToCamel} from "../utils/common/index.js";

const require = createRequire(import.meta.url);
let shell = require('shelljs');
console.log(cwd())

//初始化命令行帮助信息，并获取命令行参数

const options = getCommandOptions()


//生成API入口
if (options.generate) {
    const projectName = getProjectName()
    //1.执行下载文件命令
    await gitCloneProject(projectName)
    //2.生成api文件
    //2.1删除之前下载过的API文件
    await removeDir(path.resolve(cwd(), "node_modules/@imf/heimdall-ts/api"))

    await createApi()
    //3.生成入口文件
    await generateMain()
    //4.删除下载的yml所在文件夹
    await removeDir(path.resolve(cwd(), getProjectName()))

} else if (options.log) {
    const projectName = getProjectName()
    //1.执行下载文件命令
    await gitCloneProject(projectName, true)
    //2.执行打印日志的命令
    await showLog()
    //3.删除下载的文件夹
    await removeDir(path.resolve(cwd(), getProjectName()))
}

/**
 * 打印版本stoplight版本信息
 */
function showLog(){
    return new Promise<void>((resolve, reject)=>{
        shell.exec('git log --pretty=" %h %ci %s "', {
                cwd: `${path.resolve(cwd(), getProjectName())}`
            },()=>{
            resolve()
            }
        )
    })
}

/**
 * 初始化命令行，并获取命令参数
 * @returns {OptionValues}
 */
function getCommandOptions(): { generate: boolean, log: string } {
    //初始化命令行帮助信息
    const program = new Command();
    program.option('-g, --generate', 'generate API ');
    program.option('-l, --log', 'show stoplight git log ');
    program.addHelpText('after', `
Example call:
  $ heimdall -h --help`);
//解析命令行参数
    program.parse(process.argv);

//获取命令行参数
    return program.opts()
}

/**
 * 获取项目名
 */
function getProjectName(): string {
    const pkgMaifest = getPkgMaifest()
    //@imf这样的正则匹配
    const reg = /@(.*)\//
    return pkgMaifest.name.replace(reg, '').split('-')[0]
}

/**
 * 克隆项目
 */
function gitCloneProject(projectName, isLog = false) {
    return new Promise<void>((resolve, reject) => {
        shell.exec(`git clone https://sudongyu:YUANCxzeJwiVhzQio18v@git.stoplight.io/floozy/${projectName}.git`, {
            cwd: `${cwd()}`
        }, () => {
            const versionCode = getPkgMaifest()?.heimdall?.versionCode
            //如果有versionCode，需要回退版本
            if (!isLog && versionCode) {
                shell.exec(`git checkout ${versionCode}`, {
                    cwd: `${path.resolve(cwd(), getProjectName())}`
                }, () => {
                    resolve()
                })
            } else {
                resolve()
            }
        })
    })
}

/**
 * 生成入口文件index.ts
 */
function generateMain() {
    return new Promise<void>((resolve, reject)=>{
        //获取文件名
        const fileNames = getFileName(path.resolve(cwd(), 'node_modules/@imf/heimdall-ts/api'))
        //转换文件名 eg:  main.ts -> MainGameApi
        const transformedFileNames = fileNames.map(item => {
            return transformToCamel(item)
        })
        //编写要写如的内容content
        const content = `
        ${transformedFileNames.map((item, index) => {
                return `import \{Api as ${item}\} from \'\.\/${fileNames[index]}\'\n`
            }).join('')
        }
   
   export {
        ${transformedFileNames.map(item => {
            return `${item}\n`
        })}
    }
   `
        //创建index文件
        generateFile(path.resolve(cwd(),'node_modules/@imf/heimdall-ts/api','index.ts'))
        //写入文件
        writeFile(path.resolve(cwd(),'node_modules/@imf/heimdall-ts/api','index.ts'),content).then(()=>{
            resolve()
        })
    })


}

