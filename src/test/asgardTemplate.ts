
/**
 *
 * @param jsonObj json对象
 */
export function asgardTemplateCodeGen(jsonObj): string {

  return `

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
`
}
