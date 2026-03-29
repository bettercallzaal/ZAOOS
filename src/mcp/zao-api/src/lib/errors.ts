export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = "MCPError";
  }
}

export function handleError(err: unknown): { error: string; code: string } {
  if (err instanceof MCPError) {
    return { error: err.message, code: err.code };
  }
  console.error(err);
  return { error: "Internal server error", code: "INTERNAL_ERROR" };
}
