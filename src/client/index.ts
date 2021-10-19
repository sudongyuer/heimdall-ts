import {Command} from "commander";
import {cwd} from "process";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const path = require('path')
let shell = require('shelljs');
const YAML = require('yamljs');
console.log(cwd())
// @ts-ignore
import {getOenAPI3YmlFileName, getPkgMaifest, writeFile} from "../utils/file/index.js";
import {bootTsg, initTsg} from "../generate/generate.js";
// @ts-ignore

//初始化命令行帮助信息，并获取命令行参数

const options = getCommandOptions()


//生成API入口
if (options.generate) {
    const projectName = getProjectName()
    //1.执行下载文件命令
    await gitCloneProject(projectName)
    //2.将下载的文件转换为json格式
    await convertYml2Json()
    //3.初始化ts-gear
    await initTsg()
    //启动tsg
    await bootTsg()

}


/**
 * 初始化命令行，并获取命令参数
 * @returns {OptionValues}
 */
function getCommandOptions(): { generate: boolean } {
    //初始化命令行帮助信息
    const program = new Command();
    program.option('-g, --generate', 'generate API ');
    program.addHelpText('after', `
Example call:
  $ haimdall -h --help`);
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
function gitCloneProject(projectName) {
    return new Promise<void>((resolve, reject) => {
        shell.exec(`git clone https://sudongyu:YUANCxzeJwiVhzQio18v@git.stoplight.io/floozy/${projectName}.git`, {
            cwd: `${cwd()}`
        }, () => {
            resolve()
        })
    })
}

/**
 * 将yml文件转换为json文件
 */
async function convertYml2Json() {

    const ymlFileNameArray = getOenAPI3YmlFileName('demo')
    ymlFileNameArray.forEach(item => {
        const filePath = path.resolve(cwd(), 'demo', item)
        const nativeObject = YAML.load(filePath)
        writeFile(`${path.resolve(cwd(), 'demo', item.replace('.yml', '.json'))}`, JSON.stringify(nativeObject, null, '\t'))
    })


}
