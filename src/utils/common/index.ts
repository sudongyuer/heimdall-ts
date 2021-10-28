import {getPkgMaifest} from "../file/index.js";
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


export {
    getProjectName,
    transformToCamel
}
