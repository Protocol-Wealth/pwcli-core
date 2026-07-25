import {
  AdapterFailed,
  loadControlPlaneConfig,
  PolicyDenied,
  runReadOnlyReview
} from "./adapter.ts";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const prompt = args.find((value) => !value.startsWith("--"));
const cwdIndex = args.indexOf("--cwd");
const cwd = cwdIndex >= 0 ? args[cwdIndex + 1] : ".";
const contractsIndex = args.indexOf("--contracts-dir");
const contractsDir =
  contractsIndex >= 0
    ? args[contractsIndex + 1]
    : resolve(dirname(fileURLToPath(import.meta.url)), "../../fixtures");

if (!prompt) {
  console.error("usage: npm run review -- \"prompt\" [--cwd path]");
  process.exitCode = 2;
} else {
  try {
    const config = await loadControlPlaneConfig(contractsDir, cwd);
    const { result, receipt } = await runReadOnlyReview(prompt, config);
    console.log(result);
    console.log(JSON.stringify({ receipt }, null, 2));
  } catch (error) {
    if (error instanceof PolicyDenied || error instanceof AdapterFailed) {
      console.error(
        JSON.stringify(
          {
            status:
              (error.receipt?.status as string | undefined) ??
              (error instanceof PolicyDenied ? "denied" : "failed"),
            errorCode: error.message,
            receipt: error.receipt
          },
          null,
          2
        )
      );
      process.exitCode = 2;
    } else {
      throw error;
    }
  }
}
