import {getPkgMaifest} from "../file/index.js";
import {createRequire} from "module";
import * as fs from "fs";

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
/**
 * 获取项目名
 */
function getProjectName():string{
    const pkgMaifest=getPkgMaifest()
    //@imf这样的正则匹配
    const reg=/@(.*)\//
    return pkgMaifest.name.replace(reg,'').split('-')[0]
}

/**
 * 转换非驼峰命名的字符串为驼峰命名,并且首字母大写
 * @param str 需要转换的字符
 * @param isFirtUpperCase 是否需要首字母大写
 */
function transformToCamel(str:string,isFirtUpperCase=true){
    if(isFirtUpperCase){
        str=str.replace(/^\S/,function (a){
            return a.toUpperCase()
        })
    }

    return str.replace(/-[a-z]/g , function(a, b){

        return b == 0 ? a.replace('-','') : a.replace('-','').toUpperCase();

    });
}

/**
 * 将{}对象转换为可迭代对象
 */
function object2iterator(obj){
    obj[Symbol.iterator]=function* () {
        let properties = Object.keys(this);
        for (let i of properties) {
            yield [i, this[i]];
        }
    }
    return obj
}

/**
 * 获取特定yml文件转换之后的json文件
 * @param ymlDir
 */
function getJsonFromYmlDir(ymlDir) {
    // Get document, or throw exception on error
    try {
        return yaml.load(fs.readFileSync(ymlDir, 'utf8'))
    }
    catch (e) {
        console.log(e);
    }
}
/**
 * 检查Yml文件是否含有相应的字段和属性值
 * @param jsonObj json对象
 * @param key 需要检查的key
 * @param value 需要检查key所对应的value
 */
function checkJsonHasSpecificField(jsonObj, key, value) {
    return jsonObj.hasOwnProperty(key) && (jsonObj[key].trim() === value);
}

export {
    getJsonFromYmlDir,
    checkJsonHasSpecificField,
    getProjectName,
    transformToCamel,
    object2iterator
}
