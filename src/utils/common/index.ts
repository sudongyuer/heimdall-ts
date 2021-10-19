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

export {
    getProjectName
}
