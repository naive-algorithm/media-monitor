import { inspect } from "node:util";

/** Human-readable console summary followed by optional error details. */
export function formatLogMessage(
  event: string,
  fields: Record<string, unknown>,
): string {
  const { cause, ...context } = fields;
  const details = Object.entries(context)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const printable = value === null ||
        ["string", "number", "boolean"].includes(typeof value)
        ? value
        : inspect(value, { depth: 5, colors: false });
      return `${key}=${JSON.stringify(printable)}`;
    });

  const summary = details.length ? `${event} | ${details.join(" ")}` : event;
  return cause === undefined
    ? summary
    : `${summary}\n${inspect(cause, { depth: 5, colors: false })}`;
}
