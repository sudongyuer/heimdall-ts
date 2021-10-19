import {getProjectName} from '../utils/common/index.js'
import {getOenAPI3JsonFileName} from '../utils/file/index.js'


/**
 * 获取tsgConfig配置文件内容
 */
export function getTsgConfig() {
    const projectName=getProjectName()
    const OenAPI3JsonFileName=getOenAPI3JsonFileName(projectName)
    console.log('OpenAPI!!!',OenAPI3JsonFileName)
    return `
import type { Project } from 'ts-gear'
import {GenerateRequestFunctionNameParameter} from "ts-gear/lib/type";

const projects: Project[] = [

${OenAPI3JsonFileName.map(item=>{
    return`
 {
    name: '${item.replace('\.oas3\.json','')}',

    dest: './src/api/service',

    source: '${projectName}/${item}',
 
    importRequesterStatement: 'import {requester} from "../../requester/fetch"\\n',

    keepGeneric: true,

    shouldExportRequestOptionType: true,

    shouldExportResponseType: true,

  }
    `
    })}


]

export default projects

 `
}

