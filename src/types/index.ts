export enum generateType{
    'http',
    'asgard'
}
export interface repo{
  type:generateType,
  git:string,
  version:string
}
export interface repos{
  [index:string]:repo,
  [Symbol.iterator]:()=>Iterator<any>
}
