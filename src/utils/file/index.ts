import * as path from "path";
import {cwd} from "process";
import {createRequire} from "module";
import * as fs from "fs";

const require = createRequire(import.meta.url);
const makeDir = require('make-dir');
let shell = require('shelljs');

/**
 * 获取PackageJson文件对象
 *
 */
function getPkgMaifest() {
    return require(path.join(cwd(), 'package.json'))
}


/**
 * 向指定文件写入内容
 * @param dir 指定文件
 * @param content 要写入的内容
 * @returns {Promise<unknown>}
 */
function writeFile(dir, content) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(dir, content, err => {
            if (err) {
                console.error(err)
                reject(err)
                return
            }
            //文件写入成功
            console.log(' writeFile done ！！！')
            resolve()
        })
    })
}

/**
 * 生成OpenAPi3的文件名数据(只包含oas3的yml文件)
 * @param dir
 */
function getOenAPI3YmlFileName(dir) {
    return fs.readdirSync(path.resolve(cwd(), dir)).filter(item => (item.includes('oas3') && item.includes('yml')))
}

/**
 *  生成OpenAPi3的文件名数据(只包含oas3的json文件)
 * @param dir
 */
function getOenAPI3JsonFileName(dir) {
    return fs.readdirSync(path.resolve(cwd(), dir)).filter(item => (item.includes('oas3') && item.includes('json')))
}

/**
 * 生成OpenAPi2的文件名数据(只包含oas3的yml文件)
 * @param dir
 */
function getOenAPI2YmlFileName(dir) {
    return fs.readdirSync(path.resolve(cwd(), dir)).filter(item => (item.includes('oas2') && item.includes('yml')))
}

/**
 *  生成OpenAPi2的文件名数据(只包含oas3的json文件)
 * @param dir
 */
function getOenAPI2JsonFileName(dir) {
    return fs.readdirSync(path.resolve(cwd(), dir)).filter(item => (item.includes('oas2') && item.includes('json')))
}

/**
 * 创建指定文件夹
 * @param dir 需要创建的文件目录 tips:创建的时候不要在开头写/了，直接demo/xxx
 */
function generateDir(dir) {
  return new Promise<void>((resolve, reject)=>{
        makeDir(dir).then(paths=>{
            // 打印生成出来的文件目录
            console.log('generateDirPath', paths);
            resolve()
        })
    })
}


/**
 * 生成指定文件
 * @param dir eg:build/DockerFile
 */
function generateFile(dir) {
    shell.touch(dir)
}

/**
 * 同步删除指定文件夹
 * @param dir
 */
function removeDir(dir){
    return new Promise<void>((resolve, reject)=>{
        shell.exec(`rm -rf ${dir}`, {
            cwd: `${cwd()}`
        }, () => {
          resolve()
        })
    })
}


export {
    getPkgMaifest,
    writeFile,
    getOenAPI3YmlFileName,
    getOenAPI3JsonFileName,
    generateFile,
    generateDir,
    getOenAPI2YmlFileName,
    getOenAPI2JsonFileName,
    removeDir

}
