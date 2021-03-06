import snowflake from "../src/snowflake";
const nextID = snowflake({ dataCenterId: 1, workerId: 1 });
it("create 5000", () => {
  const count = 1;
  const array = Array(count).fill(0).map(nextID);
  expect(new Set(array).size).toBe(count);
  expect(array).toEqual(array.slice(0).sort());
});
