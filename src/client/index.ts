import {Command} from "commander";
import {cwd} from "process";
import {createRequire} from "module";
import {createApi, createMultiApi} from '../generate/generate.js'
import * as path from "path";

import {
    generateFile,
    getFileName,
    getPkgMaifest,
    removeDir,
    writeFile
} from "../utils/file/index.js";

import {object2iterator, transformToCamel} from "../utils/common/index.js";

const require = createRequire(import.meta.url);
let shell = require('shelljs');
console.log(cwd())

//初始化命令行帮助信息，并获取命令行参数

const options = getCommandOptions()

console.log(options)

const pkg = getPkgMaifest()

//默认生成API入口(使用方没有指定repo，默认拉取项目名的仓库)
if (options.generate) {

    let repos = getRepos()
    //转换为可迭代对象
    repos=object2iterator(repos)
    //1.执行下载文件命令
    await gitCloneProject(repos)
    //2.生成api文件
    //2.1删除之前下载过的API文件
    await removeDir(path.resolve(cwd(), "node_modules/@sudongyuer/heimdall-ts/api"))

    await createMultiApi(repos)
    //3.生成入口文件
    await generateMain()
    //4.删除下载的yml所在文件夹
    await removeCacheFile(repos)

} else if (options.log) {

    //为对象添加迭代器
    let repo={
        [options.log]:getPkgMaifest().heimdall.repo[options.log]
    }
    repo=object2iterator(repo)

    //1.执行下载文件命令
    await gitCloneProject(repo, true)
    //2.执行打印日志的命令
    await showLog(options.log)
    //3.删除下载的文件夹
    await removeDir(path.resolve(cwd(), options.log))

}

/**
 * 打印版本stoplight版本信息
 */
function showLog(repo) {
    return new Promise<void>((resolve, reject) => {
        shell.exec('git log --pretty=" %h %ci %s "', {
                cwd: `${path.resolve(cwd(), repo)}`
            }, () => {
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
    program.option('-l, --log <repo>', 'show stoplight git log of repo');
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
 * 获取所有repo
 */
function getRepos(): string {
    const pkgMaifest = getPkgMaifest()
    return pkgMaifest?.heimdall?.repo
}

/**
 * 克隆项目
 */
function gitCloneProject(repo, isLog = false) {
    const promiseArray = [];
    return new Promise<void>((resolveClone, rejectClone) => {
        for (const [projectName, {git:gitRepo,version:versionCode}] of repo) {
            promiseArray.push(new Promise<void>((resolve, reject) => {
                shell.exec(`git clone ${gitRepo}`, {
                    cwd: `${cwd()}`
                }, (err) => {
                    if(err){reject('git clone failed')}
                    //如果有versionCode，需要回退版本
                    if (!isLog && versionCode && versionCode !== '^') {
                        shell.exec(`git checkout ${versionCode}`, {
                            cwd: `${path.resolve(cwd(), projectName)}`
                        }, () => {
                            resolve()
                        })
                    } else {
                        resolve()
                    }
                })
            }))
        }
        Promise.all(promiseArray).then(() => {
            resolveClone()
        })
    })

}

/**
 * 生成入口文件index.ts
 */
function generateMain() {
    return new Promise<void>((resolve, reject) => {
        //获取文件名
        const fileNames = getFileName(path.resolve(cwd(), 'node_modules/@sudongyuer/heimdall-ts/api'))
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
        generateFile(path.resolve(cwd(), 'node_modules/@sudongyuer/heimdall-ts/api', 'index.ts'))
        //写入文件
        writeFile(path.resolve(cwd(), 'node_modules/@sudongyuer/heimdall-ts/api', 'index.ts'), content).then(() => {
            resolve()
        })
    })

}

/**
 * 清除YML/JSON所产生的缓存文件
 */
function removeCacheFile(repos){
    return new Promise<void>((resolve, reject)=>{
        const promiseArray=[]
        for (const [repo,versionCode] of repos) {
            promiseArray.push(removeDir(path.resolve(cwd(),repo)))
        }
        Promise.all(promiseArray).then(()=>{
            resolve()
        })
    })

}

