import snowflake from "../src/snowflake";
it("create 5000", async () => {
  const nextID = snowflake({ dataCenterId: 1, workerId: 1 });
  const count = 1;
  const array = await Promise.all(Array(count).fill(0).map(nextID));
  expect(new Set(array).size).toBe(count);
  expect(array).toEqual(array.slice(0).sort());
});
