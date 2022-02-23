/**
 *
 * @param jsonObj json对象
 */
export function asgardTemplateCodeGen(jsonObj): string {
//获取所有path
let paths =jsonObj.paths
let pathObjects =[]
let baseUrl = jsonObj.servers[0].description
  for(const path in paths) {
    let pathObject: any = {}
    pathObject.baseUrl=baseUrl
    pathObject.path=path
    const pathObj = paths[path]
    //判断有没有parameters
    if (pathObj.parameters && typeof (pathObj.parameters) === 'object' && pathObj.parameters.length !== 0) {
      pathObject.parameters = pathObj.parameters[0]
    }
    //获取当前的方法 path get
    const keys =Object.keys(pathObj)
    keys.forEach(key=>{
      switch (key){
        case 'get':
          pathObject.method ='get'
          pathObject.asgardMethod ='get'
          break
        case 'post':
          pathObject.method ='post'
          pathObject.asgardMethod ='post'
          break
        case 'put':
          pathObject.method ='put'
          pathObject.asgardMethod ='stream'

          break
        case 'patch':
          pathObject.method ='patch'
          pathObject.asgardMethod ='broadcast'
          break
        case 'delete':
          pathObject.method ='delete'
          pathObject.asgardMethod ='fire'
          break
      }
    })
    // //保存instance
      pathObject.instance=pathObj[pathObject.method]
    // //保存summary
    pathObject.summary=pathObject.instance.summary
    // //保存operationId
    pathObject.operationId=pathObject.instance.operationId
    //判断有无请求体requestBody
    if(pathObject.instance.requestBody){
      pathObject.requestBody=pathObject.instance.requestBody
    }
    //判断有无responses
    if(pathObject.instance.responses){
      pathObject.responses=pathObject.instance.responses
    }
    pathObjects.push(pathObject)
  }
  // console.log(pathObjects)
    return `
import {AsgardClient, AsgardClientConfig} from "@imf/asgard-client";

export class Api {

    public asgardClientConfig: AsgardClientConfig;
  
    public asgardClient: AsgardClient
  
    constructor(asgardClientConfig:AsgardClientConfig) {
      this.asgardClientConfig = asgardClientConfig
      this.asgardClient = new AsgardClient(this.asgardClientConfig)
    }
  
    connect() {
      this.asgardClient.connect()
    }
  
  ${pathObjects.map((pathObject)=>{
      return `
    \n
    /**
     * 
     * ${pathObject.summary}
     */
    ${pathObject.operationId.replace(/-([a-z])/,function (match,p1){return p1.toUpperCase()})}(${pathObject.requestBody?`payload:operations["${pathObject.operationId}"]["requestBody"]["content"]["application/json"]`:''}){
    
      return this.asgardClient.${pathObject.asgardMethod}${shouldHasReturnGeneric(pathObject)?`<operations["${pathObject.operationId}"]["responses"]["200"]["content"]["application/json"]>`:``}("${pathObject.baseUrl}${pathObject.path}"${pathObject.requestBody?`,payload`:``})
    \n
     }   
      `
    }).join('')}
}
`
}

function shouldHasReturnGeneric(pathObject):boolean{
  return pathObject.responses&&pathObject.asgardMethod!='post'&&(JSON.stringify(pathObject.responses)!=='{}')
}
// operations[operationId][responses][200][content][application/json]
