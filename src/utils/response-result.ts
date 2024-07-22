export const responseResult = (
  result: Record<string, any> | null,
  success: boolean,
  message: string,
) => {
  return {
    result,
    success,
    message,
  };
};
