/**
 * BigInt Version
 * most copy form
 * https://github.com/Welogix-Tech/node-snowflake/blob/master/lib/snowflake.js
 */

interface IConfig {
  workerIdBits?: number;
  workerId?: number;
  dataCenterId?: number;
  twepoch?: number;
  dataCenterIdBits?: number;
  sequenceBits?: number;
}
export default function snowflake({
  workerId = 0,
  dataCenterId = 0,
  // 2010-11-04T01:42:54.657Z
  twepoch = 1288834974657,
  workerIdBits = 5,
  dataCenterIdBits = 5,
}: IConfig = {}): () => string {
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

const ZERO = BigInt(0);
const ONE = BigInt(1);

function makeNextID(
  dataCenterIdBits: number,
  workerIdBits: number,
  sequenceBits: number,
  twepoch: number,
  dataCenterId: number,
  workerId: number,
): () => string {
  const timestampLeftShift = BigInt(sequenceBits + workerIdBits + dataCenterIdBits);
  const sequenceMask = BigInt(-1 ^ (-1 << sequenceBits));
  const dataCenterWorkerValue = dataCenterWorker(workerIdBits, sequenceBits, dataCenterId, workerId);
  const twepochBigInt = BigInt(twepoch);
  let sequence = ZERO;
  let lastTimestamp = ZERO;

  return function nextID() {
    let timestamp = BigInt(Date.now());
    if (lastTimestamp === timestamp) {
      sequence = (sequence + ONE) & sequenceMask;
      if (sequence === ZERO) {
        do {
          timestamp = BigInt(Date.now());
        } while (timestamp !== lastTimestamp);
      }
    } else {
      sequence = ZERO;
    }
    if (timestamp < lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate id for " +
        (lastTimestamp - timestamp));
    }

    lastTimestamp = timestamp;
    return format(
      timestampLeftShift,
      twepochBigInt,
      BigInt(timestamp),
      dataCenterWorkerValue,
      sequence,
    );
  };
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
  return BigInt(dataCenterWorkerValue);
}

function format(
  timestampLeftShift: bigint,
  twepoch: bigint,
  timestamp: bigint,
  dataCenterWorkerValue: bigint,
  sequence: bigint,
): string {
  const value = (timestamp - twepoch) << timestampLeftShift | dataCenterWorkerValue | sequence;
  return value.toString();
}
