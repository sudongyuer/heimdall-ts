import {sum} from './index'
import {asgardTemplateCodeGen} from "../template/asgardTemplate";
import {cwd} from "process";
import * as path from "path";
import * as fs from "fs";
import * as fes from 'fs-extra'
import * as os from 'os'
it('test sum  ', function () {
  expect(sum(1,2)).toBe(3)
});

it('generateApiCode ', function () {
  //读取文件对象
  const jsonObj = fes.readJsonSync(path.resolve(cwd(),'evelynn-doc','evelynn-service-user.json'))
  console.log(jsonObj)
});

it('test fes patch content to file', function () {
  fs.appendFileSync(path.resolve(cwd(),'src/test/test.ts'), `
  import {AsgardClient, AsgardClientConfig} from "@imf/asgard-client";

class Api {

  public asgardClientConfig: AsgardClientConfig;

  public asgardClient: AsgardClient

  constructor(asgardClientConfig:AsgardClientConfig) {
    this.asgardClientConfig = asgardClientConfig
    this.asgardClient = new AsgardClient(this.asgardClientConfig)
  }

  connect() {
    this.asgardClient.connect()
  }

  loginDeviceNumber<T>(payload:operations["loginDeviceNumber"]["requestBody"]["content"]["application/json"]) {
    return this.asgardClient.get<operations["loginDeviceNumber"]["responses"]["200"]["content"]["application/json"]>('/login/deviceNumber', payload)
  }

}
  class Api {

    public asgardClientConfig: AsgardClientConfig;

    public asgardClient: AsgardClient

    constructor(asgardClientConfig:AsgardClientConfig) {
      this.asgardClientConfig = asgardClientConfig
      this.asgardClient = new AsgardClient(this.asgardClientConfig)
    }

    connect() {
      this.asgardClient.connect()
    }

    loginDeviceNumber<T>(payload:operations["login-deviceNumber"]["requestBody"]["content"]["application/json"]) {
      return this.asgardClient.get<operations["login-deviceNumber"]["responses"]["200"]["content"]["application/json"]>('/login/deviceNumber', payload)
    }
    
  }

}
  `,'utf-8')
});
it('asgardTemplateCodeGen',()=>{
  const jsonObj = fes.readJSONSync(path.resolve(cwd(),'evelynn-doc','evelynn-service-user.json'))
  const string =asgardTemplateCodeGen(jsonObj)
  fs.appendFileSync(path.resolve(cwd(),'src/test/test.ts'),string)
})
