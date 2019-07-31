/**
 * most copy form
 * https://github.com/Welogix-Tech/node-snowflake/blob/master/lib/snowflake.js
 */

import { fromValue } from "long";
interface IConfig {
  workerIdBits?: number;
  workerId?: number;
  dataCenterId?: number;
  twepoch?: number;
  dataCenterIdBits?: number;
  sequenceBits?: number;
}
// nodejs的性能差到无法在1ms内生成4000个
export default function snowflake({
  workerId = 0,
  dataCenterId = 0,
  twepoch = 1288834974657,
  workerIdBits = 5,
  dataCenterIdBits = 5,
}: IConfig = {}): () => Promise<string> {
  const sequenceBits = 22 - workerIdBits - dataCenterIdBits;
  validate(dataCenterIdBits, workerIdBits, sequenceBits, dataCenterId, workerId);
  return makeNextID(
    dataCenterIdBits,
    workerIdBits,
    sequenceBits,
    twepoch,
    dataCenterId,
    workerId,
  );
}

function validate(
  dataCenterIdBits: number,
  workerIdBits: number,
  sequenceBits: number,
  dataCenterId: number,
  workerId: number,
) {
  const maxWorkerId = -1 ^ (-1 << workerIdBits);
  const maxDataCenterId = -1 ^ (-1 << dataCenterIdBits);
  if (sequenceBits < 1) {
    throw new Error("workerIdBits + dataCenterIdBits should low then 22");
  }
  if (workerId > maxWorkerId || workerId < 0) {
    throw new Error("workerId must max than 0 and less than maxWrokerId-[" +
      maxWorkerId + "]");
  }
  if (dataCenterId > maxDataCenterId || dataCenterId < 0) {
    throw new Error("dataCenterId must max than 0 and less than maxDataCenterId-[" +
      maxDataCenterId + "]");
  }
}

function makeNextID(
  dataCenterIdBits: number,
  workerIdBits: number,
  sequenceBits: number,
  twepoch: number,
  dataCenterId: number,
  workerId: number,
): () => Promise<string> {
  const timestampLeftShift = sequenceBits + workerIdBits + dataCenterIdBits;
  const sequenceMask = -1 ^ (-1 << sequenceBits);
  const dataCenterWorkerValue = dataCenterWorker(workerIdBits, sequenceBits, dataCenterId, workerId);
  let sequence = 0;
  let lastTimestamp = -1;

  return async function nextID() {
    let timestamp = Date.now();
    if (lastTimestamp === timestamp) {
      sequence = (sequence + 1) & sequenceMask;
      if (sequence === 0) {
        do {
          timestamp = await sleep();
        } while (timestamp !== lastTimestamp);
      }
    } else {
      sequence = 0;
    }
    if (timestamp < lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate id for " +
        (lastTimestamp - timestamp));
    }

    lastTimestamp = timestamp;
    return format(
      timestampLeftShift,
      twepoch,
      timestamp,
      dataCenterWorkerValue,
      sequence,
    );
  };
}

async function sleep(): Promise<number> {
  return new Promise((r) => {
    setTimeout(() => r(Date.now()), 0);
  });
}

function dataCenterWorker(
  workerIdBits: number,
  sequenceBits: number,
  dataCenterId: number,
  workerId: number,
) {
  const workerIdShift = sequenceBits;
  const dataCenterIdShift = sequenceBits + workerIdBits;
  const dataCenterValue = dataCenterId << dataCenterIdShift;
  const workerValue = workerId << workerIdShift;
  const dataCenterWorkerValue = dataCenterValue + workerValue;
  return dataCenterWorkerValue;
}

function format(
  timestampLeftShift: number,
  twepoch: number,
  timestamp: number,
  dataCenterWorkerValue: number,
  sequence: number,
) {
  const leftValue = timestamp - twepoch;
  const rightValue = dataCenterWorkerValue + sequence;
  // js的位运算不如 + - 运算, 所以我把位运算都改成了+ - 运算了
  const value = fromValue(leftValue).shiftLeft(timestampLeftShift).add(rightValue);
  return value.toString(10);
}
