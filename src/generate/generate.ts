import {createRequire} from "module";
import {getOenAPI2YmlFileName, getOenAPI3YmlFileName} from '../utils/file/index.js'
import {cwd} from "process";
import {getProjectName} from "../utils/common/index.js";

const require = createRequire(import.meta.url);
const path = require("path");
const {generateApi} = require('swagger-typescript-api');


/**
 * 创建api文件
 */
async function createApi() {
    //V3
    /* NOTE: all fields are optional expect one of `output`, `url`, `spec` */
    const openApi3Array = getOenAPI3YmlFileName(path.resolve(cwd(), `${getProjectName()}`))
    for (let item of openApi3Array) {
        await generateApi({
            name: `${item.replace('.oas3.yml', '')}Api.ts`,
            url: null,
            output: path.resolve(process.cwd(), "node_modules/@imf/heimdall-ts/api"),
            input: path.resolve(process.cwd(), `${getProjectName()}`, `${item}`),
            httpClientType: "axios", // or "fetch",
            unwrapResponseData:true
        })
    }

    //V2
    /* NOTE: all fields are optional expect one of `output`, `url`, `spec` */
    const openApi2Array = getOenAPI2YmlFileName(path.resolve(cwd(), `${getProjectName()}`))
    for (let item of openApi2Array) {
        await generateApi({
            name: `${item.replace('.oas2.yml', '')}Api.ts`,
            url: null,
            output: path.resolve(process.cwd(), "node_modules/@imf/heimdall-ts/api"),
            input: path.resolve(process.cwd(), `${getProjectName()}`, `${item}`),
            httpClientType: "axios", // or "fetch",
            unwrapResponseData:true
        })
    }


}


export {
    createApi
}
