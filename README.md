# Twitter snowflake
snowflake 现实中很少使用到分布式,
因为最大可以支持1024个进程,
一个小型应用压根不会有部署那么多进程,
所以完全可以讲snowflake作为mysql 单机 ID 生成器
## Usage
```ts
import snowflake from "snowflake.js"
export const createID = snowflake();
async function main(){
  const id0 = createID();
  const id1 = createID();
  const id2 = createID();
}
```
## 多进程使用, 使用环境变量配置 workerID, dataCenterID
```ts
import snowflake from "snowflake.js";
const workerId = parseInt(process.env.WORKER_ID || "0", 10)
const dataCenterId = parseInt(process.env.DATA_CENTER_ID || "0", 10)
export const createID = snowflake({ workerId, dataCenterId });
```
