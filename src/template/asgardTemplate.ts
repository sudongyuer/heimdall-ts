/**
 *
 * @param jsonObj json对象
 */
export function asgardTemplateCodeGen(jsonObj): string {
//获取所有path
  let paths = jsonObj.paths
  let pathObjects = []
  let baseUrl = jsonObj.servers[0].description
  complexPathObjects(paths, baseUrl, pathObjects);
  return generateCode(pathObjects)
}

/**
 *
 * 生成函数名
 */
function generateMethodName(pathObject) {
  return `${pathObject.operationId.replace(/-([a-zA-Z])/, function (match, p1) {
    return p1.toUpperCase()
  })}`
}

/**
 * 生成支持url参数的函数参数体
 * @param pathObject
 */
function generateMethodWithParameterParameterBody(pathObject) {
  return `(${pathObject.requestBody ? `payload:operations["${pathObject.operationId}"]["requestBody"]["content"]["application/json"],` : ''}${pathObject.parameters ? `parameter:operations["${pathObject.operationId}"]["parameters"]["path"],` : ``}${`options?:options,`})`
}

/**
 *
 * 生成支持url参数的函数
 */
function generateMethodWithParameter(pathObject) {
  return `
    \n
    /**
     * 
     * ${pathObject.summary}
     */
    ${generateMethodName(pathObject)}${generateMethodWithParameterParameterBody(pathObject)}{
    
      return this.asgardClient.${pathObject.asgardMethod}${shouldHasReturnGeneric(pathObject) ? `<operations["${pathObject.operationId}"]["responses"]["200"]["content"]["application/json"]>` : ``}(\`${pathObject.baseUrl}${pathObject.path.replace(/{(\w*)}/, (match, p1) => `\${parameter["${p1}"]}`)}\`${pathObject.requestBody ? `,payload,` : `,{},`}options??options)
    \n
     }   
      `
}

/**
 * 生成普通函数的参数体
 * @param pathObject
 */
function generateNormalMethodParameterBody(pathObject) {
  return `(${pathObject.requestBody ? `payload:operations["${pathObject.operationId}"]["requestBody"]["content"]["application/json"],` : ''}${`options?:options,`})`
}

/**
 *
 * 生成普通的函数
 */
function generateNormalMethodString(pathObject) {
  return `
    \n
    /**
     * 
     * ${pathObject.summary}
     */
    ${generateMethodName(pathObject)}${generateNormalMethodParameterBody(pathObject)}{
    
      return this.asgardClient.${pathObject.asgardMethod}${shouldHasReturnGeneric(pathObject) ? `<operations["${pathObject.operationId}"]["responses"]["200"]["content"]["application/json"]>` : ``}("${pathObject.baseUrl}${pathObject.path}"${pathObject.requestBody ? `,payload,` : `,{},`}options??options)
    \n
     }   
      `
}

/**
 * 是否应该返回返回值的范型
 * @param pathObject
 */
function shouldHasReturnGeneric(pathObject): boolean {
  return pathObject.responses && pathObject.asgardMethod != 'post' && (JSON.stringify(pathObject.responses) !== '{}')
}


/**
 * 是否有参数
 * @param pathObj
 */
function hasParameters(pathObj) {
  return pathObj.parameters && typeof (pathObj.parameters) === 'object' && pathObj.parameters.length !== 0;

}

/**
 * 生成代码
 * @param pathObjects
 */
function generateCode(pathObjects) {
  return `
import { AsgardClient , options} from "@imf/asgard-client";

export class Api {

    public asgardClient: AsgardClient
  
    constructor(asgardClient:AsgardClient) {
      this.asgardClient = asgardClient
    }
  
    connect() {
      this.asgardClient.connect()
    }
  
  ${pathObjects.map((pathObject) => {

    if (pathObject.parameters) {
      //生成带url参数的
      return generateMethodWithParameter(pathObject)
    } else {
      //生成普通的
      return generateNormalMethodString(pathObject)
    }
  }).join('')}
}
`
}

/**
 * 完善PathObjects
 * @param paths
 * @param baseUrl
 * @param pathObjects
 */
function complexPathObjects(paths, baseUrl, pathObjects: any[]) {
  for (const path in paths) {
    let pathObject: any = {}
    pathObject.baseUrl = baseUrl
    pathObject.path = path
    const pathObj = paths[path]
    //判断有没有parameters
    if (hasParameters(pathObj)) {
      pathObject.parameters = pathObj.parameters[0]
    }
    //获取当前的方法 path get
    const keys = Object.keys(pathObj)
    keys.forEach(key => {
      switch (key) {
        case 'get':
          pathObject.method = 'get'
          pathObject.asgardMethod = 'get'
          break
        case 'post':
          pathObject.method = 'post'
          pathObject.asgardMethod = 'post'
          break
        case 'put':
          pathObject.method = 'put'
          pathObject.asgardMethod = 'stream'

          break
        case 'patch':
          pathObject.method = 'patch'
          pathObject.asgardMethod = 'broadcast'
          break
        case 'delete':
          pathObject.method = 'delete'
          pathObject.asgardMethod = 'fire'
          break
      }
    })
    // //保存instance
    pathObject.instance = pathObj[pathObject.method]
    // //保存summary
    pathObject.summary = pathObject.instance.summary
    // //保存operationId
    pathObject.operationId = pathObject.instance.operationId
    //判断有无请求体requestBody
    if (pathObject.instance.requestBody) {
      pathObject.requestBody = pathObject.instance.requestBody
    }
    //判断有无responses
    if (pathObject.instance.responses) {
      pathObject.responses = pathObject.instance.responses
    }
    pathObjects.push(pathObject)
  }
}
