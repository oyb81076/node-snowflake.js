// tslint:disable-next-line: no-var-requires
const snowflake = require("../dist/snowflake").default;
const nextID = snowflake();
const count = Math.pow(2, 12) * 1000;
const start = process.hrtime();
for (let i = 0; i < count; i++) { nextID(); }
const end = process.hrtime();
const ms = (end[0] - start[0]) * 1e3 + (end[1] - start[1]) / 1e6;
console.log("count: %i", count);
console.log("time:%sms", ms);
console.log("%i/ms", count / ms);
